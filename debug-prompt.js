import { buildEmbeddedSystemPrompt } from "./src/agents/pi-embedded-runner/system-prompt.js";
import { resolveMoltbotAgentDir } from "./src/agents/agent-paths.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Mock params
const params = {
  workspaceDir: "/Users/jakelamkadam/Projects/clawd-bot",
  defaultThinkLevel: "off",
  reasoningLevel: "off",
  extraSystemPrompt: "",
  ownerNumbers: [],
  reasoningTagHint: false,
  tools: [],
  modelAliasLines: [],
  userTimezone: "UTC",
  runtimeInfo: {
    host: "mac",
    os: "mac",
    arch: "arm64",
    node: "v20.0.0",
    model: "mistral/mistral-small-latest",
  },
};

const prompt = buildEmbeddedSystemPrompt(params);
console.log(prompt);
fs.writeFileSync("debug-prompt.txt", prompt);
