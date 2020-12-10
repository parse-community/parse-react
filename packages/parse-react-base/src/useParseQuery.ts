import { useRef, useReducer, useMemo, useCallback, useEffect } from 'react';
import { compareParseObjects } from './util';

interface ResultState<T extends Parse.Object<Parse.Attributes>> {
  isLoading: boolean;
  isLive: boolean;
  isSyncing: boolean;
  results?: T[];
  count?: number;
  error?: Error;
}

interface State<T extends Parse.Object<Parse.Attributes>> extends ResultState<T> {
  queryId: number;
}

export interface InitialLoad<T extends Parse.Object<Parse.Attributes>> {
  results: T[],
  count?: number
}

const getInitialState = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  initialLoad?: InitialLoad<T>
) => ({
  queryId,
  isLoading: initialLoad === undefined,
  isLive: false,
  isSyncing: false,
  results: initialLoad && initialLoad.results || undefined,
  count: initialLoad && initialLoad.count || undefined
});

enum ActionTypes {
  LoadLocalDatastoreResults,
  SetIsLive,
  SetIsSyncing,
  LoadParseServerResults,
  LoadResult,
  UnloadResult,
  Fail,
  Reset
}

type LoadLocalDatastoreResultsAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadLocalDatastoreResults,
  payload: {
    queryId: number,
    results: T[],
    count?: number
  }
};

const loadLocalDatastoreResults = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  results: T[],
  count?: number
): LoadLocalDatastoreResultsAction<T> => ({
  type: ActionTypes.LoadLocalDatastoreResults,
  payload: {
    queryId,
    results,
    count
  }
});

const setIsLive = (queryId: number, isLive: boolean) => ({
  type: ActionTypes.SetIsLive,
  payload: {
    queryId,
    isLive
  }
} as const);

const setIsSyncing = (queryId: number, isSyncing: boolean) => ({
  type: ActionTypes.SetIsSyncing,
  payload: {
    queryId,
    isSyncing
  }
} as const);

type LoadParseServerResultsAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadParseServerResults,
  payload: {
    queryId: number,
    results: T[],
    count?: number
  }
};

const loadParseServerResults = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  results: T[],
  count?: number
): LoadParseServerResultsAction<T> => ({
  type: ActionTypes.LoadParseServerResults,
  payload: {
    queryId,
    results,
    count
  }
});

type LoadResultAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadResult,
  payload: {
    queryId: number,
    result: T,
    order?: string[],
    limit?: number
  }
};

const loadResult = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  result: T,
  order?: string[],
  limit?: number
): LoadResultAction<T> => ({
  type: ActionTypes.LoadResult,
  payload: {
    queryId,
    result,
    order,
    limit
  }
});

type UnloadResultAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.UnloadResult,
  payload: {
    queryId: number,
    result: T
  }
};

const unloadResult = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  result: T
): UnloadResultAction<T> => ({
  type: ActionTypes.UnloadResult,
  payload: {
    queryId,
    result
  }
});

const fail = (queryId: number, error: Error) => ({
  type: ActionTypes.Fail,
  payload: {
    queryId,
    error
  }
} as const);

type ResetAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.Reset,
  payload: {
    initialLoad?: InitialLoad<T>
  }
};

const reset = <T extends Parse.Object<Parse.Attributes>>(
  initialLoad?: InitialLoad<T>
): ResetAction<T> => ({
  type: ActionTypes.Reset,
  payload: {
    initialLoad
  }
});

type Action<T extends Parse.Object<Parse.Attributes>> =
  LoadLocalDatastoreResultsAction<T> |
  LoadParseServerResultsAction<T> |
  LoadResultAction<T> |
  UnloadResultAction<T> |
  ResetAction<T> |
  ReturnType<
    typeof setIsLive |
    typeof setIsSyncing |
    typeof fail
  >;

type Reducer<T extends Parse.Object<Parse.Attributes>> = (
  state: State<T>,
  action: Action<T>
) => State<T>;

