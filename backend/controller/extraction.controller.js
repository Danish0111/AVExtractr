import { execSync } from 'child_process';
import fs from "fs";
import path from "path";
import os from "os";

function safeFilename(name) {
    return name
        .replace(/[\r\n]+/g, " ")
        .replace(/[<>:"/\\|?*]+/g, "")
        .replace(/[^\x20-\x7E]/g, "")
        .trim()
        .substring(0, 100);
}

const YTDLP_PATH =
    process.env.NODE_ENV === "production"
        ? "/usr/local/bin/yt-dlp"
        : "yt-dlp";

export const extractAudioController = async (req, res) => {
    try {
        let url = decodeURIComponent(req.query.url);

        if (url.includes("/shorts/")) {
            const id = url.split("/shorts/")[1].split("?")[0];
            url = `https://www.youtube.com/watch?v=${id}`;
        }

        if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
            return res.status(400).send("Invalid YouTube URL");
        }

        let title = "audio";
        try {
            const infoCmd = `${YTDLP_PATH} --dump-json --quiet "${url}"`;
            const infoOutput = execSync(infoCmd, { encoding: 'utf-8' });
            const info = JSON.parse(infoOutput);
            title = info.title || "audio";
            title = safeFilename(title);
        } catch (err) {
            console.warn("Could not fetch video title:", err.message);
        }

        res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
        res.header("Content-Type", "audio/mpeg");

        const audioCmd = `${YTDLP_PATH} -x --audio-format mp3 --audio-quality 0 -o - "${url}"`;
        
        try {
            const { spawn } = await import('child_process');
            const audioProc = spawn('sh', ['-c', audioCmd]);
            
            audioProc.stderr.on("data", (d) => {
                console.error("yt-dlp audio stderr:", d.toString());
            });

            audioProc.on('error', (err) => {
                console.error("Audio process error:", err);
                if (!res.headersSent) {
                    res.status(500).json({ message: "Audio extraction failed" });
                }
            });

            audioProc.stdout.pipe(res);
        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error("Controller error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
};

export const extractVideoController = async (req, res) => {
    try {
        let url = decodeURIComponent(req.query.url);

        if (url.includes("/shorts/")) {
            const id = url.split("/shorts/")[1].split("?")[0];
            url = `https://www.youtube.com/watch?v=${id}`;
        }

        if (!url) return res.status(400).send("Missing URL");

        let title = "video";
        try {
            const infoCmd = `${YTDLP_PATH} --dump-json --quiet "${url}"`;
            const infoOutput = execSync(infoCmd, { encoding: 'utf-8' });
            const info = JSON.parse(infoOutput);
            title = info.title || "video";
            title = safeFilename(title);
        } catch (err) {
            console.warn("Could not fetch video title:", err.message);
        }

        const tempDir = os.tmpdir();
        const filePath = path.join(tempDir, `${Date.now()}-${title}.mp4`);

        const ffmpegPath = process.env.NODE_ENV === "production"
            ? "/usr/bin/ffmpeg"
            : "ffmpeg";

        const videoCmd = `${YTDLP_PATH} -f "bestvideo[height<=1080]+bestaudio/best" --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${url}"`;

        try {
            execSync(videoCmd, { stdio: 'inherit' });

            if (!fs.existsSync(filePath)) {
                return res.status(500).send("Video not created");
            }

            res.download(filePath, () => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Error deleting temp file:", err);
                });
            });
        } catch (err) {
            console.error("Video download error:", err.message);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            if (!res.headersSent) {
                res.status(500).send("Failed to download video");
            }
        }

    } catch (error) {
        console.error("Controller error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
};