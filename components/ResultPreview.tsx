'use client';

import { formatCertificationLine } from '@/lib/generated-cv-sanitize';
import { GeneratedATSCV } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp } from 'lucide-react';

interface ResultPreviewProps {
  generatedCV: GeneratedATSCV;
}

export function ResultPreview({ generatedCV: cv }: ResultPreviewProps) {
  const lang = cv.language;
  const t = {
    summary: lang === 'es' ? 'Resumen Profesional' : 'Professional Summary',
    experience: lang === 'es' ? 'Experiencia Laboral' : 'Work Experience',
    education: lang === 'es' ? 'Educación' : 'Education',
    skills: lang === 'es' ? 'Habilidades' : 'Skills',
    certifications: lang === 'es' ? 'Certificaciones' : 'Certifications',
    projects: lang === 'es' ? 'Proyectos' : 'Projects',
    technical: lang === 'es' ? 'Técnicas' : 'Technical',
    tools: lang === 'es' ? 'Herramientas' : 'Tools',
    soft: lang === 'es' ? 'Blandas' : 'Soft',
    languages: lang === 'es' ? 'Idiomas' : 'Languages',
    atsScore: lang === 'es' ? 'Puntuación ATS Estimada' : 'Estimated ATS Score',
    matchedKeywords: lang === 'es' ? 'Keywords coincidentes' : 'Matched Keywords',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {cv.atsScore !== undefined && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">
              {t.atsScore}: {cv.atsScore}/100
            </span>
          </div>
          <div className="w-32 bg-blue-900 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${cv.atsScore}%` }}
            />
          </div>
        </div>
      )}

      <div className="p-8 max-w-3xl mx-auto font-mono text-sm">
        <div className="mb-6 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{cv.personalInfo.fullName}</h1>
          {cv.profileHeadline && (
            <p className="text-sm font-semibold text-gray-800 mt-2 tracking-tight normal-case">{cv.profileHeadline}</p>
          )}
          <div className="text-gray-600 mt-2 space-y-1">
            <p>{[cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.location].filter(Boolean).join(' | ')}</p>
            {[cv.personalInfo.linkedin, cv.personalInfo.portfolio, cv.personalInfo.github].filter(Boolean).length >
              0 && (
              <p>{[cv.personalInfo.linkedin, cv.personalInfo.portfolio, cv.personalInfo.github].filter(Boolean).join(' | ')}</p>
            )}
          </div>
        </div>

        {cv.summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
              {t.summary}
            </h2>
            <p className="text-gray-700 leading-relaxed">{cv.summary}</p>
          </section>
        )}

        {cv.workExperience?.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-3">
              {t.experience}
            </h2>
            {cv.workExperience.map((job, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start">
                  <span className="font-bold">{job.company}</span>
                  <span className="text-gray-500 text-xs">
                    {job.startDate} – {job.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-blue-700">{job.position}</span>
                  {job.location && <span className="text-gray-500 text-xs">{job.location}</span>}
                </div>
                <ul className="mt-1 space-y-1">
                  {[...(job.responsibilities || []), ...(job.achievements || [])].map((bullet, j) => (
                    <li key={j} className="flex gap-2 text-gray-600">
                      <span className="flex-shrink-0">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {cv.education?.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
              {t.education}
            </h2>
            {cv.education.map((edu, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <span className="font-bold">
                    {edu.degree} – {edu.field}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
                <span className="text-gray-600">{edu.institution}</span>
                {edu.honors && <p className="text-gray-500 text-xs">{edu.honors}</p>}
              </div>
            ))}
          </section>
        )}

        {cv.skills && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
              {t.skills}
            </h2>
            <div className="space-y-1">
              {cv.skills.technical?.length > 0 && (
                <p>
                  <span className="font-semibold">{t.technical}:</span> {cv.skills.technical.join(' • ')}
                </p>
              )}
              {cv.skills.tools?.length > 0 && (
                <p>
                  <span className="font-semibold">{t.tools}:</span> {cv.skills.tools.join(' • ')}
                </p>
              )}
              {cv.skills.soft?.length > 0 && (
                <p>
                  <span className="font-semibold">{t.soft}:</span> {cv.skills.soft.join(' • ')}
                </p>
              )}
              {cv.skills.languages?.length > 0 && (
                <p>
                  <span className="font-semibold">{t.languages}:</span> {cv.skills.languages.join(' • ')}
                </p>
              )}
            </div>
          </section>
        )}

        {cv.certifications?.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
              {t.certifications}
            </h2>
            <ul className="space-y-1">
              {cv.certifications.map((cert, i) => (
                <li key={i} className="flex gap-2 text-gray-600">
                  <span>•</span>
                  <span>{formatCertificationLine(cert)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cv.projects && cv.projects.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
              {t.projects}
            </h2>
            {cv.projects.map((proj, i) => (
              <div key={i} className="mb-3">
                <p className="font-bold">{proj.name}</p>
                {proj.description && <p className="text-gray-600">{proj.description}</p>}
                {proj.technologies?.length > 0 && (
                  <p className="text-gray-500 text-xs mt-1">{proj.technologies.join(' • ')}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      {cv.keywordsMatched && cv.keywordsMatched.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">{t.matchedKeywords}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cv.keywordsMatched.map((kw, i) => (
              <Badge key={i} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
