import { session } from 'electron'
import { registerProtocol } from '../models/protocol'

export class SessionsService {
  constructor(_session: Electron.Session = session.defaultSession) {
    registerProtocol(_session)
  }
}
