import { YtDlp } from 'ytdlp-nodejs';
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

export const extractAudioController = async (req, res) => {
    try {
        const url = req.query.url.split("&")[0];

        if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
            return res.status(400).send("Invalid YouTube URL");
        }

        const ytDlp = new YtDlp();
        let title = "audio";
        try {
            const infoProcess = ytDlp.exec(url, {
                dumpJson: true,
                noWarnings: true,
                quiet: true,
            });

            let jsonOutput = "";
            infoProcess.stdout.on("data", (chunk) => {
                jsonOutput += chunk.toString();
            });

            await new Promise((resolve, reject) => {
                infoProcess.on("close", (code) => {
                    if (code === 0) {
                        try {
                            const info = JSON.parse(jsonOutput);
                            title = info.title || "audio";
                            title = safeFilename(title);
                        } catch (e) {
                            console.warn("Could not parse JSON:", e.message);
                        }
                        resolve();
                    } else {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                });
            });
        } catch (err) {
            console.warn("Could not fetch video title:", err.message);
        }

        res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
        res.header("Content-Type", "audio/mpeg");


        ytDlp.exec(url, {
            extractAudio: true,
            audioFormat: "mp3",
            audioQuality: "0",
            quiet: true,
            noWarnings: true,
            output: "-",
        })
            .stdout.pipe(res)
            .on("error", (err) => {
                console.error("Stream error:", err.message);
                if (!res.headersSent) {
                    res.status(500).send("Failed to extract audio");
                }
            });

    } catch (error) {
        console.error("Controller error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
}

export const extractVideoController = async (req, res) => {
    try {
        const url = req.query.url.split("&")[0];
        if (!url) return res.status(400).send("Missing URL");

        const ffmpegPath =
            process.env.NODE_ENV === "production"
                ? "/usr/bin/ffmpeg"
                : "C:\\ffmpeg\\bin\\ffmpeg.exe";


        const ytDlp = new YtDlp();

        let title = "video";
        try {
            const infoProcess = ytDlp.exec(url, {
                dumpJson: true,
                noWarnings: true,
                quiet: true,
            });

            let jsonOutput = "";
            infoProcess.stdout.on("data", (chunk) => {
                jsonOutput += chunk.toString();
            });

            await new Promise((resolve, reject) => {
                infoProcess.on("close", (code) => {
                    if (code === 0) {
                        try {
                            const info = JSON.parse(jsonOutput);
                            title = info.title || "video";
                            title = safeFilename(title);
                        } catch (e) {
                            console.warn("Could not parse JSON:", e.message);
                        }
                        resolve();
                    } else {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                });
            });
        } catch (err) {
            console.warn("Could not fetch video title:", err.message);
        }
        const tempDir = os.tmpdir();
        const filePath = path.join(
            tempDir,
            `${Date.now()}-${title}.mp4`
        );


        const proc = ytDlp.exec(url, {
            format: "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best",
            mergeOutputFormat: "mp4",
            // ffmpegLocation: "/usr/bin/ffmpeg",
            ffmpegLocation: ffmpegPath,
            output: filePath,
            noWarnings: true,
            quiet: true,
        });

        await new Promise((resolve, reject) => {
            proc.on("close", (code) => {
                code === 0 ? resolve() : reject();
            });
        });

        if (!fs.existsSync(filePath)) {
            return res.status(500).send("Video not created");
        }

        res.download(filePath, () => {
            fs.unlink(filePath, () => { });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to download video");
    }
};