import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  MenuItemConstructorOptions,
} from "electron";
import { release } from "os";
import { join } from "path";
import remote from "@electron/remote/main";

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

const isDev = !app.isPackaged;
const URL = isDev
  ? `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`
  : `file://${join(app.getAppPath(), "dist/render/index.html")}`;

let mainWindow: BrowserWindow | null = null; // 主窗口
let selectPartWindow: BrowserWindow | null; // 分p窗口

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    // title: "Main window", // 标题，默认为"Electron"。如果由loadURL()加载的HTML文件中含有标签<title>，此属性将被忽略
    width: 375,
    height: 500,
    frame: false, // 是否有边框
    webPreferences: {
      webviewTag: true,
      preload: join(__dirname, "../preload/index.cjs"), // 预先加载指定的脚本
      nativeWindowOpen: false,
      webSecurity: false,
    },
    autoHideMenuBar: !isDev,
  });

  mainWindow.loadURL(URL);

  remote.enable(mainWindow.webContents); // 渲染进程中使用remote

  // Test active push message to Renderer-process
  // mainWindow.webContents.on("did-finish-load", () => {
  //   mainWindow?.webContents.send(
  //     "main-process-message",
  //     new Date().toLocaleString()
  //   );
  // });

  mainWindow.setAlwaysOnTop(true, "torn-off-menu");

  mainWindow.on("closed", () => {
    mainWindow = null;
    console.log("主窗口：已关闭");
    // 主窗口关闭后如果3s都没有重新创建，就认为程序是被不正常退出了（例如windows下直接alt+f4），关闭整个程序
    if (process.platform != "darwin") {
      setTimeout(() => {
        console.log("主窗口：关闭超过 3s 未重新创建，程序自动退出");
        app.quit();
      }, 3000);
    }
  });

  // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}

const createMenu = () => {
  // 菜单
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ],
    },
    {
      label: "Shortcuts",
      submenu: [
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { role: "selectAll" },
        {
          label: "Backward",
          accelerator: "Esc",
          click() {
            mainWindow?.webContents.send("press-esc");
          },
        },
        {
          label: "Volume+",
          accelerator: "Up",
          click() {
            mainWindow?.webContents.send("change-volume", "up");
          },
        },
        {
          label: "Volume-",
          accelerator: "Down",
          click() {
            mainWindow?.webContents.send("change-volume", "down");
          },
        },
      ],
    },
    {
      label: "Debug",
      submenu: [
        {
          label: "Inspect Main Window",
          accelerator: "CmdOrCtrl+1",
          click() {
            mainWindow?.webContents.openDevTools();
          },
        },
        {
          label: "Inspect Select Part Window",
          accelerator: "CmdOrCtrl+2",
          click() {
            selectPartWindow?.webContents.openDevTools();
          },
        },
        {
          label: "Inspect Config Window",
          accelerator: "CmdOrCtrl+3",
          click() {
            // mainWindow?.webContents.send("test", 123);
          },
        },
        {
          label: "Inspect Webview",
          accelerator: "CmdOrCtrl+4",
          click() {
            mainWindow?.webContents.send("openWebviewDevTools");
          },
        },
      ],
    },
    {
      role: "window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 当运行第二个实例时, 将会聚焦到主窗口
app.on("second-instance", () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

ipcMain.on("close-main-window", () => {
  if (process.platform == "darwin") {
    mainWindow?.close();
    selectPartWindow?.hide();
  } else {
    app.quit();
  }
});

// 初始化选分p窗口
const createSelectPartWindow = () => {
  console.log("选p窗口：开始创建");

  selectPartWindow = new BrowserWindow({
    width: 200,
    height: 300,
    frame: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"), // 预先加载指定的脚本
    },
  });

  selectPartWindow.loadURL(`${URL}#/select-part`);

  remote.enable(selectPartWindow.webContents); // 渲染进程中使用remote

  selectPartWindow.setAlwaysOnTop(true, "modal-panel");
  selectPartWindow.on("closed", () => {
    selectPartWindow = null;
    console.log("选p窗口：已关闭");
  });
  console.log("选p窗口：已创建");
  // 切换、可开可关
  const showSelectPartWindow = () => {
    console.log("选p窗口：打开");
    if (!mainWindow || !selectPartWindow) {
      return;
    }
    var p = mainWindow.getPosition(),
      s = mainWindow.getSize(),
      pos = [p[0] + s[0] + 10, p[1]];
    selectPartWindow.setPosition(pos[0], pos[1]);
    selectPartWindow.show();
  };
  ipcMain.on("toggle-select-part-window", () => {
    if (selectPartWindow && selectPartWindow.isVisible()) {
      selectPartWindow.hide();
    } else {
      showSelectPartWindow();
    }
  });
  // 仅开启
  ipcMain.on("show-select-part-window", showSelectPartWindow);
};

// electron 初始化完成
app
  .whenReady()
  .then(() => {
    // 初始化 remote
    remote.initialize();
    createWindow();
    createMenu();
    createSelectPartWindow();
  })
  .then(() => {
    selectPartWindow?.webContents.on("did-finish-load", () => {
      selectPartWindow?.webContents.send("windowID", {
        mainWindow: mainWindow?.id,
      });
    });
    mainWindow?.webContents.on("did-finish-load", () => {
      mainWindow?.webContents.send("windowID", {
        selectPartWindow: selectPartWindow?.id,
      });
    });
  });
