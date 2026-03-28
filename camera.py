import cv2
import numpy as np
import threading
import time
from ultralytics import YOLO

MODEL_PATH = "runs/detect/train4/weights/best.pt"

# Default: IP Webcam (or similar) on your phone — same Wi‑Fi as the PC. Change in app or set CAMERA_URL.
DEFAULT_STREAM_URL = "http://10.250.53.220:8080/video"


def _open_capture(source):
    """Open VideoCapture from integer index (e.g. 0) or URL string (IP Webcam, file, etc.)."""
    if isinstance(source, str) and source.isdigit():
        return cv2.VideoCapture(int(source))
    return cv2.VideoCapture(source)


class StreamReader:
    def __init__(self, url):
        self.url = url
        self.cap = _open_capture(url)
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



# ---------------------------------------------------------------------------
# New reusable detection API for frontend + server integration
# ---------------------------------------------------------------------------
class CardDetector:
    def __init__(self, url=None, commit_streak=4):
        self.url = url if url is not None else DEFAULT_STREAM_URL
        self.stream = StreamReader(self.url)
        self.model = YOLO(MODEL_PATH)

        self.count_map = {
            '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
            '7': 0, '8': 0, '9': 0,
            '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
        }

        self.count = 0
        self.seen_cards = set()
        self.pending = {}
        self.commit_streak = commit_streak
        self.failed_frames = 0
        self.max_failed_frames = 100
        self.last_committed = []

        self.jpeg_bytes = None
        self.state_lock = threading.Lock()
        self.running = True
        self.worker = threading.Thread(target=self._detect_loop, daemon=True)
        self.worker.start()

    def _detect_loop(self):
        while self.running:
            ret, frame = self.stream.read()
            if not ret or frame is None:
                self.failed_frames += 1
                if self.failed_frames >= self.max_failed_frames:
                    self.stream.release()
                    self.stream = StreamReader(self.url)
                    self.failed_frames = 0
                    continue
                time.sleep(0.05)
                continue

            self.failed_frames = 0
            results = self.model.track(frame, conf=0.30, persist=True, verbose=False)
            active_ids = set()

            for r in results:
                boxes = r.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    cls_id = int(box.cls[0])
                    rank = self.model.names[cls_id]
                    confidence = float(box.conf[0])
                    track_id = int(box.id[0]) if box.id is not None else None

                    if track_id is None or confidence < 0.30:
                        continue

                    active_ids.add(track_id)
                    x1, y1, x2, y2 = map(int, box.xyxy[0])

                    if track_id in self.seen_cards:
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 165, 0), 2)
                        cv2.putText(frame, f"{rank} (counted)", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
                        continue

                    if track_id not in self.pending or self.pending[track_id]['rank'] != rank:
                        self.pending[track_id] = {'rank': rank, 'streak': 1}
                    else:
                        self.pending[track_id]['streak'] += 1

                    streak = self.pending[track_id]['streak']
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                    cv2.putText(frame, f"{rank} ({streak}/{self.commit_streak})", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

                    if streak >= self.commit_streak:
                        self.seen_cards.add(track_id)
                        self.last_committed.append(rank)
                        if rank in self.count_map:
                            self.count += self.count_map[rank]
                        self.pending.pop(track_id, None)

            for tid in list(self.pending.keys()):
                if tid not in active_ids:
                    self.pending.pop(tid, None)

            cv2.putText(frame, f"Count: {self.count}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
            cv2.putText(frame, f"Cards seen: {len(self.seen_cards)}/52", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)

            _, jpeg = cv2.imencode('.jpg', frame)
            with self.state_lock:
                self.jpeg_bytes = jpeg.tobytes()

        self.stream.release()

    def get_frame(self):
        with self.state_lock:
            return self.jpeg_bytes

    def get_state(self):
        with self.state_lock:
            return {
                'count': self.count,
                'cards_seen': len(self.seen_cards),
                'seen_cards': sorted(list(self.seen_cards)),
                'last_committed': self.last_committed[-10:]
            }

    def reset(self):
        with self.state_lock:
            self.count = 0
            self.seen_cards.clear()
            self.pending.clear()
            self.last_committed.clear()

    def stop(self):
        self.running = False
        self.worker.join(timeout=2)


# ---------------------------------------------------------------------------
# Original legacy sample usage (kept as commented fallback)
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    # Legacy direct run with OpenCV GUI (kept for reference and manual testing)
    # Uncomment if you want to run without server integration:
    #
    # stream = StreamReader(url)
    # if not stream.isOpened():
    #     print("Failed to connect to stream. Check IP and that IP Webcam is running.")
    #     exit()
    # print("Stream connected. Starting detection...")
    # print("Model class names:", model.names)
    # (existing while True loop implementation can be copied here if needed)
    pass
