// 远程 Node 服务器地址
// 1. 如果是真机调试（手机和电脑在同一局域网），请将 localhost 替换为电脑的局域网 IP，例如 'http://192.168.31.200:3000'
// 2. 如果是云服务器，请填写公网地址，例如 'https://api.example.com'
// 3. 模拟器通常可以使用 'http://localhost:3000'
export const apiBase = import.meta.env.VITE_API_BASE || (uni.getStorageSync('apiBase') as string) || 'http://localhost:3000'

export const request = async (path: string, method: UniApp.RequestOptions['method'] = 'GET', data?: any) => {
  const token = uni.getStorageSync('token')
  
  return await new Promise<any>((resolve, reject) => {
    uni.request({
      url: `${apiBase}${path}`,
      method,
      data,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(res.data)
      },
      fail: (err) => reject(err)
    })
  })
}
