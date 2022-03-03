import { useAppStore } from '@/store'
import { videoUrlPrefix, bangumiUrlPrefix } from '@/config/constant'

const ipc = window.ipcRenderer
const logger = window.app.logger

export const getPartOfBangumi = (bvid: string) => {
  const appStore = useAppStore()
  const net = window.app.net
  net.fetch(bangumiUrlPrefix + bvid).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        logger.error(`获取番剧分p数据失败`, {
          data: res,
          label: 'getPartOfBangumi',
        })
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      let currentPartId = 0
      try {
        parts = json.epList
        currentPartId = Number(json.epInfo.i)
      } catch (err) {
        logger.error(`解析番剧分p失败`, {
          error: err,
          data: json,
          label: 'getPartOfBangumi',
        })
        return false
      }
      logger.debug(`获取番剧 ${bvid} 的分P数据成功`, {
        label: 'getPartOfBangumi',
      })
      if (parts.length) {
        if (!appStore.windowID.selectPartWindow) return
        const data = {
          url: `${videoUrlPrefix}%id`,
          currentPartId,
          parts: parts.map((value: any) => {
            return { id: value.bvid, title: value.longTitle }
          }),
        }
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-part', data)
        if (parts.length > 1) {
          appStore.disablePartButton = false
        }
      } else {
        if (!appStore.windowID.selectPartWindow) return
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-part', null)
        appStore.disablePartButton = true
      }
    })
  })
}

export const getPartOfVideo = (vid: string) => {
  const appStore = useAppStore()
  const net = window.app.net
  net.fetch(videoUrlPrefix + vid).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        logger.error(`获取视频分p数据失败`, {
          data: res,
          label: 'getPartOfVideo',
        })
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      try {
        parts = json.videoData.pages
      } catch (err) {
        logger.error(`解析视频分p失败`, {
          error: err,
          data: json,
          label: 'getPartOfVideo',
        })
        return false
      }
      logger.debug(`获取视频 ${vid} 的分P数据成功`, {
        label: 'getPartOfBangumi',
      })
      if (parts.length) {
        if (!appStore.windowID.selectPartWindow) return
        const data = {
          url: `${videoUrlPrefix}${vid}/?p=%id`,
          currentPartId: 0,
          parts: parts.map((value: any, index: number) => {
            return { id: index + 1, title: value.part }
          }),
        }
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-part', data)
        // 有超过1p时自动开启分p窗口
        if (parts.length > 1) {
          ipc.send('show-select-part-window')
          appStore.disablePartButton = false
        }
      } else {
        if (!appStore.windowID.selectPartWindow) return
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-part', null)
        appStore.disablePartButton = true
      }
    })
  })
}

export const getPartOfQQ = (cid: string, vid: string) => {
  // const appStore = useAppStore()
  const net = window.app.net
  logger.debug(cid + vid, {
    label: 'getPartOfQQ',
  })
  // https://pbaccess.video.qq.com/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData?video_appid=3000010&vplatform=2
  net
    .fetch(
      'https://pbaccess.video.qq.com/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData?video_appid=3000010&vplatform=2',
      {
        method: 'POST',
        body: JSON.stringify({
          page_params: {
            req_from: 'web',
            page_type: 'detail_operation',
            page_id: 'vsite_episode_list',
            id_type: '1',
            cid,
            lid: '',
            vid,
            page_num: '',
            page_size: '100',
            page_context:
              'page_size=100&id_type=1&req_type=6&req_from=web&req_from_second_type=&detail_page_type=0',
          },
          has_cache: 1,
        }),
        headers: {
          'content-type': 'application/json',
          referer: 'https://v.qq.com/',
        },
      },
    )
    .then((res) => {
      // console.log(res)
      res.json().then((res) => {
        // logger.debug(res, {
        //   label: 'getPartOfQQ',
        // })
        console.log(res)
      })
    })
}