const reducer = <T extends Parse.Object<Parse.Attributes>>(
  state: State<T>,
  action: Action<T>
): State<T> => {
  if (action.type === ActionTypes.Reset) {
    return getInitialState(
      state.queryId + 1,
      action.payload.initialLoad
    );
  } else if (
    action.payload.queryId !== state.queryId ||
    state.error
  ) {
    return state;
  }

  switch (action.type) {
    case ActionTypes.LoadLocalDatastoreResults: {
      return {
        ...state,
        isLoading: false,
        results: state.isLoading ? action.payload.results : state.results,
        count: state.isLoading ? action.payload.count : state.count
      };
    }

    case ActionTypes.SetIsLive: {
      return {
        ...state,
        isLive: action.payload.isLive
      };
    }

    case ActionTypes.SetIsSyncing: {
      return {
        ...state,
        isSyncing: action.payload.isSyncing
      };
    }

    case ActionTypes.LoadParseServerResults: {
      return {
        ...state,
        isLoading: false,
        isSyncing: false,
        results: action.payload.results,
        count: action.payload.count
      };
    }

    case ActionTypes.LoadResult: {
      let results = state.results;
      let count = state.count;

      if (results) {
        results = results.filter(
          result => result.id !== action.payload.result.id
        );

        let index = 0;
        if (action.payload.order) {
          index = results.findIndex(
            result => compareParseObjects(result, action.payload.result, action.payload.order as string[]) >= 0
          );
        }

        results.splice(index, 0, action.payload.result);

        if (count !== undefined) {
          count = state.count! + results.length - state.results!.length;

          if (count < 0) {
            count = 0;
          }

          if (count < results.length) {
            count = results.length;
          }
        }

        if (
          action.payload.limit !== undefined &&
          action.payload.limit >= 0 &&
          results.length > action.payload.limit
        ) {
          results = results.slice(0, action.payload.limit);
        }
      }
      
      return {
        ...state,
        results,
        count
      };
    }

    case ActionTypes.UnloadResult: {
      let results = state.results;
      let count = state.count;

      if (results) {
        results = results.filter(
          result => result.id !== action.payload.result.id
        );

        if (count !== undefined) {
          count--;

          if (count < 0) {
            count = 0;
          }

          if (count < results.length) {
            count = results.length;
          }
        }
      }

      return {
        ...state,
        results
      };
    }

    case ActionTypes.Fail: {
      return {
        ...state,
        isLoading: false,
        isLive: false,
        isSyncing: false,
        error: action.payload.error
      };
    }
  }
};

export interface UseParseQueryOptions<T extends Parse.Object<Parse.Attributes>> {
  enableLocalDatastore?: boolean;
  enableLiveQuery?: boolean;
  initialLoad?: InitialLoad<T>;
}

export interface UseParseQueryResult<T extends Parse.Object<Parse.Attributes>> extends ResultState<T> {
  reload: () => void;
}

