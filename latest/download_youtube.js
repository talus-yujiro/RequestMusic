const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const os = require("os");

// ダウンロードフォルダを取得
const downloadFolder = "/mnt/chromeos/MyFiles/Downloads";

// `links.txt` からYouTube動画のリンクを取得
const linksFile = "links.txt";

fs.readFile(linksFile, "utf8", (err, data) => {
    if (err) {
        console.error("Error reading links file:", err);
        return;
    }

    // 各URLについて処理
    data.split("\n").forEach((url) => {
        url = url.trim(); // 余分なスペースや改行を削除
        if (!url) return;

        console.log(`Downloading: ${url}`);

        // yt-dlp コマンドを実行
        const command = `yt-dlp -o "${downloadFolder}/%(title)s.%(ext)s" ${url}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error downloading ${url}:`, error);
                return;
            }
            console.log(stdout);
            if (stderr) console.error(stderr);
        });
    });
});

