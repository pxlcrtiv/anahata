# Using Anahata

Anahata is a dual-channel tone generator. Each **channel** (left / right) drives one
ear. What you hear depends on how the two channels relate to each other.

## Pure tone (monaural)
Set **both** channels to the same frequency with **Linked** on. You get a steady tone
at that frequency — e.g. 528 Hz, 432 Hz.

## Binaural beat
Set the channels to *different* frequencies with **Linked** off:
- Left ear: 200 Hz
- Right ear: 208 Hz

Your brain perceives a third tone at the **difference**: 8 Hz (a Theta/Alpha border
band, commonly used for relaxation/focus). For a binaural beat to work you must wear
**headphones** — the two frequencies must reach the ears separately. On speakers the
beats partially cancel and you mostly hear the carriers.

### Suggested starting points (presets)
| Preset | Left / Right | Perceived beat | Common use |
| --- | --- | --- | --- |
| Alpha Waves | 100 / 110 Hz | 10 Hz | Alert relaxation |
| Theta Waves | 100 / 106 Hz | 6 Hz | Deep meditation |
| Solfeggio 528 | 528 / 528 Hz | 0 (pure tone) | Tuning/tone |
| Earth Tone 432 | 432 / 432 Hz | 0 (pure tone) | Tuning/tone |
| Crown 963 | 963 / 963 Hz | 0 (pure tone) | Tuning/tone |

> The named "healing"/"chakra" presets above 20 Hz are pure tones, not beats. They are
> labeled for convenience, not as health claims.

## Waveforms
- **Sine** — purest tone, fewest harmonics. Best for clean binaural beats.
- **Square / Sawtooth** — rich in harmonics; louder-sounding at the same amplitude.
  Use lower amplitudes to avoid harshness.
- **Triangle** — softer than square/saw, brighter than sine.

## Amplitude & volume
- Per-channel **amplitude** (0–1) scales that channel's oscillator before the merger.
- **Master volume** scales the combined signal. Linked mode keeps both channels'
  amplitudes equal.

## Live waveform
While playing, the canvas shows the **actual** signal from each channel, read via a
Web Audio `AnalyserNode`. It reflects real frequency, waveform, and amplitude — pause
and it freezes the last frame (flat line when no signal).

## Exporting a WAV
The **Download** button renders the current steady-state configuration to a 16-bit
stereo `.wav` (10 s). It reconstructs the waveform mathematically from the settings,
so it matches what you hear at steady state — but it does not capture live fades or
mid-playback changes.

## Timeline sequencer
The sequencer lets you schedule parameter changes (frequency, waveform, amplitude,
master volume) at specific timestamps, with optional linear ramps.

### Transport
- **Play** — starts playback from the current position. The sequencer drives the
  audio engine automatically.
- **Pause** — pauses at the current position; audio stops.
- **Stop** — resets position to 0 and stops audio.
- **Seek** — drag the slider to jump to any point in the timeline.
- **Loop** — toggle loop mode; playback wraps at the configured duration.

### Adding events
1. Position the playhead where you want the event (click the ruler or drag the
   seek slider).
2. Click **+ Add Event** in the Timeline section.
3. An event block appears at the playhead position. Click it to edit.
4. Set frequency, waveform, amplitude, master volume, and optional `rampMs`.
5. Click **Save** to apply changes, or **Delete** to remove the event.

### Ramp transitions
Set `rampMs` on an event to linearly interpolate frequency and amplitude from the
previous value over that duration. Waveform changes always snap immediately (Web Audio
does not support oscillator-type morphing).

### Session management
- **Save** — persists the current session (events, duration, loop setting) to
  `localStorage` under the given name.
- **Load** — click a saved session name to restore it.
- **Export** — downloads the session as a `.json` file.
- **Import** — upload a `.json` file to load a session.

### Session JSON format
```json
{
  "id": "unique-id",
  "name": "My Session",
  "durationMs": 10000,
  "loop": false,
  "events": [
    {
      "id": "evt_1",
      "timeMs": 0,
      "left": { "frequency": 200, "waveform": "square", "amplitude": 0.8 },
      "masterVolume": 0.5
    },
    {
      "id": "evt_2",
      "timeMs": 5000,
      "right": { "frequency": 400, "waveform": "sawtooth" },
      "rampMs": 1000
    }
  ]
}
```

## Tips & safety
- Always use headphones for binaural beats.
- Start at low master volume; square/sawtooth can be surprisingly loud.
- If audio doesn't start, browsers require a user gesture — pressing **Play** counts.
- Respect your ears: extended listening at high volume can cause fatigue or damage.
