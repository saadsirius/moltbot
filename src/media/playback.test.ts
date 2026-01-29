import { describe, it, expect, vi, beforeEach } from "vitest";
import { spawn } from "node:child_process";
import { playAudio } from "./playback.js";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("../logging/logger.js", () => ({
  log: {
    warn: vi.fn(),
  },
}));

describe("playAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should spawn afplay on macOS", async () => {
    // Force platform to darwin
    Object.defineProperty(process, "platform", { value: "darwin" });

    const mockChild = {
      on: vi.fn((event, callback) => {
        if (event === "exit") {
          setTimeout(() => callback(0), 10);
        }
      }),
    };
    (spawn as any).mockReturnValue(mockChild);

    await playAudio("/path/to/audio.mp3");

    expect(spawn).toHaveBeenCalledWith("afplay", ["/path/to/audio.mp3"], expect.any(Object));
  });

  it("should warn and skip on non-macOS platforms", async () => {
    Object.defineProperty(process, "platform", { value: "linux" });

    await playAudio("/path/to/audio.mp3");

    expect(spawn).not.toHaveBeenCalled();
  });

  it("should reject if afplay fails", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });

    const mockChild = {
      on: vi.fn((event, callback) => {
        if (event === "exit") {
          setTimeout(() => callback(1), 10);
        }
      }),
    };
    (spawn as any).mockReturnValue(mockChild);

    await expect(playAudio("/path/to/audio.mp3")).rejects.toThrow("afplay exited with code 1");
  });
});
