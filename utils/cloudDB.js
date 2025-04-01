// 云数据库操作工具类
const db = wx.cloud.database({
  env: 'cloud1-2go4otwj32566b98'
})

// 默认图片配置
const DEFAULT_AVATAR = '/images/default-avatar.png'
const DEFAULT_POST_IMAGE = '/images/default-post.png'

// 完整的帖子数据库操作
const postDB = {
  // 获取帖子列表
  getPosts: async (page = 1, pageSize = 10) => {
    try {
      console.log('开始查询帖子，参数：', { page, pageSize })
      
      // 获取总数
      const countResult = await db.collection('posts').count()
      const total = countResult.total
      console.log('帖子总数：', total)
      
      if (total === 0) {
        console.log('没有帖子数据')
        return []
      }
      
      // 查询帖子列表
      const result = await db.collection('posts')
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      console.log('原始查询结果：', result)
      
      if (!result.data || result.data.length === 0) {
        console.log('本页没有数据')
        return []
      }
      
      // 处理数据，确保所有必要字段都存在
      const posts = result.data.map(post => ({
        _id: post._id,
        title: post.title || '无标题',
        content: post.content || '无内容',
        authorName: post.authorName || '匿名用户',
        authorAvatar: post.authorAvatar || DEFAULT_AVATAR,
        images: Array.isArray(post.images) && post.images.length > 0 ? post.images : [DEFAULT_POST_IMAGE],
        createTime: post.createTime || new Date(),
        likes: post.likes || 0,
        comments: post.comments || 0
      }))
      
      console.log('处理后的帖子数据：', posts)
      return posts
    } catch (error) {
      console.error('获取帖子列表失败：', error)
      throw error
    }
  },

  // 获取帖子详情
  getPostById: async (postId) => {
    try {
      console.log('开始获取帖子详情，ID：', postId)
      const result = await db.collection('posts').doc(postId).get()
      
      if (!result.data) {
        console.log('未找到帖子')
        return null
      }
      
      // 处理数据，确保所有必要字段都存在
      const post = {
        _id: result.data._id,
        title: result.data.title || '无标题',
        content: result.data.content || '无内容',
        authorName: result.data.authorName || '匿名用户',
        authorAvatar: result.data.authorAvatar || DEFAULT_AVATAR,
        images: Array.isArray(result.data.images) && result.data.images.length > 0 ? result.data.images : [DEFAULT_POST_IMAGE],
        createTime: result.data.createTime || new Date(),
        likeCount: result.data.likeCount || 0,
        commentCount: result.data.commentCount || 0,
        isLiked: result.data.isLiked || false
      }
      
      console.log('处理后的帖子详情：', post)
      return post
    } catch (error) {
      console.error('获取帖子详情失败：', error)
      throw error
    }
  },

  // 更新点赞状态
  updateLikes: async (postId, isLiked) => {
    try {
      await db.collection('posts').doc(postId).update({
        data: {
          likeCount: db.command.inc(isLiked ? 1 : -1),
          isLiked: isLiked
        }
      })
    } catch (error) {
      console.error('更新点赞状态失败：', error)
      throw error
    }
  },

  // 创建帖子
  createPost: async (postData) => {
    try {
      const result = await db.collection('posts').add({
        data: {
          ...postData,
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          likeCount: 0,
          commentCount: 0,
          isLiked: false
        }
      })
      return result._id
    } catch (error) {
      console.error('创建帖子失败：', error)
      throw error
    }
  }
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

// 生成碳ID的工具函数
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
    const existingUser = await db.collection('users')
      .where({
        carbonId: carbonId
      })
      .get();
    
    if (existingUser.data.length === 0) {
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
    const existingUser = await db.collection('users')
      .where({
        nickName: nickname
      })
      .get();
    
    if (existingUser.data.length === 0) {
      return nickname;
    }
    
    attempts++;
  }
  
  throw new Error('无法生成唯一的用户名，请稍后重试');
}

// 检查用户名是否可用
async function isNicknameAvailable(nickname) {
  const existingUser = await db.collection('users')
    .where({
      nickName: nickname
    })
    .get();
  
  return existingUser.data.length === 0;
}

