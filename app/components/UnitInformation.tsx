'use client'

import { useState } from 'react'

export default function UnitInformation() {
  const [prompt, setPrompt] = useState('')

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Unit Information</h2>
      <div className="space-y-4">
        <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select Grade Level</option>
          <option value="k">Kindergarten</option>
          <option value="1">1st Grade</option>
          <option value="2">2nd Grade</option>
          <option value="3">3rd Grade</option>
          <option value="4">4th Grade</option>
          <option value="5">5th Grade</option>
          <option value="6">6th Grade</option>
          <option value="7">7th Grade</option>
          <option value="8">8th Grade</option>
          <option value="9">9th Grade</option>
          <option value="10">10th Grade</option>
          <option value="11">11th Grade</option>
          <option value="12">12th Grade</option>
        </select>

        <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select Unit of Study</option>
          <option value="math">Mathematics</option>
          <option value="science">Science</option>
          <option value="english">English</option>
          <option value="history">History</option>
          <option value="art">Art</option>
          <option value="music">Music</option>
        </select>

        <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select Subject Area</option>
          <option value="algebra">Algebra</option>
          <option value="geometry">Geometry</option>
          <option value="biology">Biology</option>
          <option value="chemistry">Chemistry</option>
          <option value="literature">Literature</option>
          <option value="writing">Writing</option>
        </select>

        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your custom prompt"
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
} 