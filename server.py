import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

from advisorbot import BlackjackAgent

agent = BlackjackAgent()

_detector = None
_detector_init_error = None


def get_or_create_detector(*, clear_errors=False):
    """Lazily start CardDetector (YOLO + stream). Fails soft if deps or model missing."""
    global _detector, _detector_init_error
    if clear_errors:
        _detector_init_error = None
    if _detector is not None:
        return _detector
    if _detector_init_error is not None:
        return None
    try:
        from camera import CardDetector

        url = os.environ.get("CAMERA_STREAM_URL")
        _detector = CardDetector(url=url) if url else CardDetector()
        print("CardDetector started for camera sync.")
        return _detector
    except Exception as e:
        _detector_init_error = str(e)
        print(f"CardDetector failed to start: {e}")
        err = str(e).lower()
        if "cv2" in err or "opencv" in err:
            print(
                f"  → Install OpenCV: {sys.executable} -m pip install opencv-python"
            )
        if "ultralytics" in err or "torch" in err:
            print(
                f"  → Install YOLO stack: {sys.executable} -m pip install ultralytics"
            )
        return None


def retry_detector():
    """Clear cached failure so the next request tries to create the detector again."""
    global _detector, _detector_init_error
    if _detector is not None:
        try:
            _detector.stop()
        except Exception:
            pass
        _detector = None
    _detector_init_error = None


class RequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        BaseHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path != "/detect/state":
            self.send_response(404)
            self.end_headers()
            return

        if _detector is None:
            self._send_json(
                200,
                {
                    "available": False,
                    "error": _detector_init_error
                    or "Detector not running yet — use Deal in camera mode to start.",
                    "last_committed": [],
                },
            )
            return

        try:
            st = _detector.get_state()
            st["available"] = True
            st["error"] = None
            self._send_json(200, st)
        except Exception as e:
            self._send_json(500, {"available": False, "error": str(e), "last_committed": []})

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(length) if length else b""

        if path == "/detect/reset":
            det = get_or_create_detector(clear_errors=True)
            if det is None:
                self._send_json(
                    503,
                    {
                        "ok": False,
                        "error": _detector_init_error or "Could not start CardDetector",
                    },
                )
                return
            try:
                det.reset()
                self._send_json(200, {"ok": True})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return

        if path == "/detect/retry":
            retry_detector()
            det = get_or_create_detector()
            self._send_json(
                200,
                {
                    "ok": det is not None,
                    "error": None if det is not None else _detector_init_error,
                },
            )
            return

        if path == "/advise":
            try:
                data = json.loads(post_data.decode("utf-8"))
                player_cards = [int(x) for x in data.get("player_cards", [])]
                dealer_card = data.get("dealer_card", 0)
                dealer_card = int(dealer_card) if dealer_card else 0

                advice = agent.reason_with_gemini(player_cards, dealer_card)
                self._send_json(200, {"success": True, "advice": advice})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        self.send_response(404)
        self.end_headers()


if __name__ == "__main__":
    port = 8000
    httpd = HTTPServer(("", port), RequestHandler)
    print(f"Server on port {port} — /advise, GET /detect/state, POST /detect/reset")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("Server stopped.")
