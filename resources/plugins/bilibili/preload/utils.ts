export const is = {
  home: (href: string): boolean => /^m\.bilibili\.com\/($|channel|ranking)/.test(href),
  video: (href: string): boolean =>
    /^(m|www)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/.test(href),
  trends: (href: string): boolean => /^t\.bilibili\.com/.test(href),
  live: (href: string): boolean => /^live\.bilibili\.com\/blanc\/\d+/.test(href),
  login: (href: string): boolean => /^passport\.bilibili.com\/login/.test(href),
  search: (href: string): boolean => /^m\.bilibili\.com\/search\?/.test(href),
}

export const addStyle = (text: string) => {
  const style = document.createElement('style')
  style.textContent = text
  const styleElement = <HTMLStyleElement>document.head.insertAdjacentElement('beforeend', style)
  return {
    unload: () => {
      styleElement.remove()
    },
  }
}
