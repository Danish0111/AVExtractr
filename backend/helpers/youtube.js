import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = path.join(__dirname, "../youtube_utils.py");

export const extractMedia = (mode, url) => {
  return new Promise((resolve, reject) => {
    // Use python3 on production (Render), python on local Windows
    const pythonPath = process.env.NODE_ENV === "production" ? "python3" : "python";
    
    console.log(`[Helper] Using Python: ${pythonPath}`);
    console.log(`[Helper] Script: ${PYTHON_SCRIPT}`);

    const python = spawn(pythonPath, [PYTHON_SCRIPT, mode, url]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log("[Python stderr]", data.toString().trim());
    });

    python.on("close", (code) => {
      console.log(`[Python] Exit code: ${code}`);
      console.log(`[Python] stdout: ${stdout}`);
      console.log(`[Python] stderr: ${stderr}`);
      
      if (code !== 0) {
        reject(new Error(`Python failed: ${stderr || stdout}`));
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        console.log(`[Python] Parsing JSON: ${lastLine}`);
        const result = JSON.parse(lastLine);

        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || "Unknown error"));
        }
      } catch (error) {
        reject(new Error(`Parse error: ${error.message}, stdout: ${stdout}`));
      }
    });

    python.on("error", (error) => {
      console.error(`[Helper] Spawn error: ${error.message}`);
      reject(new Error(`Spawn error: ${error.message}`));
    });
  });
};