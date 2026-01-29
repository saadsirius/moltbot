import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMacControlTool } from "./mac-control-tool.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";

vi.mock("node:child_process");
vi.mock("../../utils.js", () => ({
  CONFIG_DIR: "/mock/config",
  ensureDir: vi.fn().mockResolvedValue(undefined),
}));

const execAsync = promisify(exec);

describe("mac_control screenshot action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should capture screenshot and return local path", async () => {
    const tool = createMacControlTool();

    vi.mocked(execAsync).mockResolvedValue({
      stdout: "",
      stderr: "",
    });

    const result = await tool.execute({
      action: "screenshot",
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.path).toMatch(/\/mock\/config\/media\/screenshot-\d+\.png/);
    expect(parsed.message).toContain("moltbot data directory");
  });

  it("should call screencapture with correct arguments", async () => {
    const tool = createMacControlTool();

    vi.mocked(execAsync).mockResolvedValue({
      stdout: "",
      stderr: "",
    });

    await tool.execute({
      action: "screenshot",
    });

    expect(execAsync).toHaveBeenCalledWith(
      expect.stringMatching(/screencapture -x ".*\/screenshot-\d+\.png"/),
    );
  });

  it("should handle screencapture errors", async () => {
    const tool = createMacControlTool();

    vi.mocked(execAsync).mockRejectedValue(new Error("screencapture failed"));

    await expect(
      tool.execute({
        action: "screenshot",
      }),
    ).rejects.toThrow("screencapture failed");
  });

  it("should create media directory if it doesn't exist", async () => {
    const { ensureDir } = await import("../../utils.js");
    const tool = createMacControlTool();

    vi.mocked(execAsync).mockResolvedValue({
      stdout: "",
      stderr: "",
    });

    await tool.execute({
      action: "screenshot",
    });

    expect(ensureDir).toHaveBeenCalledWith("/mock/config/media");
  });
});