// 检查碳ID是否已存在
async function isCarbonIdAvailable(carbonId) {
  const existingUser = await db.collection('users')
    .where({
      carbonId: carbonId
    })
    .get();
  
  return existingUser.data.length === 0;
}

// 用户相关操作
const userDB = {
  // 登录
  login: async (loginId, password) => {
    try {
      console.log('尝试登录，登录ID：', loginId)
      
      // 查询用户 - 优先使用碳ID作为唯一标识符
      let query;
      
      // 检查是否是碳ID格式 (XX-X-XXXX-XXX)
      const isCarbonIdFormat = /^[A-Z0-9]{2}-[A-Z0-9]{1}-[A-Z0-9]{4}-[A-Z0-9]{3}$/.test(loginId);
      
      if (isCarbonIdFormat) {
        // 如果是碳ID格式，只通过碳ID查询
        query = { carbonId: loginId };
      } else {
        // 否则通过手机号或用户名查询
        query = db.command.or([
          { phone: loginId },
          { nickName: loginId }
        ]);
      }
      
      const result = await db.collection('users').where(query).get();
      
      if (!result.data || result.data.length === 0) {
        console.log('用户不存在')
        return null
      }
      
      // 如果通过用户名或手机号找到多个用户（这不应该发生，但为了安全起见）
      if (result.data.length > 1 && !isCarbonIdFormat) {
        console.error('发现多个匹配的用户账户，请使用碳ID登录')
        throw new Error('账户异常，请使用碳ID登录')
      }
      
      const user = result.data[0]
      
      // 验证密码
      if (user.password !== password) {
        console.log('密码错误')
        return null
      }
      
      // 确保用户有碳ID
      if (!user.carbonId) {
        console.log('用户缺少carbonId，正在生成新的碳ID')
        user.carbonId = await generateUniqueCarbonId()
        // 更新用户信息
        await db.collection('users').doc(user._id).update({
          data: { carbonId: user.carbonId }
        })
        console.log('已为用户生成新的碳ID:', user.carbonId)
      }
      
      // 确保用户有openid
      if (!user.openid) {
        console.error('用户缺少openid，这可能导致发帖和评论功能无法正常工作')
        // 如果用户没有openid，尝试使用_openid字段
        if (user._openid) {
          user.openid = user._openid
          // 更新用户信息
          await db.collection('users').doc(user._id).update({
            data: { openid: user._openid }
          })
          console.log('已将用户的_openid复制到openid字段:', user.openid)
        }
      }
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userInfo } = user
      console.log('登录成功，用户信息：', userInfo)
      return userInfo
      
    } catch (error) {
      console.error('登录失败：', error)
      throw error
    }
  },

  // 检查用户名是否可用
  checkNickname: async (nickname) => {
    try {
      const result = await db.collection('users')
        .where({
          nickName: nickname
        })
        .get()
      
      // 严格确保用户名唯一性
      if (result.data.length > 0) {
        console.log('用户名已被使用：', nickname)
        return false
      }
      
      return true
    } catch (error) {
      console.error('检查用户名失败：', error)
      throw error
    }
  },

  // 创建用户
  createUser: async (userData) => {
    try {
      console.log('开始创建用户，数据:', userData)
      
      // 获取当前用户的openid（如果有）
      let openid = userData.openid;
      if (!openid) {
        try {
          // 尝试从云函数获取openid
          const wxContext = await wx.cloud.callFunction({
            name: 'login',
            data: { isUserInitiated: true }
          });
          if (wxContext && wxContext.result && wxContext.result.openid) {
            openid = wxContext.result.openid;
            console.log('从云函数获取的openid:', openid);
          }
        } catch (err) {
          console.error('获取openid失败:', err);
        }
      }
      
      // 如果有openid，先检查是否已存在该openid的用户
      if (openid) {
        console.log('检查是否已存在openid为', openid, '的用户');
        
        // 先通过openid字段查询
        let existingUser = await db.collection('users').where({
          openid: openid
        }).get();
        
        // 如果没找到，再通过_openid字段查询
        if (!existingUser.data || existingUser.data.length === 0) {
          existingUser = await db.collection('users').where({
            _openid: openid
          }).get();
        }
        
        // 如果找到了现有用户，更新用户信息而不是创建新用户
        if (existingUser.data && existingUser.data.length > 0) {
          console.log('找到现有用户，将更新而不是创建新用户');
          const user = existingUser.data[0];
          
          // 准备更新数据
          const updateData = {};
          
          // 只更新提供的字段
          if (userData.phone && userData.phone !== user.phone) {
            // 检查手机号是否已被其他用户使用
            const phoneExists = await userDB.checkPhoneExists(userData.phone);
            if (phoneExists) {
              throw new Error('该手机号已被其他用户使用');
            }
            updateData.phone = userData.phone;
          }
          
          if (userData.password) {
            updateData.password = userData.password;
          }
          
          if (userData.avatarUrl) {
            updateData.avatarUrl = userData.avatarUrl;
          }
          
          // 确保用户有碳ID
          if (!user.carbonId) {
            updateData.carbonId = await generateUniqueCarbonId();
            console.log('为现有用户生成新的碳ID:', updateData.carbonId);
          }
          
          // 确保用户有openid字段
          if (!user.openid && openid) {
            updateData.openid = openid;
          }
          
          // 如果有更新内容，执行更新
          if (Object.keys(updateData).length > 0) {
            updateData.updateTime = db.serverDate();
            console.log('更新现有用户数据:', updateData);
            
            await db.collection('users').doc(user._id).update({
              data: updateData
            });
          }
          
          // 获取更新后的用户信息
          const updatedUser = await db.collection('users').doc(user._id).get();
          const { password: _, ...userInfo } = updatedUser.data;
          
          console.log('返回更新后的用户信息:', userInfo);
          return userInfo;
        }
      }
      
      // 如果没有找到现有用户，创建新用户
      console.log('未找到现有用户，将创建新用户');
      
      // 检查手机号是否已注册
      if (userData.phone) {
        const phoneExists = await userDB.checkPhoneExists(userData.phone);
        if (phoneExists) {
          throw new Error('该手机号已注册');
        }
      }
      
      // 检查用户名是否已注册（如果提供）
      if (userData.nickName) {
        const nicknameExists = !(await isNicknameAvailable(userData.nickName));
        if (nicknameExists) {
          throw new Error('该用户名已被使用');
        }
      }
      
      // 强制生成新的唯一碳ID，不使用用户提供的值
      // 这样可以确保每个用户都有唯一的碳ID，防止任何形式的身份冒充
      const carbonId = await generateUniqueCarbonId();
      console.log('生成的碳ID:', carbonId)
      
      // 如果用户提供了昵称且该昵称可用，则使用用户提供的昵称，否则生成新的昵称
      const nickName = userData.nickName || await generateUniqueNickname();
      console.log('使用的昵称:', nickName)
      
      // 创建用户数据对象
      const userDataToSave = {
        ...userData,
        carbonId,
        nickName,
        openid: openid, // 确保保存openid
        avatarUrl: userData.avatarUrl || DEFAULT_AVATAR,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };
      
      console.log('准备保存的用户数据:', userDataToSave);
      
      // 创建用户
      const result = await db.collection('users').add({
        data: userDataToSave
      });
      
      console.log('用户创建成功，ID:', result._id);
      
      // 获取创建的用户信息
      const newUser = await db.collection('users').doc(result._id).get();
      const { password: _, ...userInfo } = newUser.data;
      
      console.log('返回的用户信息:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('创建用户失败：', error);
      throw error;
    }
  },

  // 更新用户信息
  updateUserInfo: async (openid, userInfo) => {
    try {
      console.log('开始更新用户信息，openid:', openid)
      
      // 获取当前用户信息 - 使用openid作为主要标识符
      let currentUser = await db.collection('users').where({
        openid: openid
      }).get()
      
      // 如果通过openid找不到用户，尝试通过_openid查询
      if (!currentUser.data || currentUser.data.length === 0) {
        console.log('通过openid未找到用户，尝试通过_openid查询')
        
        currentUser = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (!currentUser.data || currentUser.data.length === 0) {
          console.error('未找到用户，openid:', openid)
          throw new Error('用户不存在')
        }
        
        // 找到用户，但需要更新openid字段
        console.log('通过_openid找到用户，将更新openid字段')
      }

      const existingUser = currentUser.data[0]
      console.log('找到现有用户:', existingUser)

      // 确保必要字段存在 - 碳ID是必须的
      if (!existingUser.carbonId) {
        console.log('用户缺少carbonId，正在生成新的碳ID')
        existingUser.carbonId = await generateUniqueCarbonId()
        console.log('生成的新碳ID:', existingUser.carbonId)
      }
      
      // 确保用户有openid字段
      if (!existingUser.openid) {
        console.log('用户缺少openid字段，将添加')
        existingUser.openid = openid
      }

      // 如果要更新手机号，先检查是否已被其他用户使用
      if (userInfo.phone && userInfo.phone !== existingUser.phone) {
        const phoneExists = await userDB.checkPhoneExists(userInfo.phone);
        if (phoneExists) {
          throw new Error('该手机号已被其他用户使用');
        }
      }
      
      // 如果要更新昵称，严格检查是否可用
      if (userInfo.nickName && userInfo.nickName !== existingUser.nickName) {
        console.log('检查用户名是否可用:', userInfo.nickName)
        // 检查用户名是否已被使用
        const isAvailable = await userDB.checkNickname(userInfo.nickName)
        if (!isAvailable) {
          throw new Error('该用户名已被使用，请选择其他用户名')
        }
      }
      
      // 构建更新对象，确保保留所有必要字段
      // 碳ID是不可更改的唯一标识符
      const updateData = {
        // 允许更新用户名，但需要严格检查唯一性
        nickName: userInfo.nickName || existingUser.nickName,
        avatarUrl: userInfo.avatarUrl || existingUser.avatarUrl,
        // 碳ID是不可更改的
        carbonId: existingUser.carbonId,
        phone: userInfo.phone || existingUser.phone,
        openid: openid, // 确保设置openid
        updateTime: db.serverDate()
      }
      
      console.log('准备更新用户数据:', updateData)
      
      // 更新用户信息 - 使用_id作为查询条件，确保能找到用户
      await db.collection('users').doc(existingUser._id).update({
        data: updateData
      })
      
      console.log('用户信息已更新，正在获取最新数据')
      
      // 获取更新后的用户信息 - 使用_id查询，确保能找到用户
      const result = await db.collection('users').doc(existingUser._id).get()
      
      if (!result.data) {
        console.error('更新后未找到用户')
        throw new Error('更新用户信息后无法获取用户数据')
      }
      
      const { password: _, ...updatedUserInfo } = result.data
      console.log('返回更新后的用户信息:', updatedUserInfo)
      return updatedUserInfo
      
    } catch (error) {
      console.error('更新用户信息失败：', error)
      throw error
    }
  },

  // 获取用户信息 - 优先使用碳ID
  getUserInfo: async (openid) => {
    try {
      console.log('获取用户信息，openid:', openid)
      
      // 尝试通过openid查询用户
      const result = await db.collection('users').where({
        openid: openid
      }).get()
      
      if (!result.data || result.data.length === 0) {
        console.log('通过openid未找到用户，尝试通过_openid查询')
        
        // 尝试通过_openid查询
        const altResult = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (!altResult.data || altResult.data.length === 0) {
          console.log('用户不存在')
          return null
        }
        
        // 找到用户，但需要更新openid字段
        const user = altResult.data[0]
        console.log('通过_openid找到用户，更新openid字段')
        
        // 更新用户的openid字段
        await db.collection('users').doc(user._id).update({
          data: { openid: openid }
        })
        
        user.openid = openid
      } else {
        var user = result.data[0]
      }
      
      // 确保用户有碳ID
      if (!user.carbonId) {
        console.log('用户缺少carbonId，正在生成新的碳ID')
        const carbonId = await generateUniqueCarbonId()
        await db.collection('users').doc(user._id).update({
          data: { carbonId }
        })
        user.carbonId = carbonId
        console.log('已为用户生成新的碳ID:', carbonId)
      }
      
      // 确保用户有openid
      if (!user.openid) {
        console.log('用户缺少openid，正在更新')
        await db.collection('users').doc(user._id).update({
          data: { openid }
        })
        user.openid = openid
        console.log('已更新用户的openid:', openid)
      }
      
      const { password: _, ...userInfo } = user
      console.log('返回用户信息:', userInfo)
      return userInfo
    } catch (error) {
      console.error('获取用户信息失败：', error)
      throw error
    }
  },

  // 获取用户收藏的帖子
  getFavorites: async (openid, page = 1, pageSize = 10) => {
    try {
      console.log('获取用户收藏，openid:', openid)
      
      // 先通过openid查询
      let result = await db.collection('favorites')
        .where({
          openid: openid
        })
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      // 如果没有结果，尝试通过_openid查询
      if (!result.data || result.data.length === 0) {
        console.log('通过openid未找到收藏，尝试通过_openid查询')
        
        result = await db.collection('favorites')
          .where({
            _openid: openid
          })
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()
        
        // 如果找到了结果，更新这些记录的openid字段
        if (result.data && result.data.length > 0) {
          console.log('通过_openid找到收藏，更新这些记录的openid字段')
          
          // 更新所有找到的记录
          for (const favorite of result.data) {
            await db.collection('favorites').doc(favorite._id).update({
              data: { openid: openid }
            })
          }
        }
      }
      
      console.log('找到收藏记录数:', result.data ? result.data.length : 0)
      return result.data || []
    } catch (error) {
      console.error('获取收藏列表失败：', error)
      throw error
    }
  },

  // 添加收藏
  addFavorite: async (openid, postId) => {
    try {
      console.log('添加收藏，openid:', openid, 'postId:', postId)
      
      // 先检查是否已收藏，避免重复
      const isAlreadyFavorite = await userDB.checkFavorite(openid, postId)
      if (isAlreadyFavorite) {
        console.log('已经收藏过该帖子')
        return
      }
      
      // 添加收藏记录
      const result = await db.collection('favorites').add({
        data: {
          openid,
          postId,
          createTime: db.serverDate()
        }
      })
      
      console.log('收藏成功，ID:', result._id)
    } catch (error) {
      console.error('添加收藏失败：', error)
      throw error
    }
  },

  // 取消收藏
  removeFavorite: async (openid, postId) => {
    try {
      console.log('取消收藏，openid:', openid, 'postId:', postId)
      
      // 先通过openid查询
      let result = await db.collection('favorites')
        .where({
          openid: openid,
          postId: postId
        })
        .remove()
      
      // 如果没有删除任何记录，尝试通过_openid查询
      if (result.stats.removed === 0) {
        console.log('通过openid未找到收藏记录，尝试通过_openid查询')
        
        result = await db.collection('favorites')
          .where({
            _openid: openid,
            postId: postId
          })
          .remove()
      }
      
      console.log('取消收藏结果:', result)
    } catch (error) {
      console.error('取消收藏失败：', error)
      throw error
    }
  },

  // 检查是否已收藏
  checkFavorite: async (openid, postId) => {
    try {
      console.log('检查是否已收藏，openid:', openid, 'postId:', postId)
      
      // 先通过openid查询
      let result = await db.collection('favorites')
        .where({
          openid: openid,
          postId: postId
        })
        .get()
      
      // 如果没有结果，尝试通过_openid查询
      if (!result.data || result.data.length === 0) {
        console.log('通过openid未找到收藏记录，尝试通过_openid查询')
        
        result = await db.collection('favorites')
          .where({
            _openid: openid,
            postId: postId
          })
          .get()
        
        // 如果找到了结果，更新这些记录的openid字段
        if (result.data && result.data.length > 0) {
          console.log('通过_openid找到收藏记录，更新openid字段')
          
          // 更新所有找到的记录
          for (const favorite of result.data) {
            await db.collection('favorites').doc(favorite._id).update({
              data: { openid: openid }
            })
          }
        }
      }
      
      const isFavorite = result.data && result.data.length > 0
      console.log('是否已收藏:', isFavorite)
      return isFavorite
    } catch (error) {
      console.error('检查收藏状态失败：', error)
      throw error
    }
  },

  // 检查手机号是否已注册
  checkPhoneExists: async (phone) => {
    try {
      const result = await db.collection('users')
        .where({
          phone: phone
        })
        .get();
      return result.data.length > 0;
    } catch (error) {
      console.error('检查手机号失败：', error);
      throw error;
    }
  },
}

