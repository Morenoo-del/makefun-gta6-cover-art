"""Take the gta6-cover-art-01 screenshots and validate the app offline.

Serves app/ on localhost, loads it in headless Chromium, asserts zero
external requests and zero console errors, exports a PNG in each of the
three post sizes through the app's own export path, and writes:
  screenshots/1-cover.jpg          exported 1920x1080 cover, scaled to 1280x720
  screenshots/2-editor.jpg         the editor in a browser, photo loaded, 1280x720
  screenshots/3-cover-portrait.jpg exported 1080x1350 cover, scaled to 1024x1280
  screenshots/4-cover-square.jpg   exported 1080x1080 cover, scaled to 1024x1024
"""
import io
import json
import struct
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ENTRY = Path(__file__).resolve().parent
APP = ENTRY / "app"
SHOTS = ENTRY / "screenshots"
PORT = 8931


def serve():
    handler = partial(SimpleHTTPRequestHandler, directory=str(APP))
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def png_dims(data: bytes):
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def find_chromium():
    cache = Path.home() / ".cache" / "ms-playwright"
    candidates = sorted(cache.glob("chromium-*/chrome-linux/chrome"), reverse=True)
    candidates += sorted(cache.glob("chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell"), reverse=True)
    return str(candidates[0]) if candidates else None
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def scaled_jpeg(png_bytes: bytes, target_w: int, target_h: int, path: Path, quality=88):
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    img = img.resize((target_w, target_h), Image.LANCZOS)
    # Step the quality down until the file fits the 256 KiB screenshot cap.
    for q in (quality, 80, 72, 64, 55):
        img.save(path, "JPEG", quality=q)
        if path.stat().st_size <= 262144:
            return path.stat().st_size, img.size
    return path.stat().st_size, img.size


def main():
    httpd = serve()
    external = []
    errors = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=find_chromium())
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("request", lambda r: external.append(r.url) if not r.url.startswith(f"http://127.0.0.1:{PORT}") else None)
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))

            # --- Cover 1: hero layout, Vice Sunset, landscape ----------------
            page.goto(f"http://127.0.0.1:{PORT}/index.html?shot=cover&layout=heroThree&grade=viceSunset&photo=pier&title=SUNSET%20CITY&subtitle=one%20last%20ride")
            page.wait_for_function("window.coverReady === true", timeout=20000)
            page.wait_for_timeout(800)
            exp = page.evaluate("window.coverApp.exportPngBytes('1920x1080')")
            raw = bytes(exp["bytes"])
            assert png_dims(raw) == (1920, 1080), f"landscape export dims {png_dims(raw)}"
            size, dims = scaled_jpeg(raw, 1280, 720, SHOTS / "1-cover.jpg")
            print(f"1-cover.jpg {dims} {size} bytes (from {len(raw)}-byte exported PNG)")

            # --- Cover 3: story portrait, Neon Nights -------------------------
            page.goto(f"http://127.0.0.1:{PORT}/index.html?shot=cover&layout=storyPortrait&grade=neonNights&photo=neon-friends&title=NEON%20NIGHTS&subtitle=after%20dark")
            page.wait_for_function("window.coverReady === true", timeout=20000)
            page.wait_for_timeout(800)
            exp = page.evaluate("window.coverApp.exportPngBytes('1080x1350')")
            raw = bytes(exp["bytes"])
            assert png_dims(raw) == (1080, 1350), f"portrait export dims {png_dims(raw)}"
            size, dims = scaled_jpeg(raw, 1024, 1280, SHOTS / "3-cover-portrait.jpg")
            print(f"3-cover-portrait.jpg {dims} {size} bytes (from {len(raw)}-byte exported PNG)")

            # --- Cover 4: four-panel grid, Golden Hour, square ----------------
            page.goto(f"http://127.0.0.1:{PORT}/index.html?shot=cover&layout=fourPanel&grade=goldenHour&photo=convertible&title=GOLDEN%20HOUR&subtitle=coast%20road")
            page.wait_for_function("window.coverReady === true", timeout=20000)
            page.wait_for_timeout(800)
            exp = page.evaluate("window.coverApp.exportPngBytes('1080x1080')")
            raw = bytes(exp["bytes"])
            assert png_dims(raw) == (1080, 1080), f"square export dims {png_dims(raw)}"
            size, dims = scaled_jpeg(raw, 1024, 1024, SHOTS / "4-cover-square.jpg")
            print(f"4-cover-square.jpg {dims} {size} bytes (from {len(raw)}-byte exported PNG)")

            # --- Editor shot: hero layout, photo loaded -----------------------
            page.goto(f"http://127.0.0.1:{PORT}/index.html?shot=editor&layout=heroThree&grade=viceSunset&photo=pier&title=SUNSET%20CITY&subtitle=one%20last%20ride")
            page.wait_for_function("window.coverReady === true", timeout=20000)
            page.wait_for_timeout(1200)
            page.screenshot(path=str(SHOTS / "2-editor.jpg"), type="jpeg", quality=88)
            img = Image.open(SHOTS / "2-editor.jpg")
            print(f"2-editor.jpg {img.size} {(SHOTS / '2-editor.jpg').stat().st_size} bytes")
            browser.close()
    finally:
        httpd.shutdown()

    print(f"external requests: {len(external)} {external}")
    print(f"console errors: {len(errors)} {errors}")
    if external:
        sys.exit("FAIL: external network requests during offline load")
    if errors:
        sys.exit("FAIL: console errors during load")
    for f in sorted(SHOTS.iterdir()):
        img = Image.open(f)
        assert f.stat().st_size <= 262144, f"{f.name} over 256 KiB"
        assert max(img.size) <= 1280 and min(img.size) >= 480, f"{f.name} size {img.size}"
        print(f"OK {f.name} {img.size} {f.stat().st_size} bytes")
    print("ALL SCREENSHOT CHECKS PASSED")


if __name__ == "__main__":
    main()
