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

## Overview

**Creative North Star: "The Midnight Instrument"**

Anahata's interface is a physical instrument viewed at night: a matte-black chassis whose surfaces are flat, tonal layers of graphite, with light reserved for what is alive. The interface recedes so the sound leads — quiet, unhurried, engineered, honest. Nothing on screen claims more attention than the signal it represents.

Depth is tonal, never theatrical: cards are darker or lighter strata of the chassis, sometimes translucent with a soft backdrop blur, and glow appears only where the user's attention should land — the play control, the player card, the slider thumb. The wordmark's green-to-blue gradient is the single expressive flourish; everything else earns its color by meaning something.

The system deliberately rejects the neon-purple "spiritual glow" aesthetic common to wellness apps. Anahata's honesty-over-hype voice extends to its visuals: the meters show the real signal, the lamps report real state, and ornament that claims nothing is left out.

**Key Characteristics:**
- Matte-black instrument chassis — flat tonal surfaces, soft translucency, no general elevation
- One lamp vocabulary: green = live transport, cyan/amber = the channel pair, red = recording
- System type stack — hierarchy by size, weight, and tone, never by added fonts
- A single gradient flourish (green→blue) on the wordmark and player-tile identity
- The real-signal waveform canvas as the centerpiece: instrument output, not decoration

## Colors

The palette is a night-quiet chassis plus a small set of indicator lamps — color arrives meaning-bearing or not at all.

