import React from 'react';
import { X, Loader2 } from 'lucide-react';

const DeviceModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      
      {/* Expanded Modal Container */}
      <div className="relative w-full max-w-2xl min-h-[50vh] max-h-[85vh] bg-casino-panel rounded-[2.5rem] p-8 sm:p-14 flex flex-col shadow-2xl">
        
        {/* Header Absolute X Button */}
        <div className="absolute top-8 left-8 sm:top-14 sm:left-14">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Cancel Connection"
          >
            <X className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
          </button>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center mt-12 sm:mt-8">
          <Loader2 className="w-20 h-20 sm:w-28 sm:h-28 text-white animate-spin mb-8 sm:mb-12" strokeWidth={1.5} />
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase text-center mb-4">
            Locating Table
          </h2>
          <p className="text-gray-400 font-bold tracking-widest uppercase text-xs sm:text-base text-center">
            Establishing secure connection to physical blackjack device...
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;
