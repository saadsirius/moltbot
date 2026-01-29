import { loadConfig } from "./src/config/config.js";
import { textToSpeech } from "./src/tts/tts.js";
import { playAudio } from "./src/media/playback.js";

async function test() {
  const cfg = loadConfig();
  console.log("Testing macos TTS provider...");
  const result = await textToSpeech({
    text: "Hello, I am testing the local mac os text to speech provider.",
    cfg,
    overrides: { provider: "macos" },
  });

  if (result.success && result.audioPath) {
    console.log(`Success! Playing audio: ${result.audioPath}`);
    await playAudio(result.audioPath);
  } else {
    console.error(`Failed: ${result.error}`);
  }
}

test().catch(console.error);
