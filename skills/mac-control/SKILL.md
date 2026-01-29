---
name: mac-control
description: Control macOS system settings and applications (volume, brightness, notifications, media, AppleScript, open files/apps). Use when the user asks to change volume/brightness, show a notification, control music/media, or run AppleScript.
metadata:
  {
    "moltbot":
      { "emoji": "💻", "os": ["darwin"], "requires": { "platform": "darwin" } },
  }
---

# Mac Control

Control your Mac's system settings and applications directly through Moltbot.

## Capabilities

Use the `mac_control` tool for the following actions:

### System Settings

- `action="set_volume"`, `value=0-100`: Set system output volume.
- `action="get_volume"`: Get current system output volume.
- `action="set_brightness"`, `value=0-100`: Set display brightness.
- `action="notification"`, `title="..."`, `body="..."`: Show a native macOS notification.

### Media & Playback

- `action="media_control"`, `media_action="play"|"pause"|"next"|"previous"`: Control system-wide media playback.

### Automation & Opening

- `action="run_applescript"`, `script="..."`: Run raw AppleScript for advanced automation.
- `action="open"`, `target="..."`: Open an application (by name) or a file/URL.

## Examples

- "Turn the volume up to 80" -> `mac_control({ action: "set_volume", value: 80 })`
- "Show a notification saying 'Meeting in 5 mins'" -> `mac_control({ action: "notification", body: "Meeting in 5 mins" })`
- "Pause the music" -> `mac_control({ action: "media_control", media_action: "pause" })`
- "Open Spotify" -> `mac_control({ action: "open", target: "Spotify" })`
- "Run applescript to toggle dark mode" -> `mac_control({ action: "run_applescript", script: "tell application \"System Events\" to tell appearance preferences to set dark mode to not dark mode" })`

## Notes

- macOS only.
- Some actions may require permissions (Accessibility/Automation) in System Settings.
