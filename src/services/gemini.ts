import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeResume(resumeText: string, jobDescription: string) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Analyze the following resume against the job description.
    
    Job Description:
    ${jobDescription}
    
    Resume:
    ${resumeText}
    
    Provide a structured analysis including:
    1. Candidate name
    2. Email (if found)
    3. Phone (if found)
    4. Summary of experience
    5. Key skills found
    6. Estimated years of experience
    7. Education details
    8. Match score (0-100) based on how well they fit the job
    9. Detailed analysis (strengths, weaknesses, summary, recommendation)
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          summary: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experienceYears: { type: Type.NUMBER },
          education: { type: Type.STRING },
          matchScore: { type: Type.NUMBER },
          analysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["strengths", "weaknesses", "summary", "recommendation"]
          }
        },
        required: ["name", "matchScore", "analysis"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
