import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head'
import { initializeParse, encodeParseQuery, useParseQuery } from '@parse/react-ssr';

initializeParse(
  'http://localhost:1337/parse',
  'APPLICATION_ID',
  'JAVASCRIPT_KEY'
);

const createParseQuery = hideDone => {
  const parseQuery = new Parse.Query('Todo');

  if (hideDone) {
    parseQuery.notEqualTo('done', true);
  }

  (parseQuery as any).withCount();

  return parseQuery;
};

export default function Home() {
  const [
    {
      hideDone,
      parseQuery
    },
    setParseQueryState
  ] = useState({
    hideDone: false,
    parseQuery: createParseQuery(false)
  });

  const toggleHideDone = useCallback(
    () => {
      setParseQueryState({
        hideDone: !hideDone,
        parseQuery: createParseQuery(!hideDone)
      });
    },
    [hideDone]
  );

  const {
    isLive,
    isLoading,
    isSyncing,
    results,
    count,
    error,
    reload
  } = useParseQuery(parseQuery);

  return (
    <>
      <Head>
        <title>Todo Example using @parse/ssr on Next.js (Typescript)</title>
        <link rel="icon" href="/favicon-32x32.png" />
      </Head>
      <button onClick={toggleHideDone}>
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
      {results && (
        <ul>
          {results.map(result => (
            <li key={result.id}>
              {result.get('title')}
            </li>
          ))}
        </ul>
      )}
      <p>{count}</p>
      {error && (
        <p>{error.message}</p>
      )}
      <button
        onClick={reload}
      >
        Reload
      </button>
    </>
  );
};
