// pages/task_create/task_create.js
Page({
  data: {
    formData: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      completionCount: '',
      coinReward: ''
    },
    taskTypes: ['步行出行', '公共交通', '垃圾分类', '节约用水', '节约用电', '其他'],
    typeIndex: 0
  },

  onLoad: function(options) {
    // 设置默认开始日期为今天
    const today = new Date();
    const startDate = this.formatDate(today);
    
    // 设置默认结束日期为一个月后
    const endDate = this.formatDate(new Date(today.setMonth(today.getMonth() + 1)));
    
    this.setData({
      'formData.startDate': startDate,
      'formData.endDate': endDate
    });
  },

  // 格式化日期为YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 任务类型选择器变化事件
  bindTypeChange: function(e) {
    this.setData({
      typeIndex: e.detail.value
    });
  },

  // 开始日期选择器变化事件
  bindStartDateChange: function(e) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  // 结束日期选择器变化事件
  bindEndDateChange: function(e) {
    this.setData({
      'formData.endDate': e.detail.value
    });
  },

  // 提交任务表单
  submitTask: function(e) {
    const formValues = e.detail.value;
    const taskType = this.data.taskTypes[this.data.typeIndex];
    
    // 表单验证
    if (!formValues.title) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.formData.startDate) {
      wx.showToast({
        title: '请选择开始日期',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.formData.endDate) {
      wx.showToast({
        title: '请选择结束日期',
        icon: 'none'
      });
      return;
    }
    
    if (!formValues.completionCount) {
      wx.showToast({
        title: '请输入需完成次数',
        icon: 'none'
      });
      return;
    }
    
    if (!formValues.coinReward) {
      wx.showToast({
        title: '请输入奖励碳币数量',
        icon: 'none'
      });
      return;
    }
    
    // 构建任务数据
    const taskData = {
      title: formValues.title,
      type: taskType,
      description: formValues.description,
      startDate: this.data.formData.startDate,
      endDate: this.data.formData.endDate,
      completionCount: parseInt(formValues.completionCount),
      coinReward: parseFloat(formValues.coinReward),
      createTime: new Date(),
      status: 'active'
    };
    
    // 获取用户信息
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const userId = res.result.openid;
      const db = wx.cloud.database();
      
      // 添加任务到数据库
      db.collection('tasks').add({
        data: {
          ...taskData,
          userId: userId
          // 移除手动设置_openid，让系统自动处理
        }
      }).then(() => {
        wx.showToast({
          title: '任务创建成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }).catch(err => {
        console.error('创建任务失败', err);
        wx.showToast({
          title: '创建失败，请重试',
          icon: 'none'
        });
      });
    });
  }
})