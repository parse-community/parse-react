import React from 'react';
import Parse from 'parse';
import { useParseQuery } from '@parse/react';
import logo from './logo.svg';
import './App.css';

Parse.serverURL = 'http://localhost:1337/parse';
Parse.initialize('APPLICATION_ID', 'JAVASCRIPT_KEY');

function App() {
  const todos = useParseQuery(new Parse.Query('Todo'));

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {todos ? (
          <ul>
            {todos.map(todo => (
              <li>{todo.get('title')}</li>
            ))}
          </ul>
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
