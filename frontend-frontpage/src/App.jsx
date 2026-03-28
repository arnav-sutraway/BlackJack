import React, { useState } from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import RulesModal from './components/RulesModal';
import DeviceModal from './components/DeviceModal';
import AboutModal from './components/AboutModal';

function App() {
  const [showRules, setShowRules] = useState(false);
  const [showDevice, setShowDevice] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <Layout>
      <Header />
      <MainMenu 
        onOpenRules={() => setShowRules(true)} 
        onOpenDevice={() => setShowDevice(true)}
        onOpenAbout={() => setShowAbout(true)}
      />
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showDevice && <DeviceModal onClose={() => setShowDevice(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </Layout>
  );
}

export default App;
