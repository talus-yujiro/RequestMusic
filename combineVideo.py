import os
import glob
import ffmpeg
from datetime import datetime

today = datetime.today().strftime("%Y-%m-%d")

video_folder = os.path.join("video", today)

mp4_files = glob.glob(os.path.join(video_folder, "*.mp4"))

input_videos = mp4_files
output_video = f"{today}.mp4"  # 出力ファイル名

# 一時的なリストファイルを作成
with open("file_list.txt", "w") as f:
    for video in input_videos:
        f.write(f"file '{video}'\n")

# ffmpeg を実行（連結処理）
ffmpeg.input("file_list.txt", format="concat", safe=0).output(output_video, c="copy").run()

os.remove("file_list.txt")

print("動画の結合が完了しました！")