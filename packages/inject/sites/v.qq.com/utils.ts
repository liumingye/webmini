export const is = {
  video: (href: string) => /^(m\.|)v\.qq\.com(.*?)(\/cover|\/play)/.test(href),
}
