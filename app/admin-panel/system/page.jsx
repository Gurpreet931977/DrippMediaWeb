'use client';

import { useState, useEffect } from 'react';
import { Settings, FileText, MessageSquare, Send, CheckCircle2, Copy, FileSignature } from 'lucide-react';
import styles from '../admin.module.css';

const SERVICE_TYPES = [
  'General / Custom',
  'Logo Designing',
  'Video Editing',
  'Hotel SMM',
  'F&B SMM',
  'Cafe SMM',
  'Educational Brand SMM'
];

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState('onboarding');

  const tabs = [
    { id: 'onboarding', label: 'Onboarding Doc Maker', icon: FileText },
    { id: 'feedback', label: 'Feedback Form Maker', icon: MessageSquare },
    { id: 'delivery', label: 'Delivery Doc Maker', icon: Send },
    { id: 'agreement', label: 'Agreement Maker', icon: FileSignature },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1200px', margin: '0 auto' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>SYSTEM <span style={{ color: '#ebd73f' }}>WORKSPACE</span></h1>
        <p className={styles.subtitle}>Generate critical operational documents and messages</p>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', overflowX: 'auto' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={styles.btn}
              style={{
                background: isActive ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                borderColor: isActive ? 'rgba(235, 215, 63, 0.3)' : 'transparent',
                color: isActive ? '#ebd73f' : '#888',
                borderRadius: '8px',
                padding: '10px 20px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'onboarding' && <OnboardingDocMaker />}
        {activeTab === 'feedback' && <FeedbackFormMaker />}
        {activeTab === 'delivery' && <DeliveryDocMaker />}
        {activeTab === 'agreement' && <AgreementMaker />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function OnboardingDocMaker() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState('General / Custom');
  const [assetsRequired, setAssetsRequired] = useState('');
  const [timeline, setTimeline] = useState('Kickoff: Today\nFirst Draft: 7 Days');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handleServiceChange(serviceType);
  }, []);

  const handleServiceChange = (val) => {
    setServiceType(val);
    let assets = '1. Brand Logo (PNG/SVG)\n2. Brand Guidelines\n3. High-res product images';
    if (val === 'Logo Designing') assets = '1. Brand Questionnaire Responses\n2. Moodboard / Inspiration references\n3. Competitor list';
    if (val === 'Video Editing') assets = '1. Raw Footage (Google Drive Link)\n2. Script / Storyboard\n3. Reference editing styles / Music choices';
    if (val === 'Hotel SMM') assets = '1. High-res property photos\n2. Current F&B menus\n3. Amenities list & USP document';
    if (val === 'F&B SMM') assets = '1. Updated Food & Beverage Menu\n2. Food photography/videos\n3. Current promos/offers';
    if (val === 'Cafe SMM') assets = '1. Coffee/Menu photos\n2. Interior/Vibe photos\n3. List of upcoming specials';
    if (val === 'Educational Brand SMM') assets = '1. Course Syllabi/Outlines\n2. Faculty headshots\n3. Student testimonials/success stories';
    setAssetsRequired(assets);
  };

  const handleGenerate = () => {
    const msg = `Hey ${clientName}! 👋\n\nWelcome to Dripp Media. We're super excited to start working on your ${serviceType} project (${projectName}).\n\nTo hit the ground running, we'll need a few assets from your end:\n${assetsRequired}\n\nOur current timeline looks like this:\n${timeline}\n\nLet me know if you have any questions!`;
    setGeneratedMsg(msg);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
      <div className={styles.card}>
        <h3 style={{ marginBottom: '20px', color: '#ebd73f', fontSize: '1.2rem' }}>Onboarding Details</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label className={styles.label}>Service Type</label>
          <select className={styles.inputField} value={serviceType} onChange={e => handleServiceChange(e.target.value)}>
             {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label className={styles.label}>Client Name</label>
            <input type="text" className={styles.inputField} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. John" />
          </div>
          <div>
            <label className={styles.label}>Project Name</label>
            <input type="text" className={styles.inputField} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Q3 Ad Campaign" />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className={styles.label}>Assets Required</label>
          <textarea className={styles.inputField} style={{ minHeight: '100px', resize: 'vertical' }} value={assetsRequired} onChange={e => setAssetsRequired(e.target.value)} />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label className={styles.label}>Timeline Estimates</label>
          <textarea className={styles.inputField} style={{ minHeight: '80px', resize: 'vertical' }} value={timeline} onChange={e => setTimeline(e.target.value)} />
        </div>

        <button onClick={handleGenerate} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
          Generate Onboarding Message
        </button>
      </div>

      <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)' }}>
         <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#ebd73f' }}>Generated Output</h3>
         {generatedMsg ? (
           <>
             <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', whiteSpace: 'pre-wrap', color: '#ddd', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
               {generatedMsg}
             </div>
             <button onClick={copyToClipboard} className={styles.btn} style={{ width: '100%', justifyContent: 'center' }}>
                {copied ? <CheckCircle2 size={18} color="#ebd73f" /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard' : 'Copy Message'}
             </button>
           </>
         ) : (
           <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
             Fill out the details on the left to generate the client message.
           </div>
         )}
      </div>
    </div>
  );
}

function FeedbackFormMaker() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState('General / Custom');
  const [reviewStage, setReviewStage] = useState('Draft 1');
  const [link, setLink] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    let focusArea = "overall direction and layout";
    if (serviceType === 'Logo Designing') focusArea = "typography, icon aesthetics, and brand alignment";
    if (serviceType === 'Video Editing') focusArea = "pacing, music selection, and color grading";
    if (serviceType === 'Hotel SMM' || serviceType === 'F&B SMM' || serviceType === 'Cafe SMM') focusArea = "captions, visual aesthetic, and promotional accuracy";
    if (serviceType === 'Educational Brand SMM') focusArea = "informational clarity and tone of voice";

    const msg = `Hey ${clientName}! 👋\n\nYour ${reviewStage} for the ${projectName} (${serviceType}) is ready for review!\n\nYou can view it here: ${link || '[Insert Link Here]'}\n\nPlease specifically let us know your thoughts on the ${focusArea}. We look forward to your feedback so we can proceed!`;
    setGeneratedMsg(msg);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
      <div className={styles.card}>
        <h3 style={{ marginBottom: '20px', color: '#ebd73f', fontSize: '1.2rem' }}>Feedback Request Details</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label className={styles.label}>Service Type</label>
          <select className={styles.inputField} value={serviceType} onChange={e => setServiceType(e.target.value)}>
             {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label className={styles.label}>Client Name</label>
            <input type="text" className={styles.inputField} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Sarah" />
          </div>
          <div>
            <label className={styles.label}>Project Name</label>
            <input type="text" className={styles.inputField} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Website Mockup" />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className={styles.label}>Review Stage</label>
          <select className={styles.inputField} value={reviewStage} onChange={e => setReviewStage(e.target.value)}>
             <option value="Draft 1">Draft 1</option>
             <option value="Draft 2">Draft 2</option>
             <option value="Final Review">Final Review</option>
             <option value="Concept Pitch">Concept Pitch</option>
          </select>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label className={styles.label}>Review Link (Frame.io / Figma / etc)</label>
          <input type="text" className={styles.inputField} value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
        </div>

        <button onClick={handleGenerate} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
          Generate Feedback Request
        </button>
      </div>

      <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)' }}>
         <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#ebd73f' }}>Generated Output</h3>
         {generatedMsg ? (
           <>
             <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', whiteSpace: 'pre-wrap', color: '#ddd', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
               {generatedMsg}
             </div>
             <button onClick={copyToClipboard} className={styles.btn} style={{ width: '100%', justifyContent: 'center' }}>
                {copied ? <CheckCircle2 size={18} color="#ebd73f" /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard' : 'Copy Message'}
             </button>
           </>
         ) : (
           <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
             Fill out the details on the left to generate the client message.
           </div>
         )}
      </div>
    </div>
  );
}

function DeliveryDocMaker() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState('General / Custom');
  const [driveLink, setDriveLink] = useState('');
  const [password, setPassword] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handleServiceChange(serviceType);
  }, []);

  const handleServiceChange = (val) => {
    setServiceType(val);
    let steps = "Feel free to deploy these assets right away. If you need monthly retainers, let us know!";
    if (val === 'Logo Designing') steps = "Included are the SVG, PNG, and PDF files of your logo. Be sure to use the SVG for large scale printing!";
    if (val === 'Video Editing') steps = "You can download the MP4 files directly from the link. We recommend downloading rather than playing in the browser for best quality.";
    if (val === 'Hotel SMM' || val === 'F&B SMM' || val === 'Cafe SMM') steps = "These assets are optimized for IG Reels and TikTok. The captions doc is also attached in the folder.";
    setNextSteps(steps);
  };

  const handleGenerate = () => {
    const pwdText = password ? `\nPassword/PIN: ${password}` : '';
    const msg = `Hey ${clientName}! 🎉\n\nGreat news—your final assets for the ${projectName} (${serviceType}) are ready for download!\n\nYou can grab everything from this folder:\n🔗 Link: ${driveLink || '[Insert Link Here]'}${pwdText}\n\n${nextSteps}\n\nIt was a pleasure working on this. Let us know when you're ready for the next one!`;
    setGeneratedMsg(msg);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
      <div className={styles.card}>
        <h3 style={{ marginBottom: '20px', color: '#ebd73f', fontSize: '1.2rem' }}>Delivery Details</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label className={styles.label}>Service Type</label>
          <select className={styles.inputField} value={serviceType} onChange={e => handleServiceChange(e.target.value)}>
             {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label className={styles.label}>Client Name</label>
            <input type="text" className={styles.inputField} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Mike" />
          </div>
          <div>
            <label className={styles.label}>Project Name</label>
            <input type="text" className={styles.inputField} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Final Video Edits" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label className={styles.label}>Drive/Download Link</label>
            <input type="text" className={styles.inputField} value={driveLink} onChange={e => setDriveLink(e.target.value)} placeholder="https://drive..." />
          </div>
          <div>
            <label className={styles.label}>Password (Opt)</label>
            <input type="text" className={styles.inputField} value={password} onChange={e => setPassword(e.target.value)} placeholder="e.g. DRIPP24" />
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label className={styles.label}>Next Steps / Sign-off Note</label>
          <textarea className={styles.inputField} style={{ minHeight: '80px', resize: 'vertical' }} value={nextSteps} onChange={e => setNextSteps(e.target.value)} />
        </div>

        <button onClick={handleGenerate} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
          Generate Delivery Message
        </button>
      </div>

      <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)' }}>
         <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#ebd73f' }}>Generated Output</h3>
         {generatedMsg ? (
           <>
             <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', whiteSpace: 'pre-wrap', color: '#ddd', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
               {generatedMsg}
             </div>
             <button onClick={copyToClipboard} className={styles.btn} style={{ width: '100%', justifyContent: 'center' }}>
                {copied ? <CheckCircle2 size={18} color="#ebd73f" /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard' : 'Copy Message'}
             </button>
           </>
         ) : (
           <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
             Fill out the details on the left to generate the client message.
           </div>
         )}
      </div>
    </div>
  );
}

