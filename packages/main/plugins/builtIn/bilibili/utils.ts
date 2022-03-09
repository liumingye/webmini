// import { useAppStore } from '@/store'
// import Net from '~/apis/net'
import { Application } from '../../../application'
import Net from '~/common/net'

export const videoUrlPrefix = 'https://www.bilibili.com/video/'
export const bangumiUrlPrefix = 'https://www.bilibili.com/bangumi/play/'
export const liveUrlPrefix = 'https://live.bilibili.com/blanc/'

// const net = new Net()

// const ipc = window.ipcRenderer
// const logger = window.app.logger

export const getVidWithP = (pathname: string) => {
  const m = /^\/video\/((av\d+|BV\w+)(?:\/?\?p=\d+)?)/.exec(pathname)
  return m ? m[1] : null
}

export const getBvid = (pathname: string) => {
  const m = /^\/bangumi\/play\/(ss\d+|ep\d+)/.exec(pathname)
  return m ? m[1] : null
}

export const getPartOfBangumi = (application: Application, net: Net, bvid: string) => {
  net.fetch(bangumiUrlPrefix + bvid).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        // logger.error(`获取番剧分p数据失败`, {
        //   data: res,
        //   label: 'getPartOfBangumi',
        // })
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      let currentPartId = 0
      try {
        parts = json.epList
        currentPartId = Number(json.epInfo.i)
      } catch (err) {
        // logger.error(`解析番剧分p失败`, {
        //   error: err,
        //   data: json,
        //   label: 'getPartOfBangumi',
        // })
        return false
      }
      // logger.debug(`获取番剧 ${bvid} 的分P数据成功`, {
      //   label: 'getPartOfBangumi',
      // })
      if (parts.length) {
        const data = {
          url: `${videoUrlPrefix}%id`,
          currentPartId,
          parts: parts.map((value: any) => {
            return { id: value.bvid, title: value.longTitle }
          }),
        }
        application.selectPartWindow?.send('update-part', data)
        if (parts.length > 1) {
          application.mainWindow?.send('setAppState', 'disablePartButton', false)
        }
      } else {
        application.selectPartWindow?.send('update-part', null)
        application.mainWindow?.send('setAppState', 'disablePartButton', true)
      }
    })
  })
}

export const getPartOfVideo = (application: Application, net: Net, vid: string) => {
  net.fetch(videoUrlPrefix + vid).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        // logger.error(`获取视频分p数据失败`, {
        //   data: res,
        //   label: 'getPartOfVideo',
        // })
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      try {
        parts = json.videoData.pages
      } catch (err) {
        // logger.error(`解析视频分p失败`, {
        //   error: err,
        //   data: json,
        //   label: 'getPartOfVideo',
        // })
        return false
      }
      // logger.debug(`获取视频 ${vid} 的分P数据成功`, {
      //   label: 'getPartOfBangumi',
      // })
      if (parts.length) {
        const data = {
          url: `${videoUrlPrefix}${vid}/?p=%id`,
          currentPartId: 0,
          parts: parts.map((value: any, index: number) => {
            return { id: index + 1, title: value.part }
          }),
        }
        application.selectPartWindow?.send('update-part', data)
        // 有超过1p时自动开启分p窗口
        if (parts.length > 1) {
          application.mainWindow?.send('setAppState', 'disablePartButton', false)
          application.selectPartWindow?.show()
        }
      } else {
        application.selectPartWindow?.send('update-part', null)
        application.mainWindow?.send('setAppState', 'disablePartButton', true)
      }
    })
  })
}
