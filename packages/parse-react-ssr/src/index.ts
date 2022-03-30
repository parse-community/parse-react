import { useCallback, useMemo } from 'react';
import {
  UseParseQueryOptions,
  UseParseQueryResult,
  useParseQuery as useParseQueryBase
} from '@parse/react-base';

const isServer = typeof window === 'undefined';

if ((process as any).browser) {
  global.Parse = require('parse');
} else {
  global.Parse = require('parse/node');
}

export const initializeParse = (serverURL: string, applicationId: string, javascriptKey: string) => {
  Parse.serverURL = serverURL;
  Parse.initialize(applicationId, javascriptKey);
  if (!isServer) {
    Parse.enableLocalDatastore();
  }
};

export interface EncodedParseQuery {
  className: string,
  query: object,
  findResult?: object,
  findError?: object
}

export const encodeParseQuery = async <T extends Parse.Object<Parse.Attributes>>(
  query: Parse.Query<T>
): Promise<EncodedParseQuery> => {
  let findResult, findError;

  try {
    findResult = await query.find();
  } catch (e) {
    findError = e;
  }

  const encodedParseQuery = {
    className: query.className,
    query: query.toJSON(),
    findResult: findResult && (Parse as any)._encode(findResult) || undefined,
    findError: findError && (Parse as any)._encode(findError) || undefined
  };

  if (!encodedParseQuery.findResult) {
    delete encodedParseQuery.findResult;
  }
  if (!encodedParseQuery.findError) {
    delete encodedParseQuery.findError;
  }

  return encodedParseQuery;
};

export const useParseQuery = <T extends Parse.Object<Parse.Attributes>>(
  query: Parse.Query<T> | EncodedParseQuery,
  options?: UseParseQueryOptions<T>
): UseParseQueryResult<T> => {
  if (
    query instanceof Parse.Query &&
    isServer
  ) {
    return {
      isLoading: true,
      isLive: false,
      isSyncing: false,
      reload: () => {}
    };
  }

  const {
    findResult,
    findError,
    decodedQuery
  } = useMemo(
    () => {
      if (query instanceof Parse.Query) {
        return {
          decodedQuery: query
        };
      } else {
        return {
          findResult: query.findResult && (Parse as any)._decode(query.findResult) || undefined,
          findError: query.findError && (Parse as any)._decode(query.findError) || undefined,
          decodedQuery: Parse.Query.fromJSON(
            query.className,
            query.query
          ) as Parse.Query<T>
        };
      }
    },
    [query]
  );

  const {
    findResultResults,
    findResultCount
  } = useMemo(
    () => ({
      findResultResults: findResult && (findResult.results || findResult) || undefined,
      findResultCount: findResult && findResult.count || undefined
    }),
    [findResult]
  );

  const serverReload = useCallback(
    () => {
      throw new Error(
        'The reload function can not be used in the server side.'
      );
    },
    []
  )

  const serverResult = useMemo(
    () => ({
      isLoading: false,
      isLive: false,
      isSyncing: false,
      results: findResultResults,
      count: findResultCount,
      error: findError,
      reload: serverReload
    }),
    [findResultResults, findResultCount, findError, serverReload]
  );

  if (isServer) {
    return serverResult;
  }

  return useParseQueryBase(
    decodedQuery,
    {
      enabled: options && options.enabled || undefined,
      enableLocalDatastore: (options && options.enableLocalDatastore) ?? undefined,
      enableLiveQuery: (options && options.enableLiveQuery) ?? undefined,
      initialLoad: options && options.initialLoad ||
        findResult && {
          results: findResultResults,
          count: findResultCount
        } ||
        undefined
    }
  );
};
