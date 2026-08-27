
import React from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'lucide-react';

interface ChannelConfig {
  frequency: number;
  waveform: string;
  amplitude: number;
}

interface ChannelMixerProps {
  leftChannel: ChannelConfig;
  rightChannel: ChannelConfig;
  linkedChannels: boolean;
  onLeftChannelChange: (config: Partial<ChannelConfig>) => void;
  onRightChannelChange: (config: Partial<ChannelConfig>) => void;
  onLinkToggle: () => void;
}

const ChannelMixer: React.FC<ChannelMixerProps> = ({
  leftChannel,
  rightChannel,
  linkedChannels,
  onLeftChannelChange,
  onRightChannelChange,
  onLinkToggle
}) => {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">Channel Mixer</h3>
          <Button
            onClick={onLinkToggle}
            variant="outline"
            size="sm"
            className={`${
              linkedChannels 
                ? 'bg-green-500/20 border-green-500 text-green-400' 
                : 'border-gray-600 text-gray-400'
            } hover:bg-gray-700`}
          >
            <Link className="w-4 h-4 mr-2" />
            {linkedChannels ? 'Linked' : 'Independent'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Channel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <h4 className="text-cyan-400 font-medium">Left Channel</h4>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 text-sm">Frequency</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={leftChannel.frequency}
                    onChange={(e) => onLeftChannelChange({ frequency: Number(e.target.value) })}
                    min={1}
                    max={20000}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <div className="flex items-center text-gray-400 text-sm px-2">Hz</div>
                </div>
                <Slider
                  value={[leftChannel.frequency]}
                  onValueChange={(value) => onLeftChannelChange({ frequency: value[0] })}
                  min={1}
                  max={2000}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Waveform</Label>
                <Select 
                  value={leftChannel.waveform} 
                  onValueChange={(value) => onLeftChannelChange({ waveform: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="sine">Sine</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="triangle">Triangle</SelectItem>
                    <SelectItem value="sawtooth">Sawtooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Amplitude</Label>
                <Slider
                  value={[leftChannel.amplitude]}
                  onValueChange={(value) => onLeftChannelChange({ amplitude: value[0] })}
                  min={0}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <div className="text-gray-400 text-sm mt-1">{Math.round(leftChannel.amplitude * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Right Channel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <h4 className="text-orange-400 font-medium">Right Channel</h4>
              {linkedChannels && (
                <Badge variant="secondary" className="text-xs">Synced</Badge>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 text-sm">Frequency</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={rightChannel.frequency}
                    onChange={(e) => onRightChannelChange({ frequency: Number(e.target.value) })}
                    min={1}
                    max={20000}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={linkedChannels}
                  />
                  <div className="flex items-center text-gray-400 text-sm px-2">Hz</div>
                </div>
                <Slider
                  value={[rightChannel.frequency]}
                  onValueChange={(value) => onRightChannelChange({ frequency: value[0] })}
                  min={1}
                  max={2000}
                  step={1}
                  className="mt-2"
                  disabled={linkedChannels}
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Waveform</Label>
                <Select 
                  value={rightChannel.waveform} 
                  onValueChange={(value) => onRightChannelChange({ waveform: value })}
                  disabled={linkedChannels}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="sine">Sine</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="triangle">Triangle</SelectItem>
                    <SelectItem value="sawtooth">Sawtooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Amplitude</Label>
                <Slider
                  value={[rightChannel.amplitude]}
                  onValueChange={(value) => onRightChannelChange({ amplitude: value[0] })}
                  min={0}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <div className="text-gray-400 text-sm mt-1">{Math.round(rightChannel.amplitude * 100)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Binaural Beat Info */}
        {Math.abs(leftChannel.frequency - rightChannel.frequency) > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
            <div className="text-center">
              <div className="text-white font-medium text-lg">
                Binaural Beat: {Math.abs(leftChannel.frequency - rightChannel.frequency).toFixed(1)} Hz
              </div>
              <div className="text-gray-300 text-sm mt-1">
                Perfect for meditation and brainwave entrainment
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChannelMixer;
