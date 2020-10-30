import { useReducer, useMemo, useCallback, useEffect } from 'react';
import Parse from 'parse';
import { compareParseObjects } from './util';

interface ResultState<T extends Parse.Object<Parse.Attributes>> {
  isLoading: boolean;
  isLive: boolean;
  isSyncing: boolean;
  objects?: T[];
  count?: number;
  error?: Error;
}

interface State<T extends Parse.Object<Parse.Attributes>> extends ResultState<T> {
  queryId: number;
}

enum ActionTypes {
  LoadLocalDatastoreObjects,
  SetIsLive,
  SetIsSyncing,
  LoadParseServerObjects,
  LoadObject,
  UnloadObject,
  Fail,
  Reset
}

type LoadLocalDatastoreObjectsAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadLocalDatastoreObjects,
  payload: {
    queryId: number,
    objects: T[],
    count?: number
  }
};

const loadLocalDatastoreObjects = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  objects: T[],
  count?: number
): LoadLocalDatastoreObjectsAction<T> => ({
  type: ActionTypes.LoadLocalDatastoreObjects,
  payload: {
    queryId,
    objects,
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

type LoadParseServerObjectsAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadParseServerObjects,
  payload: {
    queryId: number,
    objects: T[],
    count?: number
  }
};

const loadParseServerObjects = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  objects: T[],
  count?: number
): LoadParseServerObjectsAction<T> => ({
  type: ActionTypes.LoadParseServerObjects,
  payload: {
    queryId,
    objects,
    count
  }
});

type LoadObjectAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadObject,
  payload: {
    queryId: number,
    object: T,
    order?: string[],
    limit?: number
  }
};

const loadObject = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  object: T,
  order?: string[],
  limit?: number
): LoadObjectAction<T> => ({
  type: ActionTypes.LoadObject,
  payload: {
    queryId,
    object,
    order,
    limit
  }
});

type UnloadObjectAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.UnloadObject,
  payload: {
    queryId: number,
    object: T
  }
};

const unloadObject = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  object: T
): UnloadObjectAction<T> => ({
  type: ActionTypes.UnloadObject,
  payload: {
    queryId,
    object
  }
});

const fail = (queryId: number, error: Error) => ({
  type: ActionTypes.Fail,
  payload: {
    queryId,
    error
  }
} as const);

const reset = () => ({
  type: ActionTypes.Reset
} as const);

type Action<T extends Parse.Object<Parse.Attributes>> =
  LoadLocalDatastoreObjectsAction<T> |
  LoadParseServerObjectsAction<T> |
  LoadObjectAction<T> |
  UnloadObjectAction<T> |
  ReturnType<
    typeof setIsLive |
    typeof setIsSyncing |
    typeof fail |
    typeof reset
  >;

type Reducer<T extends Parse.Object<Parse.Attributes>> = (
  state: State<T>,
  action: Action<T>
) => State<T>;

const initialState = {
  queryId: 1,
  isLoading: true,
  isLive: false,
  isSyncing: false
};

