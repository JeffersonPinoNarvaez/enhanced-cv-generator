import { NextRequest, NextResponse } from 'next/server';
import { completeLLM, validateLlmEnv } from '@/lib/llm';
import { parseModelJson } from '@/lib/cv-generator';
import { JOB_ANALYSIS_PROMPT, ATS_CV_GENERATION_PROMPT } from '@/lib/prompts';
import {
  checkGlobalLimit,
  checkIPLimit,
  getClientIp,
  incrementGlobalCount,
} from '@/lib/rate-limit';
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
  const ip = getClientIp(request);

  try {
    const global = await checkGlobalLimit();
    if (!global.allowed) {
      return NextResponse.json(
        {
          error: 'service_unavailable',
          message: 'El demo ha alcanzado su límite mensual. Vuelve el próximo mes.',
        },
        { status: 503 }
      );
    }

    const ipCheck = await checkIPLimit(ip);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Has alcanzado el límite de 3 CVs por día. Vuelve mañana.',
          reset: ipCheck.reset,
        },
        { status: 429 }
      );
    }
  } catch (e) {
    console.error('Límite / Redis (analyze):', e);
    return NextResponse.json(
      {
        error: 'service_unavailable',
        message: 'No se pudo comprobar los límites de uso. Inténtalo más tarde.',
      },
      { status: 503 }
    );
  }

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

    const llmCheck = validateLlmEnv();
    if (!llmCheck.ok) {
      return NextResponse.json({ error: llmCheck.message }, { status: 500 });
    }

    const jobAnalysisText = await completeLLM(JOB_ANALYSIS_PROMPT(jobOfferText), 2000);

    let jobOffer: JobOffer;
    try {
      const parsed = parseModelJson<Record<string, unknown>>(jobAnalysisText);
      jobOffer = normalizeJobOffer(parsed, jobOfferText);
    } catch {
      throw new Error('Failed to parse job offer analysis');
    }

    const cvGenerationText = await completeLLM(
      ATS_CV_GENERATION_PROMPT(cvData, jobOffer, outputLanguage),
      6000
    );

    let generatedCV: GeneratedATSCV;
    try {
      generatedCV = parseModelJson<GeneratedATSCV>(cvGenerationText);
    } catch {
      throw new Error('Failed to parse generated CV');
    }

    try {
      await incrementGlobalCount();
    } catch (e) {
      console.error('incrementGlobalCount:', e);
    }

    return NextResponse.json({ generatedCV, jobOffer });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze and generate CV';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