const useParseQuery = <T extends Parse.Object<Parse.Attributes>>(
  query: Parse.Query<T>,
  options?: UseParseQueryOptions<T>
): UseParseQueryResult<T> => {
  const queryString = useMemo(
    () => {
      return JSON.stringify({
        className: query.className,
        query: query.toJSON()
      });
    },
    [query]
  );

  const {
    enableLocalDatastore = true,
    enableLiveQuery = true,
    initialLoad,
  } = options || {};

  const {
    results: initialResults,
    count: initialCount
  } = initialLoad || {};

  const stateRef = useRef<State<T>>(getInitialState(1, initialLoad));

  const [
    {
      queryId,
      isLoading,
      isLive,
      isSyncing,
      results,
      count,
      error
    },
    dispatch
  ] = useReducer<Reducer<T>>(
    (state, action) => {
      stateRef.current = reducer(state, action);
      return stateRef.current;
    },
    stateRef.current
  );

  const localDatastoreQuery: Parse.Query<T> | undefined = useMemo(
    () => {
      if (enableLocalDatastore) {
        const queryJSON = JSON.parse(queryString);

        const memoedQuery = Parse.Query.fromJSON(queryJSON.className, queryJSON.query) as Parse.Query<T>;
        memoedQuery.fromPinWithName(queryString);

        return memoedQuery;
      }

      return;
    },
    [queryString, enableLocalDatastore]
  );

  const findFromLocalDatastore = useCallback(
    async () => {
      let findResult;
      try {
        findResult = await localDatastoreQuery!.find();
      } catch (e) {
        dispatch(fail(queryId, e));

        return;
      }

      if ((localDatastoreQuery as any)._count) {
        dispatch(loadLocalDatastoreResults(
          queryId,
          (findResult as any).results,
          (findResult as any).count
        ));
      } else {
        dispatch(loadLocalDatastoreResults(
          queryId,
          findResult
        ));
      }
    },
    [queryId, localDatastoreQuery]
  );

  const parseServerQuery: Parse.Query<T> | undefined = useMemo(
    () => {
      const queryJSON = JSON.parse(queryString);

      return Parse.Query.fromJSON(queryJSON.className, queryJSON.query) as Parse.Query<T>;
    },
    [queryString]
  );

  const pinResults = useCallback(
    async (results: T[]) => {
      try {
        await Parse.Object.unPinAllObjectsWithName(queryString);
        await Parse.Object.pinAllWithName(queryString, results);
      } catch (e) {
        dispatch(fail(queryId, e));
      }
    },
    [queryString, queryId]
  );

  const findFromParseServer = useCallback(
    () => {
      let isCanceled = false;
      let attempts = 1;

      const find = async () => {
        if (enableLocalDatastore || enableLiveQuery || initialResults) {
          dispatch(setIsSyncing(queryId, true));
        }
  
        let findResult;
        try {
          findResult = await parseServerQuery.find();
        } catch (e) {
          if (
            e instanceof Parse.Error &&
            e.code === Parse.Error.CONNECTION_FAILED
          ) {
            if (!isCanceled) {
              setTimeout(
                () => {
                  if (!isCanceled) {
                    attempts++;
                    find();
                  }
                },
                Math.random() * Math.min(30, (Math.pow(2, attempts) - 1)) * 1000
              );
            }
          } else {
            dispatch(fail(queryId, e));
          }        
  
          return ;
        }

        let results = findResult;
        let count;
        if ((parseServerQuery as any)._count) {
          results = (findResult as any).results;
          count = (findResult as any).count;
        }
  
        dispatch(loadParseServerResults(
          queryId,
          results,
          count
        ));
  
        if (enableLocalDatastore) {
          await pinResults(results);
        }
      }

      const cancel = () => {
        isCanceled = true;
      }
      
      find();

      return cancel;
    },
    [enableLocalDatastore, enableLiveQuery, initialResults, queryId, parseServerQuery, pinResults]
  );

  const subscribeLiveQuery = useCallback(
    () => {
      let liveQuerySubscription: Parse.LiveQuerySubscription | undefined;
      let cancelFindFromParseServer: (() => void) | undefined;

      const loadAndPinResult = async (result: T) => {
        dispatch(loadResult(queryId, result as T, (parseServerQuery as any)._order, (parseServerQuery as any)._limit));

        if (enableLocalDatastore) {
          try {
            await result.pinWithName(queryString);
          } catch (e) {
            dispatch(fail(queryId, e));
          }
        }
      };

      const unloadAndUnPinResult = async (result: T) => {
        dispatch(unloadResult(queryId, result as T));

        if (
          (parseServerQuery as any)._limit !== undefined &&
          (parseServerQuery as any)._limit >= 0 &&
          stateRef.current.results &&
          stateRef.current.results.length + 1 === (parseServerQuery as any)._limit
        ) {
          if (cancelFindFromParseServer) {
            cancelFindFromParseServer();
          }

          cancelFindFromParseServer = findFromParseServer();
        }

        if (enableLocalDatastore) {
          try {
            await result.unPinWithName(queryString);
          } catch (e) {
            dispatch(fail(queryId, e));
          }
        }
      };

      const subscribe = async () => {
        try {
          liveQuerySubscription = await parseServerQuery.subscribe();
        } catch (e) {
          dispatch(fail(queryId, e));

          return;
        }
    
        liveQuerySubscription.on('open', () => {
          dispatch(setIsLive(queryId, true));

          if (cancelFindFromParseServer) {
            cancelFindFromParseServer();
          }

          cancelFindFromParseServer = findFromParseServer();
        });
    
        liveQuerySubscription.on('close', () => {
          dispatch(setIsLive(queryId, false));
        });

        liveQuerySubscription.on('create', result => loadAndPinResult(result as T));
        liveQuerySubscription.on('update', result => loadAndPinResult(result as T));
        liveQuerySubscription.on('enter', result => loadAndPinResult(result as T));
        liveQuerySubscription.on('leave', result => unloadAndUnPinResult(result as T));
        liveQuerySubscription.on('delete', result => unloadAndUnPinResult(result as T));
      };

      const subscribePromise = subscribe();
    
      const unsubscribe = async () => {
        if (cancelFindFromParseServer) {
          cancelFindFromParseServer();
        }

        await subscribePromise;

        if (liveQuerySubscription) {
          liveQuerySubscription.unsubscribe();
        }

        dispatch(setIsLive(queryId, false));
      }

      return unsubscribe;
    },
    [queryString, enableLocalDatastore, queryId, parseServerQuery, findFromParseServer]
  );

  useEffect(
    () => {
      let cleanUp: (() => void) | undefined;

      if (enableLocalDatastore) {
        if (initialResults) {
          pinResults(initialResults);
        } else {
          findFromLocalDatastore();
        }
      }

      if (enableLiveQuery) {
        cleanUp = subscribeLiveQuery();
      } else {
        cleanUp = findFromParseServer();
      }

      return cleanUp;
    },
    [queryId]
  );

  const reload = useCallback(
    () => {
      dispatch(reset(initialLoad));
    },
    [initialResults, initialCount]
  );

  useEffect(
    () => reload,
    [
      queryString,
      enableLocalDatastore,
      enableLiveQuery,
      initialResults,
      initialCount
    ]
  );

  return useMemo(
    () => ({
      isLoading,
      isLive,
      isSyncing,
      results,
      count,
      error,
      reload
    }),
    [
      isLoading,
      isLive,
      isSyncing,
      results,
      count,
      error,
      reload
    ]
  );
};

export default useParseQuery;
