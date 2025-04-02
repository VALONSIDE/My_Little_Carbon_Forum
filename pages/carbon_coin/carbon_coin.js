// pages/carbon_coin/carbon_coin.js
const { userDB } = require('../../utils/cloudDB.js')
const { coinDB } = require('../../utils/coinDB.js')

Page({
  data: {
    carbonCoin: '0.00',  // 默认碳币余额
    transactions: [],    // 交易记录
    isLoading: false     // 加载状态
  },

  onLoad() {
    this.loadCarbonCoinData()
  },

  onShow() {
    // 每次进入页面时刷新碳币数据
    this.loadCarbonCoinData()
  },

  onPullDownRefresh() {
    this.loadCarbonCoinData()
    wx.stopPullDownRefresh()
  },

  /*
  碳足迹论坛：一个致力于环保和可持续发展的社区平台。
  GitHub已开源，项目地址：https://github.com/VALONSIDE/My_Little_Carbon_Forum/
  */

  // 加载碳币数据
  async loadCarbonCoinData() {
    try {
      this.setData({ isLoading: true })
      
      // 获取用户信息
      const app = getApp()
      const userInfo = app.globalData.userInfo
      
      if (!userInfo || !userInfo.openid) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      
      // 从数据库获取最新用户信息
      const latestUserInfo = await userDB.getUserInfo(userInfo.openid)
      
      if (latestUserInfo) {
        // 更新全局用户信息和本地存储
        app.globalData.userInfo = latestUserInfo
        wx.setStorageSync('userInfo', latestUserInfo)
        
        // 设置碳币余额，确保精确到小数点后2位
        const carbonCoin = latestUserInfo.carbonCoin || 0
        this.setData({
          carbonCoin: carbonCoin.toFixed(2)
        })
        
        console.log('已更新碳币余额:', carbonCoin.toFixed(2))
        
        // 获取交易记录 - 从coin集合获取
        const transactions = await coinDB.getCoinTransactions(userInfo.openid)
        
        // 格式化交易记录的时间和金额
        const formattedTransactions = transactions.map(item => ({
          ...item,
          createTime: this.formatDate(item.createTime),
          amount: item.amount.toFixed(2)
        }))
        
        this.setData({
          transactions: formattedTransactions
        })
        
        // 重新计算并更新用户碳币余额
        await coinDB.calculateCoinBalance(userInfo.openid)
      }
    } catch (error) {
      console.error('加载碳币数据失败：', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },
  
  // 格式化日期
  formatDate(dateObj) {
    if (!dateObj) return ''
    
    const date = new Date(dateObj)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 处理返回按钮点击
  back() {
    wx.navigateBack()
  },
  
  // 导航到添加交易记录页面
  navigateToAddTransaction() {
    wx.navigateTo({
      url: '/pages/coin_transaction/coin_transaction'
    })
  }
})
