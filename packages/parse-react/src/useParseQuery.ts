import Parse from 'parse';

const useParseQuery = () => {
  Parse.serverURL = '';
  const objects = [
    1,
    2,
    3
  ];
  return objects;
};

export default useParseQuery;
