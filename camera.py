import cv2
import numpy as np
import threading
import time
from ultralytics import YOLO

model = YOLO("runs/detect/train4/weights/best.pt")

url = "http://10.250.53.220:8080/video"


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
                time.sleep(0.05)

    def read(self):
        with self.lock:
            if self.frame is None:
                return False, None
            return self.ret, self.frame.copy()

    def isOpened(self):
        return self.cap.isOpened()

    def release(self):
        self.running = False
        self.thread.join(timeout=2)
        self.cap.release()


stream = StreamReader(url)

if not stream.isOpened():
    print("Failed to connect to stream. Check IP and that IP Webcam is running.")
    exit()

print("Stream connected. Starting detection...")
print("Model class names:", model.names)

count_map = {
    '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
}

count = 0
seen_cards = set()   # Committed track_ids
pending = {}         # track_id -> { 'rank': str, 'streak': int }
COMMIT_STREAK = 4
failed_frames = 0
MAX_FAILED_FRAMES = 100


while True:
    ret, frame = stream.read()

    if not ret or frame is None:
        failed_frames += 1
        if failed_frames % 20 == 0:
            print(f"Waiting for stream... ({failed_frames}/{MAX_FAILED_FRAMES})")
        if failed_frames >= MAX_FAILED_FRAMES:
            print("Stream lost. Attempting reconnect...")
            stream.release()
            stream = StreamReader(url)
            failed_frames = 0
            if not stream.isOpened():
                print("Reconnect failed. Exiting.")
                break
        continue

    failed_frames = 0

    results = model.track(frame, conf=0.35, persist=True, verbose=False)

    active_ids = set()

    for r in results:
        boxes = r.boxes
        if boxes is None:
            continue

        for box in boxes:
            cls_id     = int(box.cls[0])
            rank       = model.names[cls_id]
            confidence = float(box.conf[0])
            track_id   = int(box.id[0]) if box.id is not None else None

            if track_id is None or confidence < 0.35:
                continue

            active_ids.add(track_id)
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Already committed — draw orange
            if track_id in seen_cards:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 165, 0), 2)
                cv2.putText(frame, f"{rank} (counted)", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
                continue

            # Update streak — reset if rank changed for this track_id
            if track_id not in pending or pending[track_id]['rank'] != rank:
                pending[track_id] = {'rank': rank, 'streak': 1}
            else:
                pending[track_id]['streak'] += 1

            streak = pending[track_id]['streak']

            # Yellow while building streak
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
            cv2.putText(frame, f"{rank} ({streak}/{COMMIT_STREAK})", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

            # Commit after enough consistent frames
            if streak >= COMMIT_STREAK:
                seen_cards.add(track_id)
                if rank in count_map:
                    count += count_map[rank]
                    print(f"Committed: {rank} (ID:{track_id}) | Running count: {count}")
                else:
                    print(f"Unrecognized rank: '{rank}'")
                del pending[track_id]

    # Clean up pending for IDs no longer visible
    for tid in list(pending.keys()):
        if tid not in active_ids:
            del pending[tid]

    cv2.putText(frame, f"Count: {count}",                   (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
    cv2.putText(frame, f"Cards seen: {len(seen_cards)}/52", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)

    cv2.imshow("Blackjack Counter", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('r'):
        seen_cards.clear()
        pending.clear()
        count = 0
        print("Reset — new shoe started")

stream.release()
cv2.destroyAllWindows()