### Primary
- **Power LED Green** (#22c55e): the transport's live actions — the play button fill, the active slider range, the thumb's ring. Hover brightens it toward **Power LED Green Hover** (#4ade80), which also serves the header icon and the gradient wordmark's start.
- **Wordmark Blue** (#60a5fa): the wordmark and player-tile gradient's cool end, pairing with green for the only two gradients in the chrome.

### Secondary
- **Transport Blue** (#3b82f6): the active Loop toggle — a mode lamp, distinct from the green of live playback.
- **Left Meter Cyan** (#22d3ee) with sibling trace **Trace Cyan** (#06b6d4): the left channel's legend dot and its canvas trace. Legend dots read one step lighter than traces so the pair is legible against slate.
- **Right Meter Amber** (#fbbf24) with sibling trace **Trace Amber** (#f59e0b): the right channel, same rule.
- **Record Red** (#ef4444): the recording lamp and the timeline playhead — the only red, used only for "capturing / positioned" states.

### Neutral
- **Chassis Black** (#000000): the page floor and the player card.
- **Chassis Charcoal** (#111827): the page gradient's upper and lower strata (fading through black).
- **Panel Graphite** (#1f2937): structural panels and card borders on black.
- **Input Graphite** (#374151): editable fields — a touch lighter than panels, signaling "you can type here".
- **Edge Gray** (#4b5563) / **Edge Slate** (#475569): resting button fills and the visualizer card's crisp border.
- **Text Primary** (#ffffff), **Text Secondary** (#d1d5db), **Text Muted** (#9ca3af): hierarchy by tone, not hue.

### Named Rules
**The One Lamp Rule.** Power LED Green marks live transport actions only — play, the active range, the thumb ring. If everything is green, nothing is.
**The Meter Pair Rule.** Left channel is cyan, right channel is amber — legend dots, traces, and labels agree everywhere they appear. Never swap them and never add a third channel color.

## Typography

**Display Font:** the system sans stack (ui-sans-serif, system-ui, Segoe UI, Roboto, and friends)
**Body Font:** the same system sans stack
**Label/Mono Font:** none — numbers and values use the body font

**Character:** No webfonts anywhere — the system stack *is* the voice, and hierarchy is achieved purely through size, weight, and tonal value. (The canvas labels request Inter with a sans fallback; the fallback is what renders.)

### Hierarchy
- **Display** (700, 3rem, line-height 1): the Anahata wordmark, gradient-clipped — once per screen.
- **Headline** (700, 1.25rem, line-height 1.4): section markers ("Sequencer").
- **Title** (600, 1.125rem, line-height 1.55): card titles and in-card headers.
- **Body** (400, 0.875rem, line-height 1.43): the working size for controls, values, and descriptions.
- **Label** (400, 0.75rem, line-height 1.33): captions, axis notes, and time readouts; never smaller.

### Named Rules
**The System Voice Rule.** No display webfonts, ever. If a hierarchy needs more force, add size, weight, or tone — not a new typeface.

## Layout

A single column of full-width cards, centered in a `max-w-7xl` container over the charcoal→black→charcoal page gradient. Rhythm is a steady 24px (`space-y-6`) between sections; cards carry 16–24px internal padding. The Spotify-style player card leads, presets and the live visualizer follow, and the sequencer block (transport, timeline, session) anchors the bottom. Two-column grids appear only inside the mixer at `md` (768px) and up. This is a tool surface: density is welcome, clutter is not — every card is a device in the rack, stacked in the order it's used.

## Elevation & Depth

The chassis is flat. Depth is conveyed tonally — black floor, charcoal strata, graphite panels — with `backdrop-blur` translucency (4px on panels, 24px on the player card) letting the page gradient breathe through. Shadows are lamps, not architecture.

### Shadow Vocabulary
- **Focal glow — play button** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the play control, always.
- **Focal glow — player card** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): the deepest shadow in the system, on the card that leads the page.
- **Focal glow — slider thumb** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the grabbable point of the green-tuned slider.
- **Structural whisper** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): the base Card primitive's resting shadow — near-invisible on black.

### Named Rules
**The Flat Chassis Rule.** Surfaces stay flat at rest. Shadow appears only on the three focal points — play button, player card, slider thumb. Nowhere else, at any elevation.

## Shapes

The form language is hardware-rational: controls are rounded pills and discs, containers are softly rounded rectangles, nothing is sharp enough to feel like paper UI. Radius steps are 4px (transport buttons), 6px (inputs, preset tiles), 8px (cards) — plus fully circular for the play button, slider thumbs, and meter legend dots. The circle is reserved for things you touch or things that report state; rectangles frame content.

## Components

Controls feel precise and confident: solid fills, immediate press feedback, no ornament beyond function.

### Buttons
- **Shape:** pills — 4px radius on transport buttons (the one deliberate sharpness, echoing rack switches); fully circular for the play control (56px disc).
- **Primary:** Power LED Green fill, white icon, 8px 16px padding (Play in the transport bar carries near-black text at 700 weight).
- **Hover / Focus:** brightens toward Power LED Green Hover; focus shows a 2px ring offset by 2px.
- **Secondary / Ghost:** Edge Gray fills that lighten on hover; Loop's active state swaps to Transport Blue; Record while armed is Record Red with a slow opacity pulse.

### Chips
- **Style:** meter legend dots — 12px discs in Left Meter Cyan / Right Meter Amber beside 14px labels. State is the color itself; there are no chip borders or backgrounds.

### Cards / Containers
- **Corner Style:** 8px radius throughout.
- **Background:** two strata — Panel Graphite for working panels (transport, timeline, session), Chassis Black with 24px backdrop blur and the deep focal shadow for the player card; the visualizer uses translucent slate (`rgba(30, 41, 59, 0.5)`) over the page gradient.
- **Shadow Strategy:** focal only — see Elevation & Depth.
- **Border:** Panel Graphite or Edge Slate at 1px; borders separate strata, they do not decorate.
- **Internal Padding:** 16px in working panels, 24px in feature cards.

### Inputs / Fields
- **Style:** Input Graphite fill, 4–6px radius, no visible stroke at rest (the fill is the affordance).
- **Focus:** 2px ring in the control's accent color, offset 2px.
- **Disabled:** 50% opacity and no pointer — a dead lamp, not a hidden one.

### Signature Components
- **The Play Disc:** 56px, fully circular, Power LED Green with a white glyph, carrying the system's strongest glow. The single most recognizable control.
- **The Meter Canvas:** the live waveform visualizer — real AnalyserNode output, traces in Trace Cyan / Trace Amber on translucent slate, with channel labels set in the label voice. Flat line means no signal; pause freezes the last frame. It is the honesty of the product made visible, and no redesign may replace it with a stylized fake.
- **Preset Tiles:** gradient blocks (each preset carries its own hue — content colors, not chrome), 16px padding, `scale(1.05)` lift on hover over 200ms.

## Do's and Don'ts

### Do:
- **Do** keep the chassis black/graphite — color arrives only through the lamp vocabulary.
- **Do** use Power LED Green for live transport actions and the active slider range — the One Lamp Rule.
- **Do** keep the cyan/amber meter pair for left/right channels everywhere both appear.
- **Do** build text hierarchy from white → gray-300 → gray-400 tone steps, not new hues.
- **Do** show the real signal in the visualizer — the trace is instrument output, never illustration.

### Don't:
- **Don't** introduce neon purple/violet "spiritual glow" wellness gradients into the app chrome; preset tiles keep their individual hues as content, not decoration.
- **Don't** use shadows for general elevation — the Flat Chassis Rule reserves glow for the play button, player card, and slider thumb.
- **Don't** add new accent hues to the chrome beyond the lamp set (green, blue, cyan, amber, red).
- **Don't** set text below 12px, and never shrink the meter labels to fit — shorten the copy instead.