const reducer = <T extends Parse.Object<Parse.Attributes>>(
  state: State<T>,
  action: Action<T>
): State<T> => {
  if (action.type === ActionTypes.Reset) {
    return {
      ...initialState,
      queryId: state.queryId + 1
    };
  } else if (
    action.payload.queryId !== state.queryId ||
    state.error
  ) {
    return state;
  }

  switch (action.type) {
    case ActionTypes.LoadLocalDatastoreObjects: {
      return {
        ...state,
        isLoading: false,
        objects: state.isLoading ? action.payload.objects : state.objects,
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

    case ActionTypes.LoadParseServerObjects: {
      return {
        ...state,
        isLoading: false,
        isSyncing: false,
        objects: action.payload.objects,
        count: action.payload.count
      };
    }

    case ActionTypes.LoadObject: {
      let objects = state.objects;
      let count = state.count;

      if (objects) {
        objects = objects.filter(
          object => object.id !== action.payload.object.id
        );

        let index = 0;
        if (action.payload.order) {
          index = objects.findIndex(
            object => compareParseObjects(object, action.payload.object, action.payload.order as string[]) >= 0
          );
        }

        objects.splice(index, 0, action.payload.object);

        if (count) {
          count = state.count! + objects.length - state.objects!.length;

          if (count < 0) {
            count = 0;
          }

          if (count < objects.length) {
            count = objects.length;
          }
        }

        if (
          action.payload.limit !== undefined &&
          action.payload.limit >= 0 &&
          objects.length > action.payload.limit
        ) {
          objects = objects.slice(0, action.payload.limit);
        }
      }
      
      return {
        ...state,
        objects,
        count
      };
    }

    case ActionTypes.UnloadObject: {
      let objects = state.objects;
      let count = state.count;

      if (objects) {
        objects = objects.filter(
          object => object.id !== action.payload.object.id
        );

        if (count) {
          count--;

          if (count < 0) {
            count = 0;
          }

          if (count < objects.length) {
            count = objects.length;
          }
        }
      }

      return {
        ...state,
        objects 
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

export interface UseParseQueryOptions {
  enableLocalDatastore?: boolean;
  enableLiveQuery?: boolean;
}

export interface UseParseQueryResult<T extends Parse.Object<Parse.Attributes>> extends ResultState<T> {
  reload: () => void;
}

const useParseQuery = <T extends Parse.Object<Parse.Attributes>>(
  query: Parse.Query<T>,
  options?: UseParseQueryOptions
): UseParseQueryResult<T> => {
  const queryString = JSON.stringify({
    className: query.className,
    query: query.toJSON()
  });

  const {
    enableLocalDatastore = true,
    enableLiveQuery = true
  } = options || {};

  const [
    {
      queryId,
      isLoading,
      isLive,
      isSyncing,
      objects,
      count,
      error
    },
    dispatch
  ] = useReducer<Reducer<T>>(
    reducer,
    initialState
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
        dispatch(loadLocalDatastoreObjects(
          queryId,
          (findResult as any).results,
          (findResult as any).count
        ));
      } else {
        dispatch(loadLocalDatastoreObjects(
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

  const findFromParseServer = useCallback(
    () => {
      let isCanceled = false;
      let attempts = 1;

      const find = async () => {
        if (enableLocalDatastore || enableLiveQuery) {
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

        let objects = findResult;
        let count;
        if ((parseServerQuery as any)._count) {
          objects = (findResult as any).results;
          count = (findResult as any).count;
        }
  
        dispatch(loadParseServerObjects(
          queryId,
          objects,
          count
        ));
  
        if (enableLocalDatastore) {
          try {
            await Parse.Object.unPinAllObjectsWithName(queryString);
            await Parse.Object.pinAllWithName(queryString, objects);
          } catch (e) {
            dispatch(fail(queryId, e));
          }
        }
      }

      const cancel = () => {
        isCanceled = true;
      }
      
      find();

      return cancel;
    },
    [queryString, enableLocalDatastore, enableLiveQuery, queryId, parseServerQuery]
  );

  const subscribeLiveQuery = useCallback(
    () => {
      let liveQuerySubscription: Parse.LiveQuerySubscription | undefined;
      let cancelFindFromParseServer: (() => void) | undefined;

      const loadAndPinObject = async (object: T) => {
        dispatch(loadObject(queryId, object as T, (parseServerQuery as any)._order, (parseServerQuery as any)._limit));

        if (enableLocalDatastore) {
          try {
            await object.pinWithName(queryString);
          } catch (e) {
            dispatch(fail(queryId, e));
          }
        }
      };

      const unloadAndUnPinObject = async (object: T) => {
        dispatch(unloadObject(queryId, object as T));

        if (enableLocalDatastore) {
          try {
            await object.unPinWithName(queryString);
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

        liveQuerySubscription.on('create', object => loadAndPinObject(object as T));
        liveQuerySubscription.on('update', object => loadAndPinObject(object as T));
        liveQuerySubscription.on('enter', object => loadAndPinObject(object as T));
        liveQuerySubscription.on('leave', object => unloadAndUnPinObject(object as T));
        liveQuerySubscription.on('delete', object => unloadAndUnPinObject(object as T));
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
        findFromLocalDatastore();
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

  const reload = () => {
    dispatch(reset());
  };

  useEffect(
    () => reload,
    [
      queryString,
      enableLocalDatastore,
      enableLiveQuery
    ]
  );

  return {
    isLoading,
    isLive,
    isSyncing,
    objects,
    count,
    error,
    reload
  };
};

export default useParseQuery;
