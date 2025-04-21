import os
import string
import random
from PIL import Image, ImageDraw, ImageFont
from tqdm import tqdm  # optional, for progress bar

# Config
output_dir = "img"
os.makedirs(output_dir, exist_ok=True)

width, height = 300, 240
font_size = 64
num_images = 15000

# Load a TTF font (fallback to default if necessary)
try:
    font = ImageFont.truetype("arial.ttf", font_size)
except IOError:
    font = ImageFont.load_default()

def generate_random_text(length=6):
    return ''.join(random.choices(string.ascii_uppercase, k=length))

for i in tqdm(range(1, num_images + 1), desc="Generating images"):
    text = generate_random_text()
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)

    # Get size of text and center it
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) / 2
    y = (height - text_height) / 2

    draw.text((x, y), text, font=font, fill="black")

    # Save image
    filename = f"image-{i}.png"
    img.save(os.path.join(output_dir, filename), format="PNG")
