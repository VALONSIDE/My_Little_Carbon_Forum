// pages/task_detail/task_detail.js
Page({
  data: {
    taskId: '',
    task: null,
    loading: true,
    isCompleted: false,
    completionRecords: [],
    completionProgress: 0,
    canCheckIn: false
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        taskId: options.id
      });
      this.loadTaskDetail(options.id);
    } else {
      wx.showToast({
        title: '任务ID无效',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow: function() {
    if (this.data.taskId) {
      this.checkCompletionStatus();
    }
  },

  // 加载任务详情
  loadTaskDetail: function(taskId) {
    this.setData({ loading: true });
    
    const db = wx.cloud.database();
    db.collection('tasks').doc(taskId).get().then(res => {
      if (res.data) {
        this.setData({
          task: res.data,
          loading: false
        });
        
        // 加载完成记录
        this.loadCompletionRecords();
        // 检查今日是否可打卡
        this.checkCompletionStatus();
      } else {
        wx.showToast({
          title: '任务不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      console.error('获取任务详情失败', err);
      wx.showToast({
        title: '获取任务详情失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    });
  },

  // 加载完成记录
  loadCompletionRecords: function() {
    if (!this.data.task) return;
    
    const db = wx.cloud.database();
    db.collection('task_completions')
      .where({
        taskId: this.data.taskId
      })
      .orderBy('completionTime', 'desc')
      .get()
      .then(res => {
        const records = res.data || [];
        const completionCount = records.length;
        const targetCount = this.data.task.completionCount || 1;
        const progress = Math.min(completionCount / targetCount * 100, 100);
        
        this.setData({
          completionRecords: records,
          completionProgress: progress,
          isCompleted: progress >= 100
        });
      })
      .catch(err => {
        console.error('获取完成记录失败', err);
      });
  },

  // 检查今日是否可打卡
  checkCompletionStatus: function() {
    if (!this.data.task) return;
    
    const today = new Date().toISOString().split('T')[0];
    const db = wx.cloud.database();
    
    db.collection('task_completions')
      .where({
        taskId: this.data.taskId,
        completionDate: today
      })
      .count()
      .then(res => {
        const canCheckIn = res.total === 0 && !this.data.isCompleted;
        this.setData({ canCheckIn });
      })
      .catch(err => {
        console.error('检查打卡状态失败', err);
      });
  },

  // 打卡任务
  checkInTask: function() {
    if (!this.data.canCheckIn) {
      wx.showToast({
        title: this.data.isCompleted ? '任务已完成' : '今日已打卡',
        icon: 'none'
      });
      return;
    }
    
    const task = this.data.task;
    
    // 显示打卡确认对话框
    wx.showModal({
      title: '任务打卡',
      content: `确认完成「${task.title}」任务吗？将获得 ${task.coinReward} 碳币奖励。`,
      success: (res) => {
        if (res.confirm) {
          this.completeTask();
        }
      }
    });
  },
  
  // 完成任务并奖励碳币
  completeTask: function() {
    const task = this.data.task;
    const today = new Date().toISOString().split('T')[0];
    const db = wx.cloud.database();
    
    wx.showLoading({ title: '正在打卡...' });
    
    // 获取用户信息
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const userId = res.result.openid;
      
      // 添加完成记录
      return db.collection('task_completions').add({
        data: {
          taskId: this.data.taskId,
          userId: userId,
          taskTitle: task.title,
          completionDate: today,
          completionTime: db.serverDate(),
          coinRewarded: task.coinReward
        }
      });
    }).then(() => {
      // 更新用户碳币余额
      const _ = db.command;
      return db.collection('users').where({
        _openid: task.userId
      }).update({
        data: {
          carbonCoin: _.inc(task.coinReward)
        }
      });
    }).then(() => {
      // 添加交易记录
      return db.collection('coin_transactions').add({
        data: {
          userId: task.userId,
          amount: task.coinReward,
          title: `完成低碳任务：${task.title}`,
          type: 'income',
          createTime: db.serverDate()
        }
      });
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: `获得 ${task.coinReward} 碳币`,
        icon: 'success'
      });
      
      // 刷新页面数据
      this.loadCompletionRecords();
      this.checkCompletionStatus();
    }).catch(err => {
      wx.hideLoading();
      console.error('打卡失败', err);
      wx.showToast({
        title: '打卡失败，请重试',
        icon: 'none'
      });
    });
  },
  
  // 格式化日期
  formatDate: function(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  
  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  }
})