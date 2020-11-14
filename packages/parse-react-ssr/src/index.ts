import {
  UseParseQueryOptions,
  UseParseQueryResult,
  useParseQuery as useParseQueryBase
} from '@parse/react-base';

const isServer = typeof window === 'undefined';

if (isServer) {
  global.Parse = require('parse/node');
} else {
  global.Parse = require('parse');
}

export const initializeParse = (serverURL: string, applicationId: string, javascriptKey: string) => {
  if (!isServer) {
    Parse.enableLocalDatastore();
  }
  Parse.serverURL = serverURL;
  Parse.initialize(applicationId, javascriptKey);
};

export const useParseQuery = <T extends Parse.Object<Parse.Attributes>>(
  query: Parse.Query<T>,
  options?: UseParseQueryOptions
): UseParseQueryResult<T> => useParseQueryBase(
  query,
  {
    ...(options || {}),
    ...(isServer ? {
      enableLocalDatastore: false,
      enableLiveQuery: false
    } : {})
  }
);
