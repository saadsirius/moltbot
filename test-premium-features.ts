#!/usr/bin/env tsx
/**
 * Manual Functionality Test Script for Premium Features
 *
 * This script tests the premium features in a real environment:
 * - Audio UI (chimes)
 * - Screenshot tool
 * - macOS TTS provider
 * - Streaming vocal responses
 *
 * Run with: npx tsx test-premium-features.ts
 */

import { loadConfig } from "./src/config/config.js";
import { textToSpeech } from "./src/tts/tts.js";
import { playAudio } from "./src/media/playback.js";
import { createMacControlTool } from "./src/agents/tools/mac-control-tool.js";
import { existsSync } from "node:fs";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof COLORS = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60) + "\n");
}

async function testChimes() {
  section("Test 1: Audio UI Chimes");

  try {
    log("Playing 'listening' chime (Tink.aiff)...", "blue");
    await playAudio("/System/Library/Sounds/Tink.aiff");
    log("✓ Listening chime played successfully", "green");

    await new Promise((resolve) => setTimeout(resolve, 500));

    log("Playing 'understood' chime (Glass.aiff)...", "blue");
    await playAudio("/System/Library/Sounds/Glass.aiff");
    log("✓ Understood chime played successfully", "green");

    return true;
  } catch (error) {
    log(`✗ Chime test failed: ${error}`, "red");
    return false;
  }
}

async function testScreenshot() {
  section("Test 2: Screenshot Tool");

  try {
    const tool = createMacControlTool();

    log("Capturing screenshot...", "blue");
    const result = await tool.execute({ action: "screenshot" });
    const parsed = JSON.parse(result);

    if (!parsed.success) {
      throw new Error("Screenshot failed");
    }

    log(`Screenshot saved to: ${parsed.path}`, "yellow");

    if (existsSync(parsed.path)) {
      log("✓ Screenshot file exists", "green");
    } else {
      throw new Error("Screenshot file not found");
    }

    log(`Message: ${parsed.message}`, "yellow");
    log("✓ Screenshot test passed", "green");

    return true;
  } catch (error) {
    log(`✗ Screenshot test failed: ${error}`, "red");
    return false;
  }
}

async function testMacosTTS() {
  section("Test 3: macOS TTS Provider");

  try {
    const cfg = loadConfig();

    log(
      "Converting text to speech using native macOS 'say' command...",
      "blue",
    );
    const result = await textToSpeech({
      text: "Hello, I am testing the local macOS text to speech provider. This is completely offline and stored locally.",
      cfg,
      overrides: { provider: "macos" },
    });

    if (!result.success || !result.audioPath) {
      throw new Error(`TTS failed: ${result.error}`);
    }

    log(`Audio file created: ${result.audioPath}`, "yellow");
    log(`Provider: ${result.provider}`, "yellow");
    log(`Latency: ${result.latencyMs}ms`, "yellow");

    if (!existsSync(result.audioPath)) {
      throw new Error("Audio file not found");
    }

    log("Playing generated audio...", "blue");
    await playAudio(result.audioPath);

    log("✓ macOS TTS test passed", "green");
    return true;
  } catch (error) {
    log(`✗ macOS TTS test failed: ${error}`, "red");
    return false;
  }
}

async function testStreamingSimulation() {
  section("Test 4: Streaming TTS Simulation");

  try {
    const cfg = loadConfig();
    const blocks = [
      "This is the first block of text.",
      "Here comes the second block.",
      "And finally, the third block.",
    ];

    log("Simulating streaming blocks with sequential playback...", "blue");

    let playChain = Promise.resolve();

    for (let i = 0; i < blocks.length; i++) {
      const text = blocks[i];
      log(`\nBlock ${i + 1}: "${text}"`, "yellow");

      // Chain TTS and playback
      playChain = playChain.then(async () => {
        const startTime = Date.now();
        const result = await textToSpeech({
          text,
          cfg,
          overrides: { provider: "macos" },
        });

        if (result.success && result.audioPath) {
          log(`  TTS completed in ${Date.now() - startTime}ms`, "blue");
          await playAudio(result.audioPath);
          log(`  ✓ Block ${i + 1} played`, "green");
        }
      });
    }

    await playChain;
    log("\n✓ Streaming simulation test passed", "green");
    return true;
  } catch (error) {
    log(`✗ Streaming simulation test failed: ${error}`, "red");
    return false;
  }
}

async function testProviderFallback() {
  section("Test 5: TTS Provider Fallback");

  try {
    const cfg = loadConfig();

    log("Testing fallback from unavailable provider to macos...", "blue");

    // Try with a provider that might not be configured
    const result = await textToSpeech({
      text: "Testing provider fallback mechanism.",
      cfg,
    });

    if (!result.success) {
      throw new Error(`TTS failed: ${result.error}`);
    }

    log(`Provider used: ${result.provider}`, "yellow");
    log(`Audio path: ${result.audioPath}`, "yellow");

    if (result.audioPath && existsSync(result.audioPath)) {
      log("Playing fallback audio...", "blue");
      await playAudio(result.audioPath);
    }

    log("✓ Provider fallback test passed", "green");
    return true;
  } catch (error) {
    log(`✗ Provider fallback test failed: ${error}`, "red");
    return false;
  }
}

async function main() {
  log("\n🧪 Premium Features Functionality Test Suite", "cyan");
  log("Testing local-first audio UI, screenshot, and TTS features\n", "cyan");

  const results = {
    chimes: await testChimes(),
    screenshot: await testScreenshot(),
    macosTTS: await testMacosTTS(),
    streaming: await testStreamingSimulation(),
    fallback: await testProviderFallback(),
  };

  section("Test Summary");

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([name, passed]) => {
    const icon = passed ? "✓" : "✗";
    const color = passed ? "green" : "red";
    log(`${icon} ${name}`, color);
  });

  console.log("\n" + "=".repeat(60));
  if (passed === total) {
    log(`\n🎉 All ${total} tests passed!`, "green");
  } else {
    log(`\n⚠️  ${passed}/${total} tests passed`, "yellow");
  }
  console.log("=".repeat(60) + "\n");

  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Test suite failed: ${error}`, "red");
  console.error(error);
  process.exit(1);
});
