import { useState, useRef } from 'react'

type BlendMode = 'multiply' | 'screen' | 'auto'

interface ImageMergerProps {
  className?: string
}

export function ImageMerger({ className }: ImageMergerProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [mergedImage, setMergedImage] = useState<string | null>(null)
  const [invertColors, setInvertColors] = useState(false)
  const [blendMode, setBlendMode] = useState<BlendMode>('auto')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mergedImageDataRef = useRef<ImageData | null>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files))
    }
  }

  const invertImageColors = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]         // 红色通道反转
      data[i + 1] = 255 - data[i + 1] // 绿色通道反转
      data[i + 2] = 255 - data[i + 2] // 蓝色通道反转
      // 保持 alpha 通道不变
    }

    ctx.putImageData(imageData, 0, 0)
    return imageData
  }

  const handleInvertChange = (checked: boolean) => {
    setInvertColors(checked)
    if (!canvasRef.current || !mergedImageDataRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 恢复原始图像数据
    ctx.putImageData(mergedImageDataRef.current, 0, 0)

    // 如果需要反转，则应用反转效果
    if (checked) {
      invertImageColors(ctx, canvas.width, canvas.height)
    }

    // 更新合成结果
    setMergedImage(canvas.toDataURL())
  }

  const mergeImages = async () => {
    if (!selectedImages.length || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小为第一张图片的大小
    const firstImage = await createImageFromFile(selectedImages[0])
    canvas.width = firstImage.width
    canvas.height = firstImage.height

    // 绘制第一张图片
    ctx.drawImage(firstImage, 0, 0)

    // 处理后续图片
    for (let i = 1; i < selectedImages.length; i++) {
      const img = await createImageFromFile(selectedImages[i])
      
      // 根据选择的混合模式设置
      if (blendMode === 'auto') {
        // 创建临时画布来分析背景色
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) continue

        tempCtx.drawImage(img, 0, 0)
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height)
        const { isWhiteBackground, isBlackBackground } = analyzeBackground(imageData)

        // 如果既不是明显的白色背景也不是明显的黑色背景，使用正片叠底作为默认值
        ctx.globalCompositeOperation = isWhiteBackground ? 'multiply' : (isBlackBackground ? 'screen' : 'multiply')
      } else {
        ctx.globalCompositeOperation = blendMode
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    // 重置混合模式
    ctx.globalCompositeOperation = 'source-over'

    // 保存原始合成结果
    mergedImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // 如果启用了颜色反转，则进行反转处理
    if (invertColors) {
      invertImageColors(ctx, canvas.width, canvas.height)
    }

    setMergedImage(canvas.toDataURL())
  }

  const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = URL.createObjectURL(file)
    })
  }

  const analyzeBackground = (imageData: ImageData) => {
    const data = imageData.data
    let whitePixels = 0
    let blackPixels = 0
    const totalPixels = data.length / 4
    const threshold = 0.4 // 降低阈值，使检测更严格

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 判断像素是否接近白色或黑色
      if (r > 240 && g > 240 && b > 240) {
        whitePixels++
      } else if (r < 15 && g < 15 && b < 15) {
        blackPixels++
      }
    }

    return {
      isWhiteBackground: (whitePixels / totalPixels) > threshold,
      isBlackBackground: (blackPixels / totalPixels) > threshold
    }
  }

  return (
    <div className={className}>
      <div className="upload-section">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
        />
        <button onClick={mergeImages} disabled={selectedImages.length < 2}>
          合成图片
        </button>
      </div>

      <div className="preview-section">
        <div className="selected-images">
          <div className="section-header">
            <h3>已选择的图片：</h3>
            <div className="result-controls">
              <select 
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as BlendMode)}
                className="blend-mode-select"
              >
                <option value="auto">自动检测</option>
                <option value="multiply">正片叠底</option>
                <option value="screen">滤色</option>
              </select>
              <label className="invert-control">
                <input
                  type="checkbox"
                  checked={invertColors}
                  onChange={(e) => handleInvertChange(e.target.checked)}
                />
                <span>颜色反转</span>
              </label>
            </div>
          </div>
          <div className="image-list">
            {selectedImages.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt={`Selected ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="merged-result">
          <h3>合成结果：</h3>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {mergedImage && (
            <img src={mergedImage} alt="Merged result" />
          )}
        </div>
      </div>
    </div>
  )
} 