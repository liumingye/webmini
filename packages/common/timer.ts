export class Timer {
  private timer: NodeJS.Timeout | NodeJS.Immediate | null = null

  private mode = 'timeout'

  private debug = false

  private logger

  private fn

  private delay = 0

  constructor(
    fn: <TArgs extends any[]>(...args: TArgs) => void,
    delay = 0,
    option: { mode: string; debug?: boolean },
  ) {
    this.fn = fn
    this.delay = delay
    if (option?.mode) this.mode = option.mode
    if (option?.debug) this.debug = option.debug
    if (typeof process !== 'object' && typeof window.app.logger === 'object') {
      this.logger = window.app.logger
    } else {
      this.logger = console
    }
  }

  public start() {
    switch (this.mode) {
      case 'timeout': {
        this.log('timeout start')
        this.timer = setTimeout(() => {
          this.log('timeout run')
          this.fn?.()
          this.clear()
        }, this.delay)
        break
      }
      case 'interval': {
        this.log('interval start')
        this.timer = setInterval(() => {
          this.log('interval run')
          this.fn?.()
        }, this.delay)
        break
      }
      case 'immediate': {
        this.log('immediate start')
        this.timer = setImmediate(() => {
          this.log('immediate run')
          this.fn?.()
        })
        break
      }
      default:
        break
    }
  }

  public clear() {
    if (this.timer) {
      switch (this.mode) {
        case 'timeout': {
          this.log('timeout clear')
          clearTimeout(<NodeJS.Timeout>this.timer)
          break
        }
        case 'interval': {
          this.log('interval clear')
          clearInterval(<NodeJS.Timeout>this.timer)
          break
        }
        case 'immediate': {
          this.log('immediate clear')
          clearImmediate(<NodeJS.Immediate>this.timer)
          break
        }
        default:
          break
      }
      this.timer = null
    }
  }

  public restart() {
    this.clear()
    this.start()
  }

  private log(...args: any) {
    if (this.debug) {
      this.logger.info(args)
    }
  }
}
