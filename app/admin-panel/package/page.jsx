'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Copy, CheckCircle2, RefreshCw, Share2, Layers, DollarSign, Calendar, Edit3, Trash2, Plus, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../admin.module.css';

export default function PackageMaker() {
  const [isClient, setIsClient] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const pdfRef = useRef(null);
  
  const [brandName, setBrandName] = useState('');
  const [packageType, setPackageType] = useState('monthly');
  const [totalBudget, setTotalBudget] = useState('0');
  const [pmpStrategy, setPmpStrategy] = useState('');
  const [services, setServices] = useState([
    { name: 'Custom Strategy', qty: 1, rate: 0 }
  ]);
  
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Check if there is pending package data from Orlo
    const pendingDataStr = sessionStorage.getItem('pendingPackageData');
    if (pendingDataStr) {
      try {
        const data = JSON.parse(pendingDataStr);
        if (data.brandName) setBrandName(data.brandName);
        if (data.packageType) setPackageType(data.packageType.toLowerCase());
        if (data.totalBudget) setTotalBudget(data.totalBudget.toString());
        if (data.pmpStrategy) setPmpStrategy(data.pmpStrategy);
        if (data.services && data.services.length > 0) {
          setServices(data.services);
        }
        // Clear it so it doesn't auto-fill again on refresh
        sessionStorage.removeItem('pendingPackageData');
      } catch (err) {
        console.error('Failed to parse package data', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleCopilotAction = (e) => {
      const data = e.detail;
      if (data && (data.intent === 'package' || data.intent === 'quote') && data.payload) {
        const payload = data.payload;
        if (payload.brandName) setBrandName(payload.brandName);
        if (payload.packageType) setPackageType(payload.packageType.toLowerCase());
        if (payload.totalBudget) setTotalBudget(payload.totalBudget.toString());
        if (payload.pmpStrategy) setPmpStrategy(payload.pmpStrategy);
        if (payload.services && payload.services.length > 0) {
          setServices(payload.services);
        }
      }
    };
    window.addEventListener('copilot-action', handleCopilotAction);
    return () => window.removeEventListener('copilot-action', handleCopilotAction);
  }, []);

  const handleServiceChange = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { name: '', qty: 1, rate: 0 }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    const pdf = new jsPDF('l', 'px', [1920, 1080]);
    const elements = document.querySelectorAll('.standalone-pdf-slide');
    
    for (let i = 0; i < elements.length; i++) {
        const slide = elements[i];
        slide.style.display = 'flex';
        try {
            const canvas = await html2canvas(slide, { scale: 2, backgroundColor: '#050505' });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            if (i > 0) pdf.addPage([1920, 1080], 'l');
            pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
        } catch (err) {
            console.error(`Error rendering slide ${i}`, err);
        }
        slide.style.display = 'none';
    }
    
    const brandNameStr = brandName ? `_${brandName.replace(/\s+/g, '_')}` : '';
    pdf.save(`Dripp_Media_PMP${brandNameStr}.pdf`);
  };

  const generateShareLink = async () => {
    setIsGeneratingLink(true);
    const pass = Math.floor(1000 + Math.random() * 9000).toString();
    
    try {
        // We post to /api/quote but pass type as standalone_pmp
        const payload = {
            type: 'standalone_pmp',
            clientDetails: { brandName },
            packageType,
            total: parseFloat(totalBudget || 0),
            pmpStrategy,
            items: services.map(s => ({ desc: s.name, qty: s.qty, rate: s.rate })),
            password: pass
        };
        
        const response = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const data = await response.json();
            const link = `${window.location.origin}/quote/${data.id}`;
            setGeneratedLink(link);
            const msg = `Hey!\n\nHere is your custom Personal Marketing Plan from Dripp Media.\n\n🔗 Link: ${link}\n🔑 PIN: ${pass}`;
            navigator.clipboard.writeText(msg);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
        } else {
            alert("Failed to save package securely.");
        }
    } catch(err) {
        console.error(err);
        alert("API error while generating secure link.");
    } finally {
        setIsGeneratingLink(false);
    }
  };

  if (!isClient) return <div style={{ padding: '50px', color: 'white' }}>Loading PMP Maker...</div>;

  return (
    <div style={{ color: 'white', maxWidth: '1400px', margin: '0 auto' }}>

      <div className={styles.header}>
        <h1 className={styles.title}>PERSONAL <span style={{ color: '#ebd73f' }}>MARKETING</span> PLAN</h1>
        <p className={styles.subtitle}>Design a personalized PMP for your clients</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
        {/* Editor Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} /> Client Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className={styles.label}>Brand / Client Name</label>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={brandName} 
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Habivana Stays"
                />
              </div>
              <div>
                <label className={styles.label}>Package Modality</label>
                <select 
                  className={styles.inputField} 
                  value={packageType} 
                  onChange={(e) => setPackageType(e.target.value)}
                >
                  <option value="monthly">Monthly Retainer</option>
                  <option value="project">One-time Project</option>
                  <option value="hourly">Hourly Billing</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} /> Strategy / Concept Pitch
            </h3>
            <textarea 
              className={styles.inputField} 
              style={{ minHeight: '120px', resize: 'vertical' }}
              placeholder="e.g. A storytelling UGC campaign targeting high-income demographics..."
              value={pmpStrategy}
              onChange={(e) => setPmpStrategy(e.target.value)}
            />
          </div>

          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} /> Scope of Services
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {services.map((service, index) => (
                <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 2 }}>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      placeholder="Service Name (e.g. 5 Reels/month)" 
                      value={service.name} 
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{color: '#888'}}>Qty</span>
                    <input 
                      type="number" 
                      className={styles.inputField} 
                      placeholder="1" 
                      value={service.qty} 
                      onChange={(e) => handleServiceChange(index, 'qty', e.target.value)}
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{color: '#888'}}>₹</span>
                    <input 
                      type="number" 
                      className={styles.inputField} 
                      style={{ padding: '8px 12px' }}
                      placeholder="Rate" 
                      value={service.rate} 
                      onChange={(e) => handleServiceChange(index, 'rate', e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => removeService(index)}
                    style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px', opacity: 0.7, transition: 'opacity 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.opacity=1} 
                    onMouseOut={(e) => e.currentTarget.style.opacity=0.7}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              className={styles.btn} 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={addService}
            >
              <Plus size={16} /> Add Another Service
            </button>
          </div>

        </div>

        {/* Right Column: Actions & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
          
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Export & Share</h3>
            <button onClick={generatePDF} className={styles.btnPrimary} style={{ width: '100%', padding: '12px', justifyContent: 'center', marginBottom: '15px' }}>
              <Download size={18} /> Download as PDF
            </button>
            <button onClick={generateShareLink} disabled={isGeneratingLink} className={styles.btn} style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
              {copiedLink ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
              {copiedLink ? 'LINK & PIN COPIED' : (isGeneratingLink ? 'GENERATING...' : 'SHARE PACKAGE')}
            </button>
            
            {generatedLink && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '0.75rem' }}>
                 <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#888' }}>Secure Link Generated:</p>
                 <input type="text" readOnly value={generatedLink} className={styles.inputField} style={{ padding: '8px', width: '100%', cursor: 'pointer' }} onClick={(e) => e.target.select()} title="Click to select link" />
              </div>
            )}
          </div>

          <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)', borderColor: 'rgba(235, 215, 63, 0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#ebd73f' }}>Package Summary</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <p className={styles.label} style={{ marginBottom: '8px' }}>Target Client</p>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{brandName || 'Unnamed Client'}</div>
            </div>

            <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className={styles.label} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} /> Total Budget Quoted
              </p>
              <input 
                type="text" 
                className={styles.inputField} 
                style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: 0, padding: '8px 0', color: '#ebd73f' }}
                value={totalBudget} 
                onChange={(e) => setTotalBudget(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p className={styles.label} style={{ marginBottom: '16px' }}>Included Services</p>
              {services.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                  <span style={{ color: '#ddd' }}>{s.qty}x {s.name || 'Unnamed Service'}</span>
                  <span style={{ color: '#888' }}>{s.rate > 0 ? `₹${s.rate}` : ''}</span>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center', margin: 0 }}>
                This is a {packageType === 'monthly' ? 'recurring monthly' : packageType === 'hourly' ? 'hourly billed' : 'one-time'} package.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN PDF TEMPLATES */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        
        {/* SLIDE 1: Cover */}
        <div className="standalone-pdf-slide" style={{ width: '1920px', height: '1080px', background: '#050505', color: 'white', padding: '100px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', display: 'none', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(235,215,63,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
           
           <div style={{ zIndex: 1 }}>
              <h1 style={{ fontSize: '120px', color: '#ebd73f', margin: 0, letterSpacing: '-4px', fontWeight: '900', fontFamily: "'Panchang', sans-serif" }}>DRIPP MEDIA</h1>
              <p style={{ fontSize: '32px', color: '#888', margin: '10px 0 0 0', fontWeight: '300' }}>Personal Marketing Plan</p>
           </div>
           
           <div style={{ zIndex: 1, flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '24px', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>PREPARED FOR</p>
              <h2 style={{ fontSize: '100px', color: '#fff', margin: '0 0 10px 0', lineHeight: 1.1, fontFamily: "'Panchang', sans-serif" }}>{brandName || 'Client Name'}</h2>
           </div>
        </div>

        {/* SLIDE 2: Strategy */}
        {pmpStrategy && (
          <div className="standalone-pdf-slide" style={{ width: '1920px', height: '1080px', background: '#050505', color: 'white', padding: '100px', boxSizing: 'border-box', position: 'relative', display: 'none', flexDirection: 'column' }}>
             <h2 style={{ fontSize: '50px', color: '#ebd73f', margin: '0 0 60px 0', fontFamily: "'Panchang', sans-serif" }}>Marketing Strategy</h2>
             <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderLeft: '8px solid #ebd73f', padding: '60px', borderRadius: '16px', flex: 1 }}>
                 <p style={{ fontSize: '36px', color: '#fff', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>
                     {pmpStrategy}
                 </p>
             </div>
          </div>
        )}

        {/* SLIDE 3: Scope & Pricing */}
        <div className="standalone-pdf-slide" style={{ width: '1920px', height: '1080px', background: '#050505', color: 'white', padding: '100px', boxSizing: 'border-box', position: 'relative', display: 'none', flexDirection: 'column' }}>
           <h2 style={{ fontSize: '50px', color: '#ebd73f', margin: '0 0 60px 0', fontFamily: "'Panchang', sans-serif" }}>Scope of Work & Budget</h2>
           
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {services.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '40px' }}>
                      <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '40px', color: '#fff', margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif" }}>{item.name || 'Service Item'}</h3>
                          <p style={{ fontSize: '28px', color: '#888', margin: 0 }}>Qty: {item.qty} {item.rate > 0 ? `| Rate: ₹${item.rate}` : ''}</p>
                      </div>
                  </div>
              ))}
           </div>
           
           <div style={{ marginTop: '60px', background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '24px', padding: '50px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '20px' }}>
               <p style={{ fontSize: '40px', color: '#888', textTransform: 'uppercase', letterSpacing: '4px', margin: 0 }}>Total Budget Quoted:</p>
               <span style={{ fontSize: '60px', color: '#ebd73f', fontWeight: '500' }}>₹</span>
               <span style={{ fontSize: '120px', color: '#ebd73f', fontWeight: '900', letterSpacing: '-3px', lineHeight: 1, fontFamily: "'Panchang', sans-serif" }}>{parseFloat(totalBudget || 0).toLocaleString()}</span>
           </div>
        </div>

      </div>

    </div>
  );
}
