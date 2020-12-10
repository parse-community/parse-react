import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { initializeParse, useParseQuery } from '@parse/react-native';

initializeParse(
  'http://10.0.0.131:1337/parse',
  'APPLICATION_ID',
  'JAVASCRIPT_KEY'
);

export default function App() {
  const [
    hideDone,
    setHideDone
  ] = useState(false);

  const parseQuery = useMemo(
    () => {
      const parseQuery = new Parse.Query('Todo');

      if (hideDone) {
        parseQuery.notEqualTo('done', true);
      }

      (parseQuery as any).withCount();

      return parseQuery;
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
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View>
        <Button
          onPress={() => setHideDone(!hideDone)}
          title={`${hideDone ? 'Unhide' : 'Hide'} done todos`}
        />
      </View>
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
                {result.get('title')}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
