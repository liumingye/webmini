export const is = {
  video: (pathname: string) => /^(\/video\/(av|BV)|\/bangumi\/play\/)/.test(pathname),
  trends: (href: string) => /^http(s|):\/\/t\.bilibili\.com/.test(href),
  live: (href: string) => /\/\/live\.bilibili\.com\/blanc\/\d+/.test(href),
  login: (href: string) => /passport\.bilibili.com\/login/.test(href),
  search: (href: string) => /m\.bilibili\.com\/search\?/.test(href),
}

/**
 * 在 head 里插入 css
 * @param css - style
 * @returns remove method
 */
export const addStyle = (css: string) => {
  const dom = document.createElement('style')
  dom.innerHTML = css
  const style = document.head.appendChild(dom)
  return () => {
    style.remove()
  }
}
