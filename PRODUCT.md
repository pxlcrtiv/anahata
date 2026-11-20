# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two first-class audiences, confirmed by the owner:

- **Focus & relaxation seekers** — people using binaural beats for meditation, focus, sleep, or unwinding. They arrive at the live demo, pick a preset (Alpha/Theta waves, Solfeggio 528, Earth Tone 432…), press play, and listen on headphones.
- **Audio experimenters** — sound designers, musicians, and psychoacoustics-curious tinkerers. They set per-channel frequency/waveform/amplitude independently, schedule sequencer events with ramps, export WAVs, and move sessions around as JSON.

Both are equally primary; neither may be traded away for the other.

## Product Purpose

Anahata (Sanskrit: "unstruck sound") is a browser-based dual-channel tone generator for binaural beats, brainwave entrainment, and audio experiments. It exists as a free, live tool at https://sonic-dreamscape-orchestrator.netlify.app/ — not a paywalled app or a marketing site around one. Success means people find the live demo, get a tone playing quickly, and come back: adoption and return visits are the metric the owner cares about.

## Positioning

What a neighboring tone generator could not truthfully claim:

- **It shows the actual signal.** The waveform canvas is tapped off per-channel Web Audio `AnalyserNode`s — it draws the real output, not a redraw of the settings. Pause freezes the last frame; a flat line means no signal.
- **Preset-simple and instrument-deep at once.** One click gets a listener to a preset; the same surface offers a timeline sequencer with ramped, scheduled parameter changes, WAV export, and JSON sessions.
- **Honesty as a feature.** "Healing"/"chakra"/Solfeggio labels are presented as cultural shorthand for well-known frequencies, backed by an explicit no-medical-claims stance in the README and usage guide.

## Operating Context

- Runs in the browser on the Web Audio API; audio start requires a user gesture (pressing Play counts).
- Binaural beats require headphones — on speakers the two frequencies partially cancel and the beat is lost.
- Listening realism is part of the job: start at low master volume (square/sawtooth are louder than they look), and extended high-volume listening risks fatigue.
- Sessions live in `localStorage`; sharing happens via JSON export/import files.
- Deploys: pushing to `main` triggers a Netlify build; manual `netlify deploy --prod --dir=dist`.

## Capabilities and Constraints

Confirmed functionality:

- Dual-channel oscillators, 1 Hz – 20 kHz, sine/square/triangle/sawtooth per channel; Linked mode keeps channels in lockstep, unlinked allows independent control.
- Frequency presets: brainwave bands (Alpha, Theta), Solfeggio, 432 Hz, chakra tones.
- Per-channel amplitude + master volume; stop applies a ~20 ms fade to avoid clicks.
- WAV export: renders the current session — events, ramps, and full duration — to a 16-bit stereo `.wav`.
- Timeline sequencer: scheduled events for frequency, waveform, amplitude, and master volume at timestamps; linear `rampMs` interpolation; loop mode; transport (play/pause/stop/seek); visual timeline editor with add/edit/delete.
- Session persistence: save/load to `localStorage`, export/import as JSON; the working session and settings autosave and restore on reload.
- Vitest unit and integration tests across the sequencer, storage, transport, and components; Playwright E2E smoke tests in CI.
- Installable as a PWA (home screen on iOS/Android) with an offline shell.

Known constraints (Web Audio limits, not product choices):

- Waveform changes snap immediately — oscillator type cannot be morphed.
- WAV export renders the scheduled session — events, ramps, duration — not live crossfades or mid-playback manual tweaks.

## Brand Commitments

All three confirmed binding by the owner:

1. **The name and its concept** — "Anahata" and the "unstruck sound" meaning stay central to naming, copy, and identity.
2. **Honest audio-tool voice** — precise, unhyped framing; wellness/chakra labels remain cultural shorthand for frequencies, never medical or paranormal claims.
3. **The current dark, instrument-like visual identity is binding** — future work refines it; it does not rebrand it.

## Evidence on Hand

- Live demo: https://sonic-dreamscape-orchestrator.netlify.app/
- `README.md` — product description, feature list, architecture, deploy flow.
- `docs/USAGE.md` — usage guide including the session JSON format and safety tips.
- MIT `LICENSE`.
- Working implementation under `src/` (components, hooks, sequencer) plus a Vitest suite for the sequencer.

Not on hand, and future work must not fabricate: testimonials, user counts or analytics, case studies, press, and any health/efficacy evidence.

## Product Principles

1. **Both audiences, one surface.** Preset simplicity for seekers and instrument depth for experimenters coexist; a change that serves one must not bury the other.
2. **Show the truth.** What the visitor sees and hears is the real signal — visualizer and exports reflect actual audio state, never a simulation of it.
3. **Honesty over hype.** Cultural frequency names are shorthand; the product never trades on medical, wellness, or paranormal claims.
4. **Fast to first tone.** Adoption is the success metric; time from arrival to a playing, correct binaural beat is the number to shrink.
5. **Assume real listening.** Headphones, safe volumes, and browser realities (gesture requirement) shape defaults and guidance.
