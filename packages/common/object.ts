export const isValidKey = (
  key: string | number | symbol,
  object: object,
): key is keyof typeof object => {
  return key in object
}
