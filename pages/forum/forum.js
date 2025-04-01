// pages/forum/forum.js
const { postDB } = require('../../utils/cloudDB.js')

// 默认图片配置
const DEFAULT_AVATAR = '/images/default-avatar.png'
const DEFAULT_POST_IMAGE = '/images/default-post.png'

Page({
  data: {
    isEditing: false,
    postContent: '',
    tempImagePath: '',
    userInfo: {},
    refreshing: false,
    posts: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },
  
  // 图片加载错误处理
  onImageError: function(e) {
    const { type, index } = e.currentTarget.dataset
    const { posts } = this.data
    const post = {...posts[index]}
    
    if (type === 'avatar') {
      post.authorAvatar = DEFAULT_AVATAR
    } else if (type === 'post') {
      post.images = [DEFAULT_POST_IMAGE]
    }
    
    this.setData({
      [`posts[${index}]`]: post
    })
  },
  
  // 加载帖子
  async loadPosts() {
    if (this.data.loading || !this.data.hasMore) return;
    
    try {
      console.log('开始加载帖子，页码：', this.data.page)
      this.setData({ loading: true });
      
      const posts = await postDB.getPosts(this.data.page, this.data.pageSize);
      console.log('获取到帖子数据：', posts)
      
      if (!posts || posts.length === 0) {
        console.log('没有更多帖子了')
        this.setData({
          hasMore: false,
          loading: false
        });
        return;
      }
      
      this.setData({
        posts: this.data.page === 1 ? posts : [...this.data.posts, ...posts],
        page: this.data.page + 1,
        hasMore: posts.length === this.data.pageSize,
        loading: false
      });
      
      console.log('帖子加载完成，当前总数：', this.data.posts.length)
    } catch (error) {
      console.error('加载帖子失败：', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },
  
  // 点赞或取消点赞
  toggleLike: async function(e) {
    // 检查用户是否已登录
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再点赞',
        showCancel: false
      });
      return;
    }
    
    // 验证用户信息的完整性
    if (!app.globalData.userInfo || !app.globalData.userInfo.openid) {
      wx.showModal({
        title: '错误',
        content: '用户登录信息不完整，无法点赞',
        showCancel: false
      });
      return;
    }
    
    const postId = e.currentTarget.dataset.id;
    const posts = this.data.posts;
    const postIndex = posts.findIndex(post => post._id === postId);
    
    if (postIndex !== -1) {
      const isLiked = posts[postIndex].isLiked;
      const newIsLiked = !isLiked;
      
      try {
        // 先更新数据库，以确保操作成功
        await postDB.updateLikes(postId, newIsLiked);
        
        // 数据库更新成功后，再更新本地状态
        posts[postIndex].isLiked = newIsLiked;
        posts[postIndex].likeCount = newIsLiked 
          ? (posts[postIndex].likeCount || 0) + 1 
          : (posts[postIndex].likeCount || 1) - 1;
        
        this.setData({
          posts: posts
        });
      } catch (error) {
        console.error('更新点赞状态失败：', error);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    }
  },
  
  // 跳转到帖子详情页
  goToDetail: function(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/post/post?id=' + postId
    });
  },
  
  // 跳转到发帖页面
  goToCreatePost: function() {
    // 检查用户是否已登录
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布帖子',
        showCancel: false
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/post_create/post_create'
    });
  },
  
  // 页面显示时触发
  onShow: function() {
    if (!this.data.posts || this.data.posts.length === 0) {
      this.loadPosts();
    }
  },
  
  // 下拉刷新
  onRefresh: async function() {
    this.setData({
      refreshing: true,
      page: 1,
      posts: [],
      hasMore: true
    });
    
    await this.loadPosts();
    this.setData({
      refreshing: false
    });
    
    wx.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1000
    });
  },
  
  onLoad: function() {
    this.loadPosts();
  },
  
  // 上拉加载更多
  onReachBottom: function() {
    this.loadPosts();
  }
})
