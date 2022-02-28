export const is = {
  home: (href: string) => /m\.bilibili\.com\/($|channel)/.test(href),
  video: (pathname: string) => /^(\/video\/(av|BV)|\/bangumi\/play\/)/.test(pathname),
  trends: (href: string) => /^http(s|):\/\/t\.bilibili\.com/.test(href),
  live: (href: string) => /\/\/live\.bilibili\.com\/blanc\/\d+/.test(href),
  login: (href: string) => /passport\.bilibili.com\/login/.test(href),
  search: (href: string) => /m\.bilibili\.com\/search\?/.test(href),
}

/**
 * 向文档添加样式
 * @param text - 样式内容
 * @returns entry method
 */
export const addStyle = (text: string) => {
  const style = document.createElement('style')
  style.textContent = text
  const styleElement = document.head.insertAdjacentElement('beforeend', style) as HTMLStyleElement
  return {
    unload: () => {
      styleElement.remove()
    },
  }
}
