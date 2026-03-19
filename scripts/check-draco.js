const fs = require('fs')
const path = require('path')

const glbPath = path.join(__dirname, '../public/models/air-force-one.glb')

// 读取 GLB 文件
const buffer = fs.readFileSync(glbPath)

console.log('=== GLB 文件信息 ===')
console.log('文件大小:', (buffer.length / 1024 / 1024).toFixed(2), 'MB')

// 读取 JSON chunk (跳过12字节头和4字节chunk长度+4字节chunk类型)
const jsonChunkLength = buffer.readUInt32LE(12)
const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength)

try {
  const gltf = JSON.parse(jsonString)
  
  const extensionsUsed = gltf.extensionsUsed || []
  
  console.log('\n=== 使用的扩展 ===')
  if (extensionsUsed.length > 0) {
    extensionsUsed.forEach(ext => console.log('-', ext))
  } else {
    console.log('无')
  }
  
  const hasDraco = extensionsUsed.includes('KHR_draco_mesh_compression')
  
  console.log('\n=== 结论 ===')
  console.log(hasDraco ? '此文件使用了 Draco 压缩，需要 Draco 解码器' : '此文件未使用 Draco 压缩，可以移除 Draco 配置')
  
} catch (e) {
  console.error('解析失败:', e.message)
}
