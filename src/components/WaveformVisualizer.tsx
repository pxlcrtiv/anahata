import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface WaveformVisualizerProps {
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
  isPlaying: boolean;
  masterVolume: number;
  getWaveformData: () => { left: Uint8Array | null; right: Uint8Array | null };
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  leftChannel,
  rightChannel,
  isPlaying,
  masterVolume,
  getWaveformData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const drawFromData = (
    ctx: CanvasRenderingContext2D,
    width: number,
    centerY: number,
    data: Uint8Array | null,
    color: string,
    flip: boolean
  ) => {
    const baseline = flip ? centerY + centerY * 0.5 : centerY - centerY * 0.5;
    const halfHeight = centerY * 0.45;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1;

    if (!data) {
      // No live signal yet (e.g. paused) — draw a flat line.
      ctx.moveTo(0, baseline);
      ctx.lineTo(width, baseline);
      ctx.stroke();
      return;
    }

    const len = data.length;
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * width;
      // Byte data is centered at 128; map 0..255 -> -1..1.
      const v = (data[i] - 128) / 128;
      const y = flip ? baseline + v * halfHeight : baseline - v * halfHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const centerY = height / 2;

    const { left, right } = getWaveformData();
    drawFromData(ctx, width, centerY, left, isPlaying ? '#06b6d4' : '#64748b', false);
    drawFromData(ctx, width, centerY, right, isPlaying ? '#f59e0b' : '#64748b', true);

    // Center divider
    ctx.beginPath();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Labels
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`L: ${leftChannel.frequency}Hz ${leftChannel.waveform}`, 16, 28);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`R: ${rightChannel.frequency}Hz ${rightChannel.waveform}`, 16, height - 16);
  };

  const animate = () => {
    if (isPlayingRef.current) {
      render();
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // Draw last captured frame (flat line if no data) so it isn't blank.
      render();
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Redraw once on config change while paused.
  useEffect(() => {
    if (!isPlaying) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftChannel, rightChannel, masterVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 256 * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = '256px';
      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-600">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Live Waveform</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <span className="text-gray-300">Left Channel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span className="text-gray-300">Right Channel</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-64 bg-slate-900/50 rounded-lg border border-slate-700"
            style={{ width: '100%', height: '256px' }}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 rounded-lg">
              <div className="text-gray-400 text-lg">Press play to see live waveforms</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WaveformVisualizer;
