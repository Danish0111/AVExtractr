// import { YtDlp } from 'ytdlp-nodejs';
// import fs from "fs";
// import path from "path";
// import os from "os";

// function safeFilename(name) {
//     return name
//         .replace(/[\r\n]+/g, " ")
//         .replace(/[<>:"/\\|?*]+/g, "")
//         .replace(/[^\x20-\x7E]/g, "")
//         .trim()
//         .substring(0, 100);
// }

// const YTDLP_PATH =
//     process.env.NODE_ENV === "production"
//         ? "yt-dlp"
//         : "yt-dlp";

// export const extractAudioController = async (req, res) => {
//     try {
//         let url = decodeURIComponent(req.query.url);

//         if (url.includes("/shorts/")) {
//             const id = url.split("/shorts/")[1].split("?")[0];
//             url = `https://www.youtube.com/watch?v=${id}`;
//         }

//         if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
//             return res.status(400).send("Invalid YouTube URL");
//         }

//         const ytDlp = new YtDlp();
//         let title = "audio";
//         try {
//             const infoProcess = ytDlp.exec(url, {
//                 binPath: YTDLP_PATH,
//                 dumpJson: true,
//                 noWarnings: true,
//                 quiet: true,

//                 noPlaylist: true,
//             });

//             let jsonOutput = "";
//             infoProcess.stdout.on("data", (chunk) => {
//                 jsonOutput += chunk.toString();
//             });

//             await new Promise((resolve, reject) => {
//                 infoProcess.on("close", (code) => {
//                     if (code === 0) {
//                         try {
//                             const info = JSON.parse(jsonOutput);
//                             title = info.title || "audio";
//                             title = safeFilename(title);
//                         } catch (e) {
//                             console.warn("Could not parse JSON:", e.message);
//                         }
//                         resolve();
//                     } else {
//                         reject(new Error(`Process exited with code ${code}`));
//                     }
//                 });
//             });
//         } catch (err) {
//             console.warn("Could not fetch video title:", err.message);
//         }

//         res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
//         res.header("Content-Type", "audio/mpeg");

//         const audioProc = ytDlp.exec(url, {
//             binPath: YTDLP_PATH,
//             noPlaylist: true,
//             extractAudio: true,
//             audioFormat: "mp3",
//             audioQuality: "0",
//             output: "-"
//         });

//         audioProc.stderr.on("data", d => {
//             console.error("yt-dlp audio stderr:", d.toString());
//         });

//         audioProc.stdout.pipe(res);

//     } catch (error) {
//         console.error("Controller error:", error);
//         if (!res.headersSent) {
//             res.status(500).json({ message: "Internal Server Error", error: error.message });
//         }
//     }
// }

// export const extractVideoController = async (req, res) => {
//     try {
//         let url = decodeURIComponent(req.query.url);

//         if (url.includes("/shorts/")) {
//             const id = url.split("/shorts/")[1].split("?")[0];
//             url = `https://www.youtube.com/watch?v=${id}`;
//         }

//         if (!url) return res.status(400).send("Missing URL");

//         const ytDlp = new YtDlp();

//         let title = "video";
//         try {
//             const infoProcess = ytDlp.exec(url, {
//                 binPath: YTDLP_PATH,
//                 dumpJson: true,
//                 noWarnings: true,
//                 quiet: true,
//                 noPlaylist: true,
//             });

//             let jsonOutput = "";
//             infoProcess.stdout.on("data", (chunk) => {
//                 jsonOutput += chunk.toString();
//             });

//             await new Promise((resolve, reject) => {
//                 infoProcess.on("close", (code) => {
//                     if (code === 0) {
//                         try {
//                             const info = JSON.parse(jsonOutput);
//                             title = info.title || "video";
//                             title = safeFilename(title);
//                         } catch (e) {
//                             console.warn("Could not parse JSON:", e.message);
//                         }
//                         resolve();
//                     } else {
//                         reject(new Error(`Process exited with code ${code}`));
//                     }
//                 });
//             });
//         } catch (err) {
//             console.warn("Could not fetch video title:", err.message);
//         }
//         const tempDir = os.tmpdir();
//         const filePath = path.join(
//             tempDir,
//             `${Date.now()}-${title}.mp4`
//         );

//         const proc = ytDlp.exec(url, {
//             binPath: YTDLP_PATH,
//             format: "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]",
//             mergeOutputFormat: "mp4",
//             ffmpegLocation:
//                 process.env.NODE_ENV === "production"
//                     ? "/usr/bin/ffmpeg"
//                     : "C:\\ffmpeg\\bin\\ffmpeg.exe",
//             output: filePath,
//             noPlaylist: true,
//         });

//         proc.stderr.on("data", d => {
//             console.error("yt-dlp video stderr:", d.toString());
//         });

//         await new Promise((resolve, reject) => {
//             proc.on("close", (code) => {
//                 code === 0 ? resolve() : reject();
//             });
//         });

//         if (!fs.existsSync(filePath)) {
//             return res.status(500).send("Video not created");
//         }

