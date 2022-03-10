/** docoment ready */
export function domContentLoaded(
  condition: DocumentReadyState[] = ['complete', 'interactive'],
): Promise<unknown> {
  return new Promise<unknown>((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(undefined)
    } else {
      document.addEventListener('readystatechange', (e) => {
        if (condition.includes(document.readyState)) {
          resolve(e)
        }
      })
    }
  })
}
