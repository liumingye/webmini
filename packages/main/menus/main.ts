import { Menu, MenuItemConstructorOptions, MenuItem, app, shell } from 'electron'
import { Application } from '../application'

export const getMainMenu = () => {
  const application = Application.instance
  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      label: app.name,
      submenu: [
        { label: `关于 ${app.name}`, role: 'about' },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { type: 'separator' },
        { label: `隐藏 ${app.name}`, role: 'hide' },
        { label: '隐藏其他', role: 'hideOthers' },
        { label: '全部显示', role: 'unhide' },
        { type: 'separator' },
        { label: `退出 ${app.name}`, role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '恢复', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '拷贝', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '删除', role: 'delete' },
        { label: '全选', role: 'selectAll' },
        { type: 'separator' },
        {
          label: '返回',
          accelerator: 'Esc',
          click() {
            application.mainWindow?.send('press-esc')
          },
        },
        {
          label: '提高音量',
          accelerator: 'Up',
          click() {
            application.mainWindow?.send('change-volume', 'up')
          },
        },
        {
          label: '降低音量',
          accelerator: 'Down',
          click() {
            application.mainWindow?.send('change-volume', 'down')
          },
        },
      ],
    },
    {
      label: '窗口',
      role: 'window',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '缩放', role: 'zoom' },
        { label: '关闭', role: 'close' },
      ],
    },
    {
      label: '帮助',
      role: 'help',
      submenu: [
        {
          label: '清理缓存',
          click() {
            application.clearSensitiveDirectories()
          },
        },
        {
          label: '重置应用',
          click() {
            application.clearAllUserData()
          },
        },
        { type: 'separator' },
        {
          label: '报告问题',
          click() {
            shell.openExternal('https://github.com/liumingye/bilimini/issues')
          },
        },
        { type: 'separator' },
        { label: 'Inspect Main', role: 'toggleDevTools' },
        {
          label: 'Inspect Webview',
          accelerator: 'CmdOrCtrl+i',
          click() {
            application.mainWindow?.send('openWebviewDevTools')
          },
        },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}