function AgreementMaker() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState('General / Custom');
  const [fee, setFee] = useState('');
  const [contractLink, setContractLink] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    let serviceSpecificTerms = "As discussed, standard payment and intellectual property terms apply.";
    if (serviceType === 'Logo Designing') serviceSpecificTerms = "Included in this agreement are up to 3 rounds of revisions and final delivery of vector source files.";
    if (serviceType === 'Video Editing') serviceSpecificTerms = "Included in this agreement are 2 rounds of revisions. Raw project files are not included unless specified.";
    if (serviceType === 'Hotel SMM' || serviceType === 'F&B SMM' || serviceType === 'Cafe SMM') serviceSpecificTerms = "This is a recurring monthly retainer. It requires a minimum 3-month commitment for optimal results.";
    if (serviceType === 'Educational Brand SMM') serviceSpecificTerms = "This includes cross-platform syndication and strict adherence to the brand's educational guidelines.";

    const msg = `Hey ${clientName},\n\nWe are thrilled to officially partner with you for the ${projectName} (${serviceType})!\n\nI've drafted the formal agreement for your review and signature. \nTotal Investment: ${fee || 'TBD'}\n\n${serviceSpecificTerms}\n\nPlease review and e-sign the agreement here:\n🔗 ${contractLink || '[Insert Contract Link Here]'}\n\nOnce signed, we will move forward with onboarding!`;
    setGeneratedMsg(msg);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
      <div className={styles.card}>
        <h3 style={{ marginBottom: '20px', color: '#ebd73f', fontSize: '1.2rem' }}>Agreement Details</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label className={styles.label}>Service Type</label>
          <select className={styles.inputField} value={serviceType} onChange={e => setServiceType(e.target.value)}>
             {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label className={styles.label}>Client Name</label>
            <input type="text" className={styles.inputField} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Amanda" />
          </div>
          <div>
            <label className={styles.label}>Project Name</label>
            <input type="text" className={styles.inputField} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Rebranding 2026" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label className={styles.label}>Total Fee / Retainer</label>
            <input type="text" className={styles.inputField} value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. $5,000" />
          </div>
          <div>
            <label className={styles.label}>Contract Link (DocuSign/etc)</label>
            <input type="text" className={styles.inputField} value={contractLink} onChange={e => setContractLink(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <button onClick={handleGenerate} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
          Generate Agreement Message
        </button>
      </div>

      <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)' }}>
         <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#ebd73f' }}>Generated Output</h3>
         {generatedMsg ? (
           <>
             <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', whiteSpace: 'pre-wrap', color: '#ddd', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
               {generatedMsg}
             </div>
             <button onClick={copyToClipboard} className={styles.btn} style={{ width: '100%', justifyContent: 'center' }}>
                {copied ? <CheckCircle2 size={18} color="#ebd73f" /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard' : 'Copy Message'}
             </button>
           </>
         ) : (
           <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
             Fill out the details on the left to generate the client message.
           </div>
         )}
      </div>
    </div>
  );
}
