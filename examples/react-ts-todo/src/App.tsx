import React from 'react';
import Parse from 'parse';
import { useParseQuery } from '@parse/react';
import logo from './logo.svg';
import './App.css';

Parse.serverURL = 'http://localhost:1337/parse';
Parse.initialize('APPLICATION_ID', 'JAVASCRIPT_KEY');

function App() {
  const {
    isLoading,
    objects: todos,
    error
  } = useParseQuery(new Parse.Query('Todo'));

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {todos && (
              <ul>
                {todos.map(todo => (
                  <li>{todo.get('title')}</li>
                ))}
              </ul>
            )}
            {error && (
              <p>{error.message}</p>
            )}
          </>
        )}
      </header>
    </div>
  );
}

export default App;
