import React from 'react';
import PoseNetCamera from './components/PoseNetCamera';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Body Parts Detection</h1>
      <PoseNetCamera />
    </div>
  );
};

export default App;
