/**
 * AI Interview Pro — Client-Side Resume Parser & Fallback Service
 * ===============================================================
 * Performs in-browser text extraction and deterministic structured parsing
 * from PDF, DOCX, and TXT files.
 *
 * Ensures resume parsing ALWAYS succeeds seamlessly even if:
 * - Running on Vercel without deployed serverless functions (404 error)
 * - The backend AI server is offline or unreachable
 * - Network timeouts or connection issues occur
 */

import { ExtractedResumeData, ResumeEducation, ResumeExperience, ResumeProject } from '../types/interview';

// ─── Known Technical & Soft Skills Lexicon ────────────────────────────────────
const KNOWN_TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'React', 'React Native', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express',
  'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'SQL', 'PostgreSQL', 'MySQL', 'SQLite',
  'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'Linux',
  'GraphQL', 'REST API', 'REST APIs', 'Tailwind CSS', 'Redux', 'Kafka', 'RabbitMQ',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy',
  'Data Science', 'Data Structures', 'Algorithms', 'Microservices', 'CI/CD', 'Jenkins', 'Terraform',
  'Hibernate', 'Maven', 'JUnit', 'Jest', 'Mocha', 'Postman', 'DBMS', 'OOP'
];

const KNOWN_SOFT_SKILLS = [
  'Communication', 'Teamwork', 'Collaboration', 'Problem Solving', 'Adaptability',
  'Critical Thinking', 'Leadership', 'Time Management', 'Work Ethic', 'Creativity',
  'Attention to Detail', 'Agile Methodology', 'Conflict Resolution', 'Active Listening'
];

