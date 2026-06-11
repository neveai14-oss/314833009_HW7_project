import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

try:
    from .llm_client import expand_prompt
    from .diffusion_client import generate_stable_diffusion_image
except ImportError:
    from llm_client import expand_prompt
    from diffusion_client import generate_stable_diffusion_image


ROOT = Path(__file__).resolve().parent


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        if self.path == "/api/expand":
            self._handle_expand()
            return
        if self.path == "/api/stable-diffusion":
            self._handle_stable_diffusion()
            return
        self.send_error(404)

    def _handle_expand(self):
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        prompt = payload.get("prompt", "").strip()
        if not prompt:
            self._send_json({"error": "Prompt is required."}, status=400)
            return
        self._send_json(expand_prompt(prompt))

    def _handle_stable_diffusion(self):
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        prompt = payload.get("prompt", "").strip()
        if not prompt:
            self._send_json({"error": "Prompt is required."}, status=400)
            return
        try:
            result = generate_stable_diffusion_image(
                prompt=prompt,
                negative_prompt=payload.get("negative_prompt", ""),
                width=payload.get("width", 512),
                height=payload.get("height", 768),
                steps=payload.get("steps", 25),
                guidance=payload.get("guidance", 7.5),
                seed=payload.get("seed"),
            )
            self._send_json(result)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=500)

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    host = "127.0.0.1"
    port = 8000
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Prompt-to-Flow Poster Studio running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
