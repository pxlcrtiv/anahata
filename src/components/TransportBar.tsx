import React from 'react';
import { Circle, Square } from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  loop: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (ms: number) => void;
  onToggleLoop: () => void;
  onDurationChange: (ms: number) => void;
  isRecording?: boolean;
  canRecord?: boolean;
  onToggleRecord?: () => void;
}

const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  positionMs,
  durationMs,
  loop,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onToggleLoop,
  onDurationChange,
  isRecording = false,
  canRecord = false,
  onToggleRecord,
}) => {
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        onClick={onStop}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      >
        Stop
      </button>
      <button
        onClick={onToggleLoop}
        className={`px-3 py-2 text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${loop ? 'bg-blue-500' : 'bg-gray-600'}`}
      >
        Loop
      </button>
      <button
        onClick={onToggleRecord}
        disabled={!canRecord}
        className={`px-3 py-2 rounded font-bold inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : canRecord
            ? 'bg-gray-600 hover:bg-gray-500 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isRecording ? (
          <>
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
            Stop Rec
          </>
        ) : (
          <>
            <Circle className="w-3.5 h-3.5" aria-hidden="true" />
            Rec
          </>
        )}
      </button>
      <input
        type="range"
        aria-label="Position"
        min={0}
        max={durationMs}
        value={positionMs}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="flex-1"
      />
      <span className="text-sm text-gray-300 w-20 text-right">
        {formatTime(positionMs)} / {formatTime(durationMs)}
      </span>
      <input
        type="number"
        value={durationMs}
        onChange={(e) => onDurationChange(Number(e.target.value))}
        aria-label="Session duration (ms)"
        className="w-20 bg-gray-700 rounded px-2 py-1 text-sm"
        min={1000}
        step={1000}
      />
      <span className="text-xs text-gray-400">ms</span>
    </div>
  );
};

export default TransportBar;
