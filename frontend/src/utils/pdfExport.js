/**
 * PDF Export Utility
 * 
 * Uses jsPDF for PDF generation
 * Exports analysis content in professional format
 * 
 * Installation:
 * npm install jspdf jspdf-autotable
 */


import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
/**
 * PDF Export Utility with Korean Support
 * 
 * Uses jsPDF with Noto Sans KR for Korean text
 * Falls back to Helvetica for English
 * 
 * Installation:
 * npm install jspdf jspdf-autotable
 * 
 * Font Setup (one-time):
 * bash setup-korean-font.sh
 */


// ===================================
// Korean Font Support
// ===================================

// Font will be loaded dynamically from public/fonts/
// This keeps bundle size small
let koreanFontLoaded = false;
let koreanFontData = null;

/**
 * Load Korean font dynamically
 */
const loadKoreanFont = async () => {
  if (koreanFontLoaded && koreanFontData) {
    return koreanFontData;
  }
  
  try {
    const response = await fetch('/fonts/NotoSansKR-Regular.ttf');
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    koreanFontData = btoa(binary);
    koreanFontLoaded = true;
    
  
    return koreanFontData;
  } catch (error) {
    console.warn('⚠️ Korean font not found, using default:', error);
    return null;
  }
};


/**
 * Setup PDF document with Korean support
 */
const setupPDF = async () => {
  const doc = new jsPDF({ format: 'a4', putOnlyUsedFonts: true, compress: true });

  const fontData = await loadKoreanFont();
  
  if (fontData) {
    try {
      doc.addFileToVFS('NotoSansKR-Regular.ttf', fontData);
      doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
      doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'bold');
      
  
    } catch (error) {
      console.warn('⚠️ Failed to add Korean font:', error);
    }
  }
  
  return doc;
};


/**
 * Check if text contains Korean
 */
