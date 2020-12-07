import { useState, useMemo } from 'react';
import Head from 'next/head'
import { initializeParse, useParseQuery } from '@parse/react-ssr';

initializeParse(
  'http://localhost:1337/parse',
  'APPLICATION_ID',
  'JAVASCRIPT_KEY'
);

export default function Home() {
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
    <>
      <Head>
        <title>Todo Example using @parse/ssr on Next.js (Typescript)</title>
        <link rel="icon" href="/favicon-32x32.png" />
      </Head>
    </>
  );
};
