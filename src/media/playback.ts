import { spawn } from "node:child_process";
import { log } from "../logging/logger.js";

/**
 * Plays an audio file using the system's native player.
 * On macOS, this uses 'afplay'.
 */
export async function playAudio(audioPath: string): Promise<void> {
  if (process.platform !== "darwin") {
    log.warn(`playAudio: unsupported platform ${process.platform}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const child = spawn("afplay", [audioPath], {
      stdio: "ignore",
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start afplay: ${String(err)}`));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`afplay exited with code ${code}`));
      }
    });
  });
}
