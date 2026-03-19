import fs from 'fs'
import path from 'path'

const glbPath = path.join(process.cwd(), 'public/models/air-force-one.glb')

// 读取 GLB 文件
const buffer = fs.readFileSync(glbPath)

// GLB 文件结构: 12 字节头 + JSON chunk + Binary chunk
// 头部: magic(4) + version(4) + length(4)
const magic = buffer.toString('ascii', 0, 4)
const version = buffer.readUInt32LE(4)
const totalLength = buffer.readUInt32LE(8)

console.log('=== GLB 文件信息 ===')
console.log(`文件大小: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
console.log(`GLB 版本: ${version}`)

// 读取 JSON chunk
const jsonChunkLength = buffer.readUInt32LE(12)
const jsonChunkType = buffer.readUInt32LE(16)
const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength)

try {
  const gltf = JSON.parse(jsonString)
  
  // 检查 extensionsUsed 和 extensionsRequired
  const extensionsUsed = gltf.extensionsUsed || []
  const extensionsRequired = gltf.extensionsRequired || []
  
  console.log('\n=== 使用的扩展 ===')
  if (extensionsUsed.length > 0) {
    extensionsUsed.forEach(ext => console.log(`- ${ext}`))
  } else {
    console.log('无')
  }
  
  // 检查是否使用 Draco
  const hasDraco = extensionsUsed.includes('KHR_draco_mesh_compression') || 
                   extensionsRequired.includes('KHR_draco_mesh_compression')
  
  console.log('\n=== Draco 压缩 ===')
  console.log(hasDraco ? '是 - 此文件使用了 Draco 压缩' : '否 - 此文件未使用 Draco 压缩')
  
} catch (e) {
  console.error('解析 JSON 失败:', e.message)
}
