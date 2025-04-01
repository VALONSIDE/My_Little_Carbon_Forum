// pages/account_settings/account_settings.js
Page({
  data: {
    userInfo: null,
    t: {}, // 翻译文本对象
    cacheSize: '0KB'
  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
    
    // 获取全局应用实例
    const app = getApp();
    
    // 设置当前页面的语言文本
    this.setData({
      t: app.globalData.translations
    });

    this.calculateCacheSize()
  },
  
  // 计算缓存大小
  async calculateCacheSize() {
    try {
      const res = await wx.getStorageInfo()
      const size = res.currentSize
      let sizeStr = ''
      
      if (size < 1024) {
        sizeStr = size + 'KB'
      } else if (size < 1024 * 1024) {
        sizeStr = (size / 1024).toFixed(2) + 'MB'
      } else {
        sizeStr = (size / (1024 * 1024)).toFixed(2) + 'GB'
      }
      
      this.setData({
        cacheSize: sizeStr
      })
    } catch (error) {
      console.error('获取缓存大小失败：', error)
      this.setData({
        cacheSize: '获取失败'
      })
    }
  },
  
  // 清除缓存
  async clearCache() {
    try {
      wx.showModal({
        title: '提示',
        content: '确定要清除缓存吗？',
        success: async (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '清理中...' })
            
            // 保存用户登录信息
            const userInfo = wx.getStorageSync('userInfo')
            
            // 清除本地存储
            wx.clearStorageSync()
            
            // 恢复用户登录信息
            if (userInfo) {
              wx.setStorageSync('userInfo', userInfo)
            }
            
            // 清除文件缓存
            const fileList = await wx.getSavedFileList()
            for (const file of fileList.fileList) {
              await wx.removeSavedFile({
                filePath: file.filePath
              })
            }
            
            // 重新计算缓存大小
            await this.calculateCacheSize()
            
            wx.hideLoading()
            wx.showToast({
              title: '清理完成',
              icon: 'success'
            })
          }
        }
      })
    } catch (error) {
      console.error('清理缓存失败：', error)
      wx.hideLoading()
      wx.showToast({
        title: '清理失败',
        icon: 'error'
      })
    }
  },
  
  // 关于我们
  aboutUs: function() {
    wx.showModal({
      title: '关于碳生活',
      content: '碳生活是一款致力于推广低碳生活方式的社区应用',
      showCancel: false
    });
  }
})
