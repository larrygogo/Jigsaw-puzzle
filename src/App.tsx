import { useState } from 'react'
import { ImageMerger } from './components/ImageMerger'
import { ImageSplitter } from './components/ImageSplitter'
import './App.css'

type Tool = 'merger' | 'splitter'

function App() {
  const [currentTool, setCurrentTool] = useState<Tool>('merger')

  return (
    <div className="app-container">
      <h1>图片处理工具</h1>
      
      <div className="tool-selector">
        <button
          className={currentTool === 'merger' ? 'active' : ''}
          onClick={() => setCurrentTool('merger')}
        >
          图片合成
        </button>
        <button
          className={currentTool === 'splitter' ? 'active' : ''}
          onClick={() => setCurrentTool('splitter')}
        >
          图片分层
        </button>
      </div>

      {currentTool === 'merger' ? (
        <ImageMerger className="tool-container" />
      ) : (
        <ImageSplitter className="tool-container" />
      )}
    </div>
  )
}

export default App
