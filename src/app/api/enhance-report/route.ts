import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, projectTitle, apiKey, tone = 'professional' } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const finalApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY || '';
    if (!finalApiKey) {
      return NextResponse.json({ 
        error: 'Gemini API Key is missing. Please configure it in the AI settings panel or set GEMINI_API_KEY in your environment (.env.local).' 
      }, { status: 401 });
    }

    const toneInstructions: Record<string, string> = {
      professional: 'Maintain a highly professional, polished, and polite tone, suitable for status updates to managers or stakeholders.',
      concise: 'Make the report extremely concise and punchy. Remove fluff but keep all core facts, tasks, and blocker information.',
      bullets: 'Convert the report content into clear, neat bullet points with minimal extra text.',
      executive: 'Write in an executive summary style - formal, action-oriented, highlighting high-level progress and blockers.',
    };

    const tonePrompt = toneInstructions[tone] || toneInstructions.professional;

    const prompt = `You are an expert copywriter and editor. Your task is to polish the following work update report.
Ensure the following guidelines are met:
1. Correct all spelling, grammar, punctuation, and sentence structure issues.
2. ${tonePrompt}
3. Keep the overall formatting clean and neat. Preserve the structure (e.g. lists, bullet points) where appropriate, but make the text sound professional.
4. Do NOT change or remove the meaning or details of the tasks completed, ongoing, or blocked. Just correct the spelling, sentence flow, formatting, and tone.
5. Provide ONLY the enhanced report content. Do not add any introductory text, explaining remarks, conversational words, or markdown code block wrappers (like \`\`\`markdown or \`\`\`). Output only the formatted report itself.

Here is the report text to enhance for the project "${projectTitle || 'General'}":
---
${text}
---`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${finalApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: errData.error?.message || `Gemini API returned status ${response.status}` 
      }, { status: response.status });
    }

    const data = await response.json();
    let enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!enhancedText) {
      return NextResponse.json({ error: 'Failed to extract enhanced text from Gemini response.' }, { status: 500 });
    }

    // Clean up any accidental code fence blocks from the AI output
    enhancedText = enhancedText.trim();
    if (enhancedText.startsWith('```')) {
      // Remove first line containing backticks
      enhancedText = enhancedText.substring(enhancedText.indexOf('\n') + 1);
      // Remove trailing backticks
      if (enhancedText.endsWith('```')) {
        enhancedText = enhancedText.substring(0, enhancedText.length - 3).trim();
      }
    }

    return NextResponse.json({ enhancedText });
  } catch (error: any) {
    console.error('AI Enhance Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during AI enhancement.' }, { status: 500 });
  }
}
