'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'
import UnitInformation from './components/UnitInformation'
import AnalysisResults from './components/AnalysisResults'

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

export default function Home() {
  const [showResults, setShowResults] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])

  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisResults(results)
    setShowResults(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Unit Optimizer</h1>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <UnitInformation />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
          <FileUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <AnalysisResults results={analysisResults} />
        </div>
      </div>
    </div>
  )
} 