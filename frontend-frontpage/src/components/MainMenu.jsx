import React from 'react';
import MenuButton from './MenuButton';

const MainMenu = ({ onOpenRules, onOpenDevice, onOpenAbout }) => {
  return (
    <div className="flex flex-col w-full gap-[0.85rem]">
      <MenuButton 
        label="Play" 
        subtext="Play Now"
        variant="black" 
        iconName="spade" 
        onClick={() => console.log('Play clicked')}
      />
      <MenuButton 
        label="Rules" 
        subtext="How to play"
        variant="black" 
        iconName="heart" 
        onClick={onOpenRules}
      />
      <MenuButton 
        label="Device"
        subtext="Connect Device"
        variant="black" 
        iconName="club" 
        onClick={onOpenDevice}
      />
      <MenuButton 
        label="About" 
        subtext="About the game"
        variant="black" 
        iconName="diamond" 
        onClick={onOpenAbout}
      />
    </div>
  );
};

export default MainMenu;
