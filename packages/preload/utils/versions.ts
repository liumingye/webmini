import { app } from '@electron/remote'
import { version } from 'vue'
import { arch, release, type } from 'os'
import { isLinuxSnap } from '../../common/platform'

class Versions {
  public App = app.getVersion()
  public 'Vue.js' = version
  public Electron = process.versions.electron
  public Chromium = process.versions.chrome
  public 'Node.js' = process.versions.node
  public V8 = process.versions.v8
  public OS = `${type} ${arch} ${release}${isLinuxSnap ? ' snap' : ''}`
}

export default Versions
