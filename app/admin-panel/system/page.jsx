'use client';

import { useState } from 'react';
import { Settings, FileText, MessageSquare, Send, CheckCircle2, Copy } from 'lucide-react';
import styles from '../admin.module.css';

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState('onboarding');

  const tabs = [
    { id: 'onboarding', label: 'Onboarding Doc Maker', icon: FileText },
    { id: 'feedback', label: 'Feedback Form Maker', icon: MessageSquare },
    { id: 'delivery', label: 'Delivery Doc Maker', icon: Send },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1200px', margin: '0 auto' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>SYSTEM <span style={{ color: '#ebd73f' }}>WORKSPACE</span></h1>
        <p className={styles.subtitle}>Generate critical operational documents and messages</p>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
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
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function OnboardingDocMaker() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [assetsRequired, setAssetsRequired] = useState('1. Brand Logo (PNG/SVG)\n2. Brand Guidelines\n3. High-res product images');
  const [timeline, setTimeline] = useState('Kickoff: Today\nFirst Draft: 7 Days');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const msg = `Hey ${clientName}! 👋\n\nWelcome to Dripp Media. We're super excited to start working on ${projectName} for you.\n\nTo hit the ground running, we'll need a few assets from your end:\n${assetsRequired}\n\nOur current timeline looks like this:\n${timeline}\n\nLet me know if you have any questions!`;
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
  const [reviewStage, setReviewStage] = useState('Draft 1');
  const [link, setLink] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const msg = `Hey ${clientName}! 👋\n\nYour ${reviewStage} for ${projectName} is ready for review!\n\nYou can view it here: ${link || '[Insert Link Here]'}\n\nPlease let us know if you have any feedback or approval to proceed. We look forward to hearing your thoughts!`;
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
  const [driveLink, setDriveLink] = useState('');
  const [password, setPassword] = useState('');
  const [nextSteps, setNextSteps] = useState('Feel free to deploy these assets right away. If you need monthly retainers, let us know!');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pwdText = password ? `\nPassword/PIN: ${password}` : '';
    const msg = `Hey ${clientName}! 🎉\n\nGreat news—your final assets for ${projectName} are ready for download!\n\nYou can grab everything from this folder:\n🔗 Link: ${driveLink || '[Insert Link Here]'}${pwdText}\n\n${nextSteps}\n\nIt was a pleasure working on this. Let us know when you're ready for the next one!`;
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
