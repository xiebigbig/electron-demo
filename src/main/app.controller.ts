import { Controller, IpcHandle, IpcOn, Window } from 'einf'
import { BrowserWindow, dialog, clipboard, shell, screen } from 'electron'
import { factory, Conf as JsonConf } from 'electron-json-config'
import fse from 'fs-extra'
import { download } from 'electron-dl';


@Controller()
export class AppController {
  private version: String = process.env.VERSION

  private dbConfig: JsonConf
  private uniappWin: BrowserWindow | null = null

  constructor(
    @Window() private mainWin: BrowserWindow,
  ) {
    this.dbConfig = factory()
  }


  public openTest(config, data) {
    //如果打开的是后台管理界面
    if (config.type) {
      //不是http表示本地目录
      let ishttp = /^http(s)?:\/\/.*/i.test(data.url);
      if (config.type == 'adminh5' || !ishttp) {
        let url = data.url
        //如果用户配置的是静态html页面
        if (url.indexOf('#') > 0 && url.indexOf("main.html") > 0) {
          url = url.substring(0, url.indexOf('#'))
          shell.openExternal(url + '#/' + config.page + ".html")
          // this.uniappWin.loadURL(url + '#/' + config.page+".html")
          // this.uniappWin.setAlwaysOnTop(true, 'floating')
        } else if (url.indexOf("main.html")) {
          // this.uniappWin.loadURL(url + '#/' + config.page+".html")
          // this.uniappWin.setAlwaysOnTop(true, 'floating')
          shell.openExternal(url + '#/' + config.page + ".html")
        } else {
          // this.uniappWin.loadURL(url + config.page+".html")
          shell.openExternal(url + '#/' + config.page + ".html")
        }
      } else {
        let url = data.url
        if (url.indexOf('#') > 0) {
          url = url.substring(0, url.indexOf('#'))
        }
        shell.openExternal(url + '#/' + config.page)
        // this.uniappWin.loadURL(url + '#/' + config.page)
        // this.uniappWin.setAlwaysOnTop(true, 'floating')
      }
    } else {
      const projectPath = data['uniapp'] + '/pages/'
      const pageFile = projectPath + config.page + '.vue'
      if (!fse.existsSync(pageFile)) {
        //给渲染进程发送消息
        this.mainWin.webContents.send('message', { cmd: 'no-file-exist' })
        return
      }
      let url = data.url
      if (url.indexOf('#') > 0) {
        url = url.substring(0, url.indexOf('#'))
      }
      this.uniappWin.loadURL(url + '#/pages/' + config.page)
      this.uniappWin.setAlwaysOnTop(true, 'floating')
    }
  }

  /**
   * 打开uniapp调试窗口 或者 重新加载窗口
   * @param config 
   */
  @IpcOn('diygw-open-uniapp')
  public openUniapp(config: any) {
    const data: any = this.dbConfig.get(config.id)
    if (data && data.url) {
      let ishttp = /^http(s)?:\/\/.*/i.test(data.url);
      if (!this.uniappWin && ishttp && !config.type) {
        this.uniappWin = new BrowserWindow({
          width: config.width || 388,
          height: config.height || 680,
          center: true
        })
        this.uniappWin.on('closed', () => {
          this.uniappWin = null
        })
      }
      this.openTest(config, data)
    } else {
      dialog.showMessageBox({
        type: 'warning',
        title: '警告',
        buttons: ['确定'],
        message: '请先配置本地调试地址',
        noLink: true
      })
    }
  }

  /**
   * 切换页面刷新页面
   */
  @IpcOn('diygw-change-uniapp')
  public changeUniapp(config: any) {
    const data: any = this.dbConfig.get(config.id)
    if (data && data.url && this.uniappWin) {
      this.openTest(config, data)

    }
  }

  /**
   * 获取配置
   */
  @IpcHandle('diygw-get-config')
  public getConfig(id: any) {
    return this.dbConfig.get(id)
  }

  /**
  * 设置配置
  */
  @IpcHandle('diygw-set-config')
  public setConfig(config: any) {
    this.dbConfig.set(config.id, config)
    return true
  }

