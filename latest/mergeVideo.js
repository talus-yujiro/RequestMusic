const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// 動画リストの読み込み
const videoListFile = 'videolist.txt';
const tempDir = 'temp_videos';
const outputFile = 'output.mp4';
const downloadDir = '/mnt/chromeos/MyFiles/Downloads';

// 一時フォルダの作成
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// 動画リストを取得
const videos = fs.readFileSync(videoListFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim() !== ''); // 空行を除去

if (videos.length < 2) {
  console.log('動画が2つ以上必要です。');
  process.exit(1);
}

// 動画を MP4 に変換する関数
const convertToMp4 = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .videoCodec('libx264')
      .audioCodec('aac')
      .format('mp4')
      .on('end', () => {
        console.log(`変換完了: ${outputFile}`);
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error(`変換エラー: ${inputFile}`, err);
        reject(err);
      })
      .run();
  });
};

// 変換処理
const convertAllVideos = async () => {
  const convertedVideos = [];
  for (const video of videos) {
    const inputPath = video.trim();
    if (!fs.existsSync(inputPath)) {
      console.error(`ファイルが見つかりません: ${inputPath}`);
      process.exit(1);
    }
    const outputPath = path.join(tempDir, path.basename(inputPath, path.extname(inputPath)) + '_converted.mp4');
    const converted = await convertToMp4(inputPath, outputPath);
    convertedVideos.push(converted);
  }
  return convertedVideos;
};

// 動画結合
const mergeVideos = (videoFiles) => {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = ffmpeg();
    videoFiles.forEach(video => {
      ffmpegCommand.input(video);
    });

    ffmpegCommand
      .on('start', commandLine => {
        console.log('実行中:', commandLine);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('エラー:', err);
        console.error('標準エラー出力:', stderr);
        reject(err);
      })
      .on('end', () => {
        console.log('動画の結合が完了しました:', outputFile);
        resolve();
      })
      .mergeToFile(outputFile);
  });
};

// ファイル移動
const moveToDownloads = (file) => {
  const destination = path.join(downloadDir, path.basename(file));
  fs.renameSync(file, destination);
  console.log(`ファイルを移動しました: ${destination}`);
};

// 実行
const run = async () => {
  try {
    console.log('動画のMP4変換を開始...');
    const convertedVideos = await convertAllVideos();
    console.log('すべての動画がMP4に変換されました。');

    console.log('動画の結合を開始...');
    await mergeVideos(convertedVideos);

    // output.mp4 を Downloads に移動
    moveToDownloads(outputFile);

    // 一時ファイルの削除
    convertedVideos.forEach(file => fs.unlinkSync(file));
    fs.rmdirSync(tempDir);
    console.log('一時ファイルを削除しました。');
  } catch (err) {
    console.error('エラーが発生しました:', err);
  }
};

run();