const hasKorean = (text) => {
  if (!text) return false;
  const koreanRegex = /[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/;
  return koreanRegex.test(text);
};

/**
 * Set font based on text content
 */
const setAppropriateFont = (doc, text, style = 'normal') => {
  if (hasKorean(text) && koreanFontLoaded) {
    doc.setFont('NotoSansKR', style);
  } else {
    doc.setFont('helvetica', style);
  }
};

/**
 * Add text with auto font selection
 */
const addText = (doc, text, x, y, options = {}) => {
  const { fontSize = 11, style = 'normal', color = '#000000' } = options;
  
  doc.setFontSize(fontSize);
  setAppropriateFont(doc, text, style);
  doc.setTextColor(color);
  doc.text(text, x, y);
};

/**
 * Split text with Korean support
 */
const splitText = (doc, text, maxWidth) => {
  if (!text) return [];
  
  setAppropriateFont(doc, text);
  
  if (hasKorean(text)) {
    // Korean text - split by spaces
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const width = doc.getTextWidth(testLine);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  // English text - use default
  return doc.splitTextToSize(text, maxWidth);
};

// ===================================
// Export Functions
// ===================================

/**
 * Export complete analysis as PDF
 */
/**
 * PDF Export Utility
 * 
 * Uses jsPDF for PDF generation
 * Exports analysis content in professional format
 * 
 * Installation:
 * npm install jspdf jspdf-autotable
 */


/**
 * Export complete analysis as PDF
 * 
 * @param {Object} analysis - Analysis data
 * @param {Object} preview - Preview payload
 * @param {Object} full - Full payload
 */
export const exportCompletePDF = async (analysis, preview, full) => {
  const doc = await setupPDF();
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper: Check if new page needed
  
  
  // Helper: Add section title
  const addSectionTitle = (title, color = '#7c3aed') => {
    checkPageBreak(15);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color);
    doc.text(title, margin, yPosition);
    yPosition += 10;
    
    // Add line under title
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };
  
  // Helper: Add text with word wrap
  const addText = (text, fontSize = 11, style = 'normal', color = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(text, contentWidth);
    
    for (const line of lines) {
      checkPageBreak();
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    }
    
    yPosition += 3;
  };

  // 유틸: 폰트 크기 기반 라인 높이 (jsPDF 단위가 mm일 때)
function getLineHeightMm(fontSize) {
  const factor = doc.getLineHeightFactor ? doc.getLineHeightFactor() : 1.15;
  // 1pt = 0.3528mm
  return fontSize * factor * 0.3528;
}

// checkPageBreak는 "필요 높이" 기준으로 페이지 넘기고 yPosition 리셋해야 안전
function checkPageBreak(requiredHeight = 0) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - margin; // 하단 마진
  if (yPosition + requiredHeight > bottomLimit) {
    doc.addPage();
    yPosition = margin; // 상단 마진으로 리셋 (원하는 topMargin 쓰면 됨)
  }
}

// 텍스트 래핑 출력 후 yPosition 반환
function writeWrapped(text, x, maxWidth, fontSize, colorRGB, style = 'normal', extraGapMm = 0) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', style);
  if (colorRGB) doc.setTextColor(...colorRGB);

  const lines = doc.splitTextToSize(text, maxWidth);
  const lh = getLineHeightMm(fontSize);

  // 이 블록이 차지할 높이를 미리 계산하고 페이지 넘김
  checkPageBreak(lines.length * lh + extraGapMm);

  for (const line of lines) {
    doc.text(line, x, yPosition);
    yPosition += lh;
  }
  yPosition += extraGapMm;
}
  
  // ===================================
  // 1. HEADER
  // ===================================

  doc.setFontSize(24);
  setAppropriateFont(doc, 'Job Application Analysis', 'bold');
  doc.setTextColor('#7c3aed');
  doc.text('Job Application Analysis', margin, yPosition);
  yPosition += 12;

  doc.setFontSize(18);
  setAppropriateFont(doc, analysis.jd_title || 'Job Position', 'bold');
  doc.setTextColor('#000000');
  doc.text(analysis.jd_title || 'Job Position', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  setAppropriateFont(doc, analysis.jd_company || 'Company Name');
  doc.setTextColor('#666666');
  doc.text(analysis.jd_company || 'Company Name', margin, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  const cvText = `CV: ${analysis.cv_set_name || 'Resume'}`;
  setAppropriateFont(doc, cvText);
  doc.text(cvText, margin, yPosition);
  yPosition += 5;
  
  const dateText = `Generated: ${new Date().toLocaleDateString()}`;
  setAppropriateFont(doc, dateText);
  doc.text(dateText, margin, yPosition);
  yPosition += 15;
  
  // ===================================
  // 2. SCORES
  // ===================================
  addSectionTitle('Match Scores');
  
  const scores = [
    ['Match Score', `${Math.round(preview.match_score || 0)}%`, getScoreColor(preview.match_score)],
    ['ATS Score', `${Math.round(preview.ats_score || 0)}%`, '#3b82f6'],
    ['Risk Score', `${Math.round(preview.risk_score || 0)}%`, '#f97316']
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Score', 'Status']],
    body: scores.map(([metric, score]) => [
      metric,
      score,
      getScoreStatus(metric, parseInt(score, 10))
    ]),
    margin: { left: margin, right: margin },
    headStyles: { 
      fillColor: [124, 58, 237],
      font: koreanFontLoaded ? 'NotoSansKR' : 'helvetica',
      fontStyle: 'bold'
    },
    bodyStyles: {
      font: koreanFontLoaded ? 'NotoSansKR' : 'helvetica'
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { fontSize: 11 }
  });
  
  yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 15
  
  // ===================================
  // 3. TOP 3 FIXES
  // ===================================
  if (preview.top_fixes && preview.top_fixes.length > 0) {
    addSectionTitle('Top 3 Recommended Fixes', '#f97316');
    
    preview.top_fixes.forEach((fix, index) => {
      checkPageBreak(20);
      
      // Fix number badge
      doc.setFillColor(249, 115, 22);
      doc.circle(margin + 5, yPosition - 2, 5, 'F');
      doc.setTextColor('#ffffff');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}`, margin + 3, yPosition + 1);
      
      // Fix title
      doc.setTextColor('#000000');
      doc.setFontSize(12);
      setAppropriateFont(doc, fix.title, 'bold');
      doc.text(fix.title, margin + 15, yPosition);
      yPosition += 7;
      
      // Fix example
      doc.setFontSize(10);
      setAppropriateFont(doc, fix.example, 'normal');
      doc.setTextColor('#666666');
      const exampleText = `Example: ${fix.example}`;
      const exampleLines = splitText(doc, exampleText, contentWidth - 15);
      exampleLines.forEach(line => {
        checkPageBreak();
        doc.text(line, margin + 15, yPosition);
        yPosition += 5;
      });
      
      yPosition += 8;
    });
  }
  
  // ===================================
  // 4. COVER LETTER
  // ===================================
  if (full?.cover_letter_full) {
    addSectionTitle('Cover Letter', '#3b82f6');
  
    // 1) 텍스트 라인 생성
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const paddingTop = 6;
    const paddingBottom = 6;
    const lineH = getLineHeightMm(10);   // 네가 만든 함수 사용 (mm 단위)
    const lines = doc.splitTextToSize(String(full.cover_letter_full), contentWidth - 10);
  
    // 2) 박스 높이 계산 (mm)
    const boxHeight = paddingTop + (lines.length * lineH) + paddingBottom;
  
    // 3) 페이지 브레이크 먼저 처리
    checkPageBreak(boxHeight + 2);
  
    // 4) 박스 그리기 (페이지 브레이크 후의 yPosition 기준)
    const boxY = yPosition;
    doc.setFillColor(249, 250, 251); // 연한 회색
    doc.rect(margin, boxY, contentWidth, boxHeight, 'F');

    doc.setFontSize(10);
    setAppropriateFont(doc, full.cover_letter_full);
    doc.setTextColor('#000000');
  
    // 5) 텍스트 출력
    yPosition = boxY + paddingTop;
    doc.setTextColor(0, 0, 0);
  
    for (const line of lines) {
      checkPageBreak(lineH);
      doc.text(line, margin + 5, yPosition);
      yPosition += lineH;
    }
  
    yPosition = boxY + boxHeight + 10;
  }
  
  // ===================================
  // 5. REWRITTEN BULLETS
  // ===================================
  if (full?.rewritten_bullets?.length) {
    checkPageBreak(30);
    addSectionTitle('Rewritten Resume Bullets', '#eab308');
  
    const labelGap = 5;
    const lineH = 5;
  
    full.rewritten_bullets.forEach((bullet) => {
      const originalText = String(bullet.original ?? '');
      const rewrittenText = String(bullet.rewritten ?? '');
  
      const origLines = doc.splitTextToSize(originalText, contentWidth - 5);
      const improvedLines = doc.splitTextToSize(rewrittenText, contentWidth - 5);
  
      const needed =
        labelGap + (origLines.length * lineH) + 3 +
        labelGap + (improvedLines.length * lineH) + 8;
  
      checkPageBreak(needed);
  
      // Original label
      doc.setFontSize(9);
      setAppropriateFont(doc, 'Original:');
      doc.setTextColor('#999999');
      doc.text('Original:', margin, yPosition);
      yPosition += labelGap;

  
      // Original lines
      doc.setFontSize(10);
      setAppropriateFont(doc, bullet.original);
      doc.setTextColor('#666666');
      origLines.forEach((line) => {
        checkPageBreak(lineH);
        doc.text(line, margin + 5, yPosition);
        yPosition += lineH;
      });
  
      yPosition += 3;
  
      // Improved label
      doc.setFontSize(9);
      setAppropriateFont(doc, '✓ Improved:');
      doc.setTextColor('#10b981');
      doc.text('✓ Improved:', margin, yPosition);
      yPosition += labelGap;
  
      // Improved lines
      doc.setFontSize(11);
      setAppropriateFont(doc, bullet.rewritten, 'bold');
      doc.setTextColor('#000000');
      improvedLines.forEach((line) => {
        checkPageBreak(lineH);
        doc.text(line, margin + 5, yPosition);
        yPosition += lineH;
      });
  
      yPosition += 8;
    });
  }
  
  
  // ===================================
  // 6. INTERVIEW Q&A
  // ===================================
  if (full && full.interview_qa && full.interview_qa.length > 0) {
    checkPageBreak(30);
    addSectionTitle('Interview Preparation', '#10b981');
    
    full.interview_qa.forEach((qa, index) => {
      checkPageBreak(30);
      
      // Question
      doc.setFontSize(11);
      setAppropriateFont(doc, qa.question, 'bold');
      doc.setTextColor('#7c3aed');
      const qLines = doc.splitTextToSize(`Q${index + 1}: ${qa.question}`, contentWidth - 5);
      qLines.forEach(line => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      yPosition += 3;
      
      // Answer
      doc.setFontSize(10);
      setAppropriateFont(doc, qa.answer);
      doc.setTextColor('#000000');
      const aLines = doc.splitTextToSize(`A: ${qa.answer}`, contentWidth - 5);
      aLines.forEach(line => {
        checkPageBreak();
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      
      yPosition += 10;
    });
  }
  
  // ===================================
  // 7. GAP ANALYSIS
  // ===================================
  if (full && (full.strong_matches || full.missing_skills || full.action_plan)) {
    checkPageBreak(30);
    addSectionTitle('Gap Analysis', '#f97316');
    
    // Strong Matches
    if (full.strong_matches && full.strong_matches.length > 0) {
      doc.setFontSize(12);
      setAppropriateFont(doc, '✓ Your Strengths', 'bold');
      doc.setTextColor('#10b981');
      doc.text('✓ Your Strengths', margin, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      doc.setTextColor('#000000');
      
      full.strong_matches.forEach(item => {
        checkPageBreak();
        setAppropriateFont(doc, item);
        doc.text('• ' + item, margin + 5, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    }
    
    // Missing Skills
    if (full.missing_skills && full.missing_skills.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      setAppropriateFont(doc, '! Areas to Address', 'bold');
      doc.setTextColor('#f97316');
      doc.text('! Areas to Address', margin, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      doc.setTextColor('#000000');
      
      full.missing_skills.forEach(item => {
        checkPageBreak();
        setAppropriateFont(doc, item);
        doc.text('• ' + item, margin + 5, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    }
    
    // Action Plan
    if (full.action_plan && full.action_plan.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      setAppropriateFont(doc, '⚡ Recommended Actions', 'bold');
      doc.setTextColor('#7c3aed');
      doc.text('⚡ Recommended Actions', margin, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      doc.setTextColor('#000000');
      
      full.action_plan.forEach((item, i) => {
        checkPageBreak();
        setAppropriateFont(doc, item);
        doc.text(`${i + 1}. ${item}`, margin + 5, yPosition);
        yPosition += 6;
      });
    }
  }
  
  // ===================================
  // FOOTER (on all pages)
  // ===================================
  const totalPages = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#999999');
    
    const footerText = `Generated by Job Agent • Page ${i} of ${totalPages}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
  }
  
  // Save PDF

  const filename = `${sanitizeFilename(analysis.jd_title || 'analysis')}_${Date.now()}.pdf`;
  doc.save(filename);
};

/**
 * Export cover letter only as PDF
 */
export const exportCoverLetterPDF = (analysis, coverLetter) => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = 20;
  
  // Header
  doc.setFontSize(20);
  setAppropriateFont(doc, 'Cover Letter', 'bold');
  doc.setTextColor('#7c3aed');
  doc.text('Cover Letter', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(18);
  setAppropriateFont(doc, analysis.jd_title || 'Job Position', 'bold');
  doc.setTextColor('#000000');
  doc.text(analysis.jd_title || 'Job Position', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  setAppropriateFont(doc, analysis.jd_company || 'Company Name');
  doc.setTextColor('#666666');
  doc.text(analysis.jd_company || 'Company Name', margin, yPosition);
  yPosition += 15;
  
  // Cover Letter Content
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPosition, contentWidth, pageHeight - yPosition - 30, 'F');
  
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  
  const lines = doc.splitTextToSize(coverLetter, contentWidth - 10);
  
  lines.forEach(line => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.text(line, margin + 5, yPosition);
    yPosition += 6;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#999999');
  const footerText = 'Generated by Job Agent';
  const textWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
  
  // Save
  const filename = `cover_letter_${sanitizeFilename(analysis.jd_title || 'job')}_${Date.now()}.pdf`;
  doc.save(filename);
};

/**
 * Export interview Q&A as PDF
 */
export const exportInterviewQAPDF = (analysis, qaList) => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = 20;
  
  const checkPageBreak = () => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#10b981');
  doc.text('Interview Preparation', margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#000000');
  doc.text(analysis.jd_title || 'Job Position', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#666666');
  doc.text(`${qaList.length} Common Interview Questions`, margin, yPosition);
  yPosition += 15;
  
  // Q&A
  qaList.forEach((qa, index) => {
    checkPageBreak();
    
    // Question
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#7c3aed');
    const qLines = doc.splitTextToSize(`Q${index + 1}: ${qa.question}`, contentWidth);
    qLines.forEach(line => {
      checkPageBreak();
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    yPosition += 3;
    
    // Answer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    const aLines = doc.splitTextToSize(qa.answer, contentWidth - 5);
    aLines.forEach(line => {
      checkPageBreak();
      doc.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  });
  
  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#999999');
    const footerText = `Generated by Job Agent • Page ${i} of ${totalPages}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
  }
  
  // Save
  const filename = `interview_qa_${sanitizeFilename(analysis.jd_title || 'job')}_${Date.now()}.pdf`;
  doc.save(filename);
};

// ===================================
// Helper Functions
// ===================================

function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#3b82f6'; // blue
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getScoreStatus(metric, score) {
  if (metric === 'Risk Score') {
    if (score <= 20) return '✓ Low Risk';
    if (score <= 40) return '⚠ Medium Risk';
    return '✗ High Risk';
  }
  
  if (score >= 80) return '✓ Excellent';
  if (score >= 60) return '✓ Good';
  if (score >= 40) return '⚠ Fair';
  return '✗ Poor';
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 50);
}

export default {
  exportCompletePDF,
  exportCoverLetterPDF,
  exportInterviewQAPDF
};

