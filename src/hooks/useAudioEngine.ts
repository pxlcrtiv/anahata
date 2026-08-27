
import { useRef, useCallback, useEffect } from 'react';

interface AudioEngineConfig {
  leftChannel: {
    frequency: number;
    waveform: string;
    amplitude: number;
  };
  rightChannel: {
    frequency: number;
    waveform: string;
    amplitude: number;
  };
  masterVolume: number;
}

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftAnalyserRef = useRef<AnalyserNode | null>(null);
  const rightAnalyserRef = useRef<AnalyserNode | null>(null);
  const isPlayingRef = useRef(false);

  // Peaks the most recent per-channel time-domain sample (0..1) for visualization.
  // Kept in refs so the visualizer can read them without re-rendering React.
  const leftDataRef = useRef<Uint8Array | null>(null);
  const rightDataRef = useRef<Uint8Array | null>(null);

  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  const startAudio = useCallback(async (config: AudioEngineConfig) => {
    await initializeAudioContext();
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Stop existing oscillators
    stopAudio();

    const merger = audioContextRef.current.createChannelMerger(2);

    // Left channel: oscillator -> gain -> analyser -> merger
    leftOscillatorRef.current = audioContextRef.current.createOscillator();
    leftGainRef.current = audioContextRef.current.createGain();
    leftAnalyserRef.current = audioContextRef.current.createAnalyser();
    leftAnalyserRef.current.fftSize = 2048;
    leftAnalyserRef.current.smoothingTimeConstant = 0.4;
    // 1024 samples gives a window of ~23ms at 44.1kHz — enough to show a few
    // cycles of low binaural beats while staying responsive.
    leftDataRef.current = new Uint8Array(leftAnalyserRef.current.frequencyBinCount);

    leftOscillatorRef.current.frequency.setValueAtTime(config.leftChannel.frequency, audioContextRef.current.currentTime);
    leftOscillatorRef.current.type = config.leftChannel.waveform as OscillatorType;
    leftGainRef.current.gain.setValueAtTime(config.leftChannel.amplitude, audioContextRef.current.currentTime);

    leftOscillatorRef.current.connect(leftGainRef.current);
    leftGainRef.current.connect(leftAnalyserRef.current);
    leftAnalyserRef.current.connect(merger, 0, 0);

    // Right channel: oscillator -> gain -> analyser -> merger
    rightOscillatorRef.current = audioContextRef.current.createOscillator();
    rightGainRef.current = audioContextRef.current.createGain();
    rightAnalyserRef.current = audioContextRef.current.createAnalyser();
    rightAnalyserRef.current.fftSize = 2048;
    rightAnalyserRef.current.smoothingTimeConstant = 0.4;
    rightDataRef.current = new Uint8Array(rightAnalyserRef.current.frequencyBinCount);

    rightOscillatorRef.current.frequency.setValueAtTime(config.rightChannel.frequency, audioContextRef.current.currentTime);
    rightOscillatorRef.current.type = config.rightChannel.waveform as OscillatorType;
    rightGainRef.current.gain.setValueAtTime(config.rightChannel.amplitude, audioContextRef.current.currentTime);

    rightOscillatorRef.current.connect(rightGainRef.current);
    rightGainRef.current.connect(rightAnalyserRef.current);
    rightAnalyserRef.current.connect(merger, 0, 1);

    // Connect to master gain
    merger.connect(masterGainRef.current);
    masterGainRef.current.gain.setValueAtTime(config.masterVolume, audioContextRef.current.currentTime);

    // Start oscillators
    leftOscillatorRef.current.start();
    rightOscillatorRef.current.start();
    
    isPlayingRef.current = true;
  }, [initializeAudioContext]);

  const stopAudio = useCallback(() => {
    const now = audioContextRef.current?.currentTime ?? 0;

    // Quick fade to avoid a click, then tear down.
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0, now + 0.02);
    }

    [leftOscillatorRef, rightOscillatorRef].forEach((ref) => {
      const osc = ref.current;
      if (osc) {
        try { osc.stop(now + 0.03); } catch { /* already stopped */ }
        osc.disconnect();
        ref.current = null;
      }
    });

    [leftGainRef, rightGainRef, leftAnalyserRef, rightAnalyserRef].forEach((ref) => {
      if (ref.current) {
        ref.current.disconnect();
        ref.current = null;
      }
    });
    leftDataRef.current = null;
    rightDataRef.current = null;

    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(0.7, now);
    }
    isPlayingRef.current = false;
  }, []);

  const updateFrequency = useCallback((channel: 'left' | 'right', frequency: number) => {
    if (!audioContextRef.current || !isPlayingRef.current) return;
    
    const oscillator = channel === 'left' ? leftOscillatorRef.current : rightOscillatorRef.current;
    if (oscillator) {
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    }
  }, []);

  const updateAmplitude = useCallback((channel: 'left' | 'right', amplitude: number) => {
    if (!audioContextRef.current || !isPlayingRef.current) return;
    
    const gainNode = channel === 'left' ? leftGainRef.current : rightGainRef.current;
    if (gainNode) {
      gainNode.gain.setValueAtTime(amplitude, audioContextRef.current.currentTime);
    }
  }, []);

  const updateMasterVolume = useCallback((volume: number) => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    
    masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
  }, []);

  const updateWaveform = useCallback((channel: 'left' | 'right', type: OscillatorType) => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    const oscillator = channel === 'left' ? leftOscillatorRef.current : rightOscillatorRef.current;
    if (oscillator) {
      oscillator.type = type;
    }
  }, []);

  const getWaveformData = useCallback(() => {
    if (leftAnalyserRef.current && leftDataRef.current) {
      leftAnalyserRef.current.getByteTimeDomainData(leftDataRef.current);
    }
    if (rightAnalyserRef.current && rightDataRef.current) {
      rightAnalyserRef.current.getByteTimeDomainData(rightDataRef.current);
    }
    return { left: leftDataRef.current, right: rightDataRef.current };
  }, []);

  const exportWAV = useCallback((config: AudioEngineConfig, duration: number = 10) => {
    if (!audioContextRef.current) return;

    const sampleRate = audioContextRef.current.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContextRef.current.createBuffer(2, length, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      
      // Generate left channel
      let leftValue = 0;
      switch (config.leftChannel.waveform) {
        case 'sine':
          leftValue = Math.sin(2 * Math.PI * config.leftChannel.frequency * time);
          break;
        case 'square':
          leftValue = Math.sign(Math.sin(2 * Math.PI * config.leftChannel.frequency * time));
          break;
        case 'triangle':
          leftValue = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * config.leftChannel.frequency * time));
          break;
        case 'sawtooth':
          leftValue = 2 * (config.leftChannel.frequency * time - Math.floor(config.leftChannel.frequency * time + 0.5));
          break;
      }
      
      // Generate right channel
      let rightValue = 0;
      switch (config.rightChannel.waveform) {
        case 'sine':
          rightValue = Math.sin(2 * Math.PI * config.rightChannel.frequency * time);
          break;
        case 'square':
          rightValue = Math.sign(Math.sin(2 * Math.PI * config.rightChannel.frequency * time));
          break;
        case 'triangle':
          rightValue = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * config.rightChannel.frequency * time));
          break;
        case 'sawtooth':
          rightValue = 2 * (config.rightChannel.frequency * time - Math.floor(config.rightChannel.frequency * time + 0.5));
          break;
      }
      
      leftChannel[i] = leftValue * config.leftChannel.amplitude * config.masterVolume;
      rightChannel[i] = rightValue * config.rightChannel.amplitude * config.masterVolume;
    }

    // Convert to WAV and download
    const wav = bufferToWave(buffer, length);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wave-${config.leftChannel.frequency}Hz-${config.rightChannel.frequency}Hz.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return {
    startAudio,
    stopAudio,
    updateFrequency,
    updateAmplitude,
    updateWaveform,
    updateMasterVolume,
    exportWAV,
    getWaveformData,
    isPlaying: isPlayingRef.current
  };
};

// Helper function to convert AudioBuffer to WAV
function bufferToWave(abuffer: AudioBuffer, len: number) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next sample
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  return buffer;
}
