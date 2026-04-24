import type { Certification, Education, GeneratedATSCV } from '@/types';

/** Quita vacío, espacios y el literal "null" que a veces devuelve el modelo. */
export function cleanGeneratedField(v: unknown): string {
  if (v == null) return '';
  const t = String(v).trim();
  if (t === '' || t.toLowerCase() === 'null') return '';
  return t;
}

/** Una sola línea ATS para certificación, sin "null (null)". */
export function formatCertificationLine(cert: Certification): string {
  const name = cleanGeneratedField(cert.name) || 'Certification';
  const issuer = cleanGeneratedField(cert.issuer);
  const date = cleanGeneratedField(cert.date);
  if (issuer && date) return `${name} – ${issuer} (${date})`;
  if (issuer) return `${name} – ${issuer}`;
  if (date) return `${name} (${date})`;
  return name;
}

export function sanitizeGeneratedATSCV(cv: GeneratedATSCV): GeneratedATSCV {
  const certifications: Certification[] = (cv.certifications || [])
    .map((c) => ({
      ...c,
      name: cleanGeneratedField(c.name),
      issuer: cleanGeneratedField(c.issuer),
      date: cleanGeneratedField(c.date),
      expiryDate: c.expiryDate != null ? cleanGeneratedField(c.expiryDate) : undefined,
      credentialId: c.credentialId != null ? cleanGeneratedField(c.credentialId) : undefined,
    }))
    .filter((c) => c.name.length > 0);

  const education: Education[] = (cv.education || []).map((e) => ({
    ...e,
    startDate: cleanGeneratedField(e.startDate),
    endDate: cleanGeneratedField(e.endDate),
  }));

  return { ...cv, certifications, education };
}
