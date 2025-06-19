import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

const MetaTagDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [metaTags, setMetaTags] = useState<{ property: string; content: string }[]>([])

  const refreshMetaTags = () => {
    const tags = Array.from(document.querySelectorAll('meta[property^="og:"], meta[property^="twitter:"]'))
      .map(tag => ({
        property: tag.getAttribute('property') || '',
        content: tag.getAttribute('content') || ''
      }))
      .filter(tag => tag.property && tag.content)

    setMetaTags(tags)
  }

  useEffect(() => {
    if (isVisible) {
      refreshMetaTags()
    }
  }, [isVisible])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Meta Tag Debugger"
      >
        {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {isVisible && (
        <div className="absolute bottom-16 right-0 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Meta Tags Debugger</h3>
            <button
              onClick={refreshMetaTags}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto p-4">
            {metaTags.length === 0 ? (
              <p className="text-gray-500 text-sm">No meta tags found</p>
            ) : (
              <div className="space-y-3">
                {metaTags.map((tag, index) => (
                  <div key={index} className="border border-gray-200 rounded p-3">
                    <div className="text-xs font-mono text-gray-600 mb-1">
                      {tag.property}
                    </div>
                    <div className="text-sm text-gray-900 break-all">
                      {tag.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MetaTagDebugger 