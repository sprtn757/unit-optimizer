'use client'

import { useState, useCallback } from 'react'
import axios from 'axios'

interface AnalysisResult {
  filename: string;
  overallScore: number;
  missedQuestions: {
    question: string;
    percentageMissed: number;
    relatedLessons: string[];
    improvementSuggestions: string[];
  }[];
  lessonRecommendations: {
    lessonName: string;
    currentContent: string;
    suggestedImprovements: string[];
    additionalResources: string[];
  }[];
}

interface FileUploadProps {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

export default function FileUpload({ onAnalysisComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files?.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.dataTransfer.files)])
      setError(null)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (fileList && fileList.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(fileList)])
      setError(null)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    // Validate file types
    const validFileTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain',
      'application/json',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const invalidFiles = files.filter(file => !validFileTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      setError(`Unsupported file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Please upload only PowerPoint (.pptx), Word (.doc, .docx), PDF, or text files.`)
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await axios.post('/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        },
        validateStatus: (status) => status < 500, // Don't reject if status < 500
      })

      if (response.status !== 200) {
        throw new Error(response.data.error || 'Failed to analyze files')
      }

      if (response.data.results) {
        const validResults = response.data.results.filter((result: any) => !result.error)
        if (validResults.length > 0) {
          setFiles([])
          onAnalysisComplete(validResults)
        } else {
          setError('No files were successfully analyzed. Please try again.')
        }
      } else {
        setError('Failed to analyze files. Please try again.')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Error uploading files. Please try again.'
      setError(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-gray-600 mb-2">
          Drag 'n' drop files here, or click to select files
        </p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.pptx"
          className="hidden"
          id="file-upload"
          multiple
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
        >
          Select Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || files.length === 0}
        className={`w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center space-x-2 ${
          (uploading || files.length === 0) && 'opacity-50 cursor-not-allowed'
        }`}
      >
        {uploading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{uploading ? `Uploading ${uploadProgress}%` : 'Upload Files'}</span>
      </button>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gray-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </form>
  )
} 