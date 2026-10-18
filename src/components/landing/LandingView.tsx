import React, { useState } from 'react';
import {
  Upload,
  FileText,
  ShieldCheck,
  Type,
  Droplet,
  PenTool,
  Hash,
  LayoutGrid,
  Highlighter,
  Eraser,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Smartphone,
  Lock,
  Zap,
} from 'lucide-react';
import type { ToolType } from '../../types/editor';

import { PaperForgeLogo } from '../common/PaperForgeLogo';

interface LandingViewProps {
  onUploadClick: () => void;
  onLoadSample?: () => void;
  onLoadSampleDocx?: () => void;
  onSelectToolPreset?: (tool: ToolType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onUploadClick,
  onLoadSample,
  onLoadSampleDocx,
  onSelectToolPreset,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const tools = [
    {
      id: 'docx' as ToolType | 'docx',
      title: 'Word Editor (.docx)',
      badge: 'New',
      desc: 'Open, edit paragraphs, headings, tables, and styles in Word documents with 100% browser privacy.',
      icon: <FileText size={22} className="tool-card-icon" />,
      color: '#2563eb',
    },
    {
      id: 'editText' as ToolType,
      title: 'Edit PDF Text',
      badge: 'Popular',
      desc: 'Click on existing text in your PDF to edit, replace, or update words directly.',
      icon: <Type size={22} className="tool-card-icon" />,
      color: '#3b82f6',
    },
    {
      id: 'watermark' as ToolType,
      title: 'Add Watermark',
      badge: 'Utility',
      desc: 'Stamp custom draft, confidential, or branded text across all pages with custom opacity & angle.',
      icon: <Droplet size={22} className="tool-card-icon" />,
      color: '#ec4899',
    },
    {
      id: 'signature' as ToolType,
      title: 'Sign PDF',
      badge: 'Essential',
      desc: 'Draw signatures, choose elegant cursive fonts, or upload your handwritten signature.',
      icon: <PenTool size={22} className="tool-card-icon" />,
      color: '#10b981',
    },
    {
      id: 'pageNumber' as ToolType,
      title: 'Page Numbers',
      badge: 'Utility',
      desc: 'Insert automatic page numbers (Page X of Y) in headers or footers across your document.',
      icon: <Hash size={22} className="tool-card-icon" />,
      color: '#8b5cf6',
    },
    {
      id: 'organize' as ToolType,
      title: 'Organize Pages',
      badge: 'Page Grid',
      desc: 'Reorder with drag-and-drop, rotate 90°, duplicate, or delete pages in a visual grid.',
      icon: <LayoutGrid size={22} className="tool-card-icon" />,
      color: '#f59e0b',
    },
    {
      id: 'highlight' as ToolType,
      title: 'Highlight & Annotate',
      badge: 'Study & Review',
      desc: 'Add translucent color highlights, shapes, arrows, and custom text callouts.',
      icon: <Highlighter size={22} className="tool-card-icon" />,
      color: '#eab308',
    },
    {
      id: 'eraser' as ToolType,
      title: 'Redact & Whiteout',
      badge: 'Privacy',
      desc: 'Cleanly mask out confidential numbers, names, or unwanted scanned blemishes.',
      icon: <Eraser size={22} className="tool-card-icon" />,
      color: '#ef4444',
    },
    {
      id: 'export' as ToolType,
      title: 'Export & Convert',
      badge: 'High-Res',
      desc: 'Download clean vector PDFs or high-resolution PNG page images with zero quality loss.',
      icon: <Download size={22} className="tool-card-icon" />,
      color: '#06b6d4',
    },
  ];

  const faqs = [
    {
      q: 'Can I edit Microsoft Word (.docx) documents in PaperForge?',
      a: 'Yes! PaperForge provides a full Microsoft Word (.docx) editor right in the browser. You can edit text, headings, bold/italic formatting, bullet and numbered lists, and tables, and export back to standard .docx or convert to PDF with 100% client-side privacy.',
    },
    {
      q: 'How do I edit existing text in a PDF?',
      a: 'Simply upload your PDF and select the "Edit PDF Text" tool in the top toolbar. Click on any text passage in the document — PaperForge uses smart layout detection to identify the text, cover the original characters with an exact whiteout mask, and open an editable text box in its place.',
    },
    {
      q: 'Is PaperForge really 100% free with no limits?',
      a: 'Yes! Unlike traditional cloud services which restrict free users to 1 or 2 files per day or lock text editing behind expensive monthly paywalls, PaperForge is completely free. There are no hourly caps, watermarks forced on output, or daily file quotas.',
    },
    {
      q: 'Are my sensitive documents uploaded to any server?',
      a: 'No. PaperForge is built with client-side WebAssembly and modern HTML5 Canvas technology. Your files are processed 100% locally in your web browser. Neither your original PDF nor your edited version is ever sent to or stored on any server.',
    },
    {
      q: 'Can I use PaperForge on my phone or tablet?',
      a: 'Absolutely! PaperForge is fully responsive and touch-optimized for mobile phones, iPads, and Android tablets. The signature tool supports finger and stylus drawing with zero touch lag, and the toolbar adapts dynamically to smaller screen sizes.',
    },
    {
      q: 'How do I add a watermark or page numbers to every page?',
      a: 'Click "Watermark" or "Page #" in the toolbar. Choose your preferred text, opacity, position, and formatting, then click "Apply". PaperForge automatically formats and places the elements across every page in your document instantly.',
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToolClick = (toolId: any) => {
    if (toolId === 'docx') {
      if (onLoadSampleDocx) {
        onLoadSampleDocx();
        return;
      }
    }
    if (onSelectToolPreset) {
      onSelectToolPreset(toolId);
    }
    if (onLoadSample) {
      onLoadSample();
    } else {
      onUploadClick();
    }
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero">
        <div style={{ marginBottom: 16 }}>
          <PaperForgeLogo size="xl" subtitle="Document & PDF Studio" />
        </div>

        <div className="hero-pill">
          <Sparkles size={14} className="hero-pill-icon" />
          <span>100% Free • Private Client-Side • Word (.docx) &amp; PDF</span>
        </div>

        <h1 className="hero-heading">
          Free Online Document &amp; PDF Editor
          <span className="hero-subheading-gradient">Edit Word Docs (.docx), Edit PDF Text &amp; Sign</span>
        </h1>

        <p className="hero-description">
          The privacy-first document editing studio. Edit Microsoft Word (.docx) documents and PDFs,
          add digital signatures, watermarks, page numbers, and organize pages directly inside your browser — completely free with zero server uploads.
        </p>

        {/* Main Upload Dropcard */}
        <div className="hero-upload-card" onClick={onUploadClick}>
          <div className="hero-upload-icon-wrapper">
            <Upload size={36} className="hero-upload-icon" />
          </div>

          <div className="hero-upload-text-group">
            <h2 className="hero-upload-title">Drop your PDF or Word (.docx) here</h2>
            <p className="hero-upload-subtitle">Supports PDF and Word documents. Fast, secure &amp; 100% client-side.</p>
          </div>

          <div className="hero-upload-buttons" onClick={(e) => e.stopPropagation()}>
            <button className="upload-primary-btn" onClick={onUploadClick}>
              <Upload size={18} />
              <span>Choose Document</span>
            </button>

            {onLoadSample && (
              <button
                className="btn-secondary hero-sample-btn"
                onClick={onLoadSample}
                title="Load sample PDF to test PDF tools"
              >
                <FileText size={16} />
                <span>Try Sample PDF</span>
              </button>
            )}

            {onLoadSampleDocx && (
              <button
                className="btn-secondary hero-sample-btn"
                onClick={onLoadSampleDocx}
                title="Load sample Microsoft Word (.docx) document"
                style={{ borderColor: 'rgba(37, 99, 235, 0.4)', color: '#2563eb' }}
              >
                <FileText size={16} />
                <span>Try Sample Word Doc</span>
              </button>
            )}
          </div>

          <div className="hero-privacy-guarantee">
            <ShieldCheck size={16} className="privacy-icon" />
            <span>Files never leave your device. Processed locally in your browser.</span>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="hero-highlights">
          <div className="highlight-item">
            <Lock size={18} />
            <span>100% Private (Zero Uploads)</span>
          </div>
          <div className="highlight-item">
            <Zap size={18} />
            <span>No Daily Limits</span>
          </div>
          <div className="highlight-item">
            <Smartphone size={18} />
            <span>Mobile & Tablet Ready</span>
          </div>
        </div>
      </section>

      {/* Feature Tools Grid */}
      <section className="landing-tools-section">
        <div className="section-header">
          <span className="section-eyebrow">Comprehensive PDF Toolset</span>
          <h2 className="section-title">Everything You Need to Edit PDFs Online</h2>
          <p className="section-desc">
            A complete suite of powerful PDF utilities, made completely free and private with zero server uploads or subscriptions.
          </p>
        </div>

        <div className="tools-grid">
          {tools.map((t) => (
            <div
              key={t.id}
              className="tool-card"
              onClick={() => handleToolClick(t.id)}
              role="button"
              tabIndex={0}
              title={`Click to try ${t.title}`}
            >
              <div className="tool-card-top">
                <div className="tool-card-icon-box" style={{ color: t.color, backgroundColor: `${t.color}15` }}>
                  {t.icon}
                </div>
                <span className="tool-card-badge">{t.badge}</span>
              </div>
              <h3 className="tool-card-title">{t.title}</h3>
              <p className="tool-card-desc">{t.desc}</p>
              <span className="tool-card-action">Try Tool &rarr;</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: PaperForge vs Traditional PDF Editors */}
      <section className="landing-compare-section">
        <div className="section-header">
          <span className="section-eyebrow">Why Choose PaperForge</span>
          <h2 className="section-title">PaperForge vs Cloud PDF Editors</h2>
          <p className="section-desc">
            See how PaperForge compares to traditional cloud-based PDF tools.
          </p>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight-col">PaperForge</th>
                <th>Free Cloud Editors</th>
                <th>Subscription Editors</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Document Privacy</strong></td>
                <td className="highlight-col"><CheckCircle2 size={16} color="#10b981" /> 100% In-Browser (Zero Uploads)</td>
                <td><XCircle size={16} color="#ef4444" /> Uploaded to Cloud Server</td>
                <td><XCircle size={16} color="#ef4444" /> Uploaded to Cloud Server</td>
              </tr>
              <tr>
                <td><strong>Edit Existing PDF Text</strong></td>
                <td className="highlight-col"><CheckCircle2 size={16} color="#10b981" /> Included Free</td>
                <td><XCircle size={16} color="#ef4444" /> Requires Paid Plan</td>
                <td><XCircle size={16} color="#ef4444" /> Requires Paid Plan ($12-20/mo)</td>
              </tr>
              <tr>
                <td><strong>Daily Usage Limits</strong></td>
                <td className="highlight-col"><CheckCircle2 size={16} color="#10b981" /> Unlimited Free Edits</td>
                <td><XCircle size={16} color="#ef4444" /> Strict Daily Caps (1-2 files)</td>
                <td><XCircle size={16} color="#ef4444" /> Usage Quotas or Tiers</td>
              </tr>
              <tr>
                <td><strong>Watermark & Page Numbers</strong></td>
                <td className="highlight-col"><CheckCircle2 size={16} color="#10b981" /> Included Free</td>
                <td><CheckCircle2 size={16} color="#10b981" /> Limited Options</td>
                <td><CheckCircle2 size={16} color="#10b981" /> Limited Options</td>
              </tr>
              <tr>
                <td><strong>Digital Signatures</strong></td>
                <td className="highlight-col"><CheckCircle2 size={16} color="#10b981" /> Draw, Type & Upload</td>
                <td><CheckCircle2 size={16} color="#10b981" /> Basic Only</td>
                <td><CheckCircle2 size={16} color="#10b981" /> Yes</td>
              </tr>
              <tr>
                <td><strong>Mobile & Tablet Optimized</strong></td>
                <td className="highlight-col"><CheckCircle2 size={16} color="#10b981" /> Fully Responsive Touch</td>
                <td><CheckCircle2 size={16} color="#10b981" /> Separate App Required</td>
                <td><CheckCircle2 size={16} color="#10b981" /> Separate App Required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="landing-steps-section">
        <div className="section-header">
          <span className="section-eyebrow">Quick & Easy</span>
          <h2 className="section-title">How to Edit a PDF in 3 Simple Steps</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Upload Your PDF</h3>
            <p className="step-desc">
              Drop any PDF document or click to select from your device. It loads instantly into the local editor.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Edit, Sign, or Watermark</h3>
            <p className="step-desc">
              Edit existing text, place digital signatures, add watermarks, insert page numbers, or draw annotations.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Export Instantly</h3>
            <p className="step-desc">
              Click the Export button to immediately download your high-quality PDF. No waiting, no watermarks, 100% free.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="landing-faq-section">
        <div className="section-header">
          <span className="section-eyebrow">Frequently Asked Questions</span>
          <h2 className="section-title">Everything You Need to Know</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className={`faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {isOpen && <p className="faq-answer">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-icon">P</div>
            <span className="footer-brand-title">PaperForge</span>
            <p className="footer-tagline">The private, open-source online PDF editor for web, tablet, and mobile.</p>
          </div>

          <div className="footer-badges">
            <span className="footer-badge">🔒 100% Client-Side</span>
            <span className="footer-badge">⚡ Instant WebAssembly</span>
            <span className="footer-badge">📱 Responsive</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PaperForge. All rights reserved. Free & privacy-first PDF utility.</p>
        </div>
      </footer>
    </div>
  );
};
