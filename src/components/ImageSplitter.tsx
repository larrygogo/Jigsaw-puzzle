import { useState, useRef } from 'react'

interface ImageSplitterProps {
  className?: string
}

export function ImageSplitter({ className }: ImageSplitterProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [layerCount, setLayerCount] = useState(3)
  const [blockSize, setBlockSize] = useState(32)
  const [invertColors, setInvertColors] = useState(false)
  const [splitImages, setSplitImages] = useState<string[]>([])
  const [randomSeed, setRandomSeed] = useState(Math.random())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
      setSplitImages([]) // 清除之前的结果
    }
  }

  const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = URL.createObjectURL(file)
    })
  }

  // 生成随机块分配表
  const generateBlockAssignment = (width: number, height: number, blockSize: number, layerCount: number): number[][] => {
    const blockWidth = Math.ceil(width / blockSize)
    const blockHeight = Math.ceil(height / blockSize)
    const assignment: number[][] = Array(blockHeight).fill(0).map(() => Array(blockWidth).fill(0))
    
    // 为每个块生成一个随机序列
    const blocks = []
    for (let y = 0; y < blockHeight; y++) {
      for (let x = 0; x < blockWidth; x++) {
        blocks.push({ x, y })
      }
    }

    // 随机打乱块的顺序
    for (let i = blocks.length - 1; i > 0; i--) {
      const j = Math.floor((randomSeed * 7919 + i) % (i + 1))
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
    }

    // 按打乱后的顺序分配图层
    blocks.forEach((block, index) => {
      assignment[block.y][block.x] = index % layerCount
    })

    return assignment
  }

  const splitImage = async () => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = await createImageFromFile(selectedImage)
    canvas.width = img.width
    canvas.height = img.height

    // 绘制原始图片
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 创建分层图片
    const layers: ImageData[] = Array(layerCount).fill(null).map(() => 
      ctx.createImageData(canvas.width, canvas.height)
    )

    // 生成随机块分配
    const blockAssignment = generateBlockAssignment(canvas.width, canvas.height, blockSize, layerCount)

    // 计算每个像素的分配
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const blockX = Math.floor(x / blockSize)
        const blockY = Math.floor(y / blockSize)
        const layerIndex = blockAssignment[blockY]?.[blockX] ?? 0
        
        const i = (y * canvas.width + x) * 4
        
        // 将像素分配到对应的层
        for (let channel = 0; channel < 3; channel++) {
          const value = data[i + channel]
          layers[layerIndex].data[i + channel] = invertColors ? 255 - value : value
        }
        layers[layerIndex].data[i + 3] = data[i + 3] // Alpha 通道保持不变
      }
    }

    // 生成每一层的图片 URL
    const newSplitImages = layers.map(layerData => {
      ctx.putImageData(layerData, 0, 0)
      return canvas.toDataURL()
    })

    setSplitImages(newSplitImages)
  }

  const regenerateDistribution = () => {
    setRandomSeed(Math.random())
    splitImage()
  }

  return (
    <div className={className}>
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
        />
        <div className="controls">
          <div className="control-group">
            <label>
              分层数量：
              <input
                type="number"
                min="2"
                max="10"
                value={layerCount}
                onChange={(e) => setLayerCount(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
              />
            </label>
          </div>
          <div className="control-group">
            <label>
              块大小（像素）：
              <input
                type="number"
                min="8"
                max="128"
                step="8"
                value={blockSize}
                onChange={(e) => setBlockSize(Math.max(8, Math.min(128, parseInt(e.target.value) || 32)))}
              />
            </label>
          </div>
          <div className="control-group">
            <label className="invert-control">
              <input
                type="checkbox"
                checked={invertColors}
                onChange={(e) => setInvertColors(e.target.checked)}
              />
              <span>颜色反转</span>
            </label>
          </div>
          <button 
            onClick={splitImage} 
            disabled={!selectedImage}
          >
            开始分图
          </button>
          <button 
            onClick={regenerateDistribution}
            disabled={!selectedImage}
          >
            重新随机
          </button>
        </div>
      </div>

      {selectedImage && (
        <div className="preview-section">
          <div className="selected-image">
            <h3>原始图片：</h3>
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Original"
              style={{ width: '100%', height: '100%', maxWidth: '500px', maxHeight: '500px' }}
            />
          </div>
        </div>
      )}

      {splitImages.length > 0 && (
        <div className="result-section">
          <h3>分层结果：</h3>
          <div className="split-images">
            {splitImages.map((url, index) => (
              <div key={index} className="split-image-container">
                <h4>第 {index + 1} 层</h4>
                <img src={url} alt={`Layer ${index + 1}`} />
                <a 
                  href={url} 
                  download={`layer_${index + 1}.png`}
                  className="download-button"
                >
                  下载
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
} 