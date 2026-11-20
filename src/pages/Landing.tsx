
import React from 'react';
import { Link } from 'react-router-dom';
import { Waves, Activity, SlidersHorizontal, ShieldCheck, ArrowRight } from 'lucide-react';
import { focusRing } from '@/lib/focus';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <main className="max-w-3xl mx-auto px-6 py-24 space-y-24">
        {/* Hero — the one authored motion moment */}
        <section className="text-center space-y-6 animate-[hero-rise_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex items-center justify-center gap-3">
            <Waves className="w-10 h-10 text-green-400" aria-hidden="true" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Anahata
            </h1>
          </div>
          <p className="text-xl text-gray-300">The unstruck sound.</p>
          <p className="text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            A free, browser-based binaural tone studio. Two independent channels, real signal
            visualization, and a timeline sequencer — no sign-up, nothing to install.
          </p>
          <Link
            to="/app"
            className={`inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full px-8 py-4 text-lg ${focusRing} focus-visible:ring-green-400 transition-colors`}
          >
            Open the studio
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </section>

        {/* What it is — three factual claims, no hype */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Activity className="w-6 h-6 text-cyan-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">The signal you see is the signal you hear</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              The visualizer draws the live output of both channels, tapped straight from the
              audio engine. Pause and it freezes the truth; silence draws a flat line.
            </p>
          </div>
          <div className="space-y-3">
            <SlidersHorizontal className="w-6 h-6 text-amber-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Preset-simple, instrument-deep</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              One click gets you a true binaural beat — audible carriers, real offset. Go
              further with per-channel control, a sequencer with ramped events, and WAV export
              of the whole session.
            </p>
          </div>
          <div className="space-y-3">
            <ShieldCheck className="w-6 h-6 text-green-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Runs in your browser, stays there</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nothing to sign up for and nothing leaves your device — sessions live in your
              browser's storage. Add it to your home screen and it behaves like an app.
            </p>
          </div>
        </section>

        {/* Honesty strip — the product's binding voice */}
        <section className="border border-gray-700 rounded-lg bg-gray-800 p-6 text-center">
          <p className="text-sm text-gray-300 leading-relaxed">
            No medical claims. The frequency names are cultural shorthand — the beats are
            mathematics, and the tool shows you exactly what it does.
          </p>
        </section>

        <footer className="text-center text-xs text-gray-500 space-y-1">
          <p>
            <Link to="/app" className={`hover:text-gray-300 underline underline-offset-4 ${focusRing} focus-visible:ring-white rounded`}>
              Open the studio
            </Link>
            {' '}— free, MIT-licensed, built with the Web Audio API.
          </p>
        </footer>
      </main>

      <style>{`
        @keyframes hero-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