// 评论相关操作
const commentDB = {
  // 获取评论列表
  getComments: async (postId, page = 1, pageSize = 10) => {
    try {
      console.log('获取评论列表，postId:', postId, '页码:', page)
      
      const result = await db.collection('comments')
        .where({
          postId: postId
        })
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      console.log('找到评论数:', result.data ? result.data.length : 0)
      
      // 处理评论数据，确保所有必要字段都存在
      return (result.data || []).map(comment => ({
        ...comment,
        authorAvatar: comment.authorAvatar || DEFAULT_AVATAR,
        authorName: comment.authorName || '匿名用户'
      }))
    } catch (error) {
      console.error('获取评论列表失败：', error)
      throw error
    }
  },

  // 添加评论
  addComment: async (commentData) => {
    try {
      console.log('添加评论，数据:', commentData)
      
      // 确保评论数据包含所有必要字段
      if (!commentData.postId) {
        throw new Error('缺少帖子ID')
      }
      
      if (!commentData.content || !commentData.content.trim()) {
        throw new Error('评论内容不能为空')
      }
      
      // 确保authorId字段存在
      if (!commentData.authorId) {
        console.error('评论缺少authorId字段，这可能导致后续功能异常')
      }
      
      // 添加评论
      const result = await db.collection('comments').add({
        data: {
          postId: commentData.postId,
          content: commentData.content.trim(),
          authorName: commentData.authorName || '匿名用户',
          authorAvatar: commentData.authorAvatar || DEFAULT_AVATAR,
          authorId: commentData.authorId, // 确保保存authorId
          openid: commentData.authorId, // 同时保存为openid，确保兼容性
          createTime: db.serverDate()
        }
      })
      
      console.log('评论添加成功，ID:', result._id)

      // 更新帖子的评论计数
      await db.collection('posts').doc(commentData.postId).update({
        data: {
          commentCount: db.command.inc(1)
        }
      })
      
      console.log('帖子评论计数已更新')

      return result._id
    } catch (error) {
      console.error('添加评论失败：', error)
      throw error
    }
  }
}

