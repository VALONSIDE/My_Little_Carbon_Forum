// pages/account/account.js
const { userDB } = require('../../utils/cloudDB.js')

Page({
  data: {
    userInfo: null,
    isLogin: false,
    loading: false,
    refreshing: false  // 添加下拉刷新状态
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.checkLoginStatus()
    
    // 每次进入页面时刷新用户信息以更新碳币余额
    this.loadUserInfo()
  },
  
  // 处理返回按钮点击事件
  back() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果返回失败，跳转到首页
        wx.switchTab({
          url: '/pages/forum/forum'
        })
      }
    })
  },
  
  // 添加下拉刷新处理函数
  async onPullDownRefresh() {
    try {
      this.setData({ refreshing: true })
      await this.loadUserInfo()
      wx.stopPullDownRefresh()
    } catch (error) {
      console.error('刷新失败：', error)
    } finally {
      this.setData({ refreshing: false })
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        // 从数据库获取最新用户信息
        const latestUserInfo = await userDB.getUserInfo(userInfo.openid)
        if (latestUserInfo) {
          // 更新本地存储和全局状态
          wx.setStorageSync('userInfo', latestUserInfo)
          const app = getApp()
          app.globalData.userInfo = latestUserInfo
          
          this.setData({
            userInfo: latestUserInfo,
            isLogin: true
          })
          
          console.log('已更新用户信息，碳币余额:', latestUserInfo.carbonCoin || 0)
        } else {
          this.setData({
            userInfo: null,
            isLogin: false
          })
          wx.removeStorageSync('userInfo')
        }
      }
    } catch (error) {
      console.error('加载用户信息失败：', error)
      this.setData({
        userInfo: null,
        isLogin: false
      })
      wx.removeStorageSync('userInfo')
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    // 使用全局的登录状态
    const app = getApp()
    
    this.setData({
      userInfo: app.globalData.userInfo,
      isLogin: app.globalData.isLoggedIn
    })
    
    // 如果全局已登录，但本地没有用户信息，则同步到本地
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
      wx.setStorageSync('userInfo', app.globalData.userInfo)
    }
  },

  // 处理用户登录
  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userInfo')
          
          // 更新全局状态
          const app = getApp()
          app.globalData.isLoggedIn = false
          app.globalData.userInfo = null
          
          // 更新页面状态
          this.setData({
            userInfo: null,
            isLogin: false
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 编辑资料
  navigateToEdit() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/user_edit/user_edit'
    })
  },

  // 跳转到设置页面
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/account_settings/account_settings'
    })
  },

  // 跳转到碳ID页面
  navigateToCarbonId() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/carbon_id/carbon_id'
    })
  },
  
  // 跳转到碳币页面
  navigateToCarbonCoin() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/carbon_coin/carbon_coin'
    })
  }
})
