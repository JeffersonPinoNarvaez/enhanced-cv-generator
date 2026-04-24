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
  "jobFunction": "string (Engineering/Marketing/Sales/Commercial/etc.)",
  "detectedLanguage": "string (es or en)",
  "domainMismatch": "boolean — true if the PRIMARY profile implied by this offer (function + seniority + domain) is clearly different from what the CV mainly shows (e.g. sales vs engineering IC; data science vs ops; product vs pure support). Use false when the CV is already a close match.",
  "cvTailoringDirective": "string, 4-8 sentences in the SAME language as detectedLanguage. Be concrete for **this** offer and **this** CV: (1) Which 3-5 verbs or phrases from the posting should surface in bullets/summary where facts allow. (2) List 2-4 **legitimate bridges** between what the CV shows and what the posting stresses (any domain: technical, commercial, analytical, operational, people, etc.). (3) List 4-6 **forbidden fabrications** for this pairing (tools, metrics, titles, scope not in the CV). (4) Name 2-5 **posting keywords or verbs that are discipline-narrow** for this field and must NOT be used as bullet openers unless the CV explicitly supports that meaning (e.g. \"vender\" for pure IC engineering). (5) How to phrase hybrid job titles without replacing the real employer role. This guides the CV writer in the next step."
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
1. **TRUTH ONLY (facts)**: Every company, date, credential, and metric must come from the candidate's CV. NEVER invent employers, roles, dates, tools the candidate did not use, or numbers.
2. **ALLOWED REFRAMING (words & emphasis)**: You MUST aggressively align vocabulary with the job offer. That includes:
   - **profileHeadline**: one line under the name combining **this posting's** role vocabulary with the candidate's REAL stack/domain (e.g. "Backend Engineer | Python & distributed systems", "Product Analyst | SQL & experimentation") — NOT a fake job title at a company; a positioning line for ATS + humans.
   - **Work experience "position" field**: you may use a **hybrid or outcome-oriented title** when \`domainMismatch\` is true or when the CV's dominant track (e.g. IC delivery, ops, support) differs from the posting's emphasis (e.g. product discovery, scale, governance, GTM). Pattern: keep the **real** role from \`cvData\` + a **short** clause only if bullets prove it (e.g. "Software Engineer — cross-functional delivery & reliability" when the CV shows both).
   - **Bullets**: rewrite so the opening verb or phrase matches what **this** employer cares about—could be reliability, scale, security, experimentation, stakeholder alignment, discovery, cost, quality, compliance, customer impact, etc.—**using only facts already stated or clearly implied** in the CV (same work, sharper angle).

### Discipline-specific verbs & impact claims (all sectors — not only sales)
Many verbs and short phrases carry a **narrow professional meaning** in one field. Using them to describe **different** work misleads reviewers. This app serves **every** job category—apply this block to **whatever** domain the posting implies (engineering, data, healthcare, legal, finance, HR, operations, education, trades, etc.).

- **Hard rule**: Do **not** start a bullet or the professional summary with a **domain-narrow** verb or noun taken from the posting if \`cvData\` only describes a different kind of work—even when the posting repeats that word. Instead, express the **same underlying fact** with wording that matches what the CV actually says, or use **cross-domain** phrasing below.
- **Illustrative guardrails** (adapt to the posting; these are **patterns**, not an exhaustive list):
  - **Commercial / GTM / revenue ownership**: e.g. Spanish *vender, prospectar, cerrar ventas, cuota, pipeline comercial*; English *sold to, prospected, closed deals, sales quota, booked revenue* — **only** if the CV explicitly mentions external customers, commercial accountability, quotas, a named sales/CRM cycle, or equivalent.
  - **Clinical or regulated authority**: e.g. *diagnose, prescribe, treat patients*; *sign statutory audit opinion*; *represent client in court* — only if the CV establishes that role or authority.
  - **People management**: *managed direct reports, performance reviews, headcount* — only if the CV states team management; **not** from "technical lead" or "mentoring" alone unless the CV says people management.
  - **Finance / risk / compliance sign-off**: e.g. *materiality decisions, regulatory filing ownership, SOX sign-off* — only if explicitly stated in the CV.
  - **Research / academic claims**: *principal investigator, peer-reviewed first author* — only if the CV supports it.
- **Safer cross-domain phrasing** (use **only** when the CV supports the underlying activity): *aligned with business or product priorities; collaborated across functions; delivered; improved quality/reliability/speed; presented findings or demos to leadership or partners; enabled adoption or scale; prioritized with stakeholders* — never as a substitute for a narrow verb the CV does not support.
- **Revenue / growth / market impact (any wording)**: Do not claim **company revenue growth, market expansion, quota attainment**, or similar business outcomes **without explicit support in \`cvData\`** (clear ownership, metrics, or wording). Vague phrases like "significant revenue increase" or "strong business growth" still count as **unsupported impact** unless sourced. Prefer outcomes the CV **does** state (technical, product, operational, user metrics).

### Target-role emphasis (any job family — not only commercial)
The product is **general-purpose**: infer what kind of role the posting targets from \`jobOffer\` (engineering, data, product, design, sales, marketing, finance, operations, people, support, etc.). **No single industry is the default.**

When \`domainMismatch\` is true **or** the posting stresses outcomes the CV does not spell out in those exact words (obey the section **Discipline-specific verbs & impact claims** above at all times):
- **Summary**: Argue fit for **this** posting with **proven** scope only. Do not claim a career the CV does not support (e.g. full sales ownership, pure research leadership, people management of a team) unless titles or bullets back it. Prefer a **credible bridge** (depth in X + collaboration with Y) only where facts exist.
- **Hybrid "position" lines**: \`{Official role from CV} — {short clause aligned to the posting}\` only if that role's bullets justify the clause. Never replace the real role with a **different** job title from the posting (e.g. "Account Executive", "Staff Engineer", "Head of Data") unless that title appears in \`cvData\`.
- **Bullets & skills**: Import verbs, tools, and frameworks from the posting **only** as re-labels of the same work. **Do NOT** add tools, methods, regulations, or metrics named in the offer unless \`cvData\` supports them (examples of what to avoid unless sourced: a specific CRM; a specific cloud ML stack; "SOC 2"; "shipped \$X revenue"; latency/coverage numbers not in the CV).
- **Balance**: If \`domainMismatch\` is true, at least **one** experience block should echo the **posting's core stress** (whatever it is: reliability, growth, research rigor, stakeholder communication, cost, risk, etc.); other bullets may stay closer to the raw CV when needed for honesty.

*Illustration only (when the posting happens to be commercial/GTM-heavy): the same rules apply—no invented pipeline, quotas, or CRM unless the CV names them.*
3. **ATS OPTIMIZATION**: The CV must pass modern ATS systems (Workday, Greenhouse, Lever, iCIMS, Taleo, etc.)
4. **JOB ALIGNMENT (non-negotiable)**: If \`jobOffer.domainMismatch\` is true OR \`jobOffer.cvTailoringDirective\` is non-empty, the summary and bullets must read as if this person is a strong plausible hire for THIS posting — not a generic tech CV dumped into the template.
5. **KEYWORD INTEGRATION**: Naturally weave jobOffer.keywords, requiredSkills, responsibilities, and industryTerms into summary, headline, bullets, and skills — especially terms that appear verbatim in the posting. **Never** fabricate work to force a keyword. If the CV does not support a term (a tool, framework, regulation, or responsibility), omit it from tools/bullets and do not imply it in the summary.
6. **QUANTIFICATION**: Strengthen metrics only where the CV already gives enough basis; never invent numbers.
7. **CERTIFICATIONS (strict)**: Only list certifications that exist in the candidate's original CV (\`cvData.certifications\`). Copy **name**, **issuer**, and **date** from that source when available. NEVER invent credentials. NEVER output the literal text \`null\` for issuer, date, or any field—use \`""\` or omit optional fields. If the source has name but no date, leave \`date\` as \`""\`. Do not add certifications just to match job keywords.
8. **OUTPUT LANGUAGE**: Write the ENTIRE CV in ${outputLanguage === 'es' ? 'SPANISH (Latin American professional standard)' : 'ENGLISH (Professional US/International standard)'}.
9. **FORMAT**: ATS-friendly — no tables, no text boxes, no graphics. Use clean sections with clear headers.

## USE THE JOB ANALYSIS OUTPUT
- Read \`jobOffer.cvTailoringDirective\` and \`jobOffer.domainMismatch\` and obey them when writing summary, headline, positions, and bullets. Treat \`cvTailoringDirective\` as the **arbitration list**: if it says not to claim something, never claim it.
- Map at least **half** of the work-experience bullets to explicit language from jobOffer.responsibilities or keywords where the CV facts allow (same work, sharper angle). Prefer **posting wording** that maps **1:1** to something the CV already describes. If a keyword is **discipline-narrow** (see section "Discipline-specific verbs & impact claims"), use a neutral equivalent or skip—never force it into a bullet opener.

## CANDIDATE'S ORIGINAL CV DATA
${JSON.stringify(cvData, null, 2)}

## JOB OFFER DETAILS
${JSON.stringify(jobOffer, null, 2)}

## ATS CV STANDARDS TO APPLY
- **profileHeadline** (required): one ATS-friendly line, Title Case or as appropriate, max ~120 characters, mixing job title keywords with candidate truth.
- Professional summary: 3-4 sentences; sentence 1 must state fit for **this** job title/function; keyword-rich; consistent person (first or third).
- Work experience bullets: Lead with verbs and outcomes the **employer** cares about for THIS offer; each bullet still grounded in CV facts.
- Skills section: Split/relabel so **soft**, **tools**, and **technical** include posting terms only if the CV states them, clearly implies them, or your bullets remain strictly derived from stated work.
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
  "profileHeadline": "string (one line; job-aligned + truthful; use pipe | between 2-4 short phrases)",
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
