import cv2
import numpy as np
import threading
import time
from ultralytics import YOLO

# --- CONFIGURATION ---
MODEL_PATH = "runs/detect/train4/weights/best.pt"
# Make sure this matches the IP currently shown on your phone's screen
URL = "http://10.250.53.220:8080/video" 

# --- THREADED READER ---
class StreamReader:
    def __init__(self, url):
        self.url = url
        self.cap = cv2.VideoCapture(url)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame = None
        self.ret = False
        self.lock = threading.Lock()
        self.running = True
        self.thread = threading.Thread(target=self._read_loop, daemon=True)
        self.thread.start()
        time.sleep(2)

    def _read_loop(self):
        while self.running:
            ret, frame = self.cap.read()
            if ret:
                with self.lock:
                    self.ret = ret
                    self.frame = frame
            else:
                time.sleep(0.01)

    def read(self):
        with self.lock:
            if self.frame is None:
                return False, None
            return self.ret, self.frame.copy()

    def isOpened(self):
        return self.cap.isOpened()

    def release(self):
        self.running = False
        self.cap.release()

# --- INITIALIZATION ---
model = YOLO(MODEL_PATH)
stream = StreamReader(URL)

if not stream.isOpened():
    print("CRITICAL: Cannot connect to phone. Check IP and Wi-Fi.")
    exit()

count = 0
seen_cards = set()  # Confirmed track IDs
pending = {}       # track_id -> {'rank': str, 'streak': int}
COMMIT_STREAK = 3  # Frames needed to "confirm" a card
count_map = {
    '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
}

print("Detection started. Press 'q' to quit, 'r' to reset count.")

while True:
    ret, frame = stream.read()
    if not ret or frame is None:
        continue

    # 1. RUN TRACKING (persist=True is required for box.id)
    results = model.track(frame, conf=0.35, persist=True, verbose=False)
    active_ids = set()

    if results and results[0].boxes.id is not None:
        boxes = results[0].boxes
        for box in boxes:
            track_id = int(box.id[0])
            cls_id = int(box.cls[0])
            rank = model.names[cls_id]
            active_ids.add(track_id)
            
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Logic: If already counted, draw ORANGE
            if track_id in seen_cards:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 165, 0), 2)
                cv2.putText(frame, f"{rank} (OK)", (x1, y1-10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)
                continue

            # Logic: New card detected, check streak
            if track_id not in pending or pending[track_id]['rank'] != rank:
                pending[track_id] = {'rank': rank, 'streak': 1}
            else:
                pending[track_id]['streak'] += 1

            streak = pending[track_id]['streak']
            
            if streak >= COMMIT_STREAK:
                # COMMIT the card
                seen_cards.add(track_id)
                if rank in count_map:
                    count += count_map[rank]
                pending.pop(track_id, None)
            else:
                # Still checking (Yellow)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                cv2.putText(frame, f"Checking {rank}... {streak}/{COMMIT_STREAK}", 
                            (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

    # 2. CLEANUP: Remove IDs that are no longer in the camera frame
    pending = {tid: val for tid, val in pending.items() if tid in active_ids}

    # 3. OVERLAYS
    cv2.putText(frame, f"Count: {count}", (20, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
    cv2.putText(frame, f"Cards: {len(seen_cards)}", (20, 90), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    cv2.imshow("Blackjack Counter", frame)

    # 4. KEYBOARD CONTROLS
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('r'):
        count = 0
        seen_cards.clear()
        pending.clear()
        print("Count Reset.")

stream.release()
cv2.destroyAllWindows()