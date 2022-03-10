export const is = {
  home: (href: string) => /^m\.bilibili\.com\/($|channel|ranking)/.test(href),
  video: (href: string) => /^(m|www)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/.test(href),
  trends: (href: string) => /^t\.bilibili\.com/.test(href),
  live: (href: string) => /^live\.bilibili\.com\/blanc\/\d+/.test(href),
  login: (href: string) => /^passport\.bilibili.com\/login/.test(href),
  search: (href: string) => /^m\.bilibili\.com\/search\?/.test(href),
}
