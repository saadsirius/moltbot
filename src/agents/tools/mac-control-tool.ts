import { Type } from "@sinclair/typebox";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam, readNumberParam } from "./common.js";

const execAsync = promisify(exec);

const MacControlSchema = Type.Object({
  action: Type.Union([
    Type.Literal("set_volume"),
    Type.Literal("get_volume"),
    Type.Literal("set_brightness"),
    Type.Literal("get_brightness"),
    Type.Literal("notification"),
    Type.Literal("run_applescript"),
    Type.Literal("open"),
    Type.Literal("media_control"),
  ]),
  value: Type.Optional(
    Type.Number({
      description: "Value for set_volume or set_brightness (0-100).",
    }),
  ),
  title: Type.Optional(Type.String({ description: "Title for notification." })),
  body: Type.Optional(Type.String({ description: "Body text for notification." })),
  script: Type.Optional(Type.String({ description: "Raw AppleScript to execute." })),
  target: Type.Optional(Type.String({ description: "App name or file path for open." })),
  media_action: Type.Optional(
    Type.Union(
      [
        Type.Literal("play"),
        Type.Literal("pause"),
        Type.Literal("next"),
        Type.Literal("previous"),
        Type.Literal("stop"),
      ],
      { description: "Action for media_control." },
    ),
  ),
});

export function createMacControlTool(): AnyAgentTool | null {
  if (process.platform !== "darwin") return null;

  return {
    name: "mac_control",
    label: "Mac Control",
    description: "Control macOS system settings and applications via AppleScript.",
    parameters: MacControlSchema,
    execute: async (_toolCallId, params) => {
      const action = readStringParam(params, "action", { required: true });

      try {
        switch (action) {
          case "set_volume": {
            const val = readNumberParam(params, "value", { required: true });
            if (val === undefined) throw new Error("value required");
            await execAsync(`osascript -e "set volume output volume ${val}"`);
            return jsonResult({ success: true, volume: val });
          }
          case "get_volume": {
            const { stdout } = await execAsync(
              `osascript -e "output volume of (get volume settings)"`,
            );
            return jsonResult({ volume: parseInt(stdout.trim(), 10) });
          }
          case "set_brightness": {
            const val = readNumberParam(params, "value", { required: true });
            if (val === undefined) throw new Error("value required");
            // Note: This requires brightness CLI or a complex AppleScript.
            // Better to use a known working AppleScript for system brightness.
            const script = `tell application "System Events" to repeat with i from 1 to (count of displays)
                tell display i to set brightness to ${val / 100}
            end repeat`;
            await execAsync(`osascript -e '${script}'`);
            return jsonResult({ success: true, brightness: val });
          }
          case "get_brightness": {
            // This is harder via AppleScript alone, usually needs ioreg or a CLI tool.
            // We'll skip for now or provide a best-effort.
            return jsonResult({
              error: "get_brightness not supported natively via AppleScript easily",
            });
          }
          case "notification": {
            const title = readStringParam(params, "title") ?? "Moltbot";
            const body = readStringParam(params, "body", { required: true });
            await execAsync(`osascript -e 'display notification "${body}" with title "${title}"'`);
            return jsonResult({ success: true });
          }
          case "run_applescript": {
            const script = readStringParam(params, "script", {
              required: true,
            });
            const { stdout, stderr } = await execAsync(
              `osascript -e '${script.replace(/'/g, "'\\''")}'`,
            );
            return jsonResult({ stdout: stdout.trim(), stderr: stderr.trim() });
          }
          case "open": {
            const target = readStringParam(params, "target", {
              required: true,
            });
            await execAsync(`open "${target.replace(/"/g, '\\"')}"`);
            return jsonResult({ success: true });
          }
          case "media_control": {
            const mediaAction = readStringParam(params, "media_action", {
              required: true,
            });
            let script = "";
            switch (mediaAction) {
              case "play":
                script = 'tell application "System Events" to key code 16';
                break; // Play/Pause info
              case "pause":
                script = 'tell application "System Events" to key code 16';
                break;
              case "next":
                script = 'tell application "System Events" to key code 19';
                break;
              case "previous":
                script = 'tell application "System Events" to key code 18';
                break;
              default:
                throw new Error(`Unsupported media action: ${mediaAction}`);
            }
            // Alternative: targeting specific apps if they are running
            // For now, use generic Media Keys (System Events)
            await execAsync(`osascript -e '${script}'`);
            return jsonResult({ success: true, action: mediaAction });
          }
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (err) {
        return jsonResult({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  };
}
