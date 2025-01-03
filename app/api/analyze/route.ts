import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'
import AdmZip from 'adm-zip'
import { parseString } from 'xml2js'
import { promisify } from 'util'

interface MissedQuestion {
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

interface AnalysisResponse {
  overallScore: number;
  missedQuestions: MissedQuestion[];
  lessonRecommendations: LessonRecommendation[];
}

const parseXml = promisify(parseString)

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Initialize Google AI
const genAI = new GoogleGenerativeAI('AIzaSyD4Y1e27h3_zUOJzwoyVPYZXJtmWQLkmtE')
const model = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
})

// Add rate limiting with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 1000 // 1 second

async function analyzeWithRetry(content: string, retryCount = 0): Promise<any> {
  try {
    const prompt = `You are an expert at analyzing educational content. Your task is to analyze the provided content and return a JSON object with specific fields.

The response MUST be a valid JSON object with EXACTLY these fields, with NO additional fields:
{
  "overallScore": (required number between 0-100, representing overall effectiveness),
  "missedQuestions": [
    {
      "question": (required string describing a specific question or concept students struggled with),
      "percentageMissed": (required number between 0-100),
      "relatedLessons": [required array of strings naming related lessons],
      "improvementSuggestions": [required array of strings with specific suggestions]
    }
  ],
  "lessonRecommendations": [
    {
      "lessonName": (required string with specific lesson name),
      "currentContent": (required string summarizing current content),
      "suggestedImprovements": [required array of strings with specific improvements],
      "additionalResources": [required array of strings with resource suggestions]
    }
  ]
}

IMPORTANT:
1. ALL fields are required and must be present
2. Arrays must contain at least one item
3. Numbers must be between 0-100
4. Strings must be descriptive and specific
5. Response must be valid JSON

Analyze this educational content and respond ONLY with the JSON object described above:

${content}`

    console.log('Making Gemini API request...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean the response to ensure it's valid JSON
    const cleanedText = text
      .replace(/^```json\s*/, '') // Remove leading JSON code block markers
      .replace(/\s*```$/, '')     // Remove trailing code block markers
      .trim()
    
    try {
      // Try to parse the cleaned JSON
      const parsedJson = JSON.parse(cleanedText) as AnalysisResponse;
      
      // Validate the required fields
      if (typeof parsedJson.overallScore !== 'number' ||
          !Array.isArray(parsedJson.missedQuestions) ||
          !Array.isArray(parsedJson.lessonRecommendations) ||
          parsedJson.missedQuestions.length === 0 ||
          parsedJson.lessonRecommendations.length === 0 ||
          !parsedJson.missedQuestions.every((q: MissedQuestion) => 
            typeof q.question === 'string' && q.question.length > 0 &&
            typeof q.percentageMissed === 'number' &&
            Array.isArray(q.relatedLessons) && q.relatedLessons.length > 0 &&
            Array.isArray(q.improvementSuggestions) && q.improvementSuggestions.length > 0
          ) ||
          !parsedJson.lessonRecommendations.every((l: LessonRecommendation) => 
            typeof l.lessonName === 'string' && l.lessonName.length > 0 &&
            typeof l.currentContent === 'string' && l.currentContent.length > 0 &&
            Array.isArray(l.suggestedImprovements) && l.suggestedImprovements.length > 0 &&
            Array.isArray(l.additionalResources) && l.additionalResources.length > 0
          )) {
        console.error('Invalid response structure:', parsedJson);
        throw new Error('Missing or invalid fields in JSON response');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('Raw response from Gemini:', text);
      console.error('Cleaned response:', cleanedText);
      console.error('JSON parse error:', error);
      throw new Error('Invalid JSON response from Gemini');
    }
  } catch (error: any) {
    if (error.message?.includes('RESOURCE_EXHAUSTED') && retryCount < MAX_RETRIES) {
      const backoff = INITIAL_BACKOFF * Math.pow(2, retryCount)
      console.log(`Rate limited, retrying in ${backoff}ms...`)
      await sleep(backoff)
      return analyzeWithRetry(content, retryCount + 1)
    }
    throw error
  }
}

// Log the configuration for debugging (without exposing the full API key)
console.log('API Configuration:', {
  hasApiKey: !!process.env.OPENAI_API_KEY,
  keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
});

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

interface SlideTextElement {
  'a:p'?: Array<{
    'a:r'?: Array<{
      'a:t'?: string[];
    }>;
  }>;
}

interface SlideContent {
  'p:sld'?: {
    'p:txBody'?: SlideTextElement[];
  };
}

interface PowerPointXML {
  'p:sld': {
    'p:cSld'?: [{
      'p:spTree'?: [{
        'p:sp'?: Array<{
          'p:txBody'?: [{
            'a:p'?: Array<{
              'a:r'?: Array<{
                'a:t'?: string[];
              }>;
            }>;
          }];
        }>;
      }];
      'p:txBody'?: [{
        'a:p'?: Array<{
          'a:r'?: Array<{
            'a:t'?: string[];
          }>;
        }>;
      }];
    }];
  };
}

async function extractTextFromPowerPoint(filePath: string): Promise<string> {
  try {
    const buffer = await readFile(filePath)
    const zip = new AdmZip(buffer)
    const slideEntries = zip.getEntries().filter(entry => 
      entry.entryName.startsWith('ppt/slides/slide') && 
      entry.entryName.endsWith('.xml')
    ).sort((a, b) => a.entryName.localeCompare(b.entryName)) // Sort slides in order
    
    // Extract text from each slide
    const slideTexts = await Promise.all(slideEntries.map(async (entry) => {
      const xmlContent = entry.getData().toString('utf8')
      const result = await parseXml(xmlContent) as unknown as PowerPointXML
      
      // Extract text from different parts of the slide
      const texts: string[] = []
      try {
        // Handle different possible XML structures
        const slide = result['p:sld']
        
        // Extract from shape tree
        const spTree = slide?.['p:cSld']?.[0]?.['p:spTree']?.[0]
        if (spTree?.['p:sp']) {
          spTree['p:sp'].forEach(shape => {
            const txBody = shape['p:txBody']?.[0]
            if (txBody?.['a:p']) {
              txBody['a:p'].forEach(paragraph => {
                if (paragraph['a:r']) {
                  paragraph['a:r'].forEach(run => {
                    if (run['a:t']) {
                      const text = run['a:t'][0]
                      if (typeof text === 'string' && text.trim()) {
                        texts.push(text.trim())
                      }
                    }
                  })
                }
              })
            }
          })
        }
        
        // Extract from text body if present
        const txBody = slide?.['p:cSld']?.[0]?.['p:txBody']?.[0]
        if (txBody?.['a:p']) {
          txBody['a:p'].forEach(paragraph => {
            if (paragraph['a:r']) {
              paragraph['a:r'].forEach(run => {
                if (run['a:t']) {
                  const text = run['a:t'][0]
                  if (typeof text === 'string' && text.trim()) {
                    texts.push(text.trim())
                  }
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('Error parsing slide XML:', error)
      }
      
      return texts.join('\n')
    }))
    
    // Combine and clean the text
    const combinedText = slideTexts
      .filter(text => text.length > 0) // Remove empty slides
      .join('\n\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0) // Remove empty lines
      .filter(line => !line.match(/^[0-9]+$/)) // Remove slide numbers
      .filter(line => !line.match(/^(http|https):\/\//)) // Remove URLs
      .join('\n')
    
    if (!combinedText) {
      console.error('No text content extracted from PowerPoint')
      return ''
    }
    
    console.log(`Extracted text from PowerPoint (first 100 chars): ${combinedText.slice(0, 100)}...`)
    console.log(`Total extracted text length: ${combinedText.length} characters`)
    return combinedText
  } catch (error) {
    console.error('Error extracting text from PowerPoint:', error)
    return ''
  }
}

async function extractTextFromFile(filePath: string): Promise<string> {
  try {
    if (filePath.toLowerCase().endsWith('.pptx')) {
      return await extractTextFromPowerPoint(filePath)
    }
    
    // Default text extraction for other file types
    const buffer = await readFile(filePath)
    return buffer.toString('utf-8')
  } catch (error) {
    console.error('Error extracting text from file:', error)
    return ''
  }
}

async function analyzeFileWithGPT(filePath: string, filename: string): Promise<AnalysisResult> {
  try {
    console.log(`Starting analysis of file: ${filename}`)
    
    // Extract text from file
    const textContent = await extractTextFromFile(filePath)
    if (!textContent) {
      console.error(`No content extracted from file: ${filename}`)
      return {
        filename,
        overallScore: 0,
        missedQuestions: [],
        lessonRecommendations: [{
          lessonName: 'Error',
          currentContent: 'Could not extract content from file',
          suggestedImprovements: ['Check file format and content'],
          additionalResources: []
        }]
      }
    }
    console.log(`Successfully extracted text from file: ${filename}`)
    
    // Clean and prepare the content - limit to key sections
    const cleanedContent = textContent
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim()
      .split('\n')
      .filter(line => line.length > 10) // Keep only substantial lines
      .slice(0, 50) // Take first 50 significant lines
      .join('\n')
    
    // Add delay between files
    await sleep(2000)
    
    const analysisContent = await analyzeWithRetry(cleanedContent)
    if (!analysisContent) {
      console.error(`No analysis content returned for file: ${filename}`)
      return {
        filename,
        overallScore: 0,
        missedQuestions: [],
        lessonRecommendations: [{
          lessonName: 'Error',
          currentContent: 'No response from analysis',
          suggestedImprovements: ['Try again later'],
          additionalResources: []
        }]
      }
    }

    let analysisData: any
    try {
      analysisData = JSON.parse(analysisContent)
      console.log(`Successfully parsed Gemini response for ${filename}`)
      console.log(`Analysis score: ${analysisData.overallScore}`)
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      return {
        filename,
        overallScore: 0,
        missedQuestions: [],
        lessonRecommendations: [{
          lessonName: 'Error',
          currentContent: 'Could not parse analysis results',
          suggestedImprovements: ['Try again later'],
          additionalResources: []
        }]
      }
    }

    return {
      filename,
      overallScore: analysisData.overallScore || 0,
      missedQuestions: analysisData.missedQuestions || [],
      lessonRecommendations: analysisData.lessonRecommendations || []
    }
  } catch (error: unknown) {
    console.error(`Error analyzing file ${filename}:`, error)
    return {
      filename,
      overallScore: 0,
      missedQuestions: [],
      lessonRecommendations: [{
        lessonName: 'Error',
        currentContent: 'Analysis failed',
        suggestedImprovements: ['Try again later'],
        additionalResources: []
      }]
    }
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers to the response
    const response = new NextResponse()
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    console.log('Starting file analysis request')
    const formData = await request.formData()
    const files = formData.getAll('files')
    
    if (!files || files.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No files uploaded' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    console.log(`Processing ${files.length} files`)
    const conversationId = uuidv4()
    const uploadDir = join(process.cwd(), 'uploads', conversationId)
    await mkdir(uploadDir, { recursive: true })

    const savedFiles = await Promise.all(
      files.map(async (file: any) => {
        try {
          console.log(`Saving file: ${file.name}`)
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const filePath = join(uploadDir, file.name)
          await writeFile(filePath, buffer)
          console.log(`Successfully saved file: ${file.name}`)
          return { name: file.name, path: filePath }
        } catch (error: any) {
          console.error(`Error saving file ${file.name}:`, error)
          throw new Error(`Failed to save file ${file.name}: ${error.message}`)
        }
      })
    )

    console.log('Starting GPT analysis of files')
    const results = await Promise.all(
      savedFiles.map(async (file) => {
        try {
          const result = await analyzeFileWithGPT(file.path, file.name)
          console.log(`Successfully analyzed file: ${file.name}`)
          return result
        } catch (error: any) {
          console.error(`Error analyzing file ${file.name}:`, error)
          return {
            filename: file.name,
            error: error.message,
            overallScore: 0,
            missedQuestions: [],
            lessonRecommendations: []
          }
        }
      })
    )

    console.log('Analysis complete, sending response')
    return new NextResponse(
      JSON.stringify({ conversationId, results }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  } catch (error: any) {
    console.error('Error processing files:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Error processing files'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
} 