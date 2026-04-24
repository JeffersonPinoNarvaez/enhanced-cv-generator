import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCertificationLine } from '@/lib/generated-cv-sanitize';
import { GeneratedATSCV } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generatedCV } = body as { generatedCV: GeneratedATSCV };

    if (!generatedCV) {
      return NextResponse.json({ error: 'No CV data provided' }, { status: 400 });
    }

    const pdfBytes = await generateATSPDF(generatedCV);
    const safeName = generatedCV.personalInfo.fullName.replace(/\s+/g, '_') || 'CV';

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CV_ATS_${safeName}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateATSPDF(cv: GeneratedATSCV): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  const black = rgb(0.05, 0.05, 0.05);
  const darkGray = rgb(0.25, 0.25, 0.25);
  const medGray = rgb(0.5, 0.5, 0.5);
  const accentColor = rgb(0.1, 0.25, 0.55);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y - neededSpace < margin + 20) {
      addPage();
    }
  };

  const drawText = (
    text: string,
    options: {
      x?: number;
      size?: number;
      fontRef?: typeof font;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
    } = {}
  ) => {
    const {
      x = margin,
      size = 10,
      fontRef = font,
      color = black,
      maxWidth = contentWidth,
    } = options;

    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = fontRef.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    for (const l of lines) {
      checkPageBreak(size + 4);
      page.drawText(l, { x, y, size, font: fontRef, color });
      y -= size + 3;
    }

    return lines.length;
  };

  /** Section title only (no decorative lines — cleaner ATS PDF). */
  const drawSection = (title: string) => {
    const titleSize = 11;

    y -= 10;
    checkPageBreak(titleSize + 14);

    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: titleSize,
      font: fontBold,
      color: accentColor,
    });
    y -= titleSize + 10;
  };

  const { personalInfo } = cv;

  page.drawText(personalInfo.fullName.toUpperCase(), {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: black,
  });
  y -= 24;

  if (cv.profileHeadline) {
    drawText(cv.profileHeadline, { size: 10, color: darkGray, maxWidth: contentWidth });
    y -= 6;
  }

  const contactLine1Parts = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean);
  drawText(contactLine1Parts.join('  |  '), { size: 9, color: darkGray });
  y -= 2;

  const contactLine2Parts = [personalInfo.linkedin, personalInfo.portfolio, personalInfo.github].filter(
    Boolean
  ) as string[];
  if (contactLine2Parts.length > 0) {
    drawText(contactLine2Parts.join('  |  '), { size: 9, color: medGray });
  }

  if (cv.summary) {
    drawSection(cv.language === 'es' ? 'Resumen Profesional' : 'Professional Summary');
    drawText(cv.summary, { size: 10, color: darkGray });
  }

  if (cv.workExperience && cv.workExperience.length > 0) {
    drawSection(cv.language === 'es' ? 'Experiencia Laboral' : 'Work Experience');

    for (const job of cv.workExperience) {
      checkPageBreak(40);
      page.drawText(job.company, { x: margin, y, size: 11, font: fontBold, color: black });
      const dateStr = [job.startDate, job.endDate]
        .filter((d) => d != null && String(d).trim() !== '' && String(d).toLowerCase() !== 'null')
        .join(' – ');
      if (dateStr) {
        const dateWidth = font.widthOfTextAtSize(dateStr, 9);
        page.drawText(dateStr, {
          x: pageWidth - margin - dateWidth,
          y,
          size: 9,
          font,
          color: medGray,
        });
      }
      y -= 14;

      page.drawText(job.position, { x: margin, y, size: 10, font: fontBold, color: accentColor });
      if (job.location) {
        const locWidth = font.widthOfTextAtSize(job.location, 9);
        page.drawText(job.location, {
          x: pageWidth - margin - locWidth,
          y,
          size: 9,
          font,
          color: medGray,
        });
      }
      y -= 14;

      const allBullets = [...(job.responsibilities || []), ...(job.achievements || [])];
      for (const bullet of allBullets) {
        checkPageBreak(20);
        page.drawText('•', { x: margin + 4, y, size: 10, font, color: darkGray });
        drawText(bullet, { x: margin + 16, size: 10, color: darkGray, maxWidth: contentWidth - 16 });
        y -= 2;
      }
      y -= 8;
    }
  }

  if (cv.education && cv.education.length > 0) {
    drawSection(cv.language === 'es' ? 'Educación' : 'Education');

    for (const edu of cv.education) {
      checkPageBreak(30);
      page.drawText(`${edu.degree} – ${edu.field}`, {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: black,
      });
      const dateStr = [edu.startDate, edu.endDate]
        .filter((d) => d != null && String(d).trim() !== '' && String(d).toLowerCase() !== 'null')
        .join(' – ');
      if (dateStr) {
        const dateWidth = font.widthOfTextAtSize(dateStr, 9);
        page.drawText(dateStr, {
          x: pageWidth - margin - dateWidth,
          y,
          size: 9,
          font,
          color: medGray,
        });
      }
      y -= 14;

      page.drawText(edu.institution, { x: margin, y, size: 10, font, color: darkGray });
      y -= 12;
      if (edu.honors) {
        drawText(edu.honors, { size: 9, color: medGray });
      }
      y -= 6;
    }
  }

  const skills = cv.skills || { technical: [], soft: [], languages: [], tools: [] };
  const hasSkills = Object.values(skills).some((arr) => arr && arr.length > 0);
  if (hasSkills) {
    drawSection(cv.language === 'es' ? 'Habilidades' : 'Skills');

    const skillCategories = [
      { label: cv.language === 'es' ? 'Técnicas' : 'Technical', items: skills.technical },
      { label: cv.language === 'es' ? 'Herramientas' : 'Tools', items: skills.tools },
      { label: cv.language === 'es' ? 'Blandas' : 'Soft Skills', items: skills.soft },
      { label: cv.language === 'es' ? 'Idiomas' : 'Languages', items: skills.languages },
    ];

    for (const cat of skillCategories) {
      if (cat.items && cat.items.length > 0) {
        checkPageBreak(16);
        const label = `${cat.label}: `;
        const labelWidth = fontBold.widthOfTextAtSize(label, 10);
        page.drawText(label, { x: margin, y, size: 10, font: fontBold, color: black });
        drawText(cat.items.join(' • '), {
          x: margin + labelWidth,
          size: 10,
          color: darkGray,
          maxWidth: contentWidth - labelWidth,
        });
        y -= 4;
      }
    }
  }

  if (cv.certifications && cv.certifications.length > 0) {
    drawSection(cv.language === 'es' ? 'Certificaciones' : 'Certifications');

    for (const cert of cv.certifications) {
      checkPageBreak(20);
      const certText = formatCertificationLine(cert);
      page.drawText('•', { x: margin + 4, y, size: 10, font, color: darkGray });
      drawText(certText, { x: margin + 16, size: 10, color: darkGray, maxWidth: contentWidth - 16 });
      y -= 2;
    }
  }

  if (cv.projects && cv.projects.length > 0) {
    drawSection(cv.language === 'es' ? 'Proyectos' : 'Projects');

    for (const proj of cv.projects) {
      checkPageBreak(30);
      page.drawText(proj.name, { x: margin, y, size: 11, font: fontBold, color: black });
      y -= 14;
      if (proj.description) {
        drawText(proj.description, { size: 10, color: darkGray });
      }
      if (proj.technologies && proj.technologies.length > 0) {
        drawText(
          `${cv.language === 'es' ? 'Tecnologías' : 'Technologies'}: ${proj.technologies.join(', ')}`,
          { size: 9, color: medGray }
        );
      }
      y -= 6;
    }
  }

  if (cv.atsScore !== undefined) {
    page.drawText(`ATS Match Score: ${cv.atsScore}/100 | Generated by CV Craft ATS`, {
      x: margin,
      y: margin / 2,
      size: 7,
      font,
      color: medGray,
    });
  }

  return pdfDoc.save();
}
