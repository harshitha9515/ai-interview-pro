import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  Edit3, 
  Plus, 
  X, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Award, 
  Layers, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ShieldCheck,
  RefreshCw,
  Search,
  Download
} from 'lucide-react';
import { 
  ExtractedResumeData, 
  JobMatchAnalysis, 
  InterviewFocus,
  ResumeProject,
  ResumeEducation,
  ResumeExperience
} from '../../types/interview';
import { aiProviderService } from '../../services/aiProviderService';

interface ResumeUploadAndAnalysisProps {
  resumeData: ExtractedResumeData | null;
  onResumeChange: (data: ExtractedResumeData | null) => void;
  jobDescriptionText: string;
  onJobDescriptionChange: (text: string) => void;
  jobMatchAnalysis: JobMatchAnalysis | null;
  onJobMatchChange: (analysis: JobMatchAnalysis | null) => void;
  interviewFocus: InterviewFocus;
  onInterviewFocusChange: (focus: InterviewFocus) => void;
  onCandidateNameExtracted?: (name: string) => void;
  targetRole?: string;
}

export const ResumeUploadAndAnalysis: React.FC<ResumeUploadAndAnalysisProps> = ({
  resumeData,
  onResumeChange,
  jobDescriptionText,
  onJobDescriptionChange,
  jobMatchAnalysis,
  onJobMatchChange,
  interviewFocus,
  onInterviewFocusChange,
  onCandidateNameExtracted,
  targetRole
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'jd' | 'focus'>('review');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(resumeData?.fileName || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File Validation & Upload ───────────────────────────────────────────────
  const processFile = async (file: File) => {
    setUploadError(null);
    setSelectedFileName(file.name);

    // 1. Validate File Size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`);
      return;
    }

    // 2. Validate Extension / MIME
    const nameLower = file.name.toLowerCase();
    const isPDF = nameLower.endsWith('.pdf') || file.type === 'application/pdf';
    const isDOCX = nameLower.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isTXT = nameLower.endsWith('.txt') || file.type === 'text/plain';

    if (!isPDF && !isDOCX && !isTXT) {
      setUploadError('Unsupported file type. Please upload a PDF (.pdf) or Word Document (.docx).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Read as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || res;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      });

      reader.readAsDataURL(file);
      setUploadProgress(45);
      const base64Data = await base64Promise;
      setUploadProgress(70);

      // Call Backend Resume Parser
      const result = await aiProviderService.uploadResume({
        fileBase64: base64Data,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });

      if (!result?.resumeData || ((result.resumeData.rawTextPreview || '').length < 15 && (!result.resumeData.technicalSkills || result.resumeData.technicalSkills.length === 0))) {
        throw new Error('Failed to extract meaningful text from resume. Ensure document is not an empty or scanned image.');
      }

      setUploadProgress(100);
      onResumeChange(result.resumeData);

      if (result.resumeData.candidateName && onCandidateNameExtracted) {
        onCandidateNameExtracted(result.resumeData.candidateName);
      }
    } catch (err: any) {
      console.error('[ResumeUpload] Error:', err);
      setUploadError(err.message || 'Failed to parse resume document. Ensure file is not password-protected or corrupted.');
      onResumeChange(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveResume = () => {
    setSelectedFileName(null);
    onResumeChange(null);
    onJobMatchChange(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Skill Tag Management ───────────────────────────────────────────────────
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkillInput.trim() && resumeData) {
      e.preventDefault();
      const trimmed = newSkillInput.trim();
      if (!resumeData.technicalSkills.includes(trimmed)) {
        onResumeChange({
          ...resumeData,
          technicalSkills: [...resumeData.technicalSkills, trimmed]
        });
      }
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!resumeData) return;
    onResumeChange({
      ...resumeData,
      technicalSkills: resumeData.technicalSkills.filter(s => s !== skillToRemove)
    });
  };

  // ─── Job Description Match Analysis ─────────────────────────────────────────
  const handleAnalyzeJD = async () => {
    if (!jobDescriptionText.trim()) return;
    setIsAnalyzingJD(true);
    try {
      const result = await aiProviderService.analyzeJobDescription({
        resumeData: resumeData || undefined,
        jobDescription: jobDescriptionText,
        targetRole: targetRole || 'Target Role'
      });
      onJobMatchChange(result.analysis);
      setActiveTab('jd');
    } catch (err: any) {
      console.warn('[JD Analysis Error]:', err);
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const focusOptions: { id: InterviewFocus; title: string; desc: string; icon: any }[] = [
    {
      id: 'balanced',
      title: 'Balanced Assessment',
      desc: 'Even combination of resume projects, technical competencies, and role-fit questions.',
      icon: Layers
    },
    {
      id: 'resume_based',
      title: 'Resume & Background Driven',
      desc: 'Focus heavily on verified experiences, academic coursework, and claimed skills.',
      icon: FileText
    },
    {
      id: 'project_deep_dive',
      title: 'Project Architecture Deep Dive',
      desc: 'Rigorous exploration of technical choices, architecture, data flow, and contributions.',
      icon: Code
    },
    {
      id: 'technical_skills',
      title: 'Technical Problem Solving',
      desc: 'Coding concepts, system architecture, data structures, and algorithmic tradeoffs.',
      icon: Target
    },
    {
      id: 'job_description',
      title: 'Job Description Alignment',
      desc: 'Directly target core responsibilities and potential skill gaps identified in the JD.',
      icon: Briefcase
    },
    {
      id: 'hr_behavioral',
      title: 'Behavioral & Leadership Fit',
      desc: 'STAR-method situational questions, conflict management, and collaborative ability.',
      icon: Award
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* ─── Section Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Resume & Role Alignment (Feature 1, 2, 3)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload your resume to enable personalized, evidence-grounded questions and hiring recommendations.
          </p>
        </div>

        {resumeData && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resume Active
            </span>
            <button
              type="button"
              onClick={handleRemoveResume}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1"
              title="Delete resume data and remove from current session"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        )}
      </div>

      {/* ─── Step 1: Drag & Drop Upload Zone ─── */}
      {!resumeData ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging 
              ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]' 
              : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              {isUploading ? (
                <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {isUploading ? 'Extracting Resume Data...' : 'Drop your resume here, or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF (.pdf) and Word DOCX (.docx) up to 10MB
              </p>
            </div>

            {isUploading && (
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-3">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 text-left mt-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                In-Memory Secure Extraction
              </span>
              <span>•</span>
              <span>No Disk Leaks</span>
              <span>•</span>
              <span>Editable Details</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="upload-resume-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Your Resume (PDF)</span>
              </button>
            </div>

            {selectedFileName && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-xs text-cyan-300 font-semibold mt-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Selected file: {selectedFileName}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Step 2 & 3: Extracted Resume Details & Job Match ─── */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'review'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              1. Review & Correct Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jd')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'jd'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              2. Job Description Match {jobMatchAnalysis && `(${jobMatchAnalysis.matchScorePercent}%)`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('focus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'focus'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              3. Interview Focus: {interviewFocus.replace(/_/g, ' ')}
            </button>
          </div>

          {/* TAB 1: Review & Correct Details */}
          {activeTab === 'review' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* File Info Banner */}
              <div className="flex items-center justify-between text-xs text-cyan-300 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Uploaded Resume File: <strong className="text-white">{resumeData.fileName || selectedFileName || 'Custom Resume'}</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  {resumeData.technicalSkills?.length || 0} Skills • {resumeData.projects?.length || 0} Projects Extracted
                </span>
              </div>
              
              {/* Warnings check (e.g. Scanned / Low text) */}
              {resumeData.warnings && resumeData.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Note on extracted text: </span>
                    {resumeData.warnings.join(' ')}
                  </div>
                </div>
              )}

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={resumeData.candidateName}
                    onChange={(e) => {
                      const updated = { ...resumeData, candidateName: e.target.value };
                      onResumeChange(updated);
                      if (onCandidateNameExtracted) onCandidateNameExtracted(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Candidate Name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resumeData.email || ''}
                    onChange={(e) => onResumeChange({ ...resumeData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={resumeData.phone || ''}
                    onChange={(e) => onResumeChange({ ...resumeData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="+91 / Phone"
                  />
                </div>
              </div>

              {/* Technical Skills Editable Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Extracted Technical Skills & Tools ({resumeData.technicalSkills.length})
                  </label>
                  <span className="text-[10px] text-slate-500">Press Enter to add custom skill</span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 min-h-[46px] items-center">
                  {resumeData.technicalSkills.map((skill) => (
                    <span 
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-cyan-100 transition-colors"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="+ Add skill..."
                    className="bg-transparent text-xs text-white px-2 py-1 focus:outline-none min-w-[100px] border-none"
                  />
                </div>
              </div>

              {/* Projects Extracted */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Projects Identified ({resumeData.projects.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newProj: ResumeProject = {
                        title: 'New Technical Project',
                        description: 'Detailed description of architecture and technical contributions.',
                        technologies: ['React', 'Python']
                      };
                      onResumeChange({
                        ...resumeData,
                        projects: [...resumeData.projects, newProj]
                      });
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                </div>

                <div className="space-y-2">
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updatedProjects = [...resumeData.projects];
                            updatedProjects[idx].title = e.target.value;
                            onResumeChange({ ...resumeData, projects: updatedProjects });
                          }}
                          className="font-semibold text-xs text-white bg-transparent border-b border-slate-700 focus:border-cyan-400 focus:outline-none w-full"
                          placeholder="Project Title"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedProjects = resumeData.projects.filter((_, i) => i !== idx);
                            onResumeChange({ ...resumeData, projects: updatedProjects });
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        value={proj.description}
                        onChange={(e) => {
                          const updatedProjects = [...resumeData.projects];
                          updatedProjects[idx].description = e.target.value;
                          onResumeChange({ ...resumeData, projects: updatedProjects });
                        }}
                        rows={2}
                        className="w-full text-xs text-slate-300 bg-slate-900/60 rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-400 resize-none"
                        placeholder="Explain project architecture, individual contribution, tools used, and testing approach..."
                      />

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Technologies:</span>
                        {proj.technologies.map((t, tIdx) => (
                          <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education & Experience Summary preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Education & Degrees
                  </span>
                  <div className="text-xs text-slate-300 space-y-1">
                    {resumeData.education.map((edu, eIdx) => (
                      <div key={eIdx} className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{edu.degree} — <span className="text-slate-400">{edu.institution}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Experience & Internships
                  </span>
                  <div className="text-xs text-slate-300 space-y-1">
                    {resumeData.experience.length > 0 ? (
                      resumeData.experience.map((exp, expIdx) => (
                        <div key={expIdx} className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{exp.role} at {exp.company}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">No formal industry experience parsed (Fresher mode active)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Job Description Match Analysis */}
          {activeTab === 'jd' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Paste Target Job Description (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  We'll compare your resume with the job description to generate role-aligned questions and identify focus areas.
                </p>
                <textarea
                  value={jobDescriptionText}
                  onChange={(e) => onJobDescriptionChange(e.target.value)}
                  placeholder="Paste job requirements, required technologies, or role responsibilities here..."
                  rows={4}
                  className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-cyan-400 resize-none font-mono"
                />
                
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAnalyzeJD}
                    disabled={isAnalyzingJD || !jobDescriptionText.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isAnalyzingJD ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing Match...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze Role Match
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Match Results Display */}
              {jobMatchAnalysis && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        Match Score: <span className="text-cyan-400">{jobMatchAnalysis.matchScorePercent}%</span>
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                      {jobMatchAnalysis.targetJobTitle || targetRole}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {jobMatchAnalysis.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        ✓ Skills Found on Resume ({jobMatchAnalysis.relevantSkillsFound.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobMatchAnalysis.relevantSkillsFound.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        ▲ Skills Not Evident on Resume ({jobMatchAnalysis.missingRequiredSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobMatchAnalysis.missingRequiredSkills.length > 0 ? (
                          jobMatchAnalysis.missingRequiredSkills.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 font-mono">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">All key JD skills matched!</span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-1 italic">
                        Note: Absence from resume does not imply you lack this ability; questions will offer opportunities to demonstrate it.
                      </p>
                    </div>
                  </div>

                  {jobMatchAnalysis.roleSpecificPlan && jobMatchAnalysis.roleSpecificPlan.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Role-Specific Assessment Plan
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {jobMatchAnalysis.roleSpecificPlan.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Interview Focus Selector */}
          {activeTab === 'focus' && (
            <div className="space-y-3 animate-fadeIn">
              <label className="block text-xs font-semibold text-white mb-1">
                Select Interview Question Focus
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Choose the primary evaluation emphasis for your session.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {focusOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = interviewFocus === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => onInterviewFocusChange(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/30'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{opt.title}</h4>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-cyan-400 uppercase">Selected</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
