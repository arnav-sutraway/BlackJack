import os

for folder in ["train", "val"]:
    img_dir = f"dataset/images/{folder}"
    lbl_dir = f"dataset/labels/{folder}"
    for img_file in os.listdir(img_dir):
        lbl_file = os.path.join(lbl_dir, img_file.replace(".jpg", ".txt"))
        if not os.path.exists(lbl_file):
            print("Missing label:", img_file)
        else:
            with open(lbl_file) as f:
                if len(f.readlines()) == 0:
                    print("Empty label:", img_file)