  /**
   * 获取当前源码配置的目录
   */
  @IpcHandle('diygw-select-dir')
  public selectDir(config: any) {
    const filePaths = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'createDirectory']
    })
    if (!filePaths) {
      return null
    }
    //判断是否移动端配置,如果非移动端的都直接返回
    if (config.mobile) {
      if (config.type === 'uniapp') {
        const pagefile = filePaths[0] + '/pages.json'
        if (fse.existsSync(pagefile)) {
          return filePaths[0]
        } else {
          return 'error'
        }
      } else if (config.type === 'h5') {
        return filePaths[0]
      } else {
        const pagefile = filePaths[0] + '/app.json'
        if (fse.existsSync(pagefile)) {
          return filePaths[0]
        } else {
          return 'error'
        }
      }
    } else if (config.type === 'eleadmin' || config.type === 'eleoption') {
      //前后分离项目
      const pagefile = filePaths[0] + '/package.json'
      if (fse.existsSync(pagefile)) {
        return filePaths[0]
      } else {
        return 'error'
      }
    } else if (config.type === 'adminh5') {
      //静态后台h5页面
      const pagefile = filePaths[0] + '/siteinfo.js'
      if (fse.existsSync(pagefile)) {
        return filePaths[0]
      } else {
        return 'error'
      }
    } else {
      return filePaths[0]
    }
  }

  /**
   * 下载文件
   */
  @IpcOn('diygw-down-file')
  public async downloadFile({ url }: any) {
    const win: any = BrowserWindow.getFocusedWindow();
    await download(win, url, {
      saveAs: true
    });
  }

  /**
   * 获取当前源码配置的目录
   */
  @IpcHandle('diygw-save-code')
  public async saveCode(config: any) {
    const data: any = this.dbConfig.get(config.id)
    //判断是否移动端配置,如果非移动端的都直接返回
    if (config.mobile) {
      if (config.code.type === 'uniapp') {
        //获取页面配置代码
        const pageConfig = data[config.code.type] + '/pages.json'
        const configData = fse.readJSONSync(pageConfig)
        let jsonValue = JSON.parse(config["code"]["jsonValue"])
        //判断分包
        if (jsonValue.subPackages) {
          let subPackages = configData.subPackages
          let group = jsonValue.subPackages[0].root
          //判断是否有分包
          if (subPackages && subPackages.length > 0) {
            let findPacksIndex = []
            //获取所有的分包
            configData.subPackages.forEach((item, index) => {
              if (item.root == group) {
                findPacksIndex.push(index)
              }
            })
            if (findPacksIndex.length > 0) {
              let findPagesIndex = []
              //得到第几个分包
              configData.subPackages[findPacksIndex[0]].pages.forEach((item, index) => {
                //分包路径
                if (item.path == config.data.path) {
                  findPagesIndex.push(index)
                }
              })
              //如果找到的页面大于1个
              if (findPagesIndex.length > 0) {
                configData.subPackages[findPacksIndex[0]].pages.splice(
                  findPagesIndex[0],
                  1,
                  jsonValue.subPackages[0].pages[0]
                )

                //移除多余的页面标识
                if (findPagesIndex.length > 1) {
                  for (let i = 1; i <= findPagesIndex.length - 1; i++) {
                    configData.subPackages[findPacksIndex[0]].pages.splice(findPagesIndex[i], 1)
                  }
                }
              } else {

                configData.subPackages[findPacksIndex[0]].pages.push(jsonValue.subPackages[0].pages[0])
              }

              //移除多余的页面标识
              if (findPacksIndex.length > 1) {
                for (let i = 1; i <= findPacksIndex.length - 1; i++) {
                  configData.subPackages.splice(findPacksIndex[i], 1)
                }
              }

            } else {
              //如果分组不存在，新增一个分组
              configData.subPackages.push(jsonValue.subPackages[0])
            }
          } else {
            //如果分组不存在，新增一个分组
            configData.subPackages = jsonValue.subPackages
          }
          const projectPath = data[config.code.type] + '/' + group + '/'
          const pageFile = projectPath + config.data.path + '.vue'
          //保存页面代码
          fse.outputFileSync(pageFile, config['code']['htmlValue'])
        } else {
          let findPagesIndex = []
          //判断页面标识是否存在相同的
          configData.pages.forEach((item, index) => {
            if (item.path == 'pages/' + config.data.path) {
              findPagesIndex.push(index)
            }
          })

          //如果存在相同的，由于某些情况下可能会异常，会出现相同的页面标识
          if (findPagesIndex.length > 0) {
            configData.pages.splice(
              findPagesIndex[0],
              1,
              JSON.parse(config['code']['jsonValue'])
            )
            //移除多余的页面标识
            if (findPagesIndex.length > 1) {
              for (let i = 1; i <= findPagesIndex.length - 1; i++) {
                configData.pages.splice(findPagesIndex[i], 1)
              }
            }

          } else {
            configData.pages.push(JSON.parse(config['code']['jsonValue']))
          }
          const projectPath = data[config.code.type] + '/pages/'
          const pageFile = projectPath + config.data.path + '.vue'
          //保存页面代码
          fse.outputFileSync(pageFile, config['code']['htmlValue'])
        }
        fse.outputFileSync(pageConfig, JSON.stringify(configData, undefined, 4))
      } else if (config.code.type === 'h5') {
        const projectPath = data[config.code.type]
        const pageFile = projectPath + config.data.path + '.html'
        fse.outputFileSync(pageFile, config['code']['htmlValue'])
      } else {
        let projectPath = data[config.code.type]
        const htmlTypes = <any>{
          weixin: 'wxml',
          alipay: 'axml',
          dingtalk: 'axml',
          finclip: 'fxml',
          qq: 'qml',
          baidu: 'swan',
          bytedance: 'ttml'
        }
        const cssTypes = <any>{
          weixin: 'wxss',
          alipay: 'acss',
          dingtalk: 'acss',
          finclip: 'ftss',
          qq: 'qss',
          baidu: 'css',
          bytedance: 'ttss'
        }

        //设置新页面配置代码
        const pageConfig = data[config.code.type] + '/app.json'
        const configData = fse.readJSONSync(pageConfig)

        let jsonValue = JSON.parse(config["code"]["jsonValue"])
        //判断分包
        if (jsonValue.subPackages) {
          let subPackages = configData.subPackages
          let group = jsonValue.subPackages[0].root
          projectPath = projectPath + '/' + group + '/'
          //判断是否有分包
          if (subPackages && subPackages.length > 0) {
            let findPacksIndex = []
            //获取所有的分包
            configData.subPackages.forEach((item, index) => {
              if (item.root == group) {
                findPacksIndex.push(index)
              }
            })
            if (findPacksIndex.length > 0) {
              let findPagesIndex = []
              //得到第几个分包
              configData.subPackages[findPacksIndex[0]].pages.forEach((item, index) => {
                //分包路径
                if (item == config.data.path) {
                  findPagesIndex.push(index)
                }
              })
              //如果找到的页面大于1个
              if (findPagesIndex.length > 0) {
                configData.subPackages[findPacksIndex[0]].pages.splice(
                  findPagesIndex[0],
                  1,
                  jsonValue.subPackages[0].pages[0].path
                )
                //移除多余的页面标识
                if (findPagesIndex.length > 1) {
                  for (let i = 1; i <= findPagesIndex.length - 1; i++) {
                    configData.subPackages[findPacksIndex[0]].pages.splice(findPagesIndex[i], 1)
                  }
                }
              } else {
                configData.subPackages[findPacksIndex[0]].pages.push(jsonValue.subPackages[0].pages[0].path)
              }

              //移除多余的分包标识
              if (findPacksIndex.length > 1) {
                for (let i = 1; i <= findPacksIndex.length - 1; i++) {
                  configData.subPackages.splice(findPacksIndex[i], 1)
                }
              }
            } else {
              //如果分组不存在，新增一个分包
              configData.subPackages.push({
                "root": group,
                "pages": [jsonValue.subPackages[0].pages[0].path]
              })
            }
          } else {
            //如果分组不存在，新增一个分组
            configData.subPackages = jsonValue.subPackages
          }
        } else {
          projectPath = projectPath + '/pages/'
          let findPagesIndex = []
          configData.pages.forEach((item, index) => {
            if (item == 'pages/' + config.data.path) {
              findPagesIndex.push(index)
            }
          })
          if (findPagesIndex.length > 0) {
            configData.pages.splice(
              findPagesIndex[0],
              1,
              'pages/' + config.data.path
            )
            //移除多余的页面标识
            if (findPagesIndex.length > 1) {
              for (let i = 1; i <= findPagesIndex.length - 1; i++) {
                configData.pages.splice(findPagesIndex[i], 1)
              }
            }
          } else {
            configData.pages.push('pages/' + config.data.path)
          }
        }
        fse.outputFileSync(pageConfig, JSON.stringify(configData, undefined, 4))
        const htmlPageFile =
          projectPath + config.data.path + '.' + htmlTypes[config.code.type]
        fse.outputFileSync(htmlPageFile, config['code']['htmlValue'])

        const cssPageFile =
          projectPath + config.data.path + '.' + cssTypes[config.code.type]
        fse.outputFileSync(cssPageFile, config['code']['cssValue'])

        const jsPageFile = projectPath + config.data.path + '.js'
        fse.outputFileSync(jsPageFile, config['code']['jsValue'])

        const jsonPageFile = projectPath + config.data.path + '.json'
        fse.outputFileSync(jsonPageFile, config['code']['jsonValue'])



      }
    } else if (config.code.type === 'eleadmin' || config.code.type === 'eleoption') {
      const projectPath = data[config.code.type]
      //生成vue文件
      const pageFile = projectPath + "/src/views/" + config.data.path + '.vue'
      fse.outputFileSync(pageFile, config['code']['htmlValue'])

      //替换页面路由
      const pageConfig = data[config.code.type] + '/src/router/frontRoute.ts'
      fse.writeFileSync(pageConfig, config['code']['jsValue'])

      /*
      const frontRoute = fse.readFileSync(pageConfig).toString()
      const jsValue = config['code']['jsValue'];
      增加更新路由
      //获取当前页面路径
      const path = "//path:/"
      const findPath = jsValue.substring(jsValue.indexOf(path)+path.length,jsValue.indexOf("{")).trim();
      //判断路径是否已存在
      if(frontRoute.indexOf("'"+findPath+"'")>0){
           //插入开始
           const  search = "export const frontRoutes={";
           if(frontRoute.indexOf(search)>=0){
               const startContent = frontRoute.substring(0,frontRoute.indexOf(search));
               const endContent = frontRoute.substring(frontRoute.indexOf(search)+search.length);
               const result = startContent + "\rroutes[0].children?.push("+config['code']['jsValue'].substring(config['code']['jsValue'].indexOf("{"))+")\r" + search + endContent
               fse.writeFileSync(pageConfig,result)
           }
      }
      */

    } else if (config.code.type === 'adminh5') {
      const projectPath = data[config.code.type]
      //保存HTML文件
      const pageFile = projectPath + "/" + config.data.path + '.html'
      fse.outputFileSync(pageFile, config['code']['htmlValue'])

      //保存配置siteinfojs
      const siteinfoFile = projectPath + '/siteinfo.js'
      fse.outputFileSync(siteinfoFile, config['code']['jsonValue'])

    }
  }

  /**
 * 设置配置
 */
  @IpcHandle('diygw-get-version')
  public getVersion(config: any) {
    return this.version
  }

  /**
  * 复制内容
  */
  @IpcHandle('diygw-copy')
  public copyText(data: any) {
    if (data.type == 'html') {
      clipboard.writeHTML(data.text)
    } else {
      clipboard.writeText(data.text)
    }
  }

  /**
  * 下载地址
  */
  @IpcHandle('diygw-down')
  public downLink(data: any) {
    shell.openExternal(data.text)
  }

}
