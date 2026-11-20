import React from 'react';
import { Waves } from 'lucide-react';

interface WordmarkProps {
  /** Type scale for the h1 — differs per surface (hero vs. app header). */
  className?: string;
  wrapperClassName?: string;
}

/** The brand mark — one implementation for every surface (DESIGN.md's
 *  single green-to-blue wordmark flourish). */
const Wordmark: React.FC<WordmarkProps> = ({ className = 'text-5xl', wrapperClassName = '' }) => (
  <div className={`flex items-center justify-center gap-3 ${wrapperClassName}`}>
    <Waves className="w-10 h-10 text-green-400" aria-hidden="true" />
    <h1
      className={`font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent ${className}`}
    >
      Anahata
    </h1>
  </div>
);

export default Wordmark;
