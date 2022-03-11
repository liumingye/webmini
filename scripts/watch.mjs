import { spawn } from 'child_process'
import { createServer, build } from 'vite'
import electron from 'electron'

const RESET = '\x1b[0m'
const FG_RED = '\x1b[31m'

// https://github.com/yarnpkg/yarn/issues/5063
function disallowNpm() {
  const execPath = process.env.npm_execpath
  if (!execPath.includes('yarn')) {
    console.log(FG_RED)
    console.log(`\twebmini supports only Yarn package manager.`)
    console.log(RESET)
    console.log(
      '\n\tPlease visit https://yarnpkg.com/getting-started/install to find instructions on how to install Yarn.\n',
    )
    throw new Error('Invalid package manager')
  }
}

try {
  disallowNpm()
} catch (e) {
  process.exit(1)
}

/**
 * @type {(server: import('vite').ViteDevServer) => Promise<import('rollup').RollupWatcher>}
 */
function watchMain(server) {
  /**
   * @type {import('child_process').ChildProcessWithoutNullStreams | null}
   */
  let electronProcess = null
  const address = server.httpServer.address()
  const env = Object.assign(process.env, {
    VITE_DEV_SERVER_HOST: address.address,
    VITE_DEV_SERVER_PORT: address.port,
  })

  return build({
    configFile: 'packages/main/vite.config.ts',
    mode: 'development',
    plugins: [
      {
        name: 'electron-main-watcher',
        writeBundle() {
          electronProcess && electronProcess.kill()
          electronProcess = spawn(electron, ['.'], { stdio: 'inherit', env })
        },
      },
    ],
    build: {
      watch: true,
    },
  })
}

/**
 * @type {(server: import('vite').ViteDevServer) => Promise<import('rollup').RollupWatcher>}
 */
function watchPreload(server) {
  return build({
    configFile: 'packages/preload/vite.config.ts',
    mode: 'development',
    plugins: [
      {
        name: 'electron-preload-watcher',
        writeBundle() {
          server.ws.send({ type: 'full-reload' })
        },
      },
    ],
    build: {
      watch: true,
    },
  })
}

/**
 * @type {(server: import('vite').ViteDevServer) => Promise<import('rollup').RollupWatcher>}
 */
function watchInject(server) {
  return build({
    configFile: 'packages/inject/vite.config.ts',
    mode: 'development',
    plugins: [
      {
        name: 'electron-inject-watcher',
        writeBundle() {
          server.ws.send({ type: 'full-reload' })
        },
      },
    ],
    build: {
      watch: true,
    },
  })
}

// bootstrap
const server = await createServer({
  configFile: 'packages/renderer/vite.config.ts',
})

/**
 * @type {(server: import('vite').ViteDevServer) => Promise<import('rollup').RollupWatcher>}
 */
function pluginBilibili(server) {
  return build({
    configFile: 'resources/plugins/bilibili/vite.config.ts',
    mode: 'development',
    plugins: [
      {
        name: 'electron-plugin-bilibili',
        writeBundle() {
          server.ws.send({ type: 'full-reload' })
        },
      },
    ],
    build: {
      watch: true,
    },
  })
}

await server.listen()
await watchPreload(server)
await watchInject(server)
await pluginBilibili(server)
await watchMain(server)
