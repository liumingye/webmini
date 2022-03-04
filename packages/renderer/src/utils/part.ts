const logger = window.app.logger

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
