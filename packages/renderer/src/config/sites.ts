interface Config {
  userAgent: {
    mobile: string[]
    desktop: string[]
  }
  windowType: {
    mini: RegExp[]
  }
}

export const sites: Record<string, Config> = {
  '.bilibili.com': {
    userAgent: {
      mobile: [
        'm.bilibili.com',
        'live.bilibili.com/h5',
        'live.bilibili.com/pages/h5',
        'www.bilibili.com/read/mobile',
        'www.bilibili.com/read/cv',
        'h.bilibili.com/ywh/h5',
        't.bilibili.com',
      ],
      desktop: [],
    },
    windowType: {
      mini: [
        /(www|m)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/,
        /live\.bilibili\.com\/(blanc|h5|)\/\d+/,
      ],
    },
  },
  '.qq.com': {
    userAgent: {
      mobile: ['m.v.qq.com', 'm.film.qq.com'],
      desktop: [],
    },
    windowType: {
      mini: [/(m\.|)v\.qq\.com(.*?)(\/cover|\/play)/],
    },
  },
}
