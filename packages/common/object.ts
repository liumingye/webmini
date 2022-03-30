/**
 * isValidKey
 * @param {string | number | symbol} key
 * @param {object} object
 * @returns {key is keyof typeof object}
 */
export const isValidKey = (
  key: string | number | symbol,
  object: object,
): key is keyof typeof object => {
  return key in object
}
