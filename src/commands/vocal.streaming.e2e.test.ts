import { describe, it, expect, vi, beforeEach } from "vitest";
import { vocalCommand } from "./vocal.command.js";
import { loadConfig } from "../config/config.js";
import { getReplyFromConfig } from "../auto-reply/reply.js";
import { textToSpeech } from "../tts/tts.js";
import { playAudio } from "../media/playback.js";

vi.mock("../config/config.js");
vi.mock("../auto-reply/reply.js");
vi.mock("../tts/tts.js");
vi.mock("../media/playback.js");

describe("vocal command E2E - streaming flow", () => {
  const mockRuntime = {
    log: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(loadConfig).mockReturnValue({
      owner: {
        e164: "+1234567890",
      },
    } as any);

    vi.mocked(playAudio).mockResolvedValue(undefined);
  });

  it("should stream blocks to TTS and play sequentially", async () => {
    const blocks = [
      { text: "First block of text" },
      { text: "Second block of text" },
      { text: "Third block of text" },
    ];

    let onBlockReplyCallback: any;

    vi.mocked(getReplyFromConfig).mockImplementation(async (_ctx, opts) => {
      onBlockReplyCallback = opts?.onBlockReply;

      // Simulate streaming blocks
      for (const block of blocks) {
        if (onBlockReplyCallback) {
          await onBlockReplyCallback(block);
        }
      }

      return {
        payloads: blocks,
        didSendViaMessagingTool: false,
      };
    });

    const ttsCallOrder: string[] = [];
    vi.mocked(textToSpeech).mockImplementation(async ({ text }) => {
      ttsCallOrder.push(text);
      return {
        success: true,
        audioPath: `/tmp/audio-${text}.aiff`,
        latencyMs: 100,
        provider: "macos",
      };
    });

    const playCallOrder: string[] = [];
    vi.mocked(playAudio).mockImplementation(async (path) => {
      playCallOrder.push(path);
    });

    await vocalCommand(
      { transcript: "Tell me a story", verbose: true },
      mockRuntime as any,
    );

    // Verify chimes were played
    expect(playAudio).toHaveBeenCalledWith("/System/Library/Sounds/Tink.aiff");
    expect(playAudio).toHaveBeenCalledWith("/System/Library/Sounds/Glass.aiff");

    // Verify all blocks were processed
    expect(ttsCallOrder).toEqual([
      "First block of text",
      "Second block of text",
      "Third block of text",
    ]);

    // Verify audio was played in order
    expect(playCallOrder).toEqual([
      "/tmp/audio-First block of text.aiff",
      "/tmp/audio-Second block of text.aiff",
      "/tmp/audio-Third block of text.aiff",
    ]);

    // Verify sequential execution (each TTS completes before next starts)
    expect(textToSpeech).toHaveBeenCalledTimes(3);
    expect(playAudio).toHaveBeenCalledTimes(5); // 2 chimes + 3 blocks
  });

  it("should handle TTS failures gracefully during streaming", async () => {
    const blocks = [{ text: "First block" }, { text: "Second block" }];

    let onBlockReplyCallback: any;

    vi.mocked(getReplyFromConfig).mockImplementation(async (_ctx, opts) => {
      onBlockReplyCallback = opts?.onBlockReply;

      for (const block of blocks) {
        if (onBlockReplyCallback) {
          await onBlockReplyCallback(block);
        }
      }

      return {
        payloads: blocks,
        didSendViaMessagingTool: false,
      };
    });

    vi.mocked(textToSpeech)
      .mockResolvedValueOnce({
        success: true,
        audioPath: "/tmp/audio-1.aiff",
        latencyMs: 100,
        provider: "macos",
      })
      .mockResolvedValueOnce({
        success: false,
        error: "TTS service unavailable",
      });

    await vocalCommand(
      { transcript: "Test", verbose: false },
      mockRuntime as any,
    );

    // Should log error but continue
    expect(mockRuntime.error).toHaveBeenCalledWith(
      expect.stringContaining("TTS service unavailable"),
    );

    // First block should have played
    expect(playAudio).toHaveBeenCalledWith("/tmp/audio-1.aiff");
  });

  it("should handle empty blocks during streaming", async () => {
    const blocks = [
      { text: "Valid text" },
      { text: "" },
      { text: "   " },
      { text: "More valid text" },
    ];

    let onBlockReplyCallback: any;

    vi.mocked(getReplyFromConfig).mockImplementation(async (_ctx, opts) => {
      onBlockReplyCallback = opts?.onBlockReply;

      for (const block of blocks) {
        if (onBlockReplyCallback) {
          await onBlockReplyCallback(block);
        }
      }

      return {
        payloads: blocks,
        didSendViaMessagingTool: false,
      };
    });

    vi.mocked(textToSpeech).mockResolvedValue({
      success: true,
      audioPath: "/tmp/audio.aiff",
      latencyMs: 100,
      provider: "macos",
    });

    await vocalCommand(
      { transcript: "Test", verbose: false },
      mockRuntime as any,
    );

    // Should only process non-empty blocks
    expect(textToSpeech).toHaveBeenCalledTimes(2);
    expect(textToSpeech).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Valid text" }),
    );
    expect(textToSpeech).toHaveBeenCalledWith(
      expect.objectContaining({ text: "More valid text" }),
    );
  });

  it("should verify latency improvement from streaming", async () => {
    const blocks = [
      { text: "Block 1" },
      { text: "Block 2" },
      { text: "Block 3" },
    ];

    let onBlockReplyCallback: any;
    const blockTimestamps: number[] = [];

    vi.mocked(getReplyFromConfig).mockImplementation(async (_ctx, opts) => {
      onBlockReplyCallback = opts?.onBlockReply;

      for (const block of blocks) {
        blockTimestamps.push(Date.now());
        if (onBlockReplyCallback) {
          await onBlockReplyCallback(block);
        }
        // Simulate delay between blocks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return {
        payloads: blocks,
        didSendViaMessagingTool: false,
      };
    });

    const ttsTimestamps: number[] = [];
    vi.mocked(textToSpeech).mockImplementation(async () => {
      ttsTimestamps.push(Date.now());
      return {
        success: true,
        audioPath: "/tmp/audio.aiff",
        latencyMs: 100,
        provider: "macos",
      };
    });

    await vocalCommand(
      { transcript: "Test streaming", verbose: false },
      mockRuntime as any,
    );

    // Verify first TTS started before all blocks were received
    expect(ttsTimestamps[0]).toBeLessThan(
      blockTimestamps[blockTimestamps.length - 1],
    );
  });
});
