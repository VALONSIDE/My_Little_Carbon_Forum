const { userDB } = require('../../utils/cloudDB.js')

Page({
  data: {
    activeTab: 'login', // 当前激活的标签页
    loading: false,
    phoneLoading: false,
    carbonLoading: false,
    // 账户名登录数据
    loginId: '',
    loginPassword: '',
    // 手机号登录数据
    phoneLogin: '',
    phonePassword: '',
    // 碳ID登录数据
    carbonId: '',
    carbonPassword: '',
    // 注册表单数据
    phone: '',
    registerPassword: '',
    confirmPassword: ''
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 账户名登录表单输入处理
  onLoginIdInput(e) {
    this.setData({ loginId: e.detail.value })
  },

  onLoginPasswordInput(e) {
    this.setData({ loginPassword: e.detail.value })
  },

  // 手机号登录输入处理
  onPhoneLoginInput(e) {
    this.setData({ phoneLogin: e.detail.value })
  },

  onPhonePasswordInput(e) {
    this.setData({ phonePassword: e.detail.value })
  },

  // 碳ID登录输入处理
  onCarbonIdInput(e) {
    // 将小写字母转为大写，并只保留数字和大写字母
    let value = e.detail.value.toUpperCase().replace(/[^0-9A-Z-]/g, '');
    
    // 如果输入的是纯数字和字母（没有破折号），尝试格式化
    if (value.length > 0 && !value.includes('-')) {
      // 如果长度达到10个字符，自动添加破折号
      if (value.length >= 10) {
        value = value.substring(0, 10); // 限制为10个字符
        value = value.replace(/^([0-9A-Z]{2})([0-9A-Z]{1})([0-9A-Z]{4})([0-9A-Z]{3})$/, '$1-$2-$3-$4');
      }
    }
    
    this.setData({ carbonId: value })
  },

  onCarbonPasswordInput(e) {
    this.setData({ carbonPassword: e.detail.value })
  },

  // 注册表单输入处理
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onRegisterPasswordInput(e) {
    this.setData({ registerPassword: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  // 处理账户名登录
  async handleLogin() {
    if (this.data.loading) return

    const { loginId, loginPassword } = this.data

    if (!loginId || !loginPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '登录中...' })

    try {
      const userInfo = await userDB.login(loginId, loginPassword)
      
      if (!userInfo) {
        wx.showToast({
          title: '账号或密码错误',
          icon: 'none'
        })
        return
      }

      // 更新本地存储和全局状态
      wx.setStorageSync('userInfo', userInfo)
      const app = getApp()
      app.globalData.userInfo = userInfo
      app.globalData.isLoggedIn = true

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('登录失败：', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  // 处理手机号登录
  async handlePhoneLogin() {
    if (this.data.phoneLoading) return

    const { phoneLogin, phonePassword } = this.data

    if (!phoneLogin || !phonePassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phoneLogin)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    this.setData({ phoneLoading: true })
    wx.showLoading({ title: '登录中...' })

    try {
      const userInfo = await userDB.login(phoneLogin, phonePassword)
      
      if (!userInfo) {
        wx.showToast({
          title: '手机号或密码错误',
          icon: 'none'
        })
        return
      }

      // 更新本地存储和全局状态
      wx.setStorageSync('userInfo', userInfo)
      const app = getApp()
      app.globalData.userInfo = userInfo
      app.globalData.isLoggedIn = true

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('手机号登录失败：', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ phoneLoading: false })
    }
  },

  // 处理碳ID登录
  async handleCarbonLogin() {
    if (this.data.carbonLoading) return

    const { carbonId, carbonPassword } = this.data

    if (!carbonId || !carbonPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 验证碳ID格式
    if (!/^[0-9A-Z]{2}-[0-9A-Z]-[0-9A-Z]{4}-[0-9A-Z]{3}$/.test(carbonId)) {
      wx.showToast({
        title: '碳ID格式不正确',
        icon: 'none'
      })
      return
    }

    this.setData({ carbonLoading: true })
    wx.showLoading({ title: '登录中...' })

    try {
      const userInfo = await userDB.login(carbonId, carbonPassword)
      
      if (!userInfo) {
        wx.showToast({
          title: '碳ID或密码错误',
          icon: 'none'
        })
        return
      }

      // 更新本地存储和全局状态
      wx.setStorageSync('userInfo', userInfo)
      const app = getApp()
      app.globalData.userInfo = userInfo
      app.globalData.isLoggedIn = true

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('碳ID登录失败：', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ carbonLoading: false })
    }
  },

  /*
  碳足迹论坛：一个致力于环保和可持续发展的社区平台。
  GitHub已开源，项目地址：https://github.com/VALONSIDE/My_Little_Carbon_Forum/
  */

  // 处理注册
  async handleRegister() {
    if (this.data.loading) return

    const { phone, registerPassword, confirmPassword } = this.data

    if (!phone || !registerPassword || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (registerPassword !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '注册中...' })

    try {
      // 先检查手机号是否已被注册
      const phoneExists = await userDB.checkPhoneExists(phone);
      if (phoneExists) {
        wx.showToast({
          title: '该手机号已被注册',
          icon: 'none'
        });
        this.setData({ loading: false });
        wx.hideLoading();
        return;
      }

      const userInfo = await userDB.createUser({
        phone,
        password: registerPassword,
        avatarUrl: '/images/default-avatar.png'  // 显式设置默认头像
      })

      // 注册成功后自动登录
      wx.setStorageSync('userInfo', userInfo)
      const app = getApp()
      app.globalData.userInfo = userInfo
      app.globalData.isLoggedIn = true

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('注册失败：', error)
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  handleBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/forum/forum'
        })
      }
    })
  },

  handleBackFail() {
    // 返回失败时跳转到首页
    wx.switchTab({
      url: '/pages/forum/forum'
    })
  }
})
