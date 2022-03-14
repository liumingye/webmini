import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

const request = axios.create({
  timeout: 10000,
})

export interface HttpResponse<T = unknown> {
  status: number
  msg: string
  code: number
  data: T
}

// axios实例拦截响应
request.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    return response
  },
  (error: any) => {
    return Promise.reject(error)
  },
)

// axios实例拦截请求
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 此处对请求进行配置
    return config
  },
  (error: any) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

export default request
