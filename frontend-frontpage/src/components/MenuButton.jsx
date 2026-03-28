import React from 'react';
import { Spade, Heart, Club, Diamond } from 'lucide-react';

const icons = {
  spade: Spade,
  heart: Heart,
  club: Club,
  diamond: Diamond
};

const MenuButton = ({ label, variant, iconName, onClick, subtext }) => {
  const isRed = variant === 'red';
  
  // Style configurations based on variant
  const baseClasses = "w-full flex items-center px-4 py-[0.85rem] rounded-full group cursor-pointer transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-4";
  const colorClasses = isRed 
    ? "bg-casino-red text-white hover:bg-red-600 focus:ring-red-500/50 border-[3px] border-white"
    : "bg-transparent text-white border-[3px] border-white hover:bg-casino-red focus:ring-red-500/30";

  const IconComponent = icons[iconName];

  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses}`}>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
      
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        {IconComponent && (
          <IconComponent 
            className={`w-6 h-6 text-white`} 
            fill={isRed ? "currentColor" : "currentColor"} 
            strokeWidth={isRed ? 0 : 0}
          />
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center pr-6">
         <span className="font-extrabold text-base tracking-widest uppercase">{label}</span>
         {subtext && <span className="text-[0.65rem] font-bold tracking-widest uppercase mt-0.5">{subtext}</span>}
      </div>
    </button>
  );
};

export default MenuButton;
