---
name: Anahata
description: A calm, precise dual-channel tone studio — a midnight instrument for binaural beats.
colors:
  power-led-green: "#22c55e"
  power-led-green-hover: "#4ade80"
  wordmark-blue: "#60a5fa"
  transport-blue: "#3b82f6"
  meter-cyan: "#22d3ee"
  meter-amber: "#fbbf24"
  trace-cyan: "#06b6d4"
  trace-amber: "#f59e0b"
  record-red: "#ef4444"
  chassis-black: "#000000"
  chassis-charcoal: "#111827"
  panel-graphite: "#1f2937"
  input-graphite: "#374151"
  edge-gray: "#4b5563"
  edge-slate: "#475569"
  text-primary: "#ffffff"
  text-secondary: "#d1d5db"
  text-muted: "#9ca3af"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  play-button:
    backgroundColor: "{colors.power-led-green}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    height: "56px"
    width: "56px"
  play-button-hover:
    backgroundColor: "{colors.power-led-green-hover}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    height: "56px"
    width: "56px"
  transport-button:
    backgroundColor: "{colors.edge-gray}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  transport-button-live:
    backgroundColor: "{colors.power-led-green}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  loop-button-active:
    backgroundColor: "{colors.transport-blue}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  record-button-active:
    backgroundColor: "{colors.record-red}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  panel-card:
    backgroundColor: "{colors.panel-graphite}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"
  player-card:
    backgroundColor: "{colors.chassis-black}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  preset-tile:
    backgroundColor: "{colors.power-led-green}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  number-input:
    backgroundColor: "{colors.input-graphite}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  meter-legend-dot:
    backgroundColor: "{colors.meter-cyan}"
    rounded: "{rounded.full}"
    size: "12px"
---

# Design System: Anahata

<!-- impeccable:design-map -->
Name: Anahata
Colors: primary: power-led-green #22c55e; secondary: transport-blue #3b82f6; neutral: chassis-black #000000; primary: power-led-green-hover #4ade80; primary: wordmark-blue #60a5fa (+13 more in the sidecar)
Fonts: ui-sans-serif (display, headline, title, body, label)
Spacing: xs 4px, sm 8px, md 16px, lg 24px
Radius: sm 4px, md 6px, lg 8px, full 9999px
North Star: "The Midnight Instrument"
Rules:
- The One Lamp Rule. Power LED Green marks live transport actions only — play, the active range, the thumb ring.
- The Meter Pair Rule. Left channel is cyan, right channel is amber — legend dots, traces, and labels agree everywhere they appear.
- The System Voice Rule. No display webfonts, ever.
- The Flat Chassis Rule. Surfaces stay flat at rest.
Elevation:
- Focal glow — play button: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
- Focal glow — player card: 0 25px 50px -12px rgb(0 0 0 / 0.25)
- Focal glow — slider thumb: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
- Structural whisper: 0 1px 2px 0 rgb(0 0 0 / 0.05)
Don't:
- Don't introduce neon purple/violet "spiritual glow" wellness gradients into the app chrome; preset tiles keep their individual hues as content, not decoration.
- Don't use shadows for general elevation — the Flat Chassis Rule reserves glow for the play button, player card, and slider thumb.
- Don't add new accent hues to the chrome beyond the lamp set (green, blue, cyan, amber, red).
- Don't set text below 12px, and never shrink the meter labels to fit — shorten the copy instead.
Do:
- Do keep the chassis black/graphite — color arrives only through the lamp vocabulary.
- Do use Power LED Green for live transport actions and the active slider range — the One Lamp Rule.
- Do keep the cyan/amber meter pair for left/right channels everywhere both appear.
- Do build text hierarchy from white → gray-300 → gray-400 tone steps, not new hues.
- Do show the real signal in the visualizer — the trace is instrument output, never illustration.
Full: .impeccable/design-full.md (read a section when you need its detail)
