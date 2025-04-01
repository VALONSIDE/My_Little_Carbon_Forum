const { userDB } = require('../../utils/cloudDB.js')

Page({
  data: {
    userInfo: null,
    tempFilePath: '',
    loading: false,
    pageStyle: 'min-height: 100vh; background: #f8f8f8;',
    originalNickname: '' // 保存原始昵称
  },

  onLoad() {
    // 获取当前用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ 
        userInfo,
        originalNickname: userInfo.nickName, // 保存原始昵称
        'userInfo.originalAvatarUrl': userInfo.avatarUrl // 保存原始头像URL
      })
    }
  },

  // 选择头像
  async chooseAvatar(e) {
    try {
      const { avatarUrl } = e.detail
      
      wx.showLoading({
        title: '处理头像...',
        mask: true
      })
      
      // 立即上传到云存储
      const cloudPath = `avatars/${this.data.userInfo.openid}_${Date.now()}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl
      })

      if (!uploadResult.fileID) {
        throw new Error('上传头像失败')
      }

      // 更新显示
      this.setData({
        'userInfo.avatarUrl': uploadResult.fileID,
        tempFilePath: avatarUrl
      })

      wx.hideLoading()
    } catch (error) {
      console.error('处理头像失败：', error)
      wx.showToast({
        title: '处理头像失败',
        icon: 'none'
      })
      wx.hideLoading()
    }
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  // 检查用户名是否可用
  async checkNicknameAvailable(nickname) {
    // 如果昵称没有改变，不需要检查
    if (nickname === this.data.originalNickname) {
      return true;
    }
    try {
      return await userDB.checkNickname(nickname);
    } catch (error) {
      console.error('检查用户名失败：', error);
      return false;
    }
  },

  // 上传头像到云存储
  async uploadAvatar() {
    if (!this.data.tempFilePath) return null

    try {
      const cloudPath = `avatars/${this.data.userInfo.openid}_${Date.now()}.jpg`
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.tempFilePath
      })
      return fileID
    } catch (error) {
      console.error('上传头像失败：', error)
      throw error
    }
  },

  // 保存用户信息
  async saveUserInfo() {
    if (this.data.loading) return
    
    const nickname = this.data.userInfo.nickName.trim()
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '保存中...' })

    try {
      // 只更新需要更新的字段
      const updatedUserInfo = {}
      
      // 如果昵称发生变化，添加到更新对象并检查唯一性
      if (nickname !== this.data.originalNickname) {
        // 检查用户名是否可用
        const isAvailable = await userDB.checkNickname(nickname)
        if (!isAvailable) {
          wx.hideLoading()
          wx.showToast({
            title: '该用户名已被使用，请选择其他用户名',
            icon: 'none',
            duration: 2000
          })
          this.setData({ loading: false })
          return
        }
        updatedUserInfo.nickName = nickname
      }
      
      // 如果头像发生变化，添加到更新对象
      if (this.data.userInfo.avatarUrl !== this.data.userInfo.originalAvatarUrl) {
        updatedUserInfo.avatarUrl = this.data.userInfo.avatarUrl
      }

      // 如果没有任何字段需要更新，直接返回
      if (Object.keys(updatedUserInfo).length === 0) {
        wx.showToast({
          title: '没有修改',
          icon: 'none'
        })
        this.setData({ loading: false })
        wx.hideLoading()
        return
      }

      // 更新用户信息到数据库 - 确保使用碳ID作为唯一标识
      const finalUserInfo = await userDB.updateUserInfo(this.data.userInfo.openid, updatedUserInfo)

      // 更新本地存储和全局状态
      wx.setStorageSync('userInfo', finalUserInfo)
      
      // 更新全局状态
      const app = getApp()
      app.globalData.userInfo = finalUserInfo

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('保存用户信息失败：', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  }
})
