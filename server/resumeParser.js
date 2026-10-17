/**
 * Resume Parser Service (Backend)
 * ===============================
 * Safely extracts text from PDF and DOCX files in-memory without persistent disk leaks.
 * Supports:
 * - PDF via PDFParse (CommonJS wrapper)
 * - DOCX via mammoth
 * - Rule-based heuristic extractor for fallback/deterministic parsing
 * - Validation of size, MIME type, empty/scanned documents, password protection
 */

import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Extracts plain text from a base64 encoded document buffer.
 */
export async function extractTextFromDocument(base64Data, fileName, mimeType) {
  const warnings = [];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`);
  }

  const lowerName = (fileName || '').toLowerCase();
  let text = '';

  if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      const textResult = await parser.getText();
      text = typeof textResult === 'string' ? textResult : (textResult?.text || '');
      text = text.replace(/-- \d+ of \d+ --/g, '').trim();
    } catch (err) {
      if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
        throw new Error('This PDF is password-protected. Please provide an unprotected PDF.');
      }
      throw new Error(`Failed to read PDF: ${err.message || 'corrupted document'}`);
    }
  } else if (
    lowerName.endsWith('.docx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = (result.value || '').trim();
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach(m => {
          if (m.type === 'warning') warnings.push(m.message);
        });
      }
    } catch (err) {
      throw new Error(`Failed to read DOCX: ${err.message || 'corrupted document'}`);
    }
  } else if (lowerName.endsWith('.txt')) {
    text = buffer.toString('utf-8').trim();
  } else {
    throw new Error('Unsupported format. Only PDF (.pdf) and Word DOCX (.docx) files are supported.');
  }

  // Scanned / empty check
  const isScanned = text.length < 50;
  if (isScanned) {
    warnings.push(
      'Document contains minimal or no extractable text. It may be a scanned image or empty. Please review or enter your details manually.'
    );
  }

  return { text, isScanned, warnings };
}

/**
 * Deterministic heuristic parser that extracts structured fields from resume text.
 * Used as a robust fallback or baseline before AI enhancement.
 */
export function heuristicParseResumeText(rawText, fileName) {
  const lines = (rawText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Candidate Name (usually in first 5 non-empty lines)
  let candidateName = '';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (
      !/@/.test(l) &&
      !/\d{5,}/.test(l) &&
      !/curriculum|resume|biodata|profile|contact/i.test(l) &&
      l.length >= 3 &&
      l.length <= 40 &&
      /^[A-Za-z\s.'-]+$/.test(l)
    ) {
      candidateName = l;
      break;
    }
  }
  if (!candidateName) {
    const cleanFileName = (fileName || 'Candidate').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    candidateName = cleanFileName.length > 2 && cleanFileName.length < 35 ? cleanFileName : 'Candidate';
  }

  // 2. Email
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // 3. Phone
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // 4. Social Links
  const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  // 5. Technical Skills Dictionary matching
  const knownTechSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
    'HTML', 'CSS', 'React', 'React Native', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express',
    'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'SQL', 'PostgreSQL', 'MySQL',
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'Linux',
    'GraphQL', 'REST API', 'Tailwind CSS', 'Redux', 'Kafka', 'Machine Learning', 'TensorFlow',
    'PyTorch', 'Data Structures', 'Algorithms', 'Microservices', 'CI/CD'
  ];

  const foundTech = [];
  const lowerText = rawText.toLowerCase();
  for (const skill of knownTechSkills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText) && !foundTech.includes(skill)) {
      foundTech.push(skill);
    }
  }

  // 6. Section extraction helper
  const sections = {
    education: [],
    projects: [],
    experience: [],
    certifications: [],
    achievements: []
  };

  let currentSection = '';
  for (const line of lines) {
    const lLower = line.toLowerCase();
    if (/^(education|academic background|qualifications)/i.test(lLower)) {
      currentSection = 'education';
      continue;
    } else if (/^(projects|academic projects|key projects|personal projects)/i.test(lLower)) {
      currentSection = 'projects';
      continue;
    } else if (/^(experience|work experience|internship|internships|employment)/i.test(lLower)) {
      currentSection = 'experience';
      continue;
    } else if (/^(certifications|licenses & certifications|certificates)/i.test(lLower)) {
      currentSection = 'certifications';
      continue;
    } else if (/^(achievements|honors|awards|co-curricular)/i.test(lLower)) {
      currentSection = 'achievements';
      continue;
    } else if (/^(skills|technical skills|summary|objective|hobbies|languages)/i.test(lLower)) {
      currentSection = '';
      continue;
    }

    if (currentSection && line.length > 2) {
      sections[currentSection].push(line);
    }
  }

  // Parse Education
  const education = [];
  if (sections.education.length > 0) {
    let currDegree = '';
    let currInst = '';
    for (const l of sections.education.slice(0, 8)) {
      if (/b\.?tech|b\.?e|bachelor|m\.?tech|m\.?s|master|degree|diploma|higher secondary|cbse|icse/i.test(l)) {
        if (currDegree) {
          education.push({ institution: currInst || 'University / College', degree: currDegree });
          currInst = '';
        }
        currDegree = l;
      } else if (currDegree && !currInst) {
        currInst = l;
      }
    }
    if (currDegree) {
      education.push({ institution: currInst || 'University / College', degree: currDegree });
    }
  }

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasKeyword = (text, kw) => new RegExp(`(^|[^a-zA-Z0-9+#])${escapeRegex(kw)}($|[^a-zA-Z0-9+#])`, 'i').test(text);

  // Parse Projects
  const projects = [];
  if (sections.projects.length > 0) {
    let currentProj = null;
    const isLikelyTitle = (str) => {
      if (str.length > 60 || str.startsWith('-') || str.startsWith('•') || str.endsWith('.')) return false;
      // If it starts with common sentence words, it is a description continuation
      if (/^(uses|using|used|built|developed|designed|implemented|supports|allowing|allows|frontend|backend|for|includes|including|contributed)\b/i.test(str)) {
        return false;
      }
      return true;
    };

    for (const l of sections.projects.slice(0, 20)) {
      if (isLikelyTitle(l)) {
        if (currentProj) projects.push(currentProj);
        const techFound = knownTechSkills.filter(s => hasKeyword(l, s));
        currentProj = {
          title: l,
          description: '',
          technologies: techFound
        };
      } else if (currentProj) {
        currentProj.description += (currentProj.description ? ' ' : '') + l;
        const moreTech = knownTechSkills.filter(s => hasKeyword(l, s));
        moreTech.forEach(t => {
          if (!currentProj.technologies.includes(t)) currentProj.technologies.push(t);
        });
      }
    }
    if (currentProj) projects.push(currentProj);
  }

  // Parse Experience
  const experience = [];
  if (sections.experience.length > 0) {
    let currentExp = null;
    for (const l of sections.experience.slice(0, 12)) {
      if (l.length < 60 && !l.startsWith('-') && !l.startsWith('•')) {
        if (currentExp) experience.push(currentExp);
        currentExp = { company: l, role: 'Intern / Developer', description: '' };
      } else if (currentExp) {
        currentExp.description += (currentExp.description ? ' ' : '') + l;
      }
    }
    if (currentExp) experience.push(currentExp);
  }

  return {
    candidateName,
    email,
    phone,
    location: '',
    linkedinUrl: linkedinMatch ? linkedinMatch[0] : '',
    githubUrl: githubMatch ? githubMatch[0] : '',
    summary: rawText.slice(0, 250).replace(/\s+/g, ' ').trim(),
    education: education.length > 0 ? education : [
      { institution: 'Higher Education Institution', degree: 'Bachelor of Technology / Computer Science' }
    ],
    technicalSkills: foundTech.length > 0 ? foundTech : ['Programming', 'Problem Solving', 'Data Structures'],
    softSkills: ['Teamwork', 'Communication', 'Adaptability', 'Problem Solving'],
    projects: projects.length > 0 ? projects : [
      {
        title: 'Academic Capstone Project',
        description: 'Comprehensive software solution developed during academic coursework.',
        technologies: foundTech.slice(0, 3)
      }
    ],
    experience,
    certifications: sections.certifications.slice(0, 5),
    toolsAndTechnologies: foundTech.filter(t => ['Git', 'Docker', 'Linux', 'AWS', 'Postman'].includes(t)),
    achievements: sections.achievements.slice(0, 5)
  };
}
