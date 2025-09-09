# Sonic Dreamscape Orchestrator

**Live Demo**: [https://sonic-dreamscape-orchestrator.netlify.app/](https://sonic-dreamscape-orchestrator.netlify.app/)

A professional-grade web application for generating healing frequencies, binaural beats, and conducting audio experiments. Built with modern web technologies for precise audio control and real-time waveform visualization.

## 🎵 Features

### Advanced Wave Generation
- **Pure Tone Generation**: Generate precise frequencies including the healing 528Hz frequency
- **Binaural Beats**: Create custom binaural beats for meditation, focus, and relaxation
- **Real-time Visualization**: Live waveform display with dual-channel support
- **Frequency Presets**: Quick access to commonly used healing frequencies

### Professional Audio Controls
- **Dual Channel Mixer**: Independent control for left and right audio channels
- **Waveform Selection**: Multiple waveform types (sine, square, triangle)
- **Amplitude Control**: Precise volume adjustment per channel
- **Frequency Synchronization**: Optional channel linking for stereo effects

### Real-time Monitoring
- **Live Waveform Display**: Visual feedback of generated audio in real-time
- **Channel Separation**: Clear visualization of left and right channel waveforms
- **Playback Controls**: Play, pause, and reset functionality
- **Progress Indicator**: Visual timeline with current position

## 🛠️ Technical Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui components
- **Audio Engine**: Web Audio API for precise frequency generation
- **Visualization**: Canvas-based real-time waveform rendering
- **Deployment**: Netlify for continuous deployment

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sonic-dreamscape-orchestrator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## 🎯 Usage

1. **Frequency Selection**: Use the frequency presets or enter custom frequencies
2. **Channel Configuration**: Adjust left and right channels independently
3. **Waveform Selection**: Choose between different waveform types
4. **Amplitude Control**: Fine-tune volume levels for each channel
5. **Real-time Monitoring**: Watch live waveforms as audio plays
6. **Binaural Beats**: Set different frequencies in each channel for binaural effects

## 📊 Audio Specifications

- **Frequency Range**: 1Hz - 20kHz
- **Sample Rate**: 44.1kHz (CD quality)
- **Bit Depth**: 32-bit floating point
- **Channels**: Stereo (configurable dual mono or stereo)
- **Waveform Types**: Sine, Square, Triangle

## 🎛️ Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ChannelControl.tsx
│   ├── ChannelMixer.tsx
│   ├── FrequencyPresets.tsx
│   ├── PlayerControls.tsx
│   ├── WaveGenerator.tsx
│   └── WaveformVisualizer.tsx
├── hooks/              # Custom React hooks
│   ├── useAudioEngine.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── pages/              # Application pages
├── lib/               # Utility functions
└── components/ui/     # shadcn/ui components
```

### Audio Engine Architecture
The custom audio engine uses the Web Audio API to:
- Generate precise sine waves using oscillators
- Control frequency, amplitude, and waveform type
- Provide real-time visualization data
- Handle dual-channel audio processing

## 🌐 Deployment

The application is automatically deployed to Netlify from the main branch. Any push to the main branch triggers a new deployment.

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Netlify (requires Netlify CLI)
netlify deploy --prod --dir=dist
```

## 🔧 Customization

### Adding New Frequencies
Edit the frequency presets in `src/components/FrequencyPresets.tsx` to add new healing frequencies or binaural beat combinations.

### Modifying Waveforms
Extend the waveform types by modifying the audio engine in `src/hooks/useAudioEngine.ts`.

### Styling Customization
The project uses Tailwind CSS with a consistent design system. Modify `tailwind.config.ts` for global style changes.

## 📱 Browser Support

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Demo**: [https://sonic-dreamscape-orchestrator.netlify.app/](https://sonic-dreamscape-orchestrator.netlify.app/)
- **Documentation**: Available in the `/docs` directory
- **Issues**: Report bugs and request features via GitHub Issues

---

*Built with ❤️ for the meditation, wellness, and audio research communities*
