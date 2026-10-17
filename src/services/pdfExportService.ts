import { jsPDF } from 'jspdf';
import { InterviewSession } from '../types/interview';

export const pdfExportService = {
  generateInterviewReport(session: InterviewSession): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper to check page break
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        // Mini header on subsequent pages
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 150, 160);
        doc.text('AI Interview Pro — Candidate Assessment Report', margin, 10);
        doc.text(`Candidate: ${session.candidateName || 'Candidate'}`, pageWidth - margin, 10, { align: 'right' });
        doc.setDrawColor(220, 225, 230);
        doc.line(margin, 12, pageWidth - margin, 12);
        y = 18;
      }
    };

    // ─── Header Banner ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text('AI INTERVIEW PRO', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240); // slate-200
    doc.text('Evidence-Based Candidate Evaluation & Recommendation Report', margin + 6, y + 15);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    const generatedDate = new Date(session.completedAt || session.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${generatedDate}`, pageWidth - margin - 6, y + 15, { align: 'right' });

    y += 30;

    // ─── Candidate & Session Metadata Table ─────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const col1 = margin + 5;
    const col2 = margin + contentWidth * 0.35;
    const col3 = margin + contentWidth * 0.68;

    doc.text('Candidate Name:', col1, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(session.candidateName || 'Candidate', col1 + 28, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Target Role:', col2, y + 7);
    doc.setFont('helvetica', 'normal');
    const roleText = doc.splitTextToSize(session.role, 50);
    doc.text(roleText[0] || session.role, col2 + 20, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Overall Score:', col3, y + 7);
    doc.setFont('helvetica', 'bold');
    const scoreVal = session.overallScore ?? 0;
    if (scoreVal >= 70) doc.setTextColor(16, 149, 93);
    else if (scoreVal >= 50) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(225, 29, 72);
    doc.text(`${scoreVal} / 100`, col3 + 24, y + 7);

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Experience Level:', col1, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(session.experienceLevel.toUpperCase(), col1 + 28, y + 15);

    doc.setFont('helvetica', 'bold');
    doc.text('Language / Mode:', col2, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`${session.language} (${session.mode})`, col2 + 28, y + 15);

    doc.setFont('helvetica', 'bold');
    doc.text('Questions Answered:', col3, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`${session.responses.length} / ${session.totalQuestions}`, col3 + 34, y + 15);

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Focus:', col1, y + 23);
    doc.setFont('helvetica', 'normal');
    doc.text((session.interviewFocus || 'Balanced Assessment').replace(/_/g, ' ').toUpperCase(), col1 + 28, y + 23);

    doc.setFont('helvetica', 'bold');
    doc.text('Resume Included:', col2, y + 23);
    doc.setFont('helvetica', 'normal');
    doc.text(session.resumeData ? `Yes (${session.resumeData.fileName || 'Verified'})` : 'No (Standard Mode)', col2 + 28, y + 23);

    y += 34;

    // ─── Section D: Final Selection Recommendation ──────────────────────────────
    checkPageBreak(38);
    const rec = session.finalRecommendation;
    const status = rec?.status || (scoreVal >= 70 ? 'recommended' : scoreVal >= 50 ? 'borderline' : 'not_recommended');
    
    // Status colors
    let bgFill = [240, 253, 244]; // emerald-50
    let strokeCol = [187, 247, 208]; // emerald-200
    let badgeFill = [22, 163, 74]; // emerald-600
    let label = 'RECOMMENDED FOR NEXT ROUND';

    if (status === 'borderline') {
      bgFill = [255, 251, 235]; // amber-50
      strokeCol = [254, 240, 138]; // amber-200
      badgeFill = [217, 119, 6]; // amber-600
      label = 'BORDERLINE — ADDITIONAL ASSESSMENT RECOMMENDED';
    } else if (status === 'not_recommended') {
      bgFill = [255, 241, 242]; // rose-50
      strokeCol = [254, 205, 211]; // rose-200
      badgeFill = [225, 29, 72]; // rose-600
      label = 'NOT RECOMMENDED AT THIS TIME';
    } else if (status === 'inconclusive') {
      bgFill = [241, 245, 249]; // slate-100
      strokeCol = [203, 213, 225]; // slate-300
      badgeFill = [71, 85, 105]; // slate-600
      label = 'INCONCLUSIVE ASSESSMENT';
    }

    doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
    doc.setDrawColor(strokeCol[0], strokeCol[1], strokeCol[2]);
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

    // Recommendation badge
    doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2]);
    doc.roundedRect(margin + 5, y + 4, contentWidth * 0.65, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(label, margin + 8, y + 8.2);

    // Headline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const headline = rec?.headline || `${session.candidateName} completed the assessment with an overall score of ${scoreVal}/100.`;
    doc.text(headline, margin + 5, y + 15);

    // Explanation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const explanation = rec?.explanation || 'The candidate demonstrated foundational knowledge and practical skills across the evaluated question categories.';
    const explLines = doc.splitTextToSize(explanation, contentWidth - 10);
    doc.text(explLines.slice(0, 3), margin + 5, y + 20);

    y += 40;

    // ─── Section C: Resume-Based Findings & Strengths ────────────────────────────
    if (rec?.demonstratedSkills?.length || rec?.convincinglyExplainedProjects?.length || session.resumeData) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Resume & Interview Evidence Findings', margin, y);
      y += 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

      const colHalf = contentWidth / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 149, 93);
      doc.text('✓ Demonstrated Skills:', margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const demonstratedSkills = rec?.demonstratedSkills?.join(', ') || (session.resumeData?.technicalSkills || []).slice(0, 4).join(', ') || 'Core Programming';
      doc.text(doc.splitTextToSize(demonstratedSkills, colHalf - 8).slice(0, 2), margin + 4, y + 11);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.text('★ Convincingly Explained Projects:', margin + colHalf + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const explainedProjects = rec?.convincinglyExplainedProjects?.join(', ') || (session.resumeData?.projects || []).slice(0, 2).map(p => p.title).join(', ') || 'Capstone Project';
      doc.text(doc.splitTextToSize(explainedProjects, colHalf - 8).slice(0, 2), margin + colHalf + 4, y + 11);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text('▲ Clarification / Practice Areas:', margin + 4, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const practiceSkills = rec?.skillsRequiringPractice?.join(', ') || 'Production scale trade-offs and complexity analysis';
      doc.text(doc.splitTextToSize(practiceSkills, contentWidth - 10).slice(0, 1), margin + 45, y + 18);

      y += 28;
    }

    // ─── Section B: Category Score Breakdown ────────────────────────────────────
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Category Performance Breakdown', margin, y);
    y += 4;

    const weights = session.feedbackSummary?.categoryWeights || [
      { category: 'technical', weightPercent: 40, score: scoreVal, weightedContribution: Math.round(scoreVal * 0.4), criteriaDescription: 'Core technical accuracy' },
      { category: 'problem_solving', weightPercent: 25, score: scoreVal, weightedContribution: Math.round(scoreVal * 0.25), criteriaDescription: 'Analytical reasoning' },
      { category: 'communication', weightPercent: 20, score: Math.min(100, scoreVal + 5), weightedContribution: Math.round(scoreVal * 0.2), criteriaDescription: 'Clarity and structure' },
      { category: 'role_fit', weightPercent: 15, score: scoreVal, weightedContribution: Math.round(scoreVal * 0.15), criteriaDescription: 'Role alignment' }
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('EVALUATION DIMENSION', margin + 4, y + 4.2);
    doc.text('QUESTIONS', margin + 70, y + 4.2);
    doc.text('SCORE (100)', margin + 105, y + 4.2);
    doc.text('WEIGHT', margin + 135, y + 4.2);
    doc.text('WEIGHTED PTS', margin + 155, y + 4.2);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const w of weights) {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      doc.setTextColor(30, 41, 59);
      doc.text(w.category.replace(/_/g, ' ').toUpperCase(), margin + 4, y + 4.5);
      const qCount = session.responses.filter(r => r.category === w.category).length || 1;
      doc.text(String(qCount), margin + 75, y + 4.5);
      doc.text(`${Math.round(w.score)}%`, margin + 110, y + 4.5);
      doc.text(`${w.weightPercent}%`, margin + 138, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${w.weightedContribution.toFixed(1)}`, margin + 162, y + 4.5);
      doc.setFont('helvetica', 'normal');
      y += 6.5;
    }

    y += 6;

    // ─── Section E: Question Transcript & Evaluations ───────────────────────────
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Question Evaluations & Rubric Transcript', margin, y);
    y += 5;

    session.responses.forEach((resp, idx) => {
      checkPageBreak(38);
      const qScore = resp.evaluations?.score ?? 0;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'FD');

      // Question header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${idx + 1} (${resp.category.toUpperCase()}):`, margin + 3, y + 5);

      doc.setFont('helvetica', 'bold');
      if (qScore >= 70) doc.setTextColor(16, 149, 93);
      else if (qScore >= 50) doc.setTextColor(217, 119, 6);
      else doc.setTextColor(225, 29, 72);
      doc.text(`Score: ${qScore}/100`, pageWidth - margin - 4, y + 5, { align: 'right' });

      // Question text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const qText = doc.splitTextToSize(resp.questionText, contentWidth - 8);
      doc.text(qText.slice(0, 2), margin + 3, y + 9.5);

      // Candidate answer
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const ansPreview = resp.answerText ? `Answer: "${resp.answerText.slice(0, 120)}..."` : 'Answer: [Skipped / No answer submitted]';
      doc.text(ansPreview, margin + 3, y + 17);

      // Feedback / Strengths
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const feedback = resp.evaluations?.feedback || 'Answer evaluated based on technical clarity, structured explanation, and relevance.';
      const fbLines = doc.splitTextToSize(`Feedback: ${feedback}`, contentWidth - 8);
      doc.text(fbLines.slice(0, 2), margin + 3, y + 23);

      // Suggested improved answer or model answer highlight
      const improvement = resp.evaluations?.suggestedImprovedAnswer || resp.evaluations?.modelAnswer;
      if (improvement) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(14, 116, 144);
        doc.text(`Suggested Focus: ${improvement.slice(0, 90)}...`, margin + 3, y + 31);
      }

      y += 38;
    });

    // ─── Section F: Proctoring Audit & Integrity Telemetry ───────────────────────
    const proctorSnapshot = session.proctoringSnapshot;
    if (session.isProctored || proctorSnapshot) {
      checkPageBreak(30);
      const violations = proctorSnapshot?.violations || {
        tabHidden: 0,
        windowBlur: 0,
        fullscreenExited: 0,
        cameraDisconnected: 0,
        micDisconnected: 0
      };
      const isClean = violations.tabHidden === 0 && violations.cameraDisconnected === 0 && violations.fullscreenExited === 0;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Proctored Mode Telemetry & Integrity Audit', margin, y);
      y += 5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (isClean) {
        doc.setTextColor(16, 149, 93);
        doc.text('Integrity Status: VERIFIED CLEAN (No deviations recorded)', margin + 3, y + 5);
      } else if (violations.tabHidden >= 3) {
        doc.setTextColor(225, 29, 72);
        doc.text('Integrity Status: FLAGGED FOR REVIEW (Threshold exceeded)', margin + 3, y + 5);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.text('Integrity Status: MINOR DEVIATIONS (Reviewer discretion)', margin + 3, y + 5);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const metricsText = `Tab switches: ${violations.tabHidden} | Focus shifts: ${violations.windowBlur} | Fullscreen exits: ${violations.fullscreenExited} | Camera drops: ${violations.cameraDisconnected} | Events logged: ${proctorSnapshot?.eventLog?.length || 0}`;
      doc.text(metricsText, margin + 3, y + 10);

      const auditDisclaimer = 'Note: Technical events are recorded for transparency. Scoring is derived purely from candidate answers without arbitrary deductions.';
      doc.text(auditDisclaimer, margin + 3, y + 16);

      y += 26;
    }

    // ─── Legal & Fairness Disclaimer ────────────────────────────────────────────
    checkPageBreak(18);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const disclaimer = 'FAIRNESS & ADVISORY NOTICE: This assessment report is generated by AI Interview Pro solely for educational practice and interview preparation. Recommendations do not replace human recruitment decisions. The platform strictly enforces non-discrimination and evaluates solely on job-relevant demonstrable technical and behavioral responses.';
    const discLines = doc.splitTextToSize(disclaimer, contentWidth - 6);
    doc.text(discLines, margin + 3, y + 4.5);

    // Save PDF file
    const safeName = (session.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
    const safeRole = (session.role || 'Role').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`AI_Interview_Evaluation_${safeName}_${safeRole}.pdf`);
  }
};
