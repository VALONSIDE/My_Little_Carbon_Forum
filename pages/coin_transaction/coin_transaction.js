// pages/coin_transaction/coin_transaction.js
const { coinDB } = require('../../utils/coinDB.js')
const { userDB } = require('../../utils/cloudDB.js')

Page({
  data: {
    amount: '',
    title: '',
    description: '',
    type: 'income', // 默认为收入
    isSubmitting: false
  },

  onLoad() {
    // 页面加载时的初始化操作
  },

  // 处理输入金额变化
  handleAmountInput(e) {
    this.setData({
      amount: e.detail.value
    })
  },

  // 处理输入标题变化
  handleTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  // 处理输入描述变化
  handleDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    })
  },

  // 处理交易类型变化
  handleTypeChange(e) {
    this.setData({
      type: e.detail.value
    })
  },

  // 提交交易记录
  async submitTransaction() {
    try {
      // 表单验证
      if (!this.data.amount || isNaN(parseFloat(this.data.amount))) {
        wx.showToast({
          title: '请输入有效金额',
          icon: 'none'
        })
        return
      }

      if (!this.data.title.trim()) {
        wx.showToast({
          title: '请输入交易标题',
          icon: 'none'
        })
        return
      }

      this.setData({ isSubmitting: true })

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

      // 构建交易数据
      const transactionData = {
        openid: userInfo.openid,
        title: this.data.title,
        amount: parseFloat(this.data.amount),
        type: this.data.type,
        description: this.data.description
      }

      // 添加交易记录
      await coinDB.addCoinTransaction(transactionData)

      wx.showToast({
        title: '交易记录已添加',
        icon: 'success'
      })

      // 返回上一页并刷新页面
      setTimeout(() => {
        // 获取页面栈
        const pages = getCurrentPages()
        // 获取上一页
        const prevPage = pages[pages.length - 2]
        
        // 如果上一页是碳币页面，标记需要刷新
        if (prevPage && prevPage.route.includes('carbon_coin')) {
          // 调用上一页的刷新方法
          prevPage.loadCarbonCoinData()
        }
        
        // 返回上一页
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('添加交易记录失败：', error)
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  // 处理返回按钮点击
  back() {
    wx.navigateBack()
  }
})