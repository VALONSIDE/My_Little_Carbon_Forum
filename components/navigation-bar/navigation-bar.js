Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
    
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: ''
  },
  lifetimes: {
    attached() {
      const rect = wx.getMenuButtonBoundingClientRect()
      // 使用新的API替代已弃用的wx.getSystemInfo
      const systemInfo = wx.getSystemInfoSync()
      const windowInfo = wx.getWindowInfo()
      const isAndroid = systemInfo.platform === 'android'
      const isDevtools = systemInfo.platform === 'devtools'
      this.setData({
        ios: !isAndroid,
        innerPaddingRight: `padding-right: ${windowInfo.windowWidth - rect.left}px`,
        leftWidth: `width: ${windowInfo.windowWidth - rect.left }px`,
        safeAreaTop: isDevtools || isAndroid ? `height: calc(var(--height) + ${systemInfo.safeArea.top}px); padding-top: ${systemInfo.safeArea.top}px` : ``
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    back() {
      const data = this.data
      this.triggerEvent('back', { delta: data.delta }, {})
      
      // 移除重复的导航逻辑，让页面的handleBack方法处理
      // 如果页面没有处理back事件，则执行默认导航行为
      if (!this.getRelationNodes || this.getRelationNodes().length === 0) {
        if (data.delta) {
          wx.navigateBack({
            delta: data.delta,
            fail: () => {
              // 如果返回失败，触发一个失败事件
              this.triggerEvent('backFail', {}, {})
            }
          })
        }
      }
    }
  },
})
