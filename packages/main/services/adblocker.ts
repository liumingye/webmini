import { ElectronBlocker } from '@cliqz/adblocker-electron'
import { readFileSync, writeFileSync } from 'fs'
import { Session, app } from 'electron'
import fetch from 'electron-fetch'

const PREFIX = 'https://liumingye.coding.net/p/bilimini/d'

export const adsLists = [
  `${PREFIX}/easylistchina/git/raw/master/easylistchina.txt`,
  `${PREFIX}/AdRules/git/raw/main/rules/ADgk.txt`,
]

const adblockerService = async (session: Session) => {
  const blocker = await ElectronBlocker.fromLists(
    fetch,
    adsLists,
    {
      enableCompression: true,
    },
    {
      path: `${app.getPath('userData')}/engine.bin`,
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    },
  )
  console.log('blocked load complete')

  blocker.enableBlockingInSession(session)

  // blocker.on('request-blocked', (request: Request) => {
  //   console.log('blocked', request.tabId, request.url)
  // })

  // blocker.on('request-redirected', (request: Request) => {
  //   console.log('redirected', request.tabId, request.url)
  // })

  // blocker.on('request-whitelisted', (request: Request) => {
  //   console.log('whitelisted', request.tabId, request.url)
  // })

  // blocker.on('csp-injected', (request: Request) => {
  //   console.log('csp', request.url)
  // })

  // blocker.on('script-injected', (script: string, url: string) => {
  //   console.log('script', script.length, url)
  // })

  // blocker.on('style-injected', (style: string, url: string) => {
  //   console.log('style', style.length, url)
  // })
}

export default adblockerService
