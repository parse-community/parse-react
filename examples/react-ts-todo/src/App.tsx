import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useParseQuery } from '@parse/react';

function App() {
  const objects = useParseQuery();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <ul>
          {objects.map(object => (
            <li>{object}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
