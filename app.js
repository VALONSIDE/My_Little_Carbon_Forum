// app.js
App({
  globalData: {
    translations: {},
    envId: 'cloud1-2go4otwj32566b98', // 修改为正确的云环境ID
    userInfo: null,
    isLoggedIn: false
  },
  
  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true
      });
      // 调用登录
      this.autoLogin();
    }
    
    // 加载语言包
    this.loadLanguage();
    // 设置CSS变量
    this.setCSSVariables();
  },
  
  // 自动获取OpenID
  autoLogin: function() {
    // 首先检查本地存储的用户信息
    const storedUserInfo = wx.getStorageSync('userInfo')
    if (storedUserInfo && storedUserInfo.openid) {
      this.globalData.userInfo = storedUserInfo
      this.globalData.isLoggedIn = true
      if (this.loginReadyCallback) {
        this.loginReadyCallback({ result: storedUserInfo })
      }
      return
    }

    wx.cloud.callFunction({
      name: 'login',
      data: {
        isUserInitiated: false
      },
      success: res => {
        console.log('云函数自动调用成功：', res)
        if (res.result && !res.result.error) {
          // 获取本地存储的用户信息
          const storedUserInfo = wx.getStorageSync('userInfo')
          
          if (storedUserInfo && storedUserInfo.openid) {
            // 如果本地存储有完整的用户信息，使用它
            this.globalData.userInfo = storedUserInfo
            this.globalData.isLoggedIn = true
          } else {
            // 否则只设置基本的openid信息
            this.globalData.userInfo = res.result
            this.globalData.isLoggedIn = false
          }
          
          if (this.loginReadyCallback) {
            this.loginReadyCallback(res)
          }
        } else {
          console.error('云函数返回错误：', res.result ? res.result.error : '未知错误')
          this.globalData.isLoggedIn = false
        }
      },
      fail: err => {
        console.error('云函数调用失败：', err)
        this.globalData.isLoggedIn = false
      }
    })
  },
  
  // 用户主动登录
  userLogin: function(callback) {
    wx.showLoading({
      title: '登录中...',
    })
    
    wx.cloud.callFunction({
      name: 'login',
      data: {
        isUserInitiated: true
      },
      success: res => {
        console.log('用户主动登录成功：', res)
        if (res.result && !res.result.error) {
          // 获取本地存储的用户信息
          const storedUserInfo = wx.getStorageSync('userInfo')
          
          // 合并云函数返回的信息和本地存储的用户信息
          const updatedUserInfo = {
            ...storedUserInfo,
            ...res.result,
            openid: res.result.openid
          }
          
          // 更新全局状态和本地存储
          this.globalData.userInfo = updatedUserInfo
          this.globalData.isLoggedIn = true
          wx.setStorageSync('userInfo', updatedUserInfo)
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          if (callback) {
            callback(true)
          }
        } else {
          console.error('登录失败：', res.result ? res.result.error : '未知错误')
          this.globalData.isLoggedIn = false
          
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          })
          
          if (callback) {
            callback(false)
          }
        }
      },
      fail: err => {
        console.error('登录失败：', err)
        this.globalData.isLoggedIn = false
        
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
        
        if (callback) {
          callback(false)
        }
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },
  
  // 设置CSS变量
  setCSSVariables: function() {
    // 在Skyline渲染引擎下，CSS变量已在app.wxss中定义，无需动态设置
    console.log('CSS变量已在app.wxss中定义，无需动态设置');
    // 如果需要切换深色模式，可以通过添加类名实现
    // const pages = getCurrentPages();
    // if (pages.length > 0) {
    //   const currentPage = pages[pages.length - 1];
    //   currentPage.setData({
    //     darkModeClass: this.globalData.darkMode ? 'dark-mode' : ''
    //   });
    // }
  },
  
  // 加载语言包
  loadLanguage: function() {
    this.globalData.translations = require('./utils/languages/zh_CN.js');
  },
  
  // 获取翻译文本
  t: function(key) {
    const translations = this.globalData.translations;
    return translations[key] || key;
  }
})
