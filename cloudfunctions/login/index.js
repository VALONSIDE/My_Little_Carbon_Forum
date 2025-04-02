// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const users = db.collection('users')

// 检查用户名是否可用
async function isNicknameAvailable(nickname) {
  const existingUser = await users.where({
    nickName: nickname
  }).get();
  
  return existingUser.data.length === 0;
}

// 检查碳ID是否可用
async function isCarbonIdAvailable(carbonId) {
  const existingUser = await users.where({
    carbonId: carbonId
  }).get();
  
  return existingUser.data.length === 0;
}

// 检查手机号是否可用
async function isPhoneAvailable(phone) {
  const existingUser = await users.where({
    phone: phone
  }).get();
  
  return existingUser.data.length === 0;
}

// 生成随机字符串
function generateRandomString(length) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/*
碳足迹论坛：一个致力于环保和可持续发展的社区平台。
GitHub已开源，项目地址：https://github.com/VALONSIDE/My_Little_Carbon_Forum/
*/

// 生成唯一碳ID
async function generateUniqueCarbonId() {
  const maxAttempts = 10; // 最大尝试次数
  let attempts = 0;
  
  // 定义可用字符集，排除容易混淆的字符（0/O, 1/I/L, 2/Z, 5/S, 8/B）
  const safeChars = '34679ACDEFGHJKMNPQRTUVWXY';
  
  while (attempts < maxAttempts) {
    let carbonId = '';
    const pattern = [2, 1, 4, 3]; // XX-X-XXXX-XXX
    
    pattern.forEach((length, index) => {
      for (let i = 0; i < length; i++) {
        carbonId += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
      }
      if (index < pattern.length - 1) {
        carbonId += '-';
      }
    });
    
    // 检查碳ID是否已存在
    if (await isCarbonIdAvailable(carbonId)) {
      return carbonId;
    }
    
    attempts++;
  }
  
  throw new Error('无法生成唯一的碳ID，请稍后重试');
}

// 生成唯一用户名
async function generateUniqueNickname() {
  const maxAttempts = 10; // 最大尝试次数
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const randomStr = generateRandomString(6);
    const nickname = `微信用户-${randomStr}`;
    
    // 检查用户名是否已存在
    if (await isNicknameAvailable(nickname)) {
      return nickname;
    }
    
    attempts++;
  }
  
  throw new Error('无法生成唯一的用户名，请稍后重试');
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 区分不同的登录方式
    const { isUserInitiated, loginType, loginId, password, userData } = event || {}
    
    // 如果是通过用户名、手机号或碳ID登录
    if (loginType === 'credential' && loginId && password) {
      console.log('尝试通过凭证登录，登录ID：', loginId)
      
      // 查询用户
      const result = await users.where(db.command.or([
        { carbonId: loginId },
        { nickName: loginId },
        { phone: loginId }
      ])).get()
      
      if (!result.data || result.data.length === 0) {
        console.log('用户不存在')
        return {
          code: 404,
          message: '用户不存在',
          isAuthorized: false
        }
      }
      
      const user = result.data[0]
      
      // 验证密码
      if (user.password !== password) {
        console.log('密码错误')
        return {
          code: 401,
          message: '密码错误',
          isAuthorized: false
        }
      }
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userInfo } = user
      console.log('登录成功，用户信息：', userInfo)
      
      return {
        code: 200,
        message: '登录成功',
        ...userInfo,
        openid: user.openid || openid,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
        isNewUser: false,
        isAuthorized: true
      }
    }
    // 如果是注册新用户
    else if (loginType === 'register' && userData) {
      console.log('尝试注册新用户')
      
      // 验证必要字段
      if (!userData.password || !userData.phone) {
        return {
          code: 400,
          message: '缺少必要的注册信息',
          isAuthorized: false
        }
      }
      
      // 检查手机号是否已注册
      if (!(await isPhoneAvailable(userData.phone))) {
        return {
          code: 409,
          message: '该手机号已被注册',
          isAuthorized: false
        }
      }
      
      // 检查用户名是否已注册（如果提供）
      if (userData.nickName && !(await isNicknameAvailable(userData.nickName))) {
        return {
          code: 409,
          message: '该用户名已被使用',
          isAuthorized: false
        }
      }
      
      // 强制生成新的唯一碳ID，不使用用户提供的值
      // 这样可以确保每个用户都有唯一的碳ID，防止任何形式的身份冒充
      const carbonId = await generateUniqueCarbonId();
      
      // 如果用户提供了昵称且该昵称可用，则使用用户提供的昵称，否则生成新的昵称
      const nickName = userData.nickName && (await isNicknameAvailable(userData.nickName)) 
        ? userData.nickName 
        : await generateUniqueNickname();
      
      // 创建用户
      const newUserData = {
        _openid: openid,
        openid: openid,
        nickName: nickName,
        carbonId: carbonId,
        phone: userData.phone,
        password: userData.password,
        avatarUrl: userData.avatarUrl || '',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
        posts: [],
        likes: [],
        comments: []
      };
      
      const result = await users.add({
        data: newUserData
      });
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userInfo } = newUserData;
      
      return {
        code: 200,
        message: '注册成功',
        ...userInfo,
        _id: result._id,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
        isNewUser: true,
        isAuthorized: true
      };
    }
    // 默认微信登录方式
    else {
      console.log('尝试通过微信登录')
      
      // 查询用户是否已存在 - 先通过openid字段查询
      let userRecord = await users.where({
        openid: openid
      }).get()
      
      // 如果通过openid字段没找到，再通过_openid字段查询
      if (!userRecord.data || userRecord.data.length === 0) {
        userRecord = await users.where({
          _openid: openid
        }).get()
      }
      
      if (userRecord.data.length === 0) {
        if (isUserInitiated) {
          // 只有用户主动登录时才创建用户
          const carbonId = await generateUniqueCarbonId();
          const nickName = await generateUniqueNickname();
          
          const userData = {
            _openid: openid,
            openid: openid,
            carbonId: carbonId,
            nickName: nickName,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate(),
            avatarUrl: '/images/default-avatar.png', // 设置默认头像
            posts: [],
            likes: [],
            comments: []
          }
          
          await users.add({
            data: userData
          })
          
          return {
            code: 200,
            message: '登录成功',
            ...userData,
            openid: openid,
            appid: wxContext.APPID,
            unionid: wxContext.UNIONID,
            isNewUser: true,
            isAuthorized: true
          }
        } else {
          // 自动调用时只返回openid，不创建用户
          return {
            code: 401,
            message: '用户未注册',
            openid: openid,
            appid: wxContext.APPID,
            unionid: wxContext.UNIONID,
            isAuthorized: false
          }
        }
      } else {
        // 用户已存在，返回用户信息
        const userInfo = userRecord.data[0];
        const { password: _, ...safeUserInfo } = userInfo;
        
        return {
          code: 200,
          message: '登录成功',
          ...safeUserInfo,
          openid: openid,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
          isNewUser: false,
          isAuthorized: true
        }
      }
    }
  } catch (err) {
    console.error('登录错误：', err)
    return {
      code: 500,
      message: err.message || '服务器错误',
      error: err,
      openid: openid,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      isAuthorized: false
    }
  }
}
