import { shellEnvSync } from './shell-env'

export default function fixPath() {
  if (process.platform === 'win32') {
    return
  }

  const env = shellEnvSync()

  process.env = env
}