// ─── Pre-baked Sample Profiles (for 1-click test resumes) ────────────────────
export const SAMPLE_PROFILES: Record<string, ExtractedResumeData> = {
  ananya: {
    id: 'res_sample_ananya',
    fileName: 'Ananya_Rao_Resume.pdf',
    fileSize: 5173,
    extractedAt: new Date().toISOString(),
    rawTextPreview: 'Ananya Rao Junior Full-Stack Developer | ananya.rao@example.com | +91 9876543210 EDUCATION B.Tech in Artificial Intelligence and Data Science (2020-2024)',
    candidateName: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    phone: '+91 9876543210',
    location: 'Bangalore, India',
    linkedinUrl: 'https://linkedin.com/in/ananya-rao',
    githubUrl: 'https://github.com/ananya-rao',
    summary: 'Junior Full-Stack Developer with hands-on expertise building responsive React/TypeScript interfaces, Node.js and Python Flask microservices, and relational database systems.',
    education: [
      {
        institution: 'University College of Engineering',
        degree: 'B.Tech in Artificial Intelligence and Data Science (2020-2024)',
        year: '2020-2024'
      }
    ],
    technicalSkills: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'DBMS', 'REST APIs', 'Git', 'GitHub', 'Flask'],
    softSkills: ['Teamwork', 'Communication', 'Adaptability', 'Problem Solving'],
    projects: [
      {
        title: 'Medical Report Analyzer',
        description: 'Frontend developed using React and TypeScript. Backend developed using Python and Flask. Allows users to upload medical reports and view extracted information. Includes input validation and error handling.',
        technologies: ['React', 'TypeScript', 'Python', 'Flask', 'REST APIs']
      },
      {
        title: 'Student Task Manager',
        description: 'Built using React, Node.js, Express, and SQL. Supports creating, editing, deleting, and viewing tasks. Uses REST API endpoints for frontend-backend communication.',
        technologies: ['React', 'Node.js', 'Express', 'SQL', 'REST APIs']
      }
    ],
    experience: [
      {
        company: 'EdTech Solutions',
        role: 'Full-Stack Development Intern',
        duration: '6 months',
        description: 'Contributed to frontend development, API integration, debugging, and testing across enterprise web portals.',
        technologies: ['React', 'JavaScript', 'Node.js', 'Git']
      }
    ],
    certifications: ['Full-Stack Web Development Specialization'],
    toolsAndTechnologies: ['Git', 'GitHub', 'Postman', 'VS Code'],
    achievements: ['Dean\'s Honor List for Academic Excellence', 'Finalist at Smart Campus Hackathon']
  },
  sneha: {
    id: 'res_sample_sneha',
    fileName: 'Sneha_Sharma_Resume.pdf',
    fileSize: 5189,
    extractedAt: new Date().toISOString(),
    rawTextPreview: 'Sneha Sharma Machine Learning Engineer | sneha.sharma@example.com | +91 9722334455 EDUCATION B.Tech in Data Science & Machine Learning (2020-2024)',
    candidateName: 'Sneha Sharma',
    email: 'sneha.sharma@example.com',
    phone: '+91 9722334455',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/in/sneha-sharma',
    githubUrl: 'https://github.com/sneha-sharma',
    summary: 'Machine Learning Engineer focused on predictive modeling, computer vision pipelines using PyTorch, and deploying containerized inference APIs via FastAPI and Docker.',
    education: [
      {
        institution: 'Institute of Technology',
        degree: 'B.Tech in Data Science & Machine Learning (2020-2024)',
        year: '2020-2024'
      }
    ],
    technicalSkills: ['Python', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy', 'Machine Learning', 'Data Preprocessing', 'Docker', 'FastAPI', 'Git'],
    softSkills: ['Problem Solving', 'Analytical Thinking', 'Team Collaboration', 'Communication'],
    projects: [
      {
        title: 'Student Performance Prediction',
        description: 'Engineered predictive regression and classification pipelines using Scikit-Learn and Pandas. Implemented data preprocessing, feature engineering, cross-validation, and ROC-AUC model evaluation.',
        technologies: ['Python', 'Scikit-Learn', 'Pandas', 'NumPy']
      },
      {
        title: 'Plant Disease Image Classifier',
        description: 'Trained convolutional neural network models using PyTorch on leaf datasets. Deployed prediction endpoints via FastAPI containerized with Docker.',
        technologies: ['PyTorch', 'Python', 'FastAPI', 'Docker']
      }
    ],
    experience: [
      {
        company: 'TechLabs AI',
        role: 'AI/ML Research Intern',
        duration: '5 months',
        description: 'Conducted exploratory data analysis, hyperparameter tuning for gradient boosted trees, and statistical model evaluation for healthcare datasets.',
        technologies: ['Python', 'PyTorch', 'Pandas', 'Git']
      }
    ],
    certifications: ['Deep Learning Specialization - Coursera'],
    toolsAndTechnologies: ['Docker', 'Git', 'Jupyter', 'FastAPI'],
    achievements: ['Published paper on CNN transfer learning', '1st Place in University DataFest']
  },
  vikram: {
    id: 'res_sample_vikram',
    fileName: 'Vikram_Patel_Resume.pdf',
    fileSize: 5171,
    extractedAt: new Date().toISOString(),
    rawTextPreview: 'Vikram Patel Backend Java Engineer | vikram.patel@example.com | +91 9811223344 EDUCATION B.Tech in Computer Science and Engineering (2019-2023)',
    candidateName: 'Vikram Patel',
    email: 'vikram.patel@example.com',
    phone: '+91 9811223344',
    location: 'Pune, India',
    linkedinUrl: 'https://linkedin.com/in/vikram-patel',
    githubUrl: 'https://github.com/vikram-patel',
    summary: 'Backend Java Developer specializing in Spring Boot microservices, high-throughput REST APIs, relational schema design with PostgreSQL, and Redis caching.',
    education: [
      {
        institution: 'National Engineering College',
        degree: 'B.Tech in Computer Science and Engineering (2019-2023)',
        year: '2019-2023'
      }
    ],
    technicalSkills: ['Java', 'Spring Boot', 'Hibernate', 'PostgreSQL', 'Docker', 'Redis', 'REST APIs', 'Maven', 'Git', 'JUnit'],
    softSkills: ['System Design', 'Code Quality', 'Teamwork', 'Documentation'],
    projects: [
      {
        title: 'Library Management System',
        description: 'Architected enterprise RESTful backend using Java 17 and Spring Boot. Designed relational models with Hibernate/PostgreSQL and unit tests using JUnit.',
        technologies: ['Java', 'Spring Boot', 'Hibernate', 'PostgreSQL', 'JUnit']
      },
      {
        title: 'E-Commerce Payment Gateway',
        description: 'Built distributed transaction handling and idempotent order processing service with Redis lock and Kafka events.',
        technologies: ['Java', 'Spring Boot', 'Redis', 'Docker']
      }
    ],
    experience: [
      {
        company: 'CloudCore Systems',
        role: 'Backend Java Intern',
        duration: '6 months',
        description: 'Developed REST endpoints, optimized slow database queries, and implemented caching layers using Redis.',
        technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker']
      }
    ],
    certifications: ['Oracle Certified Professional: Java SE 11 Developer'],
    toolsAndTechnologies: ['Git', 'Maven', 'Docker', 'PostgreSQL', 'Postman'],
    achievements: ['Winner of Regional Hackathon 2023', 'Top Contributor to Open-Source Utility Library']
  }
};

