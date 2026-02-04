
/**
 * App Update Utility
 * Handles both WGT (Hot Update) and PKG (Full Install) updates.
 */

export interface UpdateResult {
  hasUpdate: boolean
  type?: 'wgt' | 'pkg'
  url?: string
  version?: string
  note?: string
  force?: boolean // Whether to force update
}

// Mock API function - Replace with your actual API endpoint
const fetchUpdateInfo = async (currentVersion: string, currentVersionCode: string): Promise<UpdateResult> => {
  // TODO: Replace this with actual uni.request to your backend
  console.log('Checking update for version:', currentVersion, 'code:', currentVersionCode)
  
  // 模拟更新逻辑
  // 实际项目中请根据后端返回的数据进行判断
  if (Number(currentVersionCode) < 102) {
      return {
          hasUpdate: true,
          type: 'pkg', // APK 整包更新
          version: '1.0.2',
          // 替换为您实际的下载链接
          url: 'https://apk.tos-cn-beijing.volces.com/x.apk',
          // url: 'https://dldir1.qq.com/weixin/android/weixin8042android2460_arm64.apk', 
          note: '1. 修复已知Bug\n2. 优化用户体验\n3. 新增即时通讯功能',
          force: true // 测试强制更新
      }
  }

  return { hasUpdate: false }
}

/**
 * Check for updates
 * Returns update info if available, null otherwise
 */
export const checkAppUpdate = (): Promise<UpdateResult | null> => {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    const appid = plus.runtime.appid || ''
    if (!appid) {
        resolve(null)
        return
    }

    plus.runtime.getProperty(appid, async (widgetInfo) => {
      const verStr = widgetInfo.version ? String(widgetInfo.version) : '1.0.0'
      const verCodeStr = widgetInfo.versionCode ? String(widgetInfo.versionCode) : '0'

      try {
        const updateInfo = await fetchUpdateInfo(verStr, verCodeStr)
        if (updateInfo.hasUpdate && updateInfo.url) {
            resolve(updateInfo)
        } else {
            resolve(null)
        }
      } catch (e) {
        console.error('Check update failed', e)
        resolve(null)
      }
    })
    // #endif
    
    // #ifndef APP-PLUS
    resolve(null)
    // #endif
  })
}

/**
 * Download update package
 */
export const downloadAppUpdate = (url: string, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const downloadTask = uni.downloadFile({
      url: url,
      header: {
        // 模拟浏览器 User-Agent，防止部分存储桶因 UA 为空而拦截
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36'
      },
      success: (downloadResult) => {
        if (downloadResult.statusCode === 200) {
          resolve(downloadResult.tempFilePath)
        } else {
          reject(new Error(`Download failed with status code: ${downloadResult.statusCode}`))
        }
      },
      fail: (e) => {
        console.error('Download fail detail:', e)
        reject(new Error(e.errMsg || 'Download failed'))
      }
    })
    
    downloadTask.onProgressUpdate((res) => {
      onProgress(res.progress)
    })
  })
}

/**
 * Install update package
 */
export const installAppUpdate = (filePath: string, isWgt: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    if (isWgt) {
      plus.runtime.install(filePath, { force: true }, () => {
        resolve()
        // WGT installation success - usually needs restart
        uni.showModal({
          title: '更新完成',
          content: '新版本安装成功，是否立即重启应用？',
          showCancel: false,
          success: () => {
            plus.runtime.restart()
          }
        })
      }, (e) => {
        reject(e)
      })
    } else {
      // APK/IPA Full Install
      plus.runtime.install(filePath, {}, () => {
        resolve()
      }, (e) => {
        reject(e)
      })
    }
    // #endif
    
    // #ifndef APP-PLUS
    reject(new Error('Update not supported on this platform'))
    // #endif
  })
}
