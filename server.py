import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from advisorbot import BlackjackAgent

# Initialize the existing HackAtlanta agent
agent = BlackjackAgent()

class RequestHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable complete CORS for local index.html to fetch flawlessly
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        BaseHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/advise':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse the JSON payload sent by index.html JS
                data = json.loads(post_data.decode('utf-8'))
                player_cards = data.get('player_cards', [])
                dealer_card = data.get('dealer_card', 0)

                # Ensure integers
                player_cards = [int(x) for x in player_cards]
                dealer_card = int(dealer_card) if dealer_card else 0

                # Pipe states into your exact `advisorbot` genai logic
                advice = agent.reason_with_gemini(player_cards, dealer_card)
                
                # Send the response string wrapped in JSON back to the browser UI
                response_data = {"success": True, "advice": advice}
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_resp = {"success": False, "error": str(e)}
                self.wfile.write(json.dumps(error_resp).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Starting Native Python AI Server connected to advisorbot.py on Port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("AI Server stopped.")
