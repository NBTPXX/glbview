import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

const inputPath = './public/models/air-force-one.glb'
const outputPath = './public/models/air-force-one-draco.glb'

async function compressGLB() {
  console.log('开始压缩 GLB 文件...')
  console.log('输入文件:', inputPath)
  
  // 检查文件是否存在
  if (!fs.existsSync(inputPath)) {
    console.error('错误: 输入文件不存在')
    process.exit(1)
  }
  
  const inputStats = fs.statSync(inputPath)
  console.log('原始文件大小:', (inputStats.size / 1024 / 1024).toFixed(2), 'MB')
  
  try {
    // 使用 gltf-transform 进行 Draco 压缩
    await execAsync(`npx @gltf-transform/cli optimize ${inputPath} ${outputPath} --compress draco`)
    
    const outputStats = fs.statSync(outputPath)
    console.log('压缩后文件大小:', (outputStats.size / 1024 / 1024).toFixed(2), 'MB')
    console.log('压缩比:', ((1 - outputStats.size / inputStats.size) * 100).toFixed(1), '%')
    console.log('压缩完成! 输出文件:', outputPath)
  } catch (error) {
    console.error('压缩失败:', error.message)
    process.exit(1)
  }
}

compressGLB()
