#!/usr/bin/env python3
import cgi
import io
import json
import os
import shutil
import subprocess
import tempfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
LOCAL_REAL_ESRGAN = ROOT / "vendor" / "realesrgan-ncnn-vulkan"
REAL_ESRGAN = (
    str(LOCAL_REAL_ESRGAN)
    if LOCAL_REAL_ESRGAN.exists() and os.access(LOCAL_REAL_ESRGAN, os.X_OK)
    else shutil.which("realesrgan-ncnn-vulkan")
)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/status":
            payload = {
                "ai": bool(REAL_ESRGAN),
                "name": "Real-ESRGAN · Neural upscale" if REAL_ESRGAN else "Lanczos · High-quality local resize",
                "description": "Apple Silicon AI engine detected." if REAL_ESRGAN else "Install Real-ESRGAN to enable neural AI upscaling. Current mode remains fully local.",
            }
            self.send_json(payload)
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/upscale":
            self.send_error(404)
            return
        form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={
            "REQUEST_METHOD": "POST",
            "CONTENT_TYPE": self.headers.get("Content-Type"),
        })
        if "image" not in form:
            self.send_error(400, "Missing image")
            return
        upload = form["image"]
        scale = max(2, min(4, int(form.getvalue("scale", "4"))))
        fmt = form.getvalue("format", "jpg").lower()
        if fmt not in {"jpg", "png", "webp"}:
            self.send_error(400, "Unsupported output format")
            return
        extension = "jpg" if fmt == "jpg" else fmt
        output_name = f"{Path(upload.filename).stem}-clarity-{scale}x.{extension}"
        try:
            data = upload.file.read()
            result = self.process(data, scale, fmt)
            self.send_response(200)
            self.send_header("Content-Type", f"image/{'jpeg' if fmt == 'jpg' else fmt}")
            self.send_header("Content-Length", str(len(result)))
            self.send_header("X-Output-Name", output_name)
            self.end_headers()
            self.wfile.write(result)
        except Exception as error:
            self.send_error(500, str(error))

    def process(self, data, scale, fmt):
        if REAL_ESRGAN:
            with tempfile.TemporaryDirectory() as temp:
                source = Path(temp) / "input.png"
                output = Path(temp) / f"output.{fmt}"
                Image.open(io.BytesIO(data)).convert("RGB").save(source)
                subprocess.run(
                    [
                        REAL_ESRGAN,
                        "-i", str(source),
                        "-o", str(output),
                        "-s", str(scale),
                        "-n", "realesrgan-x4plus",
                    ],
                    cwd=str(Path(REAL_ESRGAN).parent),
                    check=True,
                    capture_output=True,
                )
                return output.read_bytes()
        image = Image.open(io.BytesIO(data))
        if fmt == "jpg":
            image = image.convert("RGB")
        width, height = image.size
        image = image.resize((width * scale, height * scale), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        save_format = {"jpg": "JPEG", "png": "PNG", "webp": "WEBP"}[fmt]
        options = {"quality": 92, "optimize": True} if fmt in ("jpg", "webp") else {"optimize": True}
        image.save(output, save_format, **options)
        return output.getvalue()

    def send_json(self, payload):
        body = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4173"))
    print(f"Clarity is running at http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
