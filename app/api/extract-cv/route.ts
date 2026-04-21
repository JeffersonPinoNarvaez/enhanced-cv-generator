import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractTextFromPDF } from '@/lib/pdf-extractor';
import { CV_EXTRACTION_PROMPT } from '@/lib/prompts';
import { parseModelJson } from '@/lib/cv-generator';
import { CVData } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No CV file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawText = await extractTextFromPDF(buffer);

    if (!rawText || rawText.length < 100) {
      return NextResponse.json(
        {
          error:
            'Could not extract meaningful text from the PDF. Please ensure the PDF is not password-protected.',
        },
        { status: 422 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Server is missing ANTHROPIC_API_KEY configuration.' },
        { status: 500 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: CV_EXTRACTION_PROMPT(rawText),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let cvData: CVData;
    try {
      cvData = parseModelJson<CVData>(content.text);
      cvData.rawText = rawText;
    } catch {
      throw new Error('Failed to parse CV extraction response');
    }

    return NextResponse.json({ cvData });
  } catch (error: unknown) {
    console.error('CV extraction error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process CV';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
