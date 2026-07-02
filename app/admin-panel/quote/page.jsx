'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Package, Search, Share2, Calendar, FileText, Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../admin.module.css';

const DEFAULT_SERVICES = [
  'Custom Landing Page Design',
  'Basic SEO Setup',
  'Monthly Social Media Strategy',
  'Short-form Video Edits (Reels/TikTok)',
  'Graphic Design Retainer',
  'E-commerce Development',
  'Meta Ads Management',
  'Google Business Profile Setup'
];

const CURRENCIES = [
  { label: 'USD ($)', symbol: '$' },
  { label: 'EUR (€)', symbol: '€' },
  { label: 'GBP (£)', symbol: '£' },
  { label: 'INR (₹)', symbol: '₹' },
];

export default function QuoteMaker() {
  const [isClient, setIsClient] = useState(false);
  const pdfRef = useRef(null);
  
  // Package Modality
  const [packageType, setPackageType] = useState('project'); // 'project' or 'monthly'
  
  // Client Details
  const [clientDetails, setClientDetails] = useState({
    name: '',
    brandName: '',
    email: '',
    mobile: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Quote Details
  const [quoteDetails, setQuoteDetails] = useState({
    number: 'QT-' + Math.floor(1000 + Math.random() * 9000),
    currency: '$',
    projectDuration: '',
    expectedDelivery: '',
    message: "At Dripp Media, we believe in delivering nothing short of excellence. Our focus is entirely on producing high-end, uncompromising quality. While our rates reflect this premium standard, our results ensure you never have to second-guess the investment."
  });

  // Services
  const [items, setItems] = useState([
    { desc: 'Project Discovery & Strategy', qty: 1, rate: 0 }
  ]);

  // Templates
  const [savedPackages, setSavedPackages] = useState([]);
  const [searchTemplate, setSearchTemplate] = useState('');
  
  // Sharing
  const [shareLink, setShareLink] = useState('');
  const [sharePassword, setSharePassword] = useState('');

  useEffect(() => {
    setIsClient(true);
    const localPackages = localStorage.getItem('dripp_advanced_packages');
    if (localPackages) {
      try {
        setSavedPackages(JSON.parse(localPackages));
      } catch (e) { console.error('Failed to parse packages'); }
    }
  }, []);

  const handleClientChange = (field, value) => setClientDetails(prev => ({ ...prev, [field]: value }));
  const handleQuoteChange = (field, value) => setQuoteDetails(prev => ({ ...prev, [field]: value }));
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { desc: '', qty: 1, rate: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const saveCurrentAsPackage = () => {
    const name = prompt("Enter a name for this package template:");
    if (name && name.trim()) {
      const newPackage = { 
        id: Date.now(),
        name: name.trim(), 
        type: packageType,
        items: [...items],
        message: quoteDetails.message
      };
      const updatedPackages = [...savedPackages, newPackage];
      setSavedPackages(updatedPackages);
      localStorage.setItem('dripp_advanced_packages', JSON.stringify(updatedPackages));
      alert(`Template "${name}" saved!`);
    }
  };

  const loadPackage = (pkg) => {
    if(confirm(`Load template "${pkg.name}"? This will replace your current items.`)) {
       setItems([...pkg.items]);
       setPackageType(pkg.type || 'project');
    }
  };

  const total = items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);

  const generatePDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dripp_Media_Quote_${quoteDetails.number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Check console.');
    }
  };

  const generateSecureLink = async () => {
    const pass = Math.random().toString(36).slice(-6).toUpperCase();
    setSharePassword(pass);
    
    // In a real app, this posts to an API route that stores it in Supabase
    // For now, we simulate the link creation.
    try {
        const payload = {
            clientDetails,
            quoteDetails,
            items,
            packageType,
            total,
            password: pass
        };
        
        const response = await fetch('/api/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const data = await response.json();
            setShareLink(`${window.location.origin}/quote/${data.id}`);
        } else {
            alert("Failed to save quote securely.");
        }
    } catch(err) {
        console.error(err);
        alert("API error while generating secure link.");
    }
  };

  if (!isClient) return <div style={{padding: '50px', color: 'white'}}>Loading Package Maker...</div>;

  const filteredTemplates = savedPackages.filter(p => p.name.toLowerCase().includes(searchTemplate.toLowerCase()));

  return (
    <div style={{ color: 'white', maxWidth: '1400px', margin: '0 auto' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>Package Maker Pro</h1>
        <p className={styles.subtitle}>Build customized, premium quotes and packages.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: BUILDER FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Client Details */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Client Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Client Name</label>
                 <input type="text" value={clientDetails.name} onChange={e => handleClientChange('name', e.target.value)} placeholder="John Doe" className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Brand Name</label>
                 <input type="text" value={clientDetails.brandName} onChange={e => handleClientChange('brandName', e.target.value)} placeholder="Acme Corp" className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Email Address</label>
                 <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="john@acme.com" className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Mobile Number</label>
                 <input type="text" value={clientDetails.mobile} onChange={e => handleClientChange('mobile', e.target.value)} placeholder="+1 555-0199" className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Date</label>
                 <input type="date" value={clientDetails.date} onChange={e => handleClientChange('date', e.target.value)} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Package Settings */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} /> Package Configuration
            </h3>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Quotation Number</label>
                 <input type="text" value={quoteDetails.number} onChange={e => handleQuoteChange('number', e.target.value)} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Currency</label>
                 <select value={quoteDetails.currency} onChange={e => handleQuoteChange('currency', e.target.value)} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }}>
                    {CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                 </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '10px' }}>Modality</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPackageType('project')} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: packageType === 'project' ? '1px solid #ebd73f' : '1px solid #333', background: packageType === 'project' ? 'rgba(235, 215, 63, 0.1)' : '#111', color: packageType === 'project' ? '#ebd73f' : 'white', cursor: 'pointer' }}>Project Basis</button>
                <button onClick={() => setPackageType('monthly')} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: packageType === 'monthly' ? '1px solid #ebd73f' : '1px solid #333', background: packageType === 'monthly' ? 'rgba(235, 215, 63, 0.1)' : '#111', color: packageType === 'monthly' ? '#ebd73f' : 'white', cursor: 'pointer' }}>Monthly / Retainer Basis</button>
              </div>
            </div>

            {packageType === 'project' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Project Duration (e.g. 4 Weeks)</label>
                   <input type="text" value={quoteDetails.projectDuration} onChange={e => handleQuoteChange('projectDuration', e.target.value)} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Expected Delivery Date</label>
                   <input type="date" value={quoteDetails.expectedDelivery} onChange={e => handleQuoteChange('expectedDelivery', e.target.value)} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Creative Message / Quality Promise</label>
              <textarea value={quoteDetails.message} onChange={e => handleQuoteChange('message', e.target.value)} className={styles.inputField} rows={4} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white', resize: 'vertical' }} />
            </div>
          </div>

          {/* Section 3: Services & Rates */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Services List</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#1a1a1a', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ flex: 2 }}>
                    <input 
                       list="services-list"
                       type="text" 
                       value={item.desc} 
                       onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                       placeholder="Service Description"
                       style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                    />
                    <datalist id="services-list">
                      {DEFAULT_SERVICES.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{color: '#888'}}>Qty</span>
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      style={{ width: '60px', padding: '8px', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{color: '#888'}}>{quoteDetails.currency}</span>
                    <input 
                      type="number" 
                      value={item.rate} 
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      style={{ width: '100px', padding: '8px', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                    />
                  </div>
                  <button onClick={() => removeItem(index)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: 'white', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>
              <Plus size={16} /> Add Another Service
            </button>
          </div>
          
        </div>
        
        {/* RIGHT COLUMN: TEMPLATES & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           {/* Actions */}
           <div className={styles.card} style={{ background: 'linear-gradient(145deg, #1a1a1a, #111)' }}>
             <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Export & Share</h3>
             <button onClick={generatePDF} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#ebd73f', color: '#000', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
               <Download size={18} /> Download as PDF
             </button>
             <button onClick={generateSecureLink} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'transparent', color: 'white', border: '1px solid #ebd73f', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
               <Lock size={18} /> Generate Secure Link
             </button>
             
             {shareLink && (
                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '8px' }}>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Secure Link Generated:</p>
                   <input type="text" readOnly value={shareLink} style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', color: '#ebd73f', borderRadius: '4px', marginBottom: '10px' }} />
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Client Password:</p>
                   <input type="text" readOnly value={sharePassword} style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '4px', letterSpacing: '2px', fontWeight: 'bold' }} />
                </div>
             )}
           </div>

           {/* Templates Manager */}
           <div className={styles.card}>
             <h3 style={{ marginBottom: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
               Templates
               <button onClick={saveCurrentAsPackage} style={{ background: '#333', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Save Current</button>
             </h3>
             <div style={{ position: 'relative', marginBottom: '15px' }}>
               <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888' }} />
               <input type="text" placeholder="Search templates..." value={searchTemplate} onChange={e => setSearchTemplate(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 32px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '6px' }} />
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
               {filteredTemplates.length === 0 ? (
                 <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', padding: '20px 0' }}>No templates found.</p>
               ) : (
                 filteredTemplates.map((pkg, idx) => (
                   <div key={idx} style={{ background: '#1a1a1a', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{pkg.name}</div>
                       <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px' }}>{pkg.type === 'project' ? 'Project' : 'Monthly'} • {pkg.items.length} items</div>
                     </div>
                     <button onClick={() => loadPackage(pkg)} style={{ background: 'transparent', color: '#ebd73f', border: '1px solid rgba(235, 215, 63, 0.3)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>Load</button>
                   </div>
                 ))
               )}
             </div>
           </div>

        </div>
      </div>

      {/* HIDDEN RENDER AREA FOR PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef} style={{ width: '800px', background: '#0a0a0a', padding: '60px', color: 'white', fontFamily: 'Arial, sans-serif' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ebd73f', paddingBottom: '30px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', letterSpacing: '-1px' }}>DRIPP MEDIA</h1>
              <p style={{ color: '#888', margin: 0 }}>Premium Digital Solutions</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#ebd73f', margin: '0 0 10px 0' }}>PROPOSAL</h2>
              <p style={{ color: '#888', margin: 0 }}>{quoteDetails.number}</p>
              <p style={{ color: '#888', margin: 0 }}>Date: {clientDetails.date}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h3 style={{ color: '#ebd73f', fontSize: '1rem', marginBottom: '10px' }}>PREPARED FOR:</h3>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{clientDetails.name}</p>
              <p style={{ margin: '0 0 5px 0' }}>{clientDetails.brandName}</p>
              <p style={{ margin: '0 0 5px 0', color: '#888' }}>{clientDetails.email}</p>
              <p style={{ margin: 0, color: '#888' }}>{clientDetails.mobile}</p>
            </div>
            {packageType === 'project' && (
               <div style={{ textAlign: 'right' }}>
                 <h3 style={{ color: '#ebd73f', fontSize: '1rem', marginBottom: '10px' }}>PROJECT DETAILS:</h3>
                 <p style={{ margin: '0 0 5px 0' }}>Duration: {quoteDetails.projectDuration}</p>
                 <p style={{ margin: 0 }}>Expected Delivery: {quoteDetails.expectedDelivery}</p>
               </div>
            )}
            {packageType === 'monthly' && (
               <div style={{ textAlign: 'right' }}>
                 <h3 style={{ color: '#ebd73f', fontSize: '1rem', marginBottom: '10px' }}>PACKAGE DETAILS:</h3>
                 <p style={{ margin: 0 }}>Recurring Monthly Retainer</p>
               </div>
            )}
          </div>

          <div style={{ background: '#111', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #ebd73f', marginBottom: '40px' }}>
             <p style={{ fontStyle: 'italic', margin: 0, lineHeight: '1.6', color: '#ddd' }}>"{quoteDetails.message}"</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '15px 0', color: '#888' }}>Description</th>
                <th style={{ textAlign: 'center', padding: '15px 0', color: '#888' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '15px 0', color: '#888' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '15px 0', color: '#888' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '20px 0' }}>{item.desc || 'Service Item'}</td>
                  <td style={{ textAlign: 'center', padding: '20px 0' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', padding: '20px 0' }}>{quoteDetails.currency}{parseFloat(item.rate).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '20px 0' }}>{quoteDetails.currency}{(item.qty * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '2px solid #ebd73f' }}>
                <strong style={{ fontSize: '1.2rem' }}>Total:</strong>
                <strong style={{ fontSize: '1.2rem', color: '#ebd73f' }}>{quoteDetails.currency}{total.toFixed(2)}</strong>
              </div>
              {packageType === 'monthly' && <p style={{ textAlign: 'right', color: '#888', fontSize: '0.85rem' }}>*Billed monthly</p>}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
