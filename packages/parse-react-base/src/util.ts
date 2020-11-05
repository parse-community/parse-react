export const compareParseObjects = <T extends Parse.Object<Parse.Attributes>>(
  a: T,
  b: T,
  sorts: string[]
): number => {
  let order = sorts[0];
  const operator = order.slice(0, 1);
  const isDescending = operator === '-';
  if (isDescending) {
    order = order.substring(1);
  }
  if (order === '_created_at') {
    order = 'createdAt';
  }
  if (order === '_updated_at') {
    order = 'updatedAt';
  }
  if (!(/^[A-Za-z][0-9A-Za-z_]*$/).test(order) || order === 'password') {
    throw new Parse.Error(Parse.Error.INVALID_KEY_NAME, `Invalid Key: ${order}`);
  }
  const field1 = a.get(order);
  const field2 = b.get(order);
  if (field1 < field2) {
    return isDescending ? 1 : -1;
  }
  if (field1 > field2) {
    return isDescending ? -1 : 1;
  }
  if (sorts.length > 1) {
    const remainingSorts = sorts.slice(1);
    return compareParseObjects(a, b, remainingSorts);
  }
  return 0;
};
