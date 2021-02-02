<p align="center">
  <a href="https://parseplatform.org">
    <img alt="Parse Platform" src="https://user-images.githubusercontent.com/8621344/99892392-6f32dc80-2c42-11eb-8c32-db0fa4a66a81.png" width="200" />
  </a>
</p>

<h2 align="center">@parse/react-native <i>(alpha)</i></h2>

<p align="center">
  An <b>experimental</b> package that provides you easy, real-time, offline-first interaction with the powerful <a href="https://github.com/parse-community/parse-server">Parse Server</a> backend from your React Native applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@parse/react-native">
    <img alt="NPM Version" src="https://badge.fury.io/js/%40parse%2Freact-native.svg" />
  </a>
</p>

# Getting Started

First, install the [parse](https://www.npmjs.com/package/parse) and [@parse/react-native](https://www.npmjs.com/package/@parse/react-native) npm modules into your react-native application.

```sh
npm install parse @parse/react-native --save
```

In your `App.js` file, import and initialize Parse:

```js
import { initializeParse } from '@parse/react-native';

initializeParse(
  'YOUR_SERVER_URL',
  'YOUR_APPLICATION_ID',
  'YOUR_JAVASCRIPT_KEY'
);
```

Now you are ready to use a Parse Query:

```js
import { useParseQuery } from '@parse/react-native';

const SomeComponent = () => {
  const parseQuery = new Parse.Query('SomeClass');

  const {
    isLive, // Indicates that Parse Live Query is connected
    isLoading, // Indicates that the initial load is being processed
    isSyncing, // Indicates that the library is getting the latest data from Parse Server
    results, // Stores the current results
    count, // Stores the current results count
    error, // Stores any error
    reload // Function that can be used to reload the data
  } = useParseQuery(parseQuery);

  return (
    <View>
      {isLoading && (
        <View>
          <Text>Loading...</Text>
        </View>
      )}
      {isLive && (
        <View>
          <Text>Live!</Text>
        </View>
      )}
      {isSyncing && (
        <View>
          <Text>Syncing...</Text>
        </View>
      )}
      {results && (
        <View>
          {results.map(result => (
            <View>
              <Text key={result.id}>
                {result.get('someField')}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View>
        <Text>{count}</Text>
      </View>
      {error && (
        <View>
          <Text>{error.message}</Text>
        </View>
      )}
      <View>
        <Button
          onPress={reload}
          title="Reload"
        />
      </View>
    </View>
  );
};
```

# Example

See a [Todo List Example](https://github.com/parse-community/parse-react/tree/master/examples/react-native-ts-todo).