import fs from 'fs-extra'
import path from 'path'
import Logger from '~/common/logger'
import type { AdapterHandlerOptions } from '~/interfaces/plugin'
import axios from 'axios'
import tar from 'tar'

/**
 * 系统插件管理器
 * @class AdapterHandler
 */
export class AdapterHandler {
  // 插件安装地址
  public baseDir: string

  /**
   * Creates an instance of AdapterHandler.
   * @param {AdapterHandlerOptions} options
   * @memberof AdapterHandler
   */
  constructor(options: AdapterHandlerOptions) {
    // 初始化插件存放
    const nodeModulesPath = path.resolve(options.baseDir, 'node_modules')

    if (!fs.existsSync(nodeModulesPath)) {
      fs.mkdirsSync(nodeModulesPath)
      fs.writeFileSync(path.resolve(options.baseDir, 'README.md'), '该目录为webmini插件存放目录')
    }
    this.baseDir = options.baseDir
  }

  /**
   * 测试url是否可用
   * @param url url地址
   * @returns {Promise<boolean>}
   */
  private async testUrlStatus(url: string): Promise<boolean> {
    return await axios.head(url).then(
      (res) => {
        return res.status === 200
      },
      () => {
        return false
      },
    )
  }

  /**
   * 下载Tar包
   * @param name 包の名称
   * @param version 包の版本
   * @param dist 保存路径
   * @returns {Promise<boolean>}
   */
  private async downloadTarball(name: string, version: string, dist: string): Promise<boolean> {
    const registrys = [
      // 淘宝源
      `https://registry.npmmirror.com`,
      // 腾讯源
      `https://mirrors.cloud.tencent.com/npm`,
      // 中国科学技术大学源
      `https://npmreg.proxy.ustclug.org`,
      // npm源
      `https://registry.npmjs.org`,
    ]

    // 查询可用的源
    let usebalUrl = ''
    for (const registry of registrys) {
      const tarUrl = `${registry}/${name}/-/${name}-${version}.tgz`
      if (await this.testUrlStatus(tarUrl)) {
        usebalUrl = tarUrl
        break
      }
    }

    // 无可用源
    console.log(usebalUrl)
    if (usebalUrl === '') {
      return Promise.reject('无可用源')
    }

    // 下载
    const res = await axios
      .get(usebalUrl, {
        responseType: 'stream',
      })
      .catch(() => {
        // 下载失败
        return Promise.reject('下载失败')
      })

    // 保存
    const file = fs.createWriteStream(dist)

    // 写入
    res.data.pipe(file)

    return new Promise((resolve, reject) => {
      // 监听写入完成
      file.on('finish', () => {
        file.close()
        resolve(true)
      })
      // 写入错误
      file.on('error', (err) => {
        reject(err)
        fs.unlink(dist)
      })
    })
  }

  /**
   * 解压tar包
   * @param file 包路径
   * @param name 包名称
   * @returns {Promise<boolean>}
   */
  private async unpack(file: string, name: string): Promise<boolean> {
    const nodeModulesPath = path.resolve(this.baseDir, 'node_modules')
    return new Promise((resolve, reject) => {
      tar
        .x({
          file,
          cwd: nodeModulesPath,
        })
        .then(() => {
          fs.rename(
            path.resolve(nodeModulesPath, 'package'),
            path.resolve(nodeModulesPath, name),
            (err) => {
              if (err) {
                reject(err)
              }
            },
          )
          fs.remove(file)
          resolve(true)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  public async install(name: string, version: string) {
    const dist = path.resolve(this.baseDir, 'node_modules', name)
    if (await fs.pathExists(dist)) {
      Logger.info(`${name}@${version} 已安装`)
      this.uninstall(name)
      // return
    }

    const tarball = path.resolve(this.baseDir, 'node_modules', `${name}-${version}.tgz`)
    if (await fs.pathExists(tarball)) {
      Logger.info(`${name}@${version} 已下载`)
      await this.unpack(tarball, name)
      return
    }

    await this.downloadTarball(name, version, tarball)

    await this.unpack(tarball, name)
  }

  public async uninstall(name: string) {
    const dist = path.resolve(this.baseDir, 'node_modules', name)
    if (!(await fs.pathExists(dist))) {
      Logger.info(`${name} 未安装`)
      return
    }
    return fs.remove(dist)
  }
}
