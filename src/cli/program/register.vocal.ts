import type { Command } from "commander";
import { vocalCommand } from "../../commands/vocal.js";
import { defaultRuntime } from "../../runtime.js";
import { theme } from "../../terminal/theme.js";
import { formatHelpExamples } from "../help-format.js";

export function registerVocalCommand(program: Command) {
  program
    .command("vocal")
    .description("Vocal chat interface (bridge for Swabble)")
    .option("--transcript <text>", "Vocal transcript to process")
    .option("--verbose", "Verbose logging", false)
    .addHelpText(
      "after",
      () =>
        `\n${theme.heading("Examples:")}\n${formatHelpExamples([
          ['moltbot vocal --transcript "Tell me a joke"', "Process a vocal command."],
        ])}`,
    )
    .action(async (opts) => {
      await vocalCommand(
        {
          transcript: opts.transcript as string | undefined,
          verbose: Boolean(opts.verbose),
        },
        defaultRuntime,
      );
    });
}
