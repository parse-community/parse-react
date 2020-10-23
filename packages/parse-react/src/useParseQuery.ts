import { useState, useEffect } from 'react';
import Parse from 'parse';

const useParseQuery = <T extends Parse.Object<Parse.Attributes>>(query: Parse.Query<T>): undefined | T[] => {
  const [objects, setObjects] = useState<T[]>();

  useEffect(
    () => {
      const runQuery = async () => {
        try {
          setObjects(await query.find());
        } catch (e) {
          console.error(e);
        }
      };
      runQuery();
    },
    []
  );

  return objects;
};

export default useParseQuery;
