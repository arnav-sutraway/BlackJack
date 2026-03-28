from ultralytics import YOLO

model = YOLO("runs/detect/train/weights/last.pt")
results = model("dataset/images/val/2C9.jpg", conf=0.80, show=True)