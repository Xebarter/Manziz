import React, { useState } from 'react'
import { TestTube, Share2, Copy, Check } from 'lucide-react'
import { useMetaTags } from '../hooks/useMetaTags'
import { updateAllMetaTags } from '../utils/metaTags'

const MetaTagTester: React.FC = () => {
  const [copied, setCopied] = useState(false)
  const [testMode, setTestMode] = useState<'auto' | 'manual'>('auto')

  // Test automatic meta tags
  useMetaTags({
    title: testMode === 'auto' ? 'Test - Manziz Restaurant' : undefined,
    description: testMode === 'auto' ? 'Testing dynamic meta tags with first menu item' : undefined,
    useFirstMenuItem: testMode === 'auto'
  })

  const testManualMetaTags = () => {
    updateAllMetaTags({
      title: 'Manual Test - Manziz Restaurant',
      description: 'This is a manual test of the meta tag system',
      image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'Test image for meta tags'
    })
  }

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: 'Check out this restaurant!',
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      copyCurrentUrl()
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <TestTube className="w-4 h-4 mr-2" />
            Meta Tag Tester
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Mode
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTestMode('auto')}
                className={`px-3 py-1 text-sm rounded ${
                  testMode === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setTestMode('manual')}
                className={`px-3 py-1 text-sm rounded ${
                  testMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {testMode === 'manual' && (
            <button
              onClick={testManualMetaTags}
              className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Test Manual Meta Tags
            </button>
          )}

          <div className="border-t pt-3">
            <div className="flex space-x-2">
              <button
                onClick={shareUrl}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </button>
              <button
                onClick={copyCurrentUrl}
                className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>Current Title: {document.title}</p>
            <p>Mode: {testMode === 'auto' ? 'Automatic (with first menu item)' : 'Manual'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetaTagTester 