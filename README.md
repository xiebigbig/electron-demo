## 🌈 diygw-electron

DIYGW可视化客户端，解决跨域API请求、快速保存文件至本地、调起本地测试环境页面

技术栈：Electron + Vue 3 + TypeScript + Vite 桌面客户端管理

## 🌈 DIYGW可视化工具介绍

DIY官网可视化工具做好的可视化拖拽开发工具无须编程、零代码基础、所见即所得设计工具支持轻松在线可视化导出微信小程序、支付宝小程序、头条小程序、H5、WebApp、UNIAPP等源码 支持组件库,高颜值,卡片,列表,轮播图,导航栏,按钮,标签,表单,单选,复选,下拉选择,多层选择,级联选择,开关,时间轴,模态框,步骤条,头像,进度条等
丰富的按钮点击事件供选择、自定义方法调用、支持API在线调试、数据动态绑定、For循环数据绑定、IF判断绑定等

DIY官网可视化工具打造低代码可视化一键生成导出源码工具设计一次打通设计师+产品经理+技术开发团队必备低代码可视化工具。从想法到原型到源码，一步到位低代码生成源码工具

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

  mainWin.loadURL(URL)

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
