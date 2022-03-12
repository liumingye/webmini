export const START = 'https://m.bilibili.com/'

export const userAgent = {
  desktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 Safari/605.1.15',
  mobile:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
}

export const ERROR_PROTOCOL = 'webmini-error'

export const NETWORK_ERROR_HOST = 'network-error'

export const webNav = {
  主站: [
    {
      name: '主站(pc)',
      url: 'https://www.bilibili.com/',
    },
    {
      name: '主站(m)',
      url: 'https://m.bilibili.com/',
    },
    {
      name: '排行榜',
      url: 'https://m.bilibili.com/ranking',
    },
    {
      name: '动态',
      url: 'https://t.bilibili.com/?tab=8',
    },
    {
      name: '个人空间',
      url: 'https://space.bilibili.com/',
    },
    {
      name: '收藏',
      url: 'https://space.bilibili.com/${uid}/favlist',
    },
    {
      name: '历史',
      url: 'https://www.bilibili.com/account/history',
    },
    {
      name: '稍后再看',
      url: 'https://www.bilibili.com/watchlater/#/list',
    },
    {
      name: '创作中心',
      url: 'https://member.bilibili.com/platform/home',
    },
  ],
  直播: [
    {
      name: '直播(pc)',
      url: 'https://live.bilibili.com/',
    },
    {
      name: '直播(m)',
      url: 'https://live.bilibili.com/h5',
    },
    {
      name: '我的关注',
      url: 'https://link.bilibili.com/p/center/index#/user-center/follow/1',
    },
    {
      name: '排行榜',
      url: 'https://live.bilibili.com/p/eden/rank#/childnav/vitality/0',
    },
    {
      name: '直播中心',
      url: 'https://link.bilibili.com/p/center/index#/user-center/my-info/operation',
    },
  ],
  番剧: [
    {
      name: '番剧',
      url: 'https://www.bilibili.com/anime',
    },
    {
      name: '我的追番',
      url: 'https://space.bilibili.com/${uid}/bangumi',
    },
    {
      name: '新番时间表',
      url: 'https://www.bilibili.com/anime/timeline/',
    },
  ],
  其他: [
    {
      name: '专栏',
      url: 'https://www.bilibili.com/read/home',
    },
    {
      name: '频道',
      url: 'https://www.bilibili.com/v/channel/',
    },
    {
      name: '消息',
      url: 'https://message.bilibili.com/#/reply',
    },
    // {
    //   name: '腾讯视频',
    //   url: 'http://m.v.qq.com/',
    // },
  ],
}
