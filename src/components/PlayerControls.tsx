
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Download, Volume2 } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  masterVolume: number;
  onPlay: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onExport: () => void;
  leftFreq: number;
  rightFreq: number;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  masterVolume,
  onPlay,
  onStop,
  onVolumeChange,
  onExport,
  leftFreq,
  rightFreq
}) => {
  return (
    <Card className="bg-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
      <div className="p-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <div className="text-white font-bold text-sm">
              {Math.abs(leftFreq - rightFreq) > 0 ? 'BB' : 'TONE'}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">
              {Math.abs(leftFreq - rightFreq) > 0 
                ? `Binaural Beat ${Math.abs(leftFreq - rightFreq).toFixed(1)}Hz`
                : `Pure Tone ${leftFreq}Hz`
              }
            </h3>
            <p className="text-gray-400 text-sm">
              L: {leftFreq}Hz • R: {rightFreq}Hz
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={onStop}
            disabled={!isPlaying}
            variant="ghost"
            size="sm"
            aria-label="Stop tone"
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <Square className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={onPlay}
            aria-label={isPlaying ? 'Pause tone' : 'Play tone'}
            className={`w-14 h-14 rounded-full ${
              isPlaying
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-green-500 hover:bg-green-400'
            } transition-all duration-200 shadow-lg`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </Button>

          <Button
            onClick={onExport}
            variant="ghost"
            size="sm"
            aria-label="Download session WAV"
            className="text-gray-400 hover:text-white"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar Simulation */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{isPlaying ? '0:00' : '--:--'}</span>
            <span>∞</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-1000 ${
                isPlaying ? 'bg-green-500 w-full' : 'bg-gray-600 w-0'
              }`}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={[masterVolume]}
            onValueChange={(value) => onVolumeChange(value[0])}
            max={1}
            min={0}
            step={0.01}
            aria-label="Master volume"
            className="flex-1"
          />
          <span className="text-gray-400 text-sm min-w-[3rem]">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PlayerControls;
