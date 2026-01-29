import { describe, it, expect, vi, beforeEach } from "vitest";
import { vocalCommand } from "./vocal.command.js";
import { getReplyFromConfig } from "../auto-reply/reply.js";
import { textToSpeech } from "../tts/tts.js";
import { playAudio } from "../media/playback.js";
import { loadConfig } from "../config/config.js";
import { defaultRuntime } from "../runtime.js";

vi.mock("../auto-reply/reply.js", () => ({
  getReplyFromConfig: vi.fn(),
}));

vi.mock("../tts/tts.js", () => ({
  textToSpeech: vi.fn(),
}));

vi.mock("../media/playback.js", () => ({
  playAudio: vi.fn(),
}));

vi.mock("../config/config.js", () => ({
  loadConfig: vi.fn(),
}));

vi.mock("../runtime.js", () => ({
  defaultRuntime: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe("vocalCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (loadConfig as any).mockReturnValue({
      owner: {
        e164: "+1234567890",
      },
      agents: {
        defaults: {
          id: "bot",
        },
      },
    });
  });

  it("should process transcript and play response", async () => {
    (getReplyFromConfig as any).mockResolvedValue({
      payloads: [{ text: "Hello from Moltbot!" }],
    });
    (textToSpeech as any).mockResolvedValue({
      success: true,
      audioPath: "/tmp/voice.mp3",
    });
    (playAudio as any).mockResolvedValue(undefined);

    await vocalCommand({ transcript: "Hello" }, defaultRuntime as any);

    expect(getReplyFromConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        Body: "Hello",
        From: "+1234567890", // Owner's E164
        CommandAuthorized: true,
      }),
      expect.any(Object),
    );
    expect(textToSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Hello from Moltbot!",
      }),
    );
    expect(playAudio).toHaveBeenCalledWith("/tmp/voice.mp3");
  });

  it("should handle error if no transcript provided", async () => {
    await expect(vocalCommand({ transcript: "" }, defaultRuntime as any)).rejects.toThrow(
      "Transcript is required",
    );
  });

  it("should throw if owner E164 is not configured", async () => {
    (loadConfig as any).mockReturnValue({
      owner: {},
      agents: { defaults: { id: "bot" } },
    });

    await expect(vocalCommand({ transcript: "Hello" }, defaultRuntime as any)).rejects.toThrow(
      "Owner E164 not configured",
    );
  });
});
