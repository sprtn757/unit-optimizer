'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Question {
  question: string;
  percentageMissed: number;
  relatedLessons: string[];
  improvementSuggestions: string[];
}

interface LessonRecommendation {
  lessonName: string;
  currentContent: string;
  suggestedImprovements: string[];
  additionalResources: string[];
}

interface AnalysisResult {
  filename: string;
  overallScore: number;
  missedQuestions: Question[];
  lessonRecommendations: LessonRecommendation[];
}

interface Props {
  results?: AnalysisResult[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const SCORE_COLORS = {
  high: '#00C49F',    // Green for good scores
  medium: '#FFBB28',  // Yellow for medium scores
  low: '#FF8042'      // Orange for low scores
};

export default function AnalysisResults({ results }: Props) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  if (!results || results.length === 0) {
    return (
      <div className="text-center text-gray-500">
        <p>Upload files to see analysis results</p>
      </div>
    )
  }

  const currentResult = selectedFile 
    ? results.find(r => r.filename === selectedFile)
    : results[0]

  const getScoreColor = (score: number) => {
    if (score >= 80) return SCORE_COLORS.high;
    if (score >= 60) return SCORE_COLORS.medium;
    return SCORE_COLORS.low;
  }

  const chartData = currentResult?.missedQuestions.map(q => ({
    name: q.question.length > 30 ? q.question.substring(0, 30) + '...' : q.question,
    percentageMissed: q.percentageMissed,
    fullQuestion: q.question
  }));

  const pieData = currentResult?.lessonRecommendations.map(lesson => ({
    name: lesson.lessonName,
    value: 1
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
      
      {results.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <select
            value={selectedFile || results[0].filename}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {results.map((result) => (
              <option key={result.filename} value={result.filename}>
                {result.filename}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentResult && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Overall Performance</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full transition-all duration-500"
                    style={{ 
                      width: `${currentResult.overallScore}%`,
                      backgroundColor: getScoreColor(currentResult.overallScore)
                    }}
                  />
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: getScoreColor(currentResult.overallScore) }}>
                {currentResult.overallScore}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Overall student proficiency
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Missed Questions Analysis</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 shadow rounded border">
                            <p className="font-medium">{payload[0].payload.fullQuestion}</p>
                            <p className="text-red-500">{payload[0].value}% missed</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="percentageMissed" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Lesson Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {pieData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Detailed Recommendations</h3>
            <div className="space-y-6">
              {currentResult.lessonRecommendations.map((lesson, index) => (
                <div 
                  key={index} 
                  className="border-l-4 border-l-blue-500 pl-4 py-2"
                >
                  <h4 className="font-medium text-lg mb-2" style={{ color: COLORS[index % COLORS.length] }}>
                    {lesson.lessonName}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Current Content:</span>{' '}
                        {lesson.currentContent}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Improvements Needed:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {lesson.suggestedImprovements.map((improvement, i) => (
                          <div 
                            key={i}
                            className="bg-blue-50 p-2 rounded flex items-start space-x-2"
                          >
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Resources:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {lesson.additionalResources.map((resource, i) => (
                          <div 
                            key={i}
                            className="bg-green-50 p-2 rounded flex items-start space-x-2"
                          >
                            <span className="text-green-500 mt-1">•</span>
                            <span className="text-sm">{resource}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 