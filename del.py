import os

val_images = "dataset/images/val"
val_labels = "dataset/labels/val"

for img in os.listdir(val_images):
    lbl = os.path.join(val_labels, img.replace(".jpg", ".txt"))
    if not os.path.exists(lbl):
        print("Missing label for", img)