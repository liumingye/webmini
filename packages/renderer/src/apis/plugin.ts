import request from '@/utils/request'
import { AxiosPromise } from 'axios'

export const fetchTotalPlugins = (): AxiosPromise => {
  return request({
    baseURL: 'https://gitee.com/liumingye/webmini-database/raw/master',
    url: 'plugins.json',
    method: 'GET',
  })
}
