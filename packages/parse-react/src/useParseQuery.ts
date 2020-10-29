import { useReducer, useMemo, useCallback, useEffect } from 'react';
import Parse from 'parse';

interface ResultState<T extends Parse.Object<Parse.Attributes>> {
  isLoading: boolean;
  isLive: boolean;
  isSyncing: boolean;
  objects?: T[];
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
  Fail,
  Reset
}

type LoadLocalDatastoreObjectsAction<T extends Parse.Object<Parse.Attributes>> = {
  type: ActionTypes.LoadLocalDatastoreObjects,
  payload: {
    queryId: number,
    objects: T[]
  }
};

const loadLocalDatastoreObjects = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  objects: T[]
): LoadLocalDatastoreObjectsAction<T> => ({
  type: ActionTypes.LoadLocalDatastoreObjects,
  payload: {
    queryId,
    objects
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
    objects: T[]
  }
};

const loadParseServerObjects = <T extends Parse.Object<Parse.Attributes>>(
  queryId: number,
  objects: T[]
): LoadParseServerObjectsAction<T> => ({
  type: ActionTypes.LoadParseServerObjects,
  payload: {
    queryId,
    objects
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
        objects: state.isLoading ? action.payload.objects : state.objects
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
        objects: action.payload.objects
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

export enum LocalDatastorePinType {
  All,
  Default,
  Custom
}

export interface LocalDatastoreOptions {
  enable?: boolean;
  pinType?: LocalDatastorePinType;
  pinName?: string;
}

export interface UseParseQueryOptions {
  localDatastore?: LocalDatastoreOptions;
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
    localDatastore = {},
    enableLiveQuery = true
  } = options || {};

  const {
    enable: enableLocalDatastore = true,
    pinType: localDatastorePinType = LocalDatastorePinType.All,
    pinName: localDatastorePinName
  } = localDatastore;

  if (localDatastorePinType === LocalDatastorePinType.Custom && !localDatastorePinName) {
    throw new Error(
      'localDatastore.pinName option must be specified when localDatastore.pinType option is "Custom"'
    );
  } else if (localDatastorePinType !== LocalDatastorePinType.Custom && localDatastorePinName) {
    throw new Error(
      'localDatastore.pinName option must not be specified when localDatastore.pinType option is not "Custom"'
    );
  }

  const [
    {
      queryId,
      isLoading,
      isLive,
      isSyncing,
      objects,
      error
    },
    dispatch
  ] = useReducer(reducer as Reducer<T>, initialState);

  const localDatastoreQuery: Parse.Query<T> | undefined = useMemo(
    () => {
      if (enableLocalDatastore) {
        const queryJSON = JSON.parse(queryString);

        const memoedQuery = Parse.Query.fromJSON(queryJSON.className, queryJSON.query) as Parse.Query<T>;

        if (localDatastorePinType === LocalDatastorePinType.All) {
          memoedQuery.fromLocalDatastore();
        } else if (localDatastorePinType === LocalDatastorePinType.Default) {
          memoedQuery.fromPin();
        } else {
          memoedQuery.fromPinWithName(localDatastorePinName!);
        }

        return memoedQuery;
      }

      return;
    },
    [queryString, enableLocalDatastore, localDatastorePinType, localDatastorePinName]
  );

  const findFromLocalDatastore = useCallback(
    async () => {
      try {
        dispatch(loadLocalDatastoreObjects(
          queryId,
          await localDatastoreQuery!.find()
        ));
      } catch (e) {
        dispatch(fail(queryId, e));
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
    async () => {
      if (enableLocalDatastore || enableLiveQuery) {
        dispatch(setIsSyncing(queryId, true));
      }

      let objects;
      try {
        objects = await parseServerQuery.find();
      } catch (e) {
        dispatch(fail(queryId, e));

        return ;
      }

      dispatch(loadParseServerObjects(
        queryId,
        objects
      ));

      if (enableLiveQuery) {
        try {
          if (localDatastorePinName) {
            await Parse.Object.pinAllWithName(localDatastorePinName, objects);
          } else {
            await Parse.Object.pinAll(objects);
          }
        } catch (e) {
          dispatch(fail(queryId, e));
        }
      }
    },
    [enableLocalDatastore, localDatastorePinName, enableLiveQuery, queryId, parseServerQuery]
  );

  const subscribeLiveQuery = useCallback(
    (): (() => void) => {
      let liveQuerySubscription: Parse.LiveQuerySubscription | undefined;

      const subscribe = async () => {
        try {
          liveQuerySubscription = await query.subscribe();
        } catch (e) {
          dispatch(fail(queryId, e));

          return;
        }
    
        liveQuerySubscription.on('open', () => {
          dispatch(setIsLive(queryId, true));

          findFromParseServer();
        });
    
        liveQuerySubscription.on('close', () => {
          dispatch(setIsLive(queryId, false));
        });
      };

      const subscribePromise = subscribe();
    
      const unsubscribe = async () => {
        await subscribePromise;

        if (liveQuerySubscription) {
          liveQuerySubscription.unsubscribe();
        }

        dispatch(setIsLive(queryId, false));
      }

      return unsubscribe;
    },
    [query, queryId, findFromParseServer]
  );

  useEffect(
    () => {
      let unsubscribeLiveQuery: (() => void) | undefined;

      if (enableLocalDatastore) {
        findFromLocalDatastore();
      }

      if (enableLiveQuery) {
        unsubscribeLiveQuery = subscribeLiveQuery();
      } else {
        findFromParseServer();
      }

      return unsubscribeLiveQuery;
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
    error,
    reload
  };
};

export default useParseQuery;
