/** docoment ready */
export function domContentLoaded(): Promise<unknown> {
  return new Promise<unknown>((resolve) => {
    const readyState = document.readyState
    if (readyState === 'complete' || (document && document.body !== null)) {
      resolve(undefined)
    } else {
      window.addEventListener('readystatechange', (e) => {
        if (document.readyState === 'complete') resolve(e)
      })
    }
  })
}
