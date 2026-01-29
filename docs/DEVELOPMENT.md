# Moltbot Developer Guide

This guide provides technical overview and instructions for extending Moltbot.

## Adding a New Tool

Tools are the primary way the agent interacts with the world. They are defined as `AgentTool` objects.

1.  **Create the Tool Definition**: Place it in `src/agents/tools/`. Reference existing tools like `mac-control-tool.ts` for patterns.
2.  **Define the Schema**: Use `TypeBox` (from `@sinclair/typebox`) to define the tool's parameters.
3.  **Implement the `execute` Function**: This is where the core logic lives.
4.  **Register the Tool**: Add your tool to the `tools` array in `src/agents/moltbot-tools.ts`.
5.  **Create a Skill**: If specialized knowledge is required to use the tool, create a `SKILL.md` in `skills/<skill-name>/`.

## Adding a New Channel Provider

Channel providers allow Moltbot to communicate via different platforms (WhatsApp, Telegram, etc.).

1.  **Implement the Monitor**: Create a monitor function in `src/web/inbound/` or a dedicated directory that listens for messages and calls `createInboundDebouncer`.
2.  **Normalize Messages**: Convert platform-specific message objects into `WebInboundMessage` or similar internal types.
3.  **Register in `Dock`**: Update `src/channels/dock.ts` to include your new channel monitor.
4.  **Implement Outbound Logic**: Typically placed in `src/channels/plugins/outbound/`.

## Core Subsystems

### Memory Manager

Located in `src/memory/manager.ts`. It handles indexing and searching of memory files. Moltbot automatically creates daily memory files in `memory/YYYY-MM-DD.md`.

### Exec Tool

Located in `src/agents/bash-tools.exec.ts`. It handles shell command execution with support for PTY and backgrounding.

### Plugin Registry

Located in `src/plugins/manifest-registry.ts`. It discovers and loads plugin manifests from various paths.
