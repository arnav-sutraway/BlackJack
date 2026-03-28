from ultralytics import YOLO

model = YOLO("yolov8n.pt")
# model = YOLO("runs/detect/train/weights/last.pt") # Use the last trained model

model.train(
    data="cards.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    augment=True
)