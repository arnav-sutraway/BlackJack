'''
DO NOT RUN AGAIN
'''

import os

labels_dir = "dataset/YOLO_Annotations"

files = [f for f in os.listdir(labels_dir) if f.endswith(".txt")]
total = len(files)

print(f"Processing {total} files...")

for i, file in enumerate(files):
    if i % 100 == 0:
        print(f"{i}/{total}")

    name = file.split('.')[0]

    if name.startswith("10"):
        rank = "10"
    else:
        rank = name[0]

    rank_map = {
        'A': 0,'2': 1,'3': 2,'4': 3,'5': 4,'6': 5,
        '7': 6,'8': 7,'9': 8,'10': 9,'J': 10,'Q': 11,'K': 12
    }

    if rank not in rank_map:
        continue

    new_class = rank_map[rank]

    file_path = os.path.join(labels_dir, file)

    with open(file_path, "r") as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        parts = line.strip().split()
        if len(parts) < 5:
            continue
        parts[0] = str(new_class)
        new_lines.append(" ".join(parts))

    with open(file_path, "w") as f:
        f.write("\n".join(new_lines))

print("Done!")