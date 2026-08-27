# Anahata

**Anahata** (Sanskrit: *anāhata* — "unstruck sound") is the tone you hear with no
external source striking. That is precisely what a binaural beat is: two slightly
different frequencies, one in each ear, fused by the brain into a perceived third tone.

Anahata is a calm, precise **dual-channel tone studio** for binaural beats, brainwave
entrainment, and audio experimentation — with a real-time waveform visualizer tapped
off the live audio signal, and a timeline sequencer for evolving soundscapes.

> Live demo: https://sonic-dreamscape-orchestrator.netlify.app/

---

## ✨ Features

### 🌊 Wave generation
- **Pure tones** — precise left/right oscillators from 1 Hz to 20 kHz.
- **Binaural beats** — set a different frequency per ear; the difference *is* the beat.
- **Waveform types** — sine, square, triangle, sawtooth, independently per channel.
- **Frequency presets** — a curated grab-bag of commonly used tones. These are
  *convenience presets*, not medical claims (see the note below).

### 🎚️ Audio controls
- **Dual-channel mixer** — independent (or linked) frequency, waveform, and amplitude
  per channel. Linked mode keeps both ears in perfect lockstep.
- **Master volume** — global gain with a short fade on stop, so there's never a click.
- **WAV export** — renders the current steady-state waveform to a 16-bit stereo `.wav`.

### 📈 Real-time visualization
- **Live waveform** — two `AnalyserNode`s are tapped off each channel's gain and drawn
  to a canvas while playing, so you see the *actual* signal — not a redraw of the config.

### 🎞️ Timeline sequencer
- **Scheduled events** — drop frequency, waveform, amplitude, and master-volume changes
  at exact timestamps on a transport timeline.
- **Ramped transitions** — linear interpolation over a configurable `rampMs` for smooth
  frequency/amplitude sweeps. (Waveform changes snap immediately — a Web Audio limitation.)
- **Loop** — wrap the timeline at `durationMs` for endless, evolving drones.
- **Transport** — play / pause / stop / seek, loop toggle, and a live time readout.
- **Timeline editor** — visual tracks with clickable event blocks; add, edit, delete
  events inline.
- **Sessions** — save/load to `localStorage`, or export/import as JSON files to share
  and version your creations.

---

## 💛 A note on the wellness framing

Anahata is an **audio tool**, full stop. The "Solfeggio" / "chakra" / frequency labels on
the presets are cultural shorthand for well-known tones — **not** health, spiritual, or
paranormal claims. Binaural beats are a genuine psychoacoustic phenomenon people use for
focus and relaxation, but nothing in this app is a substitute for medical care. Use it
because it sounds good and helps you concentrate; not because it "heals."

---

## 🧱 Tech stack
- **React 18 + TypeScript** — typed end to end.
- **Vite** — instant dev server and optimized production builds.
- **Tailwind CSS + shadcn/ui** — clean, themeable components.
- **Web Audio API** — oscillators, gains, analysers, channel merger.
- **Canvas 2D** — the live waveform visualizer.
- **Netlify** — CI deploys from `main`.

---

## 🚀 Quick start

```bash
# Requires Node 18+
npm install
npm run dev        # start the dev server (http://localhost:8080)
```

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build
```

---

## 🎯 Usage
1. Pick a preset or type a custom frequency per channel.
2. Toggle **Linked** to keep both channels in lockstep, or unlink for independent control.
3. Press play and watch the live waveforms.
4. Shape the sound with per-channel amplitude and master volume.
5. Export a WAV of the current steady-state tone — or open the **Sequencer** to compose a
   timeline and save it as a session.

---

## 📂 Project structure

```
src/
├── components/
│   ├── ChannelMixer.tsx        # per-channel frequency/waveform/amplitude
│   ├── FrequencyPresets.tsx    # quick-select preset cards
│   ├── PlayerControls.tsx      # play / stop / volume / export
│   ├── SessionPanel.tsx        # save / load / import / export sessions
│   ├── TimelineEditor.tsx      # visual timeline with event blocks
│   ├── TransportBar.tsx        # sequencer play / pause / seek / loop
│   ├── WaveGenerator.tsx       # top-level state + layout
│   └── WaveformVisualizer.tsx  # live analyser-driven canvas
├── hooks/
│   ├── useAudioEngine.ts       # Web Audio graph + WAV export
│   └── useSequencer.ts         # rAF-driven transport + evaluation
├── sequencer/
│   ├── evaluate.ts             # pure session evaluation logic
│   ├── crossfade.ts            # smooth session-switch interpolation
│   ├── session.ts              # serialize / deserialize sessions
│   ├── types.ts                # domain types
│   └── __tests__/              # Vitest unit tests
├── pages/                      # route entry (Index → WaveGenerator)
├── lib/                        # utilities
└── components/ui/              # shadcn/ui primitives
```

---

## 🔊 Audio engine

`useAudioEngine` builds the graph:

```
Oscillator → Gain → Analyser → ChannelMerger(2) → masterGain → destination
```

An `AnalyserNode` on each channel feeds the visualizer. On stop, the master gain fades
over ~20 ms and every node is fully disconnected to avoid leaks or clicks.

---

## 🚢 Deployment

Pushing to `main` triggers a Netlify build. To deploy manually:

```bash
npm run build && netlify deploy --prod --dir=dist
```

---

## 📜 License

MIT — see [LICENSE](LICENSE). Usage guide: [docs/USAGE.md](docs/USAGE.md).
