import numpy as np
from PIL import Image, ImageDraw, ImageFilter
# pyrefly: ignore [missing-import]
import imageio.v2 as imageio
import os

# 1. Load the original reference image
src_path = 'ChatGPT Image Sep 8, 2026, 11_38_35 AM.png'
base_img = Image.open(src_path).convert('RGB')
W, H = base_img.size

# Convert to grayscale numpy array for mask extraction
gray = np.array(base_img.convert('L'), dtype=np.float32)

# Define bounding boxes for eye regions
# Left Eye (viewer's left):
L_BOX = (420, 640, 580, 715)
# Right Eye (viewer's right):
R_BOX = (670, 640, 830, 715)

# Extract eye socket opening masks and pupil masks
def get_eye_layers(box):
    x0, y0, x1, y1 = box
    crop_gray = gray[y0:y1, x0:x1]
    
    # In the eye area, the upper lid is dark (< 100) at the top of the box
    # The lower lid is dark at the bottom of the box
    # The sclera is light (> 180)
    # The pupil is dark (< 100) located between sclera areas
    
    # We want to create:
    # 1. A static "eye socket mask" (the opening of the eye where sclera + pupil live)
    # 2. A "pupil sprite" (the isolated dark circle/oval with its highlight notch)
    # 3. A clean "sclera background" (pure white fill inside the eye socket opening)
    # 4. Upper eyelid overlay to preserve the exact antialiased lid boundary
    return crop_gray

# Let's create an accurate vector/raster composite for any (dx, dy, blink_t)
# where blink_t is 0.0 (fully open) to 1.0 (fully closed)

def create_frame(dx_left, dx_right, blink_t=0.0):
    frame = base_img.copy()
    
    # Left eye processing
    l_crop = base_img.crop(L_BOX)
    # Right eye processing
    r_crop = base_img.crop(R_BOX)
    
    # Let's create frame modifications
    # Left eye:
    lx0, ly0, lx1, ly1 = L_BOX
    rx0, ry0, rx1, ry1 = R_BOX
    
    # Create high-precision eye rendering
    # We will test and refine the exact drawing
    return frame

print("Script template ready")
