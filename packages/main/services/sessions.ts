import { registerProtocol } from '../models/protocol'
import { session } from 'electron'

export class SessionsService {
  constructor(_session: Electron.Session = session.defaultSession) {
    registerProtocol(_session)
  }
}
