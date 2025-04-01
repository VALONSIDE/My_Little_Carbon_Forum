// pages/carbon_id/carbon_id.js
const qrcodeUtil = require('../../utils/qrcode.js')
const barcode39Util = require('../../utils/barcode39.js')

Page({
  data: {
    carbonId: '',
    phone: ''
  },

  onLoad() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    if (userInfo && userInfo.carbonId) {
      this.setData({ 
        carbonId: userInfo.carbonId,
        phone: userInfo.phone || ''
      })
    }
  },

  onReady() {
    if (this.data.carbonId) {
      this.drawQRCode()
      this.drawBarCode()
    }
  },

  // 使用qrcode.js库绘制二维码
  async drawQRCode() {
    const query = wx.createSelectorQuery()
    query.select('#qrCode')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 设置canvas大小 - 进一步增加尺寸使二维码更清晰
        canvas.width = 600
        canvas.height = 600
        
        // 清空画布
        ctx.clearRect(0, 0, 600, 600)
        
        // 构建二维码内容
        const qrContent = `<QRCode-CarbonID><CarbonID="${this.data.carbonId}"><TEL="${this.data.phone}">`
        
        // 创建二维码
        const qrCode = qrcodeUtil.createQrCode(qrContent, 600, qrcodeUtil.QRErrorCorrectLevel.H)
        
        // 在canvas上绘制二维码
        qrcodeUtil.drawQrCodeOnCanvas(ctx, qrCode, 0, 0, 600, '#000000', '#ffffff')
      })
  },

  // 使用CODE39编码绘制条形码（比CODE128有更少的竖线，更易于显示）
  async drawBarCode() {
    const query = wx.createSelectorQuery()
    query.select('#barCode')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 设置canvas大小 - 进一步增加尺寸使条形码更清晰
        canvas.width = 600
        canvas.height = 250
        
        // 清空画布
        ctx.clearRect(0, 0, 600, 250)
        
        // 使用碳ID作为条形码内容，去除"-"字符
        const barcodeContent = this.data.carbonId.replace(/-/g, '')
        
        // 绘制白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 600, 250)
        
        // 计算条形码的位置，使其与二维码宽度一致
        const barCodeY = 40
        const barCodeHeight = 150
        
        // 在canvas上绘制CODE39条形码 - 使用优化版本，竖线更少，去除外边距
        barcode39Util.drawOptimizedBarcode39(ctx, barcodeContent, 0, barCodeY, 600, barCodeHeight, '#000000', '#ffffff')
        
        // 在条形码下方显示文本（显示原始碳ID，包含"-"）
        ctx.fillStyle = '#000000'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.data.carbonId, 300, 220)
      })
  },

  // 处理返回按钮点击
  back() {
    wx.navigateBack()
  }
})
