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

  runtime.log(`Vocal input: "${transcript}"`);

  // Get reply from agent
  const result = await getReplyFromConfig(ctx, {
    // Force a direct reply if possible
  });

  if (!result || !result.payloads || result.payloads.length === 0) {
    runtime.log("No response from agent.");
    return;
  }

  for (const payload of result.payloads) {
    const text = payload.text?.trim();
    if (!text) continue;

    runtime.log(`Moltbot: "${text}"`);

    // Convert text to speech
    const ttsResult = await textToSpeech({
      text,
      cfg,
    });

    if (ttsResult.success && ttsResult.audioPath) {
      // Play audio locally
      await playAudio(ttsResult.audioPath);
    } else if (ttsResult.error) {
      runtime.error(`TTS failed: ${ttsResult.error}`);
    }
  }
}