// 获取用户碳币交易记录
userDB.getCarbonCoinTransactions = async (openid, page = 1, pageSize = 20) => {
  try {
    console.log('获取碳币交易记录，openid:', openid)
    
    // 查询交易记录
    const result = await db.collection('carbon_transactions')
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
}

// 添加碳币交易记录
userDB.addCarbonCoinTransaction = async (transactionData) => {
  try {
    console.log('添加碳币交易记录，数据:', transactionData)
    
    // 确保交易数据包含所有必要字段
    if (!transactionData.openid) {
      throw new Error('缺少用户ID')
    }
    
    if (!transactionData.amount || isNaN(parseFloat(transactionData.amount))) {
      throw new Error('无效的交易金额')
    }
    
    // 添加交易记录
    const result = await db.collection('carbon_transactions').add({
      data: {
        openid: transactionData.openid,
        title: transactionData.title || '碳币交易',
        amount: parseFloat(parseFloat(transactionData.amount).toFixed(2)), // 确保精确到小数点后2位
        type: transactionData.type || 'expense', // income 或 expense
        createTime: db.serverDate()
      }
    })
    
    console.log('交易记录添加成功，ID:', result._id)
    
    // 更新用户碳币余额
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
}

module.exports = {
  postDB,
  userDB,
  commentDB,
  generateUniqueCarbonId,
  generateUniqueNickname,
  isNicknameAvailable,
  isCarbonIdAvailable
}
