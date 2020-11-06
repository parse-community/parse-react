import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initializeParse, useParseQuery } from '@parse/react-native';

initializeParse(
  'http://127.0.0.1:1337/parse',
  'APPLICATION_ID',
  'JAVASCRIPT_KEY'
);

(Parse as any).LiveQuery.on('error', (error: Error) => {
  console.log(error && error.message || error);
});

export default function App() {
  const [
    hideDone,
    setHideDone
  ] = useState(false);

  const query = new Parse.Query('Todo');

  if (hideDone) {
    query.notEqualTo('done', true);
  }

  const {
    isLive,
    isLoading,
    isSyncing,
    objects,
    error,
    reload
  } = useParseQuery(query);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
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
      {objects && (
        <View>
          {objects.map(object => (
            <View>
              <Text key={object.id}>
                {object.get('title')}
              </Text>
            </View>
          ))}
        </View>
      )}
      {error && (
        <View>
          <Text>{error.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
