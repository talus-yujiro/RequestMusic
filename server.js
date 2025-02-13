const express = require('express');
const fs = require('fs');
const path = require('path');
const ytDlp = require('yt-dlp');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const port = 3000;

// 一時ファイルを削除する関数
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  } else {
    console.warn(`ファイルが存在しません: ${filePath}`);
  }
};

app.get('/download', async (req, res) => {
  const videoUrls = req.query.urls;
  if (!videoUrls) {
    return res.status(400).json({ error: 'URLが指定されていません' });
  }

  const urls = videoUrls.split(',');

  try {
    // 各動画の音声と動画をダウンロード
    const tempFiles = [];
    const outputPaths = [];
    const tempAudioFiles = [];
    
    for (let i = 0; i < urls.length; i++) {
      const videoUrl = urls[i].trim();
      
      // 動画と音声を一時ファイルにダウンロード
      const videoOutput = path.resolve(__dirname, `temp_video_${i}.mp4`);
      const audioOutput = path.resolve(__dirname, `temp_audio_${i}.m4a`);
      
      // ダウンロード
      await ytDlp.exec([videoUrl, '-f', 'bestvideo+bestaudio', '--merge-output-format', 'mp4', '-o', videoOutput]);

      tempFiles.push(videoOutput);
      tempAudioFiles.push(audioOutput);
    }

    // 動画と音声の結合
    const outputPath = path.resolve(__dirname, 'output_video.mp4');
    const listFilePath = path.resolve(__dirname, 'filelist.txt');
    
    // ファイルリストを生成
    const fileList = tempFiles.map((videoFile, index) => {
      return `file '${videoFile}'\nfile '${tempAudioFiles[index]}'\n`;
    }).join('');

    fs.writeFileSync(listFilePath, fileList);

    ffmpeg()
      .input(listFilePath)
      .inputOptions('-f', 'concat')
      .inputOptions('-safe', '0')
      .outputOptions('-c:v', 'copy', '-c:a', 'aac', '-strict', 'experimental')
      .output(outputPath)
      .on('end', () => {
        // 成功時のレスポンスを送信
        res.download(outputPath, 'combined_video.mp4', (err) => {
          if (err) {
            console.error('ファイル送信エラー:', err);
          }

          // 結果のファイルと一時ファイルの削除
          tempFiles.forEach(file => deleteFileIfExists(file));
          tempAudioFiles.forEach(file => deleteFileIfExists(file));
          fs.unlinkSync(listFilePath);
          fs.unlinkSync(outputPath);
        });
      })
      .on('error', (err) => {
        console.error('結合エラー:', err);
        res.status(500).json({ error: '結合中にエラーが発生しました', message: err.message });

        // 結合に失敗した場合のファイル削除
        tempFiles.forEach(file => deleteFileIfExists(file));
        tempAudioFiles.forEach(file => deleteFileIfExists(file));
        fs.unlinkSync(listFilePath);
      })
      .run();

  } catch (error) {
    console.error('ダウンロード中にエラーが発生しました:', error);
    res.status(500).json({ error: '動画のダウンロード中にエラーが発生しました', message: error.message });

    // ダウンロード失敗時のファイル削除
    tempFiles.forEach(file => deleteFileIfExists(file));
    tempAudioFiles.forEach(file => deleteFileIfExists(file));
  }
});

app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});

