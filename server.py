import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

from advisorbot import BlackjackAgent

agent = BlackjackAgent()

# Shared state files written by camera.py
STATE_FILE = "/tmp/bj_detect_state.json"
RESET_FILE = "/tmp/bj_detect_reset"


def _read_detect_state():
    """Return the state dict written by camera.py, or None if camera isn't running."""
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return None


class RequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return  # silence per-request noise

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

        state = _read_detect_state()
        if state is None:
            self._send_json(200, {
                "available": False,
                "last_committed": [],
                "error": "camera.py is not running — start it in a separate terminal.",
            })
        else:
            self._send_json(200, {
                "available": True,
                "last_committed": state.get("last_committed", []),
                "count": state.get("count", 0),
                "error": None,
            })

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(length) if length else b""

        if path == "/detect/reset":
            # Signal camera.py to reset, and immediately clear the state file
            try:
                with open(RESET_FILE, "w") as f:
                    f.write("reset")
                with open(STATE_FILE, "w") as f:
                    json.dump({"last_committed": [], "count": 0}, f)
                self._send_json(200, {"ok": True})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
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
    print(f"Server running on http://127.0.0.1:{port}")
    print("Endpoints: GET /detect/state  POST /detect/reset  POST /advise")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("Server stopped.")
