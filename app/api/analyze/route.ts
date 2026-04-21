import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { parseModelJson } from '@/lib/cv-generator';
import { JOB_ANALYSIS_PROMPT, ATS_CV_GENERATION_PROMPT } from '@/lib/prompts';
import { CVData, JobOffer, GeneratedATSCV, OutputLanguage } from '@/types';

export const runtime = 'nodejs';

function normalizeJobOffer(raw: Record<string, unknown>, jobOfferText: string): JobOffer {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
  return {
    rawText: jobOfferText,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    company: raw.company != null ? String(raw.company) : undefined,
    requiredSkills: arr(raw.requiredSkills),
    preferredSkills: arr(raw.preferredSkills),
    responsibilities: arr(raw.responsibilities),
    requirements: arr(raw.requirements),
    keywords: arr(raw.keywords),
    industryTerms: arr(raw.industryTerms),
    seniorityLevel: typeof raw.seniorityLevel === 'string' ? raw.seniorityLevel : undefined,
    jobFunction: typeof raw.jobFunction === 'string' ? raw.jobFunction : undefined,
    detectedLanguage: typeof raw.detectedLanguage === 'string' ? raw.detectedLanguage : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvData, jobOfferText, outputLanguage } = body as {
      cvData: CVData;
      jobOfferText: string;
      outputLanguage: OutputLanguage;
    };

    if (!cvData || !jobOfferText || !outputLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Server is missing ANTHROPIC_API_KEY configuration.' },
        { status: 500 }
      );
    }

    const jobAnalysisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: JOB_ANALYSIS_PROMPT(jobOfferText),
        },
      ],
    });

    const jobAnalysisContent = jobAnalysisResponse.content[0];
    if (jobAnalysisContent.type !== 'text') {
      throw new Error('Unexpected response from job analysis');
    }

    let jobOffer: JobOffer;
    try {
      const parsed = parseModelJson<Record<string, unknown>>(jobAnalysisContent.text);
      jobOffer = normalizeJobOffer(parsed, jobOfferText);
    } catch {
      throw new Error('Failed to parse job offer analysis');
    }

    const cvGenerationResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [
        {
          role: 'user',
          content: ATS_CV_GENERATION_PROMPT(cvData, jobOffer, outputLanguage),
        },
      ],
    });

    const cvGenerationContent = cvGenerationResponse.content[0];
    if (cvGenerationContent.type !== 'text') {
      throw new Error('Unexpected response from CV generation');
    }

    let generatedCV: GeneratedATSCV;
    try {
      generatedCV = parseModelJson<GeneratedATSCV>(cvGenerationContent.text);
    } catch {
      throw new Error('Failed to parse generated CV');
    }

    return NextResponse.json({ generatedCV, jobOffer });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze and generate CV';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
