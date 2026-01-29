import { describe, it, expect, vi, beforeEach } from "vitest";
import { textToSpeech } from "./tts.js";
import { loadConfig } from "../config/config.js";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

vi.mock("node:child_process");
vi.mock("../config/config.js");

describe("macos TTS provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadConfig).mockReturnValue({
      messages: {
        tts: {
          provider: "macos",
        },
      },
    } as any);
  });

  it("should use 'say' command on macOS", async () => {
    const mockChild = {
      on: vi.fn((event, callback) => {
        if (event === "exit") {
          setTimeout(() => callback(0), 10);
        }
        return mockChild;
      }),
    };

    vi.mocked(spawn).mockReturnValue(mockChild as any);

    const result = await textToSpeech({
      text: "Hello world",
      cfg: loadConfig(),
      overrides: { provider: "macos" },
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("macos");
    expect(result.audioPath).toMatch(/\.aiff$/);
    expect(spawn).toHaveBeenCalledWith(
      "say",
      expect.arrayContaining(["-o", expect.stringMatching(/\.aiff$/), "Hello world"]),
    );
  });

  it("should handle 'say' command errors", async () => {
    const mockChild = {
      on: vi.fn((event, callback) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("say not found")), 10);
        }
        return mockChild;
      }),
    };

    vi.mocked(spawn).mockReturnValue(mockChild as any);

    const result = await textToSpeech({
      text: "Hello world",
      cfg: loadConfig(),
      overrides: { provider: "macos" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("say not found");
  });

  it("should handle non-zero exit codes", async () => {
    const mockChild = {
      on: vi.fn((event, callback) => {
        if (event === "exit") {
          setTimeout(() => callback(1), 10);
        }
        return mockChild;
      }),
    };

    vi.mocked(spawn).mockReturnValue(mockChild as any);

    const result = await textToSpeech({
      text: "Hello world",
      cfg: loadConfig(),
      overrides: { provider: "macos" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("say exited with code 1");
  });

  it("should only work on macOS platform", async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, "platform", {
      value: "linux",
      configurable: true,
    });

    const result = await textToSpeech({
      text: "Hello world",
      cfg: loadConfig(),
      overrides: { provider: "macos" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("only supported on macOS");

    Object.defineProperty(process, "platform", {
      value: originalPlatform,
      configurable: true,
    });
  });

  it("should create audio file in temp directory", async () => {
    const mockChild = {
      on: vi.fn((event, callback) => {
        if (event === "exit") {
          setTimeout(() => callback(0), 10);
        }
        return mockChild;
      }),
    };

    vi.mocked(spawn).mockReturnValue(mockChild as any);

    const result = await textToSpeech({
      text: "Test audio",
      cfg: loadConfig(),
      overrides: { provider: "macos" },
    });

    expect(result.success).toBe(true);
    expect(result.audioPath).toMatch(/\/tmp\/tts-.*\/voice-\d+\.aiff$/);
  });
});
