import { CVData, JobOffer, OutputLanguage } from '@/types';

export const CV_EXTRACTION_PROMPT = (rawText: string): string => `
You are an expert CV/Resume parser with 15+ years of experience in HR and recruitment.

Your task is to extract ALL information from the following CV text with 100% accuracy. 
Do not invent or infer information that is not explicitly present in the CV.
Extract everything, no matter the format (modern, ATS, image-based OCR text, etc.)

CV TEXT:
---
${rawText}
---

Return a JSON object with EXACTLY this structure (no markdown, no backticks, pure JSON):
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string (city, country)",
    "linkedin": "string or null",
    "portfolio": "string or null",
    "github": "string or null"
  },
  "summary": "string (professional summary/objective if present, else empty string)",
  "workExperience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string (MM/YYYY or YYYY)",
      "endDate": "string (MM/YYYY, YYYY, or 'Present'/'Actual')",
      "location": "string or null",
      "responsibilities": ["array of strings - every bullet/task listed"],
      "achievements": ["array of strings - quantified results, promotions, recognitions"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string or null",
      "honors": "string or null"
    }
  ],
  "skills": {
    "technical": ["list of technical skills"],
    "soft": ["list of soft skills"],
    "languages": ["spoken languages with level if mentioned"],
    "tools": ["software, tools, platforms"]
  },
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "expiryDate": "string or null",
      "credentialId": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array"],
      "url": "string or null",
      "date": "string or null"
    }
  ]
}

Rules:
- Extract 100% of the information present. Do NOT omit anything.
- Do NOT add information not in the CV.
- If a field has no data, use null or empty array [].
- Separate responsibilities from achievements clearly.
- Work experience must be in reverse chronological order (most recent first).
`;

export const JOB_ANALYSIS_PROMPT = (jobText: string): string => `
You are a senior talent acquisition specialist and ATS (Applicant Tracking System) expert.

Analyze the following job offer and extract all key information needed to optimize a CV for this position.

JOB OFFER:
---
${jobText}
---

Return a JSON object with EXACTLY this structure (no markdown, no backticks, pure JSON):
{
  "title": "string (job title)",
  "company": "string or null",
  "requiredSkills": ["mandatory technical skills and tools"],
  "preferredSkills": ["nice-to-have skills"],
  "responsibilities": ["main responsibilities in the role"],
  "requirements": ["qualifications, years of experience, education requirements"],
  "keywords": ["all important ATS keywords from the job posting - include exact phrases as they appear"],
  "industryTerms": ["industry-specific terminology to include in CV"],
  "seniorityLevel": "string (Junior/Mid/Senior/Lead/Director/etc.)",
  "jobFunction": "string (Engineering/Marketing/Sales/etc.)",
  "detectedLanguage": "string (es or en)"
}
`;

export const ATS_CV_GENERATION_PROMPT = (
  cvData: CVData,
  jobOffer: JobOffer,
  outputLanguage: OutputLanguage
): string => `
You are a world-class professional CV writer, ATS optimization expert, and senior recruiter with 20+ years of experience placing candidates in top companies globally.

You are generating a new, optimized ATS CV for a candidate. Follow these rules strictly:

## CORE RULES
1. **TRUTH ONLY**: Use ONLY information from the candidate's original CV. NEVER invent experiences, skills, dates, companies, or achievements.
2. **ATS OPTIMIZATION**: The CV must pass modern ATS systems (Workday, Greenhouse, Lever, iCIMS, Taleo, etc.)
3. **JOB ALIGNMENT**: Every section must be tailored to the job offer. Prioritize and highlight what is most relevant.
4. **KEYWORD INTEGRATION**: Naturally integrate the job's keywords throughout the CV — especially in summary, experience bullets, and skills section.
5. **QUANTIFICATION**: Transform vague responsibilities into quantified achievements wherever the original CV provides enough context (use original numbers, never fabricate).
6. **OUTPUT LANGUAGE**: Write the ENTIRE CV in ${outputLanguage === 'es' ? 'SPANISH (Latin American professional standard)' : 'ENGLISH (Professional US/International standard)'}.
7. **FORMAT**: ATS-friendly — no tables, no text boxes, no graphics. Use clean sections with clear headers.

## CANDIDATE'S ORIGINAL CV DATA
${JSON.stringify(cvData, null, 2)}

## JOB OFFER DETAILS
${JSON.stringify(jobOffer, null, 2)}

## ATS CV STANDARDS TO APPLY
- Professional summary: 3-4 sentences, keyword-rich, role-specific, written in third person or first person (be consistent)
- Work experience bullets: Start with strong action verbs. Focus on impact and results. Use job-relevant vocabulary.
- Skills section: Mirror keywords from the job posting exactly where they match the candidate's real skills.
- Education: Clean, standard format.
- Keep formatting: Plain text, no special characters that break ATS parsing.
- Section order: Summary → Work Experience → Education → Skills → Certifications → Projects (if relevant)
- Dates format: MM/YYYY
- Bullet points: Use • or - consistently

## OUTPUT FORMAT
Return a JSON object (no markdown, no backticks, pure JSON):
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string or null",
    "portfolio": "string or null",
    "github": "string or null"
  },
  "summary": "string (ATS-optimized professional summary, 3-4 sentences, written in ${outputLanguage === 'es' ? 'Spanish' : 'English'})",
  "workExperience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string",
      "location": "string or null",
      "responsibilities": ["ATS-optimized bullet points - action verb + task + result"],
      "achievements": ["quantified achievements if present in original CV"]
    }
  ],
  "education": [...],
  "skills": {
    "technical": ["job-relevant technical skills from candidate's real skills"],
    "soft": ["relevant soft skills"],
    "languages": ["spoken languages"],
    "tools": ["relevant tools and platforms"]
  },
  "certifications": [...],
  "projects": [...or empty array if not relevant],
  "atsScore": number (0-100, your estimate of ATS match score with this job),
  "keywordsMatched": ["list of job keywords successfully integrated into the CV"],
  "language": "${outputLanguage}"
}
`;
