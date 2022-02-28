export const is = {
  home: (href: string) => /^m\.bilibili\.com\/($|channel)/.test(href),
  video: (href: string) => /^(m|www)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/.test(href),
  trends: (href: string) => /^t\.bilibili\.com/.test(href),
  live: (href: string) => /^live\.bilibili\.com\/blanc\/\d+/.test(href),
  login: (href: string) => /^passport\.bilibili.com\/login/.test(href),
  search: (href: string) => /^m\.bilibili\.com\/search\?/.test(href),
}

/**
 * 向文档添加样式
 * @param text - 样式内容
 * @returns entry method
 */
export const addStyle = (text: string) => {
  const style = document.createElement('style')
  style.textContent = text
  const styleElement = document.head.insertAdjacentElement('beforeend', style) as HTMLStyleElement
  return {
    unload: () => {
      styleElement.remove()
    },
  }
}

/**
 * 判断dom是否存在
 * @param dom 需要判断元素
 * @param target dom的父元素，如果传入参数则会使用observer观察dom出现
 * @param options observer的options
 * @returns Promise
 */
export const whenDom = async (
  dom: string[],
  target?: string,
  options: MutationObserverInit = {},
) => {
  let $_reject: any
  let observer: MutationObserver
  const promise = new Promise<void>((resolve, reject) => {
    $_reject = reject
    if (document.querySelector(dom.join(','))) {
      return resolve()
    }
    if (!target) {
      return reject()
    }
    observer = new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes }) => {
        if (addedNodes.length === 0) return
        const node = addedNodes[0] as HTMLElement
        const reg = new RegExp(`(${dom.join('|')})`)
        if (reg.test(`.${node.className}`)) {
          resolve()
        }
      })
    })
    // 合并默认配置
    const defaultOtions = { childList: true, subtree: true }
    options = Object.assign(defaultOtions, options)
    const element = document.querySelector(target)
    // 开始观察
    if (element) {
      observer.observe(element, options)
    } else {
      reject()
    }
  })
  return {
    promise,
    abort: () => {
      observer.disconnect()
      $_reject()
    },
  }
}
