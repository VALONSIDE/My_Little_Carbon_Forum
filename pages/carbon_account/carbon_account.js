// pages/carbon_account/carbon_account.js
Page({
  data: {
    tasks: [],
    completedTasks: [],
    loading: false,
    carbonCoinBalance: '0.00', // 默认碳币余额，保留两位小数
    userTasks: [], // 用户创建的任务
    userTasksLoading: false
  },

  onLoad: function() {
    this.loadTasks();
    this.loadCompletedTasks();
    this.loadCarbonCoinBalance();
    this.loadUserTasks();
  },

  onShow: function() {
    // 刷新已完成任务列表
    this.loadCompletedTasks();
    // 刷新碳币余额
    this.loadCarbonCoinBalance();
    // 刷新用户创建的任务
    this.loadUserTasks();
  },
  
  // 加载碳币余额
  loadCarbonCoinBalance: function() {
    const db = wx.cloud.database();
    
    // 获取用户信息
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const userId = res.result.openid;
      
      // 查询用户碳币余额
      db.collection('users').where({
        _openid: userId
      }).get().then(result => {
        if (result.data && result.data.length > 0) {
          const user = result.data[0];
          const carbonCoin = user.carbonCoin || 0;
          
          // 设置碳币余额，确保精确到小数点后2位
          this.setData({
            carbonCoinBalance: carbonCoin.toFixed(2)
          });
        }
      }).catch(err => {
        console.error('获取碳币余额失败', err);
      });
    });
  },

  // 加载任务列表
  loadTasks: function() {
    this.setData({ loading: true });
    
    // 模拟任务数据，实际项目中应从服务器获取
    const tasks = [
      {
        id: 1,
        title: '步行出行',
        description: '选择步行而非驾车出行',
        coinReward: 5,
        icon: '/images/walk.svg'
      },
      {
        id: 2,
        title: '公共交通',
        description: '乘坐公共交通工具',
        coinReward: 10,
        icon: '/images/bus.svg'
      },
      {
        id: 3,
        title: '垃圾分类',
        description: '正确进行垃圾分类',
        coinReward: 8,
        icon: '/images/recycle.svg'
      },
      {
        id: 4,
        title: '节约用水',
        description: '减少水资源浪费',
        coinReward: 6,
        icon: '/images/water.svg'
      },
      {
        id: 5,
        title: '节约用电',
        description: '减少不必要的用电',
        coinReward: 7,
        icon: '/images/electricity.svg'
      }
    ];

    this.setData({
      tasks: tasks,
      loading: false
    });
  },

  // 加载已完成任务
  loadCompletedTasks: function() {
    // 从本地存储获取今日已完成的任务
    const today = new Date().toISOString().split('T')[0];
    const completedTasksKey = `completedTasks_${today}`;
    
    const completedTasks = wx.getStorageSync(completedTasksKey) || [];
    this.setData({ completedTasks });
  },

  // 打卡任务
  checkInTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // 检查任务是否已完成
    const today = new Date().toISOString().split('T')[0];
    const completedTasksKey = `completedTasks_${today}`;
    let completedTasks = wx.getStorageSync(completedTasksKey) || [];
    
    if (completedTasks.includes(taskId)) {
      wx.showToast({
        title: '今日已完成该任务',
        icon: 'none'
      });
      return;
    }
    
    // 显示打卡确认对话框
    wx.showModal({
      title: '任务打卡',
      content: `确认完成「${task.title}」任务吗？将获得 ${task.coinReward} 碳币奖励。`,
      success: (res) => {
        if (res.confirm) {
          this.completeTask(task, completedTasks, completedTasksKey);
        }
      }
    });
  },
  
  // 完成任务并奖励碳币
  completeTask: function(task, completedTasks, completedTasksKey) {
    // 添加到已完成任务列表
    completedTasks.push(task.id);
    wx.setStorageSync(completedTasksKey, completedTasks);
    
    // 更新界面
    this.setData({ completedTasks });
    
    // 奖励碳币
    this.rewardCarbonCoin(task.coinReward, task.title);
  },
  
  // 奖励碳币
  rewardCarbonCoin: function(amount, taskTitle) {
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 获取用户信息
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const userId = res.result.openid;
      
      // 更新用户碳币余额
      db.collection('users').where({
        _openid: userId
      }).update({
        data: {
          carbonCoin: _.inc(amount)
        }
      }).then(() => {
        // 添加交易记录
        return db.collection('coin_transactions').add({
          data: {
            userId: userId,
            amount: amount,
            title: `完成低碳任务：${taskTitle}`,
            type: 'income',
            createTime: db.serverDate()
          }
        });
      }).then(() => {
        wx.showToast({
          title: `获得 ${amount} 碳币`,
          icon: 'success'
        });
      }).catch(err => {
        console.error('奖励碳币失败', err);
        wx.showToast({
          title: '奖励发放失败',
          icon: 'none'
        });
      });
    });
  },
  
  // 导航到碳币页面
  navigateToCarbonCoin: function() {
    wx.navigateTo({
      url: '/pages/carbon_coin/carbon_coin'
    });
  },
  
  // 导航到新建任务页面
  navigateToTaskCreate: function() {
    wx.navigateTo({
      url: '/pages/task_create/task_create'
    });
  },
  
  // 加载用户创建的任务
  loadUserTasks: function() {
    this.setData({ userTasksLoading: true });
    
    // 获取用户信息
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const userId = res.result.openid;
      const db = wx.cloud.database();
      
      // 查询用户创建的任务
      return db.collection('tasks')
        .where({
          userId: userId
        })
        .orderBy('createTime', 'desc')
        .get();
    }).then(res => {
      this.setData({
        userTasks: res.data || [],
        userTasksLoading: false
      });
    }).catch(err => {
      console.error('获取用户任务失败', err);
      this.setData({ userTasksLoading: false });
    });
  },
  
  // 导航到任务详情页
  navigateToTaskDetail: function(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/task_detail/task_detail?id=${taskId}`
    });
  }
});