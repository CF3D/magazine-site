#!/usr/bin/env python3
import json
import mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
MAGAZINES = ROOT / "Magazines"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/magazines":
            return self.handle_magazines_api()
        return super().do_GET()

    def handle_magazines_api(self):
        magazines = []

        if MAGAZINES.exists():
            for folder in sorted(
                [p for p in MAGAZINES.iterdir() if p.is_dir() and not p.name.startswith(".")],
                key=lambda p: p.name.lower()
            ):
                pages = sorted(
                    [
                        p.name for p in folder.iterdir()
                        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
                    ],
                    key=lambda name: name.lower()
                )

                if pages:
                    magazines.append({
                        "id": folder.name,
                        "title": f"Magazine {folder.name}",
                        "pages": pages
                    })

        payload = json.dumps({"magazines": magazines}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        print(fmt % args)

if __name__ == "__main__":
    port = 8080
    print(f"Magazine Reader running at http://localhost:{port}/")
    print(f"Scanning folder: {MAGAZINES}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