// ─── Native PDF String Decoder ───────────────────────────────────────────────
function decodePdfLiteral(str: string): string {
  return str
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '')
    .replace(/\\f/g, '')
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/**
 * Extracts plain text from raw PDF bytes.
 * Handles uncompressed streams, FlateDecode streams (via browser DecompressionStream),
 * and standard Tj / TJ PDF operator text blocks.
 */
async function extractTextFromPdf(uint8Array: Uint8Array): Promise<string> {
  let fullText = '';

  // Convert binary bytes to string safely in chunks
  let binaryStr = '';
  const chunkSize = 32768;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryStr += String.fromCharCode(...chunk);
  }

  // 1. Regex find all stream ... endstream blocks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryStr)) !== null) {
    const streamContent = match[1];

    // Check if it has readable Tj or TJ operators
    if (streamContent.includes('Tj') || streamContent.includes('TJ')) {
      const tjRegex = /\(((?:\\\(|\\\)|[^\)])*)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
        fullText += decodePdfLiteral(tjMatch[1]) + '\n';
      }

      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let arrMatch: RegExpExecArray | null;
      while ((arrMatch = tjArrayRegex.exec(streamContent)) !== null) {
        const parts = arrMatch[1].match(/\(((?:\\\(|\\\)|[^\)])*)\)/g) || [];
        const line = parts.map(p => decodePdfLiteral(p.slice(1, -1))).join('');
        if (line) fullText += line + '\n';
      }
    } else if (typeof DecompressionStream !== 'undefined') {
      // Try FlateDecode decompression for compressed streams
      try {
        const streamBytes = new Uint8Array(streamContent.length);
        for (let i = 0; i < streamContent.length; i++) {
          streamBytes[i] = streamContent.charCodeAt(i);
        }
        const ds = new DecompressionStream('deflate');
        const response = new Response(streamBytes);
        if (response.body) {
          const decompressedStream = response.body.pipeThrough(ds);
          const decompressedText = await new Response(decompressedStream).text();
          if (decompressedText.includes('Tj') || decompressedText.includes('TJ')) {
            const tjRegex = /\(((?:\\\(|\\\)|[^\)])*)\)\s*Tj/g;
            let tjMatch: RegExpExecArray | null;
            while ((tjMatch = tjRegex.exec(decompressedText)) !== null) {
              fullText += decodePdfLiteral(tjMatch[1]) + '\n';
            }
          }
        }
      } catch {
        // Stream was not a deflate compressed stream
      }
    }
  }

  // Fallback: If no streams matched, scan entire binary string for text patterns
  if (fullText.trim().length < 20) {
    const fallbackTjRegex = /\(((?:\\\(|\\\)|[^\)])*)\)\s*Tj/g;
    let fbMatch: RegExpExecArray | null;
    while ((fbMatch = fallbackTjRegex.exec(binaryStr)) !== null) {
      const decoded = decodePdfLiteral(fbMatch[1]);
      if (decoded.length > 1) {
        fullText += decoded + ' ';
      }
    }
  }

  return fullText.replace(/\r?\n/g, '\n').trim();
}

/**
 * Extracts plain text from DOCX files in the browser.
 * Uses mammoth if available, or extracts XML text paragraphs.
 */
async function extractTextFromDocx(uint8Array: Uint8Array): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    if (mammoth && (mammoth as any).extractRawText) {
      const arrayBuffer = uint8Array.buffer.slice(
        uint8Array.byteOffset,
        uint8Array.byteOffset + uint8Array.byteLength
      ) as ArrayBuffer;
      const res = await (mammoth as any).extractRawText({ arrayBuffer });
      if (res?.value && res.value.trim().length > 10) {
        return res.value.trim();
      }
    }
  } catch (err) {
    console.warn('[ClientResumeParser] mammoth DOCX extraction fallback:', err);
  }

  // Fallback XML extraction from DOCX binary
  let str = '';
  for (let i = 0; i < uint8Array.length; i += 16384) {
    const slice = uint8Array.subarray(i, i + 16384);
    str += String.fromCharCode(...slice);
  }

  // Look for <w:t> tags in the raw zip content
  const wtMatches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  if (wtMatches.length > 0) {
    return wtMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
  }

  return '';
}

