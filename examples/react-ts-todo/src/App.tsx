import React from 'react';
import logo from './logo.svg';
import './App.css';
import parseReact from '@parse/react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {parseReact}
        </p>
      </header>
    </div>
  );
}

export default App;
