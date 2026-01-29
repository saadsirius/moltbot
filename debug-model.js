import {
  discoverAuthStorage,
  discoverModels,
} from "@mariozechner/pi-coding-agent";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const agentDir = path.join(os.homedir(), ".moltbot");
const authStorage = discoverAuthStorage(agentDir);
const modelRegistry = discoverModels(authStorage, agentDir);

const provider = "mistral";
const modelId = "mistral-small-latest";
const model = modelRegistry.find(provider, modelId);

let output = "";
if (model) {
  output = "Model found in registry: " + JSON.stringify(model, null, 2);
} else {
  output = "Model NOT found in registry.";
}

fs.writeFileSync("debug-output.txt", output);
console.log(output);
