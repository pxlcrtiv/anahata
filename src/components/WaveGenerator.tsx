
import React, { useState, useRef, useEffect } from 'react';
import { useTransport } from '../transport/useTransport';
import PlayerControls from './PlayerControls';
import FrequencyPresets from './FrequencyPresets';
import ChannelMixer from './ChannelMixer';
import WaveformVisualizer from './WaveformVisualizer';
import TransportBar from './TransportBar';
import TimelineEditor from './TimelineEditor';
import SessionPanel from './SessionPanel';
import Wordmark from './Wordmark';
import { DEFAULT_CROSSFADE_MS } from '../sequencer/crossfade';
import { BASELINE } from '../sequencer/evaluate';
import { renderSessionToStereo, interleaveStereo } from '../audio/renderSession';
import { encodeWAV } from '../audio/wavEncoder';
import { downloadBlob } from '../audio/downloadBlob';
import { useToast } from '@/hooks/use-toast';
import { loadAutosave, saveAutosave } from '../storage/sessionStorage';
import type { ChannelState, EvaluatedState } from '../sequencer/types';

const WaveGenerator = () => {
  // Restore the last autosaved session and settings on first render.
  const restoredRef = useRef(loadAutosave());

  // The transport owns play state, the engine, the recorder, and the
  // crossfade machine — this component is view wiring plus settings.
  const {
    session,
    setSession,
    positionMs,
    seek,
    sequencerPlaying,
    play: playSequencer,
    pause: pauseSequencer,
    stop: stopTransport,
    engineLive,
    playManual,
    pauseManual,
    applyManual,
    isRecording,
    toggleRecord,
    getDisplayState,
    getWaveformData,
    setCrossfadeDuration,
  } = useTransport();
  const { toast } = useToast();

  const [leftChannel, setLeftChannel] = useState<ChannelState>(
    () => restoredRef.current?.settings.left ?? { ...BASELINE.left }
  );
  const [rightChannel, setRightChannel] = useState<ChannelState>(
    () => restoredRef.current?.settings.right ?? { ...BASELINE.right }
  );
  const [linkedChannels, setLinkedChannels] = useState(
    () => restoredRef.current?.settings.linked ?? true
  );
  const [masterVolume, setMasterVolume] = useState(
    () => restoredRef.current?.settings.masterVolume ?? BASELINE.masterVolume
  );
  const [crossfadeMs, setCrossfadeMs] = useState(
    () => restoredRef.current?.settings.crossfadeMs ?? DEFAULT_CROSSFADE_MS
  );

  // Restore the last autosaved session once on mount.
  useEffect(() => {
    const restored = restoredRef.current;
    if (restored) {
      setSession(restored.session);
    }
  }, [setSession]);

  // Debounced autosave: the working session and settings survive reloads.
  useEffect(() => {
    const id = setTimeout(() => {
      saveAutosave({
        session,
        settings: { left: leftChannel, right: rightChannel, linked: linkedChannels, masterVolume, crossfadeMs },
      });
    }, 500);
    return () => clearTimeout(id);
  }, [session, leftChannel, rightChannel, linkedChannels, masterVolume, crossfadeMs]);

  // Keep the transport's crossfade machine on the current setting.
  useEffect(() => {
    setCrossfadeDuration(crossfadeMs);
  }, [crossfadeMs, setCrossfadeDuration]);

  // What is actually sounding: the sequencer's evaluated state while it
  // plays, the manual settings otherwise. Labels read this, never the raw
  // settings, so the UI never describes something else.
  const displayState: EvaluatedState = getDisplayState({
    left: leftChannel,
    right: rightChannel,
    masterVolume,
  });

  const handlePlayerToggle = () => {
    if (sequencerPlaying) {
      // One transport: the player card pauses the whole thing.
      pauseSequencer();
      return;
    }
    if (engineLive) {
      pauseManual();
    } else {
      void playManual({ left: leftChannel, right: rightChannel, masterVolume });
    }
  };

  const handleFrequencySelect = (frequency: number, beatHz?: number) => {
    const nextLeft = { ...leftChannel, frequency };
    const nextRight =
      beatHz !== undefined
        ? { ...rightChannel, frequency: frequency + beatHz }
        : linkedChannels
          ? { ...rightChannel, frequency }
          : rightChannel;

    setLeftChannel(nextLeft);
    setRightChannel(nextRight);
    if (beatHz !== undefined) {
      // A binaural beat needs independent channels: apply the offset pair and unlink.
      setLinkedChannels(false);
    }

    // Honored live in manual mode; gated to a no-op while the sequencer owns
    // the engine (one writer per mode).
    applyManual({ left: nextLeft, right: nextRight, masterVolume });
  };

  const handleLeftChannelChange = (changes: Partial<typeof leftChannel>) => {
    const newLeft = { ...leftChannel, ...changes };
    setLeftChannel(newLeft);

    let newRight = rightChannel;
    if (linkedChannels) {
      newRight = { ...rightChannel };
      if (changes.frequency !== undefined) newRight.frequency = changes.frequency;
      if (changes.waveform !== undefined) newRight.waveform = changes.waveform;
      if (changes.amplitude !== undefined) newRight.amplitude = changes.amplitude;
      setRightChannel(newRight);
    }

    applyManual({
      left: newLeft,
      right: newRight,
      masterVolume,
    });
  };

  const handleRightChannelChange = (changes: Partial<typeof rightChannel>) => {
    if (linkedChannels) {
      const mirrored: Partial<typeof leftChannel> = {};
      if (changes.frequency !== undefined) mirrored.frequency = changes.frequency;
      if (changes.waveform !== undefined) mirrored.waveform = changes.waveform;
      if (changes.amplitude !== undefined) mirrored.amplitude = changes.amplitude;
      handleLeftChannelChange(mirrored);
      return;
    }

    const newRight = { ...rightChannel, ...changes };
    setRightChannel(newRight);

    applyManual({
      left: leftChannel,
      right: newRight,
      masterVolume,
    });
  };

  const handleVolumeChange = (volume: number) => {
    setMasterVolume(volume);
    applyManual({
      left: leftChannel,
      right: rightChannel,
      masterVolume: volume,
    });
  };

  const handleExport = () => {
    try {
      const rendered = renderSessionToStereo(session, 44100);
      const interleaved = interleaveStereo(rendered.left, rendered.right);
      const wav = encodeWAV(interleaved, 2, rendered.sampleRate);
      const blob = new Blob([wav], { type: 'audio/wav' });
      downloadBlob(blob, `anahata-${(session.name || 'session').replace(/\s+/g, '-').toLowerCase()}-${(session.durationMs / 1000).toFixed(1)}s.wav`);
      toast({
        title: 'Export complete',
        description: `${(session.durationMs / 1000).toFixed(1)}s session rendered to WAV`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'The session could not be rendered.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <Wordmark wrapperClassName="mb-4" />
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Dual-channel wave generator for binaural beats and audio experimentation
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Player Controls - Spotify Style */}
        <PlayerControls
          isPlaying={engineLive}
          masterVolume={masterVolume}
          onPlay={handlePlayerToggle}
          onStop={stopTransport}
          onVolumeChange={handleVolumeChange}
          onExport={handleExport}
          leftFreq={displayState.left.frequency}
          rightFreq={displayState.right.frequency}
        />

        {/* Frequency Presets */}
        <FrequencyPresets onFrequencySelect={handleFrequencySelect} />

        {/* Waveform Visualizer */}
        <WaveformVisualizer
          leftChannel={displayState.left}
          rightChannel={displayState.right}
          isPlaying={engineLive}
          masterVolume={displayState.masterVolume}
          getWaveformData={getWaveformData}
        />

        {/* Channel Mixer */}
        <ChannelMixer
          leftChannel={leftChannel}
          rightChannel={rightChannel}
          linkedChannels={linkedChannels}
          onLeftChannelChange={handleLeftChannelChange}
          onRightChannelChange={handleRightChannelChange}
          onLinkToggle={() => setLinkedChannels(!linkedChannels)}
        />

        {/* Sequencer Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-200">Sequencer</h2>

          <TransportBar
            isPlaying={sequencerPlaying}
            positionMs={positionMs}
            durationMs={session.durationMs}
            loop={session.loop}
            onPlay={playSequencer}
            onPause={pauseSequencer}
            onStop={stopTransport}
            onSeek={seek}
            onToggleLoop={() => setSession({ ...session, loop: !session.loop })}
            onDurationChange={(ms) => setSession({ ...session, durationMs: ms })}
            isRecording={isRecording}
            canRecord={sequencerPlaying}
            onToggleRecord={toggleRecord}
          />

          <TimelineEditor
            session={session}
            positionMs={positionMs}
            onChange={setSession}
            onSeek={seek}
          />

          <SessionPanel
            session={session}
            onChangeSession={setSession}
            crossfadeMs={crossfadeMs}
            onCrossfadeMsChange={setCrossfadeMs}
          />
        </div>
      </div>
    </div>
  );
};

export default WaveGenerator;
