import cv2
from ultralytics import YOLO

# Load your trained model
model = YOLO("runs/detect/train4/weights/best.pt")

# Phone camera stream URL
#url = "http://192.168.1.151:8080/video"
url = "http://11.42.13.80:8080/video"  # Update with your phone's IP address

cap = cv2.VideoCapture(url)

# Running count
count = 0

# Hi-Lo values
count_map = {
    '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
}

seen_cards = set()  # prevents double counting

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, conf=0.35)

    for r in results:
        boxes = r.boxes
        print("Detections:", len(r.boxes))

        if boxes is None:
            continue

        for box in boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]

            # Avoid counting same card multiple times
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            card_id = (label, x1//50, y1//50)  # rough position bucket

            if card_id not in seen_cards:
                seen_cards.add(card_id)

                if label in count_map:
                    count += count_map[label]

            # Draw box
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, label, (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    # Show count
    cv2.putText(frame, f"Count: {count}", (20,50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,0,255), 3)

    cv2.imshow("Blackjack Counter", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()