import { loadConfig } from "../config/config.js";
import { getReplyFromConfig } from "../auto-reply/reply.js";
import { textToSpeech } from "../tts/tts.js";
import { playAudio } from "../media/playback.js";
import type { RuntimeEnv } from "../runtime.js";
import type { MsgContext } from "../auto-reply/templating.js";

/**
 * Processes a vocal transcript from Swabble.
 * Directs it to the agent, handles the reply, and plays it back.
 */
export async function vocalCommand(
  opts: { transcript?: string; verbose?: boolean },
  runtime: RuntimeEnv,
) {
  const transcript = opts.transcript?.trim();
  if (!transcript) {
    throw new Error("Transcript is required");
  }

  const cfg = loadConfig();
  const ownerE164 = cfg.owner?.e164;
  if (!ownerE164) {
    throw new Error("Owner E164 not configured in moltbot.yaml");
  }

  // Build a MsgContext mimicking an inbound message from the owner
  const ctx: MsgContext = {
    Body: transcript,
    CommandBody: transcript,
    From: ownerE164,
    To: "moltbot",
    SessionKey: `vocal:${ownerE164}`,
    SenderId: ownerE164,
    SenderName: "Owner",
    Timestamp: Date.now(),
    CommandAuthorized: true,
    CommandSource: "native",
  };

  // Play "listening" chime
  await playAudio("/System/Library/Sounds/Tink.aiff").catch(() => {});

  runtime.log(`Vocal input: "${transcript}"`);

  // Play "understood" chime
  await playAudio("/System/Library/Sounds/Glass.aiff").catch(() => {});

  // Get reply from agent
  let playChain = Promise.resolve();
  const result = await getReplyFromConfig(ctx, {
    // Force direct block-by-block delivery for vocal
    onBlockReply: async (payload) => {
      const text = payload.text?.trim();
      if (!text) return;

      if (opts.verbose) {
        runtime.log(`[Streaming] Moltbot: "${text}"`);
      }

      // Chain TTS and playback to ensure sequence
      playChain = playChain.then(async () => {
        const ttsResult = await textToSpeech({ text, cfg });
        if (ttsResult.success && ttsResult.audioPath) {
          await playAudio(ttsResult.audioPath);
        } else if (ttsResult.error) {
          runtime.error(`TTS failed: ${ttsResult.error}`);
        }
      });
    },
  });

  // Wait for any remaining audio to finish
  await playChain;

  if (!result || !result.payloads || result.payloads.length === 0) {
    if (!opts.verbose) {
      // If not verbose and we got no blocks, at least say something
      runtime.log("No response from agent.");
    }
    return;
  }
}
