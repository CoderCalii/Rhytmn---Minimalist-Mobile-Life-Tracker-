export function assertValidStoredData<T>(
  data: unknown,
  validator: (value: unknown) => value is T
): T {
  if (!validator(data)) {
    throw new Error('Invalid stored data')
  }
  return data
}
