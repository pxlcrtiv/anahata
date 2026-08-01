# Anahata

**Anahata** (Sanskrit: "unstruck sound") — the tone you perceive with no external
source. That is exactly what a binaural beat is: two slightly different frequencies
played in each ear, fused by the brain into a perceived third tone. This app is a
dual-channel tone generator for binaural beats, brainwave entrainment, and audio
experiments, with a real-time waveform visualizer tapped off the live audio signal.

> Live demo: https://sonic-dreamscape-orchestrator.netlify.app/

## Features

### Wave generation
- **Pure tones** — precise left/right oscillators (1 Hz – 20 kHz).
- **Binaural beats** — set different frequencies per ear; the difference is the beat.
- **Waveform types** — sine, square, triangle, sawtooth, per channel.
- **Frequency presets** — a grab-bag of commonly used tones (Solfeggio, 432 Hz,
  chakra tones, and low-frequency brainwave bands). These are *convenience presets*,
  not medical claims — see the note below.

### Audio controls
- **Dual-channel mixer** — independent (or linked) frequency, waveform, and amplitude
  per channel.
- **Master volume** — global gain with a short fade on stop to avoid clicks.
- **WAV export** — renders the steady-state waveform to a 16-bit stereo `.wav`.

### Real-time visualization
- **Live waveform** — two `AnalyserNode`s are tapped off each channel's gain and
  drawn to a canvas while playing, so you see the *actual* signal (not a redraw of
  the config).

### Timeline sequencer
- **Scheduled events** — schedule frequency, waveform, amplitude, and master volume
  changes at specific timestamps on a transport timeline.
- **Ramped transitions** — linear interpolation over a configurable `rampMs` for
  smooth frequency/amplitude sweeps. Waveform changes snap immediately (Web Audio
  limitation).
- **Loop mode** — toggle loop on/off; the timeline wraps at `durationMs`.
- **Transport controls** — play/pause, stop, seek slider, loop toggle, time readout.
- **Timeline editor** — visual tracks with clickable event blocks; add, edit, delete
  events inline.
- **Session persistence** — save/load sessions to `localStorage`; export/import as
  JSON files.

## A note on the wellness framing
This is an audio tool. The "healing" / "chakra" / "ET contact" labels attached to the
presets are cultural shorthand for well-known frequencies, **not** health or
paranormal claims. Binaural beats are a real psychoacoustic phenomenon used for
focus and relaxation; nothing here is a substitute for medical care.

## Tech stack
- React 18 + TypeScript
- Vite (fast dev server + optimized build)
- Tailwind CSS + shadcn/ui components
- Web Audio API (oscillators, gains, analysers, channel merger)
- Canvas 2D for the visualizer
- Netlify for CI deploys from `main`

## Quick start

```bash
# Requires Node 18+
npm install
npm run dev        # start dev server (http://localhost:8080)
```

```bash
npm run build      # production build -> dist/
npm run preview    # preview the production build
```

## Usage
1. Pick a preset or type a custom frequency per channel.
2. Toggle **Linked** to keep both channels in lockstep, or unlink for independent control.
3. Press play; watch the live waveforms.
4. Adjust amplitude (per channel) and master volume.
5. Export a WAV of the current steady-state tone.

## Project structure
```
src/
├── components/
│   ├── ChannelMixer.tsx        # per-channel frequency/waveform/amplitude
│   ├── FrequencyPresets.tsx    # quick-select buttons
│   ├── PlayerControls.tsx      # play / stop / volume / export
│   ├── SessionPanel.tsx        # save/load/import/export sessions
│   ├── TimelineEditor.tsx      # visual timeline with event blocks
│   ├── TransportBar.tsx        # sequencer play/pause/seek/loop
│   ├── WaveGenerator.tsx       # top-level state + layout
│   └── WaveformVisualizer.tsx  # live analyser-driven canvas
├── hooks/
│   ├── useAudioEngine.ts       # Web Audio graph + WAV export
│   └── useSequencer.ts         # rAF-driven transport + evaluation
├── sequencer/
│   ├── evaluate.ts             # pure session evaluation logic
│   ├── session.ts              # serialize/deserialize sessions
│   ├── types.ts                # domain types
│   └── __tests__/              # Vitest unit tests
├── pages/                      # route entry (Index -> WaveGenerator)
├── lib/                        # utils
└── components/ui/              # shadcn/ui primitives
```

## Audio engine
`useAudioEngine` builds the graph:
`Oscillator → Gain → Analyser → ChannelMerger(2) → masterGain → destination`.
An `AnalyserNode` on each channel feeds the visualizer. Stop fades the master gain
over ~20 ms and fully disconnects every node to avoid leaks.

## Deployment
Pushing to `main` triggers a Netlify build. Manual:
```bash
npm run build && netlify deploy --prod --dir=dist
```

## License
MIT — see [LICENSE](LICENSE). Usage guide: [docs/USAGE.md](docs/USAGE.md).
