from ultralytics import YOLO

model = YOLO("runs/detect/train4/weights/best.pt")
print(model.names)
#results = model("dataset/images/val/2C9.jpg", conf=0.60, show=True)