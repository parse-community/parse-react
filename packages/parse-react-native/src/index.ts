import Parse from 'parse/react-native.js';
import AsyncStorage from '@react-native-community/async-storage';

global.Parse = Parse;

export * from '@parse/react-base';

export const initializeParse = (serverURL: string, applicationId: string, javascriptKey: string) => {
  Parse.setAsyncStorage(AsyncStorage);
  Parse.enableLocalDatastore();
  Parse.serverURL = serverURL;
  Parse.initialize(applicationId, javascriptKey);
};
