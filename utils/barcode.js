/**
 * 条形码生成工具 - CODE128编码
 */

// CODE128编码表
const CODE128_ALPHABET = {
  // 数字 0-9
  '0': [2, 1, 2, 2, 2, 2],
  '1': [2, 2, 2, 1, 2, 2],
  '2': [2, 2, 2, 2, 2, 1],
  '3': [1, 2, 1, 2, 2, 3],
  '4': [1, 2, 1, 3, 2, 2],
  '5': [1, 3, 1, 2, 2, 2],
  '6': [1, 2, 2, 2, 1, 3],
  '7': [1, 2, 2, 3, 1, 2],
  '8': [1, 3, 2, 2, 1, 2],
  '9': [2, 2, 1, 2, 1, 3],
  
  // 字母 A-Z
  'A': [2, 2, 1, 3, 1, 2],
  'B': [2, 3, 1, 2, 1, 2],
  'C': [2, 2, 1, 2, 3, 1],
  'D': [2, 2, 3, 1, 2, 1],
  'E': [2, 3, 2, 1, 2, 1],
  'F': [2, 1, 3, 2, 1, 2],
  'G': [2, 1, 3, 1, 2, 2],
  'H': [2, 1, 2, 3, 1, 2],
  'I': [2, 1, 2, 1, 3, 2],
  'J': [2, 1, 2, 1, 2, 3],
  'K': [1, 2, 1, 2, 1, 4],
  'L': [1, 2, 1, 4, 1, 2],
  'M': [1, 4, 1, 2, 1, 2],
  'N': [1, 2, 3, 2, 1, 2],
  'O': [1, 2, 3, 1, 2, 2],
  'P': [1, 2, 1, 3, 2, 2],
  'Q': [1, 2, 1, 2, 3, 2],
  'R': [1, 2, 1, 2, 2, 3],
  'S': [1, 3, 2, 2, 1, 2],
  'T': [1, 3, 1, 2, 2, 2],
  'U': [1, 2, 2, 2, 1, 3],
  'V': [1, 2, 2, 3, 1, 2],
  'W': [3, 1, 2, 1, 3, 1],
  'X': [3, 1, 2, 1, 2, 2],
  'Y': [3, 2, 2, 1, 2, 1],
  'Z': [3, 2, 1, 1, 2, 2],
  
  // 特殊字符
  '-': [1, 2, 2, 1, 3, 2],
  '.': [3, 2, 1, 2, 2, 1],
  ' ': [3, 2, 2, 1, 2, 1],
  '$': [3, 1, 3, 1, 2, 1],
  '/': [3, 1, 2, 1, 3, 1],
  '+': [2, 1, 3, 1, 3, 1],
  '%': [1, 3, 3, 1, 1, 2],
  '*': [3, 1, 3, 1, 1, 2]
};

// CODE128 起始和终止符
const START_CODE_B = [2, 3, 3, 1, 1, 1]; // 开始符 B
const STOP = [2, 3, 3, 1, 1, 1, 2]; // 终止符

/**
 * 计算CODE128校验位
 * @param {string} text 要编码的文本
 * @return {number} 校验位
 */
function calculateChecksum(text) {
  let sum = 104; // 开始符B的值
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const charCode = char.charCodeAt(0);
    
    // 计算字符的权重值
    let weight;
    if (charCode >= 32 && charCode <= 95) {
      weight = charCode - 32;
    } else if (charCode >= 96 && charCode <= 127) {
      weight = charCode - 32 - 64;
    } else {
      weight = 0; // 不支持的字符
    }
    
    sum += weight * (i + 1);
  }
  
  return sum % 103;
}

/**
 * 获取校验位的编码
 * @param {number} checksum 校验位
 * @return {Array} 校验位的编码
 */
function getChecksumEncoding(checksum) {
  // 校验位的编码规则
  if (checksum <= 94) {
    const char = String.fromCharCode(checksum + 32);
    return CODE128_ALPHABET[char] || [2, 2, 2, 2, 2, 2];
  } else if (checksum <= 106) {
    const char = String.fromCharCode(checksum + 32 + 64 - 95);
    return CODE128_ALPHABET[char] || [2, 2, 2, 2, 2, 2];
  } else {
    return [2, 2, 2, 2, 2, 2]; // 默认编码
  }
}

/**
 * 生成CODE128条形码编码
 * @param {string} text 要编码的文本
 * @return {Array} 条形码的编码数组，1表示黑色条，0表示白色条
 */
function encodeCode128(text) {
  if (!text || text.length === 0) {
    return [];
  }
  
  // 计算校验位
  const checksum = calculateChecksum(text);
  
  // 编码结果
  let result = [];
  
  // 添加开始符
  START_CODE_B.forEach(width => {
    for (let i = 0; i < width; i++) {
      result.push(result.length % 2 === 0 ? 1 : 0);
    }
  });
  
  // 添加数据
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const pattern = CODE128_ALPHABET[char];
    
    if (pattern) {
      pattern.forEach(width => {
        for (let j = 0; j < width; j++) {
          result.push(result.length % 2 === 0 ? 1 : 0);
        }
      });
    } else {
      // 不支持的字符，使用空格代替
      CODE128_ALPHABET[' '].forEach(width => {
        for (let j = 0; j < width; j++) {
          result.push(result.length % 2 === 0 ? 1 : 0);
        }
      });
    }
  }
  
  // 添加校验位
  const checksumPattern = getChecksumEncoding(checksum);
  checksumPattern.forEach(width => {
    for (let i = 0; i < width; i++) {
      result.push(result.length % 2 === 0 ? 1 : 0);
    }
  });
  
  // 添加终止符
  STOP.forEach(width => {
    for (let i = 0; i < width; i++) {
      result.push(result.length % 2 === 0 ? 1 : 0);
    }
  });
  
  return result;
}

/**
 * 在canvas上绘制CODE128条形码
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {string} text 要编码的文本
 * @param {number} x 条形码左上角X坐标
 * @param {number} y 条形码左上角Y坐标
 * @param {number} width 条形码宽度
 * @param {number} height 条形码高度
 * @param {string} darkColor 条形码暗色部分颜色
 * @param {string} lightColor 条形码亮色部分颜色
 */
function drawBarcode(ctx, text, x, y, width, height, darkColor = '#000000', lightColor = '#ffffff') {
  // 获取条形码编码
  const code = encodeCode128(text);
  
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

module.exports = {
  encodeCode128,
  drawBarcode
};
