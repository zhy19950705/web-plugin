import { app, BrowserWindow, shell, ipcMain, nativeImage, Tray, Menu } from 'electron'
import { release } from 'node:os'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { update } from './update'
import login from './login'

globalThis.__filename = fileURLToPath(import.meta.url)
globalThis.__dirname = dirname(__filename)

// 资源路径处理
const RESOURCES_PATH = app.isPackaged
  ? process.resourcesPath
  : path.join(process.cwd())

const getAssetPath = (...paths: string[]) => {
  return path.join(RESOURCES_PATH, ...paths)
}

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST
const isDevelopment = process.env.VITE_DEV_SERVER_URL ? true : false

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
function getContextMenu() {
  return Menu.buildFromTemplate([
    {
      label: `当前版本: ${app.getVersion()}(点击获取最新版本)`,
      click: () => {
        const repoUrl = 'https://github.com/zhy19950705/web-plugin/releases';
        shell.openExternal(repoUrl);
      }
    },
    {
      label: '打开开发者工具',
      click: () => {
        if (win) {
          win.webContents.openDevTools();
          const bounds = win.getBounds();
          win.setBounds({
            ...bounds,
            width: 1500
          });
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    },
  ]);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | undefined
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.mjs')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    width: isDevelopment ? 1500 : 500,
    height: 700,
    webPreferences: {
      // nodeIntegration: true,
      // contextIsolation: false,
      preload,
      devTools: true,
      // // 添加安全相关配置
      // sandbox: false,
      // webSecurity: true
    },
    frame: false,
    resizable: false,
    show: false,
    title: 'Main window',
    skipTaskbar: true,
    // 在 macOS 中隐藏 dock 图标
    ...(process.platform === 'darwin' ? {
      dock: {
        hide: true
      }
    } : {}),
  })

  if (url) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('devtools-opened', () => {
    const bounds = win!.getBounds();
    win!.setBounds({
      ...bounds,
      width: 1500
    });
    setWindowPositionBelowTray();
  });
  
  win.webContents.on('devtools-closed', () => {
    const bounds = win!.getBounds();
    win!.setBounds({
      ...bounds,
      width: 500 // 这里改成你想要的默认宽度
    });
    setWindowPositionBelowTray();
  });

  // Apply electron-updater
  update(win)
}

// 保存窗口状态
let windowState = {
  position: null,
  isVisible: false
};

let tray: Tray | null = null

function createTray() {
  // 创建托盘图标
  const icon = nativeImage.createFromPath(getAssetPath('build', 'icon.png'));
  // 设置图标大小（对于 macOS 建议使用 18x18）
  const resizedIcon = icon.resize({ width: 18, height: 18 });
  tray = new Tray(resizedIcon);
  
  // 为 macOS 优化的点击处理
  const toggleWindow = () => {
    if (!win) return;
    
    if (win.isVisible()) {
      win.hide();
      windowState.isVisible = false;
      // 移除点击事件监听器
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
      win.removeListener('blur', hideWindow);
    } else {
      // 在 macOS 上，将窗口定位到托盘图标下方
      setWindowPositionBelowTray();
      win.show();
      windowState.isVisible = true;
      // 添加点击事件监听器
      win.on('blur', hideWindow);
    }
  };

  // 添加隐藏窗口的函数
  const hideWindow = () => {
    if (!win) return;
    win.hide();
    windowState.isVisible = false;
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  };

  // 左键点击：切换窗口显示/隐藏
  tray.on('click', toggleWindow);
  
  // 右键点击：显示菜单
  tray.on('right-click', () => {
    tray?.popUpContextMenu(getContextMenu());
  });
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  // 在 macOS 上隐藏 dock 图标
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
})

app.on('window-all-closed', () => {
  win = undefined;
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// 添加登录处理
ipcMain.handle('handle-login', async (_, args) => {
   login(args);
});

function setWindowPositionBelowTray() {
  if (!win || !tray) return;
  const trayBounds = tray.getBounds();
  const windowBounds = win.getBounds();
  win.setPosition(
    Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2)),
    Math.round(trayBounds.y + trayBounds.height)
  );
}

