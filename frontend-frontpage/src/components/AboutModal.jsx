import React from 'react';
import { X } from 'lucide-react';

const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      
      {/* Expanded Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-casino-panel rounded-[2.5rem] p-8 sm:p-14 flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close About"
          >
            <X className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
          </button>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase flex-1 text-center pr-6">
            ABOUT
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto text-gray-300 space-y-6 pr-4 text-base sm:text-xl leading-relaxed text-left font-medium">
          <p>
            <strong className="text-white">BlackJack AI Coach</strong> is a lightweight, real-time popup assistant that helps users learn how to play Blackjack while they play.
          </p>
          <p>
            Using a phone camera or smart glasses, it detects the current hand and instantly suggests the optimal move—hit, stand, double, or split—based on proven Blackjack strategy and live probability calculations.
          </p>
          <p>
            The goal is simple: turn any Blackjack table into a guided learning experience, helping beginners understand decisions, improve their odds, and learn the game through real-time feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
