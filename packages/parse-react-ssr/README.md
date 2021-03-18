<p align="center">
  <a href="https://parseplatform.org">
    <img alt="Parse Platform" src="https://user-images.githubusercontent.com/8621344/99892392-6f32dc80-2c42-11eb-8c32-db0fa4a66a81.png" width="200" />
  </a>
</p>

<h2 align="center">@parse/react-ssr <i>(alpha)</i></h2>

<p align="center">
  An <b>experimental</b> package that provides you easy, real-time, offline-first interaction with the powerful <a href="https://github.com/parse-community/parse-server">Parse Server</a> backend from your React with SSR applications (e.g. Next.js).
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@parse/react-ssr">
    <img alt="NPM Version" src="https://badge.fury.io/js/%40parse%2Freact-ssr.svg" />
  </a>
</p>

# Getting Started (Next.js)

First, install the [parse](https://www.npmjs.com/package/parse) and [@parse/react-ssr](https://www.npmjs.com/package/@parse/react-ssr) npm modules into your Next.js application.

```sh
npm install parse @parse/react-ssr --save
```

Now you are ready to use a Parse Query:

```js
import Parse from 'parse';
import { initializeParse, encodeParseQuery, useParseQuery } from '@parse/react-ssr';

initializeParse( // We need to initialize Parse
  'YOUR_SERVER_URL',
  'YOUR_APPLICATION_ID',
  'YOUR_JAVASCRIPT_KEY'
);

export async function getServerSideProps() {
  const parseQuery = new Parse.Query('SomeClass');

  return {
    props: {
      parseQuery: await encodeParseQuery(parseQuery) // Return encoded Parse Query for server side rendering
    }
  };
};

export default function SomePage({ parseQuery }) {
  const {
    isLive, // Indicates that Parse Live Query is connected
    isLoading, // Indicates that the initial load is being processed
    isSyncing, // Indicates that the library is getting the latest data from Parse Server
    results, // Stores the current results in an array of Parse Objects
    count, // Stores the current results count
    error, // Stores any error
    reload // Function that can be used to reload the data
  } = useParseQuery(
    parseQuery, // The Parse Query to be used
    {
      enableLocalDatastore: true, // Enables cache in local datastore (default: true)
      enableLiveQuery: true // Enables live query for real-time update (default: true)
    }
  );

  return (
    <div>
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
              {result.get('someField')}
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
    </div>
  );
};
```

# Learning More

This package aims to provide easier access to a Parse Server backend when developing React with SSR applications (e.g. Next.js). It was built on top of the official [Parse JS SDK](https://docs.parseplatform.org/js/guide/). These two libraries should be used together and you can refer to the sdk documentation in order to learn more about Parse Objects, Parse Queries, and more:
- Learn more about [Parse Objects](https://docs.parseplatform.org/js/guide/#objects);
- Learn more about [Parse Queries](https://docs.parseplatform.org/js/guide/#queries).

# Example

See a [Todo List Example](https://github.com/parse-community/parse-react/tree/master/examples/next-ts-todo).
