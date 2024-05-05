## 🌈 electron

客户端，解决跨域API请求、快速保存文件至本地、调起本地测试环境页面

技术栈：Electron + Vue 3 + TypeScript + Vite 桌面客户端管理

src\main\window.ts
```
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

  exampleProcess = spawn("remote.exe",['-s','-l']);
  if (exampleProcess) {
    process.kill(exampleProcess.pid);
  }
  MainWindow.loadFile(join(__dirname, "../dist/index.html"));// or mainWin.loadURL(URL)

  MainWindow.webContents.executeJavaScript(
    `window.location.hash = '#/index';`
  );

  mainWin.once('ready-to-show', () => {
    mainWin && mainWin.show()
    mainWin?.maximize()
  })

```



## 🌈 使用说明


```bash
# 克隆项目
git clone https://github.com/html580/diygw-electron.git

# 进入项目 桌面 cmd 运行
cd diygw-electron

# 推荐使用yarn 也可参照后面直接使用npm
# 安装 yarn
npm install -g yarn

# 安装依赖
yarn

# 运行项目
yarn dev

# 打包发布
yarn build

# 打包成功存放在dist_electron目录下


# 或者直接使用NPM
# 安装依赖
npm install

# 运行项目
npm run dev

# 打包发布
npm run build

```
