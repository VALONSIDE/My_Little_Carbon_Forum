// 碳币交易记录数据库操作工具类
const db = wx.cloud.database({
  env: 'cloud1-2go4otwj32566b98'
})

// 碳币交易相关操作
const coinDB = {
  // 添加碳币交易记录
  addCoinTransaction: async (transactionData) => {
    try {
      console.log('添加碳币交易记录，数据:', transactionData)
      
      // 确保交易数据包含所有必要字段
      if (!transactionData.openid) {
        throw new Error('缺少用户ID')
      }
      
      if (!transactionData.amount || isNaN(parseFloat(transactionData.amount))) {
        throw new Error('无效的交易金额')
      }
      
      // 添加交易记录到coin集合
      const result = await db.collection('coin').add({
        data: {
          openid: transactionData.openid,
          title: transactionData.title || '碳币交易',
          amount: parseFloat(parseFloat(transactionData.amount).toFixed(2)), // 确保精确到小数点后2位
          type: transactionData.type || 'expense', // income 或 expense
          description: transactionData.description || '', // 交易描述
          createTime: db.serverDate()
        }
      })
      
      console.log('交易记录添加成功，ID:', result._id)
      
      // 更新用户碳币余额
      const { userDB } = require('./cloudDB.js')
      const user = await userDB.getUserInfo(transactionData.openid)
      if (!user) {
        throw new Error('用户不存在')
      }
      
      // 计算新余额
      const currentBalance = user.carbonCoin || 0
      const amount = parseFloat(transactionData.amount)
      const newBalance = transactionData.type === 'income' 
        ? currentBalance + amount 
        : currentBalance - amount
      
      // 更新用户碳币余额
      await db.collection('users').doc(user._id).update({
        data: {
          carbonCoin: parseFloat(newBalance.toFixed(2)) // 确保精确到小数点后2位
        }
      })
      
      console.log('用户碳币余额已更新，新余额:', newBalance.toFixed(2))
      return result._id
    } catch (error) {
      console.error('添加碳币交易记录失败：', error)
      throw error
    }
  },

  // 获取用户碳币交易记录
  getCoinTransactions: async (openid, page = 1, pageSize = 20) => {
    try {
      console.log('获取碳币交易记录，openid:', openid)
      
      // 查询交易记录
      const result = await db.collection('coin')
        .where({
          openid: openid
        })
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      console.log('找到交易记录数:', result.data ? result.data.length : 0)
      return result.data || []
    } catch (error) {
      console.error('获取碳币交易记录失败：', error)
      throw error
    }
  },

  // 计算用户碳币余额
  calculateCoinBalance: async (openid) => {
    try {
      console.log('计算用户碳币余额，openid:', openid)
      
      // 获取所有收入交易
      const incomeResult = await db.collection('coin')
        .where({
          openid: openid,
          type: 'income'
        })
        .get()
      
      // 获取所有支出交易
      const expenseResult = await db.collection('coin')
        .where({
          openid: openid,
          type: 'expense'
        })
        .get()
      
      // 计算总收入
      const totalIncome = (incomeResult.data || []).reduce((sum, item) => {
        return sum + (parseFloat(item.amount) || 0)
      }, 0)
      
      // 计算总支出
      const totalExpense = (expenseResult.data || []).reduce((sum, item) => {
        return sum + (parseFloat(item.amount) || 0)
      }, 0)
      
      // 计算余额
      const balance = parseFloat((totalIncome - totalExpense).toFixed(2))
      console.log('计算得到的碳币余额:', balance)
      
      // 更新用户碳币余额
      const { userDB } = require('./cloudDB.js')
      const user = await userDB.getUserInfo(openid)
      if (user) {
        await db.collection('users').doc(user._id).update({
          data: {
            carbonCoin: balance
          }
        })
        console.log('用户碳币余额已更新')
      }
      
      return balance
    } catch (error) {
      console.error('计算碳币余额失败：', error)
      throw error
    }
  }
}

module.exports = {
  coinDB
}