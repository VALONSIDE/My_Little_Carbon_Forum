// pages/post/post.js
const { postDB, commentDB } = require('../../utils/cloudDB.js')

// 默认图片配置
const DEFAULT_AVATAR = '/images/default-avatar.png'
const DEFAULT_POST_IMAGE = '/images/default-post.png'

Page({
  data: {
    post: null,
    comments: [],
    commentContent: '',
    loading: false,
    commentsLoading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad: function(options) {
    if (options.id) {
      this.loadPost(options.id)
      this.loadComments(options.id)
    }
  },

  // 加载帖子详情
  async loadPost(postId) {
    try {
      this.setData({ loading: true })
      const post = await postDB.getPostById(postId)
      
      if (post) {
        // 处理默认值
        post.authorAvatar = post.authorAvatar || DEFAULT_AVATAR
        post.images = post.images && post.images.length > 0 ? post.images : [DEFAULT_POST_IMAGE]
        
        this.setData({ post })
      }
    } catch (error) {
      console.error('加载帖子详情失败：', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载评论列表
  async loadComments(postId) {
    if (this.data.commentsLoading || !this.data.hasMore) return
    
    try {
      this.setData({ commentsLoading: true })
      const comments = await commentDB.getComments(postId, this.data.page, this.data.pageSize)
      
      if (!comments || comments.length === 0) {
        this.setData({ hasMore: false })
        return
      }
      
      // 处理评论数据
      const formattedComments = comments.map(comment => ({
        ...comment,
        authorAvatar: comment.authorAvatar || DEFAULT_AVATAR,
        createTime: this.formatTime(comment.createTime)
      }))
      
      this.setData({
        comments: this.data.page === 1 ? formattedComments : [...this.data.comments, ...formattedComments],
        page: this.data.page + 1,
        hasMore: comments.length === this.data.pageSize
      })
    } catch (error) {
      console.error('加载评论失败：', error)
      wx.showToast({
        title: '加载评论失败',
        icon: 'none'
      })
    } finally {
      this.setData({ commentsLoading: false })
    }
  },

  // 处理图片加载错误
  onImageError(e) {
    const { type } = e.currentTarget.dataset
    const post = { ...this.data.post }
    
    if (type === 'avatar') {
      post.authorAvatar = DEFAULT_AVATAR
    } else if (type === 'post') {
      post.images = [DEFAULT_POST_IMAGE]
    }
    
    this.setData({ post })
  },

  // 点赞/取消点赞
  async toggleLike() {
    if (!this.data.post) return
    
    // 检查用户是否已登录
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再点赞',
        showCancel: false
      })
      return
    }
    
    const post = { ...this.data.post }
    post.isLiked = !post.isLiked
    post.likeCount = post.isLiked ? (post.likeCount || 0) + 1 : (post.likeCount || 1) - 1
    
    this.setData({ post })
    
    try {
      await postDB.updateLikes(post._id, post.isLiked)
    } catch (error) {
      console.error('更新点赞状态失败：', error)
      // 恢复原状态
      post.isLiked = !post.isLiked
      post.likeCount = post.isLiked ? (post.likeCount || 0) + 1 : (post.likeCount || 1) - 1
      this.setData({ post })
    }
  },

  // 评论输入处理
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    })
  },

  // 提交评论
  async submitComment() {
    if (!this.data.commentContent.trim()) return
    
    // 检查用户是否已登录
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发表评论',
        showCancel: false
      })
      return
    }
    
    // 获取当前登录用户信息
    const userInfo = app.globalData.userInfo || {}
    
    // 额外验证用户信息的完整性
    if (!userInfo.openid) {
      wx.showModal({
        title: '错误',
        content: '用户登录信息不完整，无法发表评论',
        showCancel: false
      })
      return
    }
    
    const commentData = {
      postId: this.data.post._id,
      content: this.data.commentContent.trim(),
      authorName: userInfo.nickName || '匿名用户',
      authorAvatar: userInfo.avatarUrl || DEFAULT_AVATAR,
      authorId: userInfo.openid,
      createTime: new Date()
    }
    
    try {
      await commentDB.addComment(commentData)
      
      // 更新评论计数
      const post = { ...this.data.post }
      post.commentCount = (post.commentCount || 0) + 1
      
      // 重置状态并刷新评论列表
      this.setData({
        post,
        commentContent: '',
        page: 1,
        comments: [],
        hasMore: true
      })
      
      this.loadComments(post._id)
      
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('提交评论失败：', error)
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      })
    }
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return ''
    
    const now = new Date()
    const diff = now - new Date(date)
    const minute = 1000 * 60
    const hour = minute * 60
    const day = hour * 24
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前'
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前'
    } else {
      return Math.floor(diff / day) + '天前'
    }
  },

  // 页面上拉触底事件
  onReachBottom() {
    if (this.data.post) {
      this.loadComments(this.data.post._id)
    }
  }
})