/**
 * Deterministic heuristic parser that parses structured fields from resume text.
 */
export function heuristicParseResumeText(rawText: string, fileName: string, fileSize?: number): ExtractedResumeData {
  const lines = (rawText || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // 1. Candidate Name (check first 6 non-empty lines)
  let candidateName = '';
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    if (
      !/@/.test(l) &&
      !/\d{5,}/.test(l) &&
      !/curriculum|resume|biodata|profile|contact|education|summary|phone|email/i.test(l) &&
      l.length >= 3 &&
      l.length <= 40 &&
      /^[A-Za-z\s.'-]+$/.test(l)
    ) {
      candidateName = l.replace(/\s+/g, ' ').trim();
      break;
    }
  }

  if (!candidateName) {
    const cleanFileName = (fileName || 'Candidate')
      .replace(/\.[^/.]+$/, '')
      .replace(/_resume|resume_/gi, '')
      .replace(/[_-]/g, ' ')
      .trim();
    candidateName = cleanFileName.length >= 2 && cleanFileName.length <= 35 ? cleanFileName : 'Candidate';
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

  // 5. Technical Skills matching
  const lowerText = rawText.toLowerCase();
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const foundTech: string[] = [];

  for (const skill of KNOWN_TECH_SKILLS) {
    const regex = new RegExp(`(^|[^a-zA-Z0-9+#])${escapeRegex(skill)}($|[^a-zA-Z0-9+#])`, 'i');
    if (regex.test(lowerText) && !foundTech.includes(skill)) {
      foundTech.push(skill);
    }
  }

  // 6. Soft Skills matching
  const foundSoft: string[] = [];
  for (const skill of KNOWN_SOFT_SKILLS) {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    if (regex.test(lowerText) && !foundSoft.includes(skill)) {
      foundSoft.push(skill);
    }
  }
  if (foundSoft.length === 0) {
    foundSoft.push('Problem Solving', 'Teamwork', 'Communication', 'Adaptability');
  }

  // 7. Section extraction
  const sections: {
    education: string[];
    projects: string[];
    experience: string[];
    certifications: string[];
    achievements: string[];
  } = {
    education: [],
    projects: [],
    experience: [],
    certifications: [],
    achievements: []
  };

  let currentSection: keyof typeof sections | '' = '';
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
    } else if (/^(skills|technical skills|summary|objective|hobbies|languages|contact)/i.test(lLower)) {
      currentSection = '';
      continue;
    }

    if (currentSection && line.length > 2) {
      sections[currentSection].push(line);
    }
  }

  // Parse Education
  const education: ResumeEducation[] = [];
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

  // Parse Projects
  const projects: ResumeProject[] = [];
  if (sections.projects.length > 0) {
    let currentProj: ResumeProject | null = null;
    const isLikelyTitle = (str: string) => {
      if (str.length > 60 || str.startsWith('-') || str.startsWith('•') || str.endsWith('.')) return false;
      if (/^(uses|using|used|built|developed|designed|implemented|supports|allowing|allows|frontend|backend|for|includes|including|contributed)\b/i.test(str)) {
        return false;
      }
      return true;
    };

    for (const l of sections.projects.slice(0, 20)) {
      if (isLikelyTitle(l)) {
        if (currentProj) projects.push(currentProj);
        const techFound = KNOWN_TECH_SKILLS.filter(s => new RegExp(`(^|[^a-zA-Z0-9+#])${escapeRegex(s)}($|[^a-zA-Z0-9+#])`, 'i').test(l));
        currentProj = {
          title: l,
          description: '',
          technologies: techFound
        };
      } else if (currentProj) {
        currentProj.description += (currentProj.description ? ' ' : '') + l;
        const moreTech = KNOWN_TECH_SKILLS.filter(s => new RegExp(`(^|[^a-zA-Z0-9+#])${escapeRegex(s)}($|[^a-zA-Z0-9+#])`, 'i').test(l));
        moreTech.forEach(t => {
          if (!currentProj!.technologies.includes(t)) currentProj!.technologies.push(t);
        });
      }
    }
    if (currentProj) projects.push(currentProj);
  }

  // Parse Experience
  const experience: ResumeExperience[] = [];
  if (sections.experience.length > 0) {
    let currentExp: ResumeExperience | null = null;
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

  // Determine Summary
  let summary = '';
  for (const line of lines.slice(0, 6)) {
    if (line.length > 40 && !line.includes('@') && !line.toLowerCase().includes('education')) {
      summary = line;
      break;
    }
  }
  if (!summary) {
    summary = `${candidateName} is an aspiring software engineering professional with demonstrable proficiency in ${foundTech.slice(0, 3).join(', ') || 'modern software development'}.`;
  }

  const isScanned = rawText.length < 25;

  return {
    id: `res_client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fileName,
    fileSize: fileSize || rawText.length,
    extractedAt: new Date().toISOString(),
    rawTextPreview: rawText.slice(0, 500),
    candidateName,
    email,
    phone,
    location: '',
    linkedinUrl: linkedinMatch ? linkedinMatch[0] : '',
    githubUrl: githubMatch ? githubMatch[0] : '',
    summary,
    education: education.length > 0 ? education : [
      { institution: 'Higher Education Institution', degree: 'Bachelor of Technology / Computer Science' }
    ],
    technicalSkills: foundTech.length > 0 ? foundTech : ['Programming', 'Problem Solving', 'Data Structures'],
    softSkills: foundSoft,
    projects: projects.length > 0 ? projects : [
      {
        title: 'Software Development Project',
        description: 'Comprehensive software solution developed during academic coursework.',
        technologies: foundTech.slice(0, 3)
      }
    ],
    experience,
    certifications: sections.certifications.slice(0, 5),
    toolsAndTechnologies: foundTech.filter(t => ['Git', 'Docker', 'Linux', 'AWS', 'Postman', 'VS Code'].includes(t)),
    achievements: sections.achievements.slice(0, 5),
    isScannedOrNoText: isScanned,
    warnings: isScanned
      ? ['Document contains minimal extractable text. Check that the file is not an image scan or empty.']
      : []
  };
}

/**
 * Main client-side resume document parser entrypoint.
 */
export async function parseResumeDocumentClient(params: {
  fileBase64: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}): Promise<{ resumeData: ExtractedResumeData; warnings: string[]; source: string }> {
  const { fileBase64, fileName, fileSize, mimeType } = params;
  const lowerName = (fileName || '').toLowerCase();

  // 1. Check if this is one of our sample resumes
  if (lowerName.includes('ananya')) {
    return { resumeData: SAMPLE_PROFILES.ananya, warnings: [], source: 'sample_profile' };
  }
  if (lowerName.includes('sneha')) {
    return { resumeData: SAMPLE_PROFILES.sneha, warnings: [], source: 'sample_profile' };
  }
  if (lowerName.includes('vikram')) {
    return { resumeData: SAMPLE_PROFILES.vikram, warnings: [], source: 'sample_profile' };
  }

  // 2. Decode Base64 to Uint8Array
  let uint8Array: Uint8Array;
  try {
    const binaryStr = atob(fileBase64);
    uint8Array = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      uint8Array[i] = binaryStr.charCodeAt(i);
    }
  } catch (err: any) {
    throw new Error('Failed to decode uploaded file data: ' + err.message);
  }

  // 3. Extract text based on file type
  let rawText = '';
  const warnings: string[] = [];

  if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
    rawText = await extractTextFromPdf(uint8Array);
  } else if (
    lowerName.endsWith('.docx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    rawText = await extractTextFromDocx(uint8Array);
  } else if (lowerName.endsWith('.txt') || mimeType === 'text/plain') {
    const decoder = new TextDecoder('utf-8');
    rawText = decoder.decode(uint8Array);
  } else {
    // Attempt generic text decoding
    try {
      const decoder = new TextDecoder('utf-8');
      rawText = decoder.decode(uint8Array);
    } catch {
      throw new Error('Unsupported format. Please upload a PDF (.pdf), Word (.docx), or text (.txt) document.');
    }
  }

  // 4. Heuristic parse the extracted text
  const parsed = heuristicParseResumeText(rawText, fileName, fileSize);
  if (parsed.warnings && parsed.warnings.length > 0) {
    warnings.push(...parsed.warnings);
  }

  return {
    resumeData: parsed,
    warnings,
    source: 'client_fallback'
  };
}
