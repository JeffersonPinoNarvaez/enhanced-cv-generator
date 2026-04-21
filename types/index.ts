export interface CVData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    github?: string;
  };
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  certifications: Certification[];
  projects?: Project[];
  rawText: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location?: string;
  responsibilities: string[];
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  date?: string;
}

export interface JobOffer {
  rawText: string;
  title?: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requirements: string[];
  keywords: string[];
  industryTerms?: string[];
  seniorityLevel?: string;
  jobFunction?: string;
  detectedLanguage?: string;
}

export interface GeneratedATSCV {
  personalInfo: CVData['personalInfo'];
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: CVData['skills'];
  certifications: Certification[];
  projects?: Project[];
  atsScore?: number;
  keywordsMatched?: string[];
  language: 'es' | 'en';
}

export type OutputLanguage = 'es' | 'en';

export interface AppState {
  step: 'input' | 'uploading' | 'processing' | 'result';
  jobOffer: string;
  outputLanguage: OutputLanguage;
  cvFile: File | null;
  extractedCV: CVData | null;
  generatedCV: GeneratedATSCV | null;
  error: string | null;
  progress: number;
  progressMessage: string;
}
