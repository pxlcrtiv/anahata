import React from 'react';

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
        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        onClick={onStop}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
      >
        Stop
      </button>
      <button
        onClick={onToggleLoop}
        className={`px-3 py-2 rounded ${loop ? 'bg-blue-500' : 'bg-gray-600'}`}
      >
        Loop
      </button>
      <input
        type="range"
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
        className="w-20 bg-gray-700 rounded px-2 py-1 text-sm"
        min={1000}
        step={1000}
      />
      <span className="text-xs text-gray-400">ms</span>
    </div>
  );
};

export default TransportBar;
