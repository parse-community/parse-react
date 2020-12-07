import React, { useState, useMemo } from 'react';
import { initializeParse, useParseQuery } from '@parse/react';
import logo from './logo.svg';
import './App.css';

initializeParse(
  'http://localhost:1337/parse',
  'APPLICATION_ID',
  'JAVASCRIPT_KEY'
);

function App() {
  const [
    hideDone,
    setHideDone
  ] = useState(false);

  const query = useMemo(
    () => {
      const query = new Parse.Query('Todo');

      if (hideDone) {
        query.notEqualTo('done', true);
      }

      return query;
    },
    [hideDone]
  );

  const {
    isLive,
    isLoading,
    isSyncing,
    objects,
    error,
    reload
  } = useParseQuery(query);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button
          onClick={() => setHideDone(!hideDone)}
        >
          {hideDone ? 'Unhide' : 'Hide'} done todos
        </button>
        {isLoading && (
          <p>Loading...</p>
        )}
        {isLive && (
          <p>Live!</p>
        )}
        {isSyncing && (
          <p>Syncing...</p>
        )}
        {objects && (
          <ul>
            {objects.map(object => (
              <li key={object.id}>
                {object.get('title')}
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p>{error.message}</p>
        )}
        <button
          onClick={reload}
        >
          Reload
        </button>
      </header>
    </div>
  );
}

export default App;
