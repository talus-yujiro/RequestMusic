import os
from datetime import datetime
import glob
import subprocess


subprocess.run(["python3", "-m", "venv", "venv"])
subprocess.run("source venv/bin/activate", shell=True, executable="/bin/bash")
subprocess.run(["pip", "install", "yt-dlp", "ffmpeg-python"])

from yt_dlp import YoutubeDL
import ffmpeg

today = datetime.today().strftime('%Y-%m-%d')

base_folder = "video"
today_folder = os.path.join(base_folder, today)
os.makedirs(today_folder, exist_ok=True)

save_folder = os.path.join(today_folder, '%(title)s.%(ext)s')

url = input("URLを空白で区切って入力: ")
url_str = str(url)

url_list = url_str.split()

ydl_opts = {
    'outtmpl': save_folder,
    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
}
with YoutubeDL(ydl_opts) as ydl:
    ydl.download(url_list)

video_folder = os.path.join("video", today)

mp4_files = glob.glob(os.path.join(video_folder, "*.mp4"))

print("動画のダウンロードが完了しました！")
print(f"{mp4_files}をダウンロードしました")

input_videos = mp4_files
output_video = f"{today}.mp4"  # 出力ファイル名

# 一時的なリストファイルを作成
with open("file_list.txt", "w") as f:
    for video in input_videos:
        f.write(f"file '{video}'\n")

print(f"{len(input_videos)}個の動画を結合します。")

combine_if = input("結合しますか？(y/n): ")

# ffmpeg を実行（連結処理）
if combine_if == "y":
    ffmpeg.input("file_list.txt", format="concat", safe=0).output(output_video, c="copy").run()
    print("動画の結合が完了しました！")
else:
    print("結合しませんでした。")

os.remove("file_list.txt")
subprocess.run("deactivate", shell=True, executable="/bin/bash")