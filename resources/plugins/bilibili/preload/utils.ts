export const is = {
  home: (href: string) => /^m\.bilibili\.com\/($|channel|ranking)/.test(href),
  video: (href: string) => /^(m|www)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/.test(href),
  trends: (href: string) => /^t\.bilibili\.com/.test(href),
  live: (href: string) => /^live\.bilibili\.com\/blanc\/\d+/.test(href),
  login: (href: string) => /^passport\.bilibili.com\/login/.test(href),
  search: (href: string) => /^m\.bilibili\.com\/search\?/.test(href),
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
