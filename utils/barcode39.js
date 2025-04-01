/**
 * 条形码生成工具 - CODE39编码
 * CODE39比CODE128有更少的竖线，更易于显示
 */

// CODE39编码表 - 每个字符由9个元素组成，其中3个是宽的，6个是窄的
const CODE39_ALPHABET = {
  '0': '101001101101',
  '1': '110100101011',
  '2': '101100101011',
  '3': '110110010101',
  '4': '101001101011',
  '5': '110100110101',
  '6': '101100110101',
  '7': '101001011011',
  '8': '110100101101',
  '9': '101100101101',
  'A': '110101001011',
  'B': '101101001011',
  'C': '110110100101',
  'D': '101011001011',
  'E': '110101100101',
  'F': '101101100101',
  'G': '101010011011',
  'H': '110101001101',
  'I': '101101001101',
  'J': '101011001101',
  'K': '110101010011',
  'L': '101101010011',
  'M': '110110101001',
  'N': '101011010011',
  'O': '110101101001',
  'P': '101101101001',
  'Q': '101010110011',
  'R': '110101011001',
  'S': '101101011001',
  'T': '101011011001',
  'U': '110010101011',
  'V': '100110101011',
  'W': '110011010101',
  'X': '100101101011',
  'Y': '110010110101',
  'Z': '100110110101',
  '-': '100101011011',
  '.': '110010101101',
  ' ': '100110101101',
  '$': '100100100101',
  '/': '100100101001',
  '+': '100101001001',
  '%': '101001001001',
  '*': '100101101101' // 星号是CODE39的起始/终止符
};

/**
 * 生成CODE39条形码编码
 * @param {string} text 要编码的文本
 * @return {Array} 条形码的编码数组，1表示黑色条，0表示白色条
 */
function encodeCode39(text) {
  if (!text || text.length === 0) {
    return [];
  }
  
  // 将文本转换为大写
  text = text.toUpperCase();
  
  // 编码结果
  let result = [];
  
  // 添加起始符 *
  const startCode = CODE39_ALPHABET['*'];
  for (let i = 0; i < startCode.length; i++) {
    result.push(parseInt(startCode.charAt(i)));
  }
  
  // 添加字符间隔
  result.push(0);
  
  // 添加数据
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const pattern = CODE39_ALPHABET[char];
    
    if (pattern) {
      for (let j = 0; j < pattern.length; j++) {
        result.push(parseInt(pattern.charAt(j)));
      }
    } else {
      // 不支持的字符，使用空格代替
      const spacePattern = CODE39_ALPHABET[' '];
      for (let j = 0; j < spacePattern.length; j++) {
        result.push(parseInt(spacePattern.charAt(j)));
      }
    }
    
    // 添加字符间隔（除了最后一个字符）
    if (i < text.length - 1) {
      result.push(0);
    }
  }
  
  // 添加字符间隔
  result.push(0);
  
  // 添加终止符 *
  const stopCode = CODE39_ALPHABET['*'];
  for (let i = 0; i < stopCode.length; i++) {
    result.push(parseInt(stopCode.charAt(i)));
  }
  
  return result;
}

/**
 * 在canvas上绘制CODE39条形码
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {string} text 要编码的文本
 * @param {number} x 条形码左上角X坐标
 * @param {number} y 条形码左上角Y坐标
 * @param {number} width 条形码宽度
 * @param {number} height 条形码高度
 * @param {string} darkColor 条形码暗色部分颜色
 * @param {string} lightColor 条形码亮色部分颜色
 */
function drawBarcode39(ctx, text, x, y, width, height, darkColor = '#000000', lightColor = '#ffffff') {
  // 获取条形码编码
  const code = encodeCode39(text);
  
  if (code.length === 0) {
    return;
  }
  
  // 计算每个单元的宽度
  const unitWidth = width / code.length;
  
  // 绘制背景
  ctx.fillStyle = lightColor;
  ctx.fillRect(x, y, width, height);
  
  // 绘制条形码
  ctx.fillStyle = darkColor;
  for (let i = 0; i < code.length; i++) {
    if (code[i] === 1) {
      ctx.fillRect(x + i * unitWidth, y, unitWidth, height);
    }
  }
}

/**
 * 优化的CODE39条形码绘制函数，使用不同宽度的条和空格
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {string} text 要编码的文本
 * @param {number} x 条形码左上角X坐标
 * @param {number} y 条形码左上角Y坐标
 * @param {number} width 条形码宽度
 * @param {number} height 条形码高度
 * @param {string} darkColor 条形码暗色部分颜色
 * @param {string} lightColor 条形码亮色部分颜色
 */
function drawOptimizedBarcode39(ctx, text, x, y, width, height, darkColor = '#000000', lightColor = '#ffffff') {
  if (!text || text.length === 0) {
    return;
  }
  
  // 将文本转换为大写
  text = text.toUpperCase();
  
  // 绘制背景
  ctx.fillStyle = lightColor;
  ctx.fillRect(x, y, width, height);
  
  // 计算总编码长度
  let totalLength = 0;
  
  // 起始符 *
  totalLength += CODE39_ALPHABET['*'].length;
  
  // 字符间隔
  totalLength += 1;
  
  // 数据
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const pattern = CODE39_ALPHABET[char];
    
    if (pattern) {
      totalLength += pattern.length;
    } else {
      totalLength += CODE39_ALPHABET[' '].length;
    }
    
    // 字符间隔（除了最后一个字符）
    if (i < text.length - 1) {
      totalLength += 1;
    }
  }
  
  // 字符间隔
  totalLength += 1;
  
  // 终止符 *
  totalLength += CODE39_ALPHABET['*'].length;
  
  // 计算单位宽度
  const unitWidth = width / totalLength;
  
  // 当前X位置
  let currentX = x;
  
  // 绘制起始符 *
  const startCode = CODE39_ALPHABET['*'];
  for (let i = 0; i < startCode.length; i++) {
    if (startCode.charAt(i) === '1') {
      ctx.fillStyle = darkColor;
      ctx.fillRect(currentX, y, unitWidth, height);
    }
    currentX += unitWidth;
  }
  
  // 添加字符间隔
  currentX += unitWidth;
  
  // 绘制数据
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const pattern = CODE39_ALPHABET[char] || CODE39_ALPHABET[' '];
    
    for (let j = 0; j < pattern.length; j++) {
      if (pattern.charAt(j) === '1') {
        ctx.fillStyle = darkColor;
        ctx.fillRect(currentX, y, unitWidth, height);
      }
      currentX += unitWidth;
    }
    
    // 添加字符间隔（除了最后一个字符）
    if (i < text.length - 1) {
      currentX += unitWidth;
    }
  }
  
  // 添加字符间隔
  currentX += unitWidth;
  
  // 绘制终止符 *
  const stopCode = CODE39_ALPHABET['*'];
  for (let i = 0; i < stopCode.length; i++) {
    if (stopCode.charAt(i) === '1') {
      ctx.fillStyle = darkColor;
      ctx.fillRect(currentX, y, unitWidth, height);
    }
    currentX += unitWidth;
  }
}

module.exports = {
  encodeCode39,
  drawBarcode39,
  drawOptimizedBarcode39
};
