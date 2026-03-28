import React from 'react';
import { X } from 'lucide-react';

const RulesModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      
      {/* Expanded Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-casino-panel rounded-[2.5rem] p-8 sm:p-14 flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close Rules"
          >
            <X className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
          </button>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase flex-1 text-center pr-6">
            RULES
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto text-gray-300 space-y-8 pr-4 text-base sm:text-xl leading-relaxed text-left font-medium">
          <div>
            <strong className="text-white tracking-widest uppercase text-sm sm:text-base block mb-2">Goal</strong>
            Beat the dealer's hand without going over 21. Face cards are worth 10. Aces are 1 or 11.
          </div>
          <div>
            <strong className="text-white tracking-widest uppercase text-sm sm:text-base block mb-2">Gameplay</strong>
            You start with two cards. "Hit" to ask for another card or "Stand" to hold your total.
          </div>
          <div>
            <strong className="text-white tracking-widest uppercase text-sm sm:text-base block mb-2">Bust & Blackjack</strong>
            If you go over 21, you bust and lose. A starting hand of an Ace and a 10 is a Blackjack (21).
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
