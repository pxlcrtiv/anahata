
import React, { useState, useCallback, useRef } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useSequencer } from '../hooks/useSequencer';
import PlayerControls from './PlayerControls';
import FrequencyPresets from './FrequencyPresets';
import ChannelMixer from './ChannelMixer';
import WaveformVisualizer from './WaveformVisualizer';
import TransportBar from './TransportBar';
import TimelineEditor from './TimelineEditor';
import SessionPanel from './SessionPanel';
import { Waves } from 'lucide-react';
import type { EvaluatedState } from '../sequencer/types';

const WaveGenerator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftChannel, setLeftChannel] = useState({
    frequency: 528,
    waveform: 'sine',
    amplitude: 0.5
  });
  const [rightChannel, setRightChannel] = useState({
    frequency: 528,
    waveform: 'sine',
    amplitude: 0.5
  });
  const [linkedChannels, setLinkedChannels] = useState(true);
  const [masterVolume, setMasterVolume] = useState(0.7);

  const sequencerRunningRef = useRef(false);

  const { startAudio, stopAudio, updateFrequency, updateAmplitude, updateWaveform, updateMasterVolume, exportWAV, getWaveformData } = useAudioEngine();

  const handleSequencerTick = useCallback((state: EvaluatedState) => {
    if (!sequencerRunningRef.current) {
      // First tick: start audio with current evaluated state
      startAudio({
        leftChannel: { frequency: state.left.frequency, waveform: state.left.waveform, amplitude: state.left.amplitude },
        rightChannel: { frequency: state.right.frequency, waveform: state.right.waveform, amplitude: state.right.amplitude },
        masterVolume: state.masterVolume,
      });
      sequencerRunningRef.current = true;
    } else {
      // Subsequent ticks: update in place
      updateFrequency('left', state.left.frequency);
      updateFrequency('right', state.right.frequency);
      updateAmplitude('left', state.left.amplitude);
      updateAmplitude('right', state.right.amplitude);
      updateWaveform('left', state.left.waveform as OscillatorType);
      updateWaveform('right', state.right.waveform as OscillatorType);
      updateMasterVolume(state.masterVolume);
    }
  }, [startAudio, updateFrequency, updateAmplitude, updateWaveform, updateMasterVolume]);

  const {
    session,
    setSession,
    positionMs,
    isPlaying: sequencerPlaying,
    play: sequencerPlay,
    pause: sequencerPause,
    stop: sequencerStop,
    seek,
  } = useSequencer(handleSequencerTick);

  const handlePlay = async () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      try {
        await startAudio({
          leftChannel,
          rightChannel,
          masterVolume
        });
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to start audio:', error);
      }
    }
  };

  const handleStop = () => {
    stopAudio();
    setIsPlaying(false);
  };

  const handleFrequencySelect = (frequency: number) => {
    setLeftChannel(prev => ({ ...prev, frequency }));
    if (linkedChannels) {
      setRightChannel(prev => ({ ...prev, frequency }));
    }
  };

  const handleLeftChannelChange = (changes: Partial<typeof leftChannel>) => {
    const newConfig = { ...leftChannel, ...changes };
    setLeftChannel(newConfig);
    
    if (linkedChannels && changes.frequency !== undefined) {
      setRightChannel(prev => ({ ...prev, frequency: changes.frequency! }));
    }
    if (linkedChannels && changes.waveform !== undefined) {
      setRightChannel(prev => ({ ...prev, waveform: changes.waveform! }));
    }
    if (linkedChannels && changes.amplitude !== undefined) {
      setRightChannel(prev => ({ ...prev, amplitude: changes.amplitude! }));
    }

    if (isPlaying && changes.frequency !== undefined) {
      updateFrequency('left', changes.frequency);
      if (linkedChannels) {
        updateFrequency('right', changes.frequency);
      }
    }
    if (isPlaying && changes.amplitude !== undefined) {
      updateAmplitude('left', changes.amplitude);
      if (linkedChannels) {
        updateAmplitude('right', changes.amplitude);
      }
    }
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

    const newConfig = { ...rightChannel, ...changes };
    setRightChannel(newConfig);

    if (isPlaying && changes.frequency !== undefined) {
      updateFrequency('right', changes.frequency);
    }
    if (isPlaying && changes.amplitude !== undefined) {
      updateAmplitude('right', changes.amplitude);
    }
  };

  const handleVolumeChange = (volume: number) => {
    setMasterVolume(volume);
    if (isPlaying) {
      updateMasterVolume(volume);
    }
  };

  const handleExport = () => {
    exportWAV({
      leftChannel,
      rightChannel,
      masterVolume
    }, 10);
  };

  const handleSequencerPlay = () => {
    sequencerPlay();
    setIsPlaying(true);
  };

  const handleSequencerPause = () => {
    sequencerPause();
    sequencerRunningRef.current = false;
    stopAudio();
    setIsPlaying(false);
  };

  const handleSequencerStop = () => {
    sequencerStop();
    sequencerRunningRef.current = false;
    stopAudio();
    setIsPlaying(false);
  };

  const handleSessionChange = (newSession: typeof session) => {
    setSession(newSession);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Waves className="w-10 h-10 text-green-400" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Anahata
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Professional wave generator for healing frequencies, binaural beats, and audio experiments
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Player Controls - Spotify Style */}
        <PlayerControls
          isPlaying={isPlaying}
          masterVolume={masterVolume}
          onPlay={handlePlay}
          onStop={handleStop}
          onVolumeChange={handleVolumeChange}
          onExport={handleExport}
          leftFreq={leftChannel.frequency}
          rightFreq={rightChannel.frequency}
        />

        {/* Frequency Presets */}
        <FrequencyPresets onFrequencySelect={handleFrequencySelect} />

        {/* Waveform Visualizer */}
        <WaveformVisualizer 
          leftChannel={leftChannel}
          rightChannel={rightChannel}
          isPlaying={isPlaying}
          masterVolume={masterVolume}
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
            onPlay={handleSequencerPlay}
            onPause={handleSequencerPause}
            onStop={handleSequencerStop}
            onSeek={seek}
            onToggleLoop={() => setSession({ ...session, loop: !session.loop })}
            onDurationChange={(ms) => setSession({ ...session, durationMs: ms })}
          />

          <TimelineEditor
            session={session}
            positionMs={positionMs}
            onChange={handleSessionChange}
            onSeek={seek}
          />

          <SessionPanel
            session={session}
            onChangeSession={handleSessionChange}
          />
        </div>
      </div>
    </div>
  );
};

export default WaveGenerator;
