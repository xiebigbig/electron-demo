import { app, BrowserWindow, globalShortcut, dialog, screen } from "electron";
import { MainMenu } from './menu'
import { info,reloadPage } from './utils'
import path from 'path'

const isDev = !app.isPackaged

/**
 * 创建主窗口
 */
export async function createWindow() {
  //顶部菜单
  const mainMenu = new MainMenu([
    {
      label: '刷新',
      // role: 'forceReload',
      accelerator: 'F5',
      click:()=>{
        reloadPage(BrowserWindow.getFocusedWindow())
      }
    },
    {
      label: '浏览器调试',
      accelerator: 'F12',
      role: 'toggleDevTools'
    },
    {
      label: "关于",
      accelerator: 'F10',
      click: () => {
        info()
      }
    }/*,
    {
      label: "关闭",
      click: () => {
        if(BrowserWindow.getFocusedWindow()==mainWin){
          BrowserWindow.getFocusedWindow().close()
        }else{
          dialog.showMessageBox({
            type: 'info',
            title: '提示',
            noLink:true,
            message: '确认关闭？',
            buttons: ['确认','取消'],  
            cancelId: 1,
          }).then(idx => {
            if (idx.response != 1) {
              BrowserWindow.getFocusedWindow().close()
            }
          })
        }
      }
    }*/
  ])
  mainMenu.createMainMenu()

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const preloadPath = path.join(__dirname, '../preload/index.js')
  const mainWin = new BrowserWindow({
    width: width,
    height: height,
    show: false,
    webPreferences: {
      webSecurity: false, //解决跨域
      preload: preloadPath
    }
  })
  // const URL = isDev
  //   ? process.env.DS_RENDERER_URL
  //   : `file://${path.join(app.getAppPath(), 'dist/renderer/index.html')}`

  const URL = isDev ? 'http://localhost:9091/' : 'https://www.diygw.com'

  mainWin.loadURL(URL)

  mainWin.once('ready-to-show', () => {
    mainWin && mainWin.show()
    mainWin?.maximize()
  })

  mainWin.on('focus', () => {
    // mac下快捷键失效的问题
    if (process.platform === 'darwin') {
      let contents = mainWin.webContents
      globalShortcut.register('CommandOrControl+C', () => {
        contents.copy()
      })

      globalShortcut.register('CommandOrControl+V', () => {
        contents.paste()
      })

      globalShortcut.register('CommandOrControl+X', () => {
        contents.cut()
      })

      globalShortcut.register('CommandOrControl+A', () => {
        contents.selectAll()
      })
    }
  })

  mainWin.on('blur', () => {
    if (process.platform === 'darwin') {
      globalShortcut.unregisterAll() // 注销键盘事件
    }
  })
  //mainWin要关闭时的方法↓
  mainWin.on('close', e => {
    e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
    dialog.showMessageBox({
      type: 'info',
      title: '提示',
      message: '确认退出？',
      noLink:true,
      buttons: ['确认', '取消'],  
      cancelId: 1,
    }).then(idx => {
      if (idx.response == 1) {
        e.preventDefault();
      } else {
        app.exit();
      }
    })
  });


  //设置弹出窗口注入Preload
  function setWindowOpenHandler(win){
      win.webContents.setWindowOpenHandler(data => {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            width: width,
            height: height,
            webPreferences: {
              webSecurity: false, //解决跨域
              preload: preloadPath
            }
          }
        };
      })

      //监听窗口新建窗口
      win.webContents.on('did-create-window', (window, details) => {
          window.on('close',e=>{
              e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
              if(details.options['close']){
                window.close()
              }else{
                dialog.showMessageBox({
                  type: 'info',
                  noLink:true,
                  title: '提示',
                  message: '确认关闭吗？',
                  buttons: ['确认', '取消'],  
                  cancelId: 1,
                }).then(idx => {
                  if (idx.response == 1) {
                    e.preventDefault();
                  } else {
                    details.options['close'] = 1
                    window.close()
                  }
                })
              }
          })
          setWindowOpenHandler(window)
      })
  }

  setWindowOpenHandler(mainWin)
  
  return mainWin
}