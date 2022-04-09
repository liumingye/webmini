import { app } from '@electron/remote'
import is from 'electron-is'
import { arch, release, type } from 'os'
import { version as VueVersion } from 'vue'

class Versions {
  private isLinuxSnap() {
    return is.linux() && !!process.env['SNAP'] && !!process.env['SNAP_REVISION']
  }
  public App = app.getVersion()
  public 'Vue.js' = VueVersion
  public Electron = process.versions.electron
  public Chromium = process.versions.chrome
  public 'Node.js' = process.versions.node
  public V8 = process.versions.v8
  public OS = `${type} ${arch} ${release}${this.isLinuxSnap() ? ' snap' : ''}`
}

export default Versions
