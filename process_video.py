import cv2
import numpy as np
import imageio_ffmpeg
import subprocess
import os

cap = cv2.VideoCapture('me.mp4')
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

crop_x1, crop_x2 = 540, 1400
crop_y1, crop_y2 = 30, 1065
raw_w = crop_x2 - crop_x1
raw_h = crop_y2 - crop_y1

# Scale to high quality crisp display size (width ~430, height ~518 - exactly 2x retina display size)
out_w = (raw_w // 2)
out_h = (raw_h // 2)
if out_w % 2 != 0: out_w += 1
if out_h % 2 != 0: out_h += 1

print(f"Original crop: {raw_w}x{raw_h} -> Export size: {out_w}x{out_h}, Frames: {total_frames}, FPS: {fps}")

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

webm_path = 'me_transparent.webm'
mp4_path = 'me_cropped.mp4'

# Fast, high-quality VP9 transparent WebM with alpha
cmd_webm = [
    ffmpeg_exe, '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{out_w}x{out_h}',
    '-pix_fmt', 'bgra',
    '-r', str(fps),
    '-i', '-',
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-deadline', 'realtime',
    '-cpu-used', '5',
    '-row-mt', '1',
    '-b:v', '1200k',
    '-auto-alt-ref', '0',
    webm_path
]

cmd_mp4 = [
    ffmpeg_exe, '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{out_w}x{out_h}',
    '-pix_fmt', 'bgr24',
    '-r', str(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-crf', '20',
    mp4_path
]

# Run WebM first, then MP4, or simultaneously without stdout/stderr pipe deadlocks
p_webm = subprocess.Popen(cmd_webm, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
p_mp4 = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

frames_bgra = []
frames_bgr = []

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    cropped = frame[crop_y1:crop_y1+raw_h, crop_x1:crop_x1+raw_w]
    resized = cv2.resize(cropped, (out_w, out_h), interpolation=cv2.INTER_AREA)
    
    # Exterior background mask via floodFill
    h, w = resized.shape[:2]
    mask = np.zeros((h+2, w+2), np.uint8)
    for pt in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1), (w//2, 0)]:
        cv2.floodFill(resized.copy(), mask, pt, (0, 0, 0), (10, 10, 10), (10, 10, 10), flags=8 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
    
    bg_mask = mask[1:-1, 1:-1]
    
    # Alpha channel computation
    diff_from_white = 255.0 - np.min(resized, axis=2).astype(np.float32)
    alpha = np.clip(diff_from_white / 20.0 * 255.0, 0, 255).astype(np.uint8)
    
    # Clean distance from bg
    dist_bg = cv2.distanceTransform(bg_mask, cv2.DIST_L2, 3)
    alpha[dist_bg > 2] = 0
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    
    bgra = cv2.cvtColor(resized, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = alpha
    
    p_webm.stdin.write(bgra.tobytes())
    p_mp4.stdin.write(resized.tobytes())

cap.release()
p_webm.stdin.close()
p_mp4.stdin.close()
p_webm.wait()
p_mp4.wait()

print(f"SUCCESS: Generated {webm_path} ({os.path.getsize(webm_path)} bytes) and {mp4_path} ({os.path.getsize(mp4_path)} bytes)")