//         res.download(filePath, () => {
//             fs.unlink(filePath, () => { });
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Failed to download video");
//     }
// };

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const COOKIES_FILE = path.join(os.tmpdir(), "youtube_cookies.txt");

const DEFAULT_COOKIES = `# Netscape HTTP Cookie File
# This is a generated file!  Do not edit.

.youtube.com	TRUE	/	TRUE	0	PREF	f1=50000000&f6=40000000
.youtube.com	TRUE	/	TRUE	0	__Secure-1PSID	YOUR_PSID_HERE
.youtube.com	TRUE	/	TRUE	0	__Secure-1PSIDTS	YOUR_PSIDTS_HERE
`;

if (!fs.existsSync(COOKIES_FILE)) {
  fs.writeFileSync(COOKIES_FILE, DEFAULT_COOKIES);
}

export const extractAudioController = async (req, res) => {
  try {
    let url = decodeURIComponent(req.query.url || "");
    
    if (!url) return res.status(400).send("Missing URL");

    if (url.includes("/shorts/")) {
      const id = url.split("/shorts/")[1].split("?")[0];
      url = `https://www.youtube.com/watch?v=${id}`;
    }

    const ytDlpPath = "yt-dlp";
    const ffmpegPath = "/usr/bin/ffmpeg";

    const outPath = path.join(os.tmpdir(), `${Date.now()}_audio.mp3`);

    const yt = spawn(ytDlpPath, [
      "-f", "bestaudio",
      "-o", "-",
      "--no-warnings",
      "-q",
      "-R", "5",
      "--socket-timeout", "30",
      "--http-headers", "User-Agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      url
    ]);

    const ffmpeg = spawn(ffmpegPath, [
      "-f", "webm",
      "-i", "pipe:0",
      "-vn",
      "-acodec", "libmp3lame",
      "-ab", "192k",
      "-f", "mp3",
      outPath
    ]);

    let ffmpegStderr = "";

    yt.stderr.on("data", d => {
      console.error("[yt-dlp stderr]", d.toString().trim());
    });

    ffmpeg.stderr.on("data", d => {
      ffmpegStderr += d.toString();
    });

    yt.stdout.pipe(ffmpeg.stdin);

    yt.on("error", (error) => {
      ffmpeg.kill();
      if (!res.headersSent) {
        res.status(500).send(`yt-dlp error: ${error.message}`);
      }
    });

    ffmpeg.on("error", (error) => {
      if (!res.headersSent) {
        res.status(500).send(`ffmpeg error: ${error.message}`);
      }
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        if (!res.headersSent) {
          res.status(500).send(`Conversion failed with code ${code}`);
        }
        return;
      }

      setTimeout(() => {
        if (!fs.existsSync(outPath)) {
          res.status(500).send("MP3 file not created");
          return;
        }

        const stats = fs.statSync(outPath);

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Disposition", `attachment; filename="audio.mp3"`);
        res.setHeader("Content-Length", stats.size);

        const stream = fs.createReadStream(outPath);
        stream.pipe(res);

        stream.on("error", () => {
          fs.unlink(outPath, () => {});
        });

        res.on("finish", () => {
          fs.unlink(outPath, () => {});
        });
      }, 300);
    });

  } catch (error) {
    console.error("Audio controller error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
};

export const extractVideoController = async (req, res) => {
  try {
    let url = decodeURIComponent(req.query.url || "");

    if (!url) return res.status(400).send("Missing URL");

    if (url.includes("/shorts/")) {
      const id = url.split("/shorts/")[1].split("?")[0];
      url = `https://www.youtube.com/watch?v=${id}`;
    }

    const ytDlpPath = "yt-dlp";
    const ffmpegPath = "/usr/bin/ffmpeg";

    const filePath = path.join(os.tmpdir(), `${Date.now()}_video.mp4`);

    const yt = spawn(ytDlpPath, [
      "-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]",
      "--merge-output-format", "mp4",
      "--ffmpeg-location", ffmpegPath,
      "--no-warnings",
      "-q",
      "-R", "5",
      "--socket-timeout", "30",
      "--http-headers", "User-Agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "-o", filePath,
      url
    ]);

    yt.stderr.on("data", d => {
      console.error("[yt-dlp stderr]", d.toString().trim());
    });

    yt.on("error", (error) => {
      if (!res.headersSent) {
        res.status(500).send(`yt-dlp error: ${error.message}`);
      }
    });

    yt.on("close", code => {
      if (code !== 0) {
        if (!res.headersSent) {
          res.status(500).send(`Video download failed with code ${code}`);
        }
        return;
      }

      setTimeout(() => {
        if (!fs.existsSync(filePath)) {
          res.status(500).send("Video file not created");
          return;
        }

        const stats = fs.statSync(filePath);

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Disposition", `attachment; filename="video.mp4"`);
        res.setHeader("Content-Length", stats.size);

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);

        stream.on("error", () => {
          fs.unlink(filePath, () => {});
        });

        res.on("finish", () => {
          fs.unlink(filePath, () => {});
        });
      }, 300);
    });

  } catch (error) {
    console.error("Video controller error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
};