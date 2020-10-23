import { useReducer, useEffect } from 'react';
import Parse from 'parse';

export interface ParseQueryState<T extends Parse.Object<Parse.Attributes>> {
  isLoading: boolean;
  objects?: T[];
  error?: Error;
}

enum ActionTypes {
  Confirm,
  Fail
}

const useParseQuery = <T extends Parse.Object<Parse.Attributes>>(query: Parse.Query<T>): ParseQueryState<T> => {
  const confirm = (objects: T[]) => ({
    type: ActionTypes.Confirm,
    payload: {
      objects
    }
  } as const);

  const fail = (error: Error) => ({
    type: ActionTypes.Fail,
    payload: {
      error
    }
  } as const);

  const [state, dispatch] = useReducer(
    (state: ParseQueryState<T>, action: ReturnType<typeof confirm | typeof fail>) => {
      switch (action.type) {
        case ActionTypes.Confirm: {
          return {
            isLoading: false,
            objects: action.payload.objects
          };
        }
        case ActionTypes.Fail: {
          return {
            isLoading: false,
            error: action.payload.error
          };
        }
      }
      return state;
    },
    {
      isLoading: false
    }
  );

  const load = async () => {
    try {
      dispatch(confirm(await query.find()));
    } catch (e) {
      dispatch(fail(e));
    }
  };

  useEffect(
    () => {
      load();
    },
    []
  );

  return state;
};

export default useParseQuery;
