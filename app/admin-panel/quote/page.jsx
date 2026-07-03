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

  // Smart Paste
  const [smartText, setSmartText] = useState('');

  const handleSmartPaste = async () => {
    if (!smartText.trim()) return;
    
    // Dynamically import compromise
    const nlp = (await import('compromise')).default;
    const doc = nlp(smartText);
    
    let updatedClient = { ...clientDetails };
    let updatedQuote = { ...quoteDetails };
    
    // 1. Extract Email
    const emailMatch = smartText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) updatedClient.email = emailMatch[0];

    // 2. Extract Phone
    const phoneMatch = smartText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) updatedClient.mobile = phoneMatch[0];

    // 3. Extract Name & Brand
    const people = doc.people().out('array');
    if (people.length > 0) {
        updatedClient.name = people[0].replace(/[.,;:!?]$/, '').trim();
    } else {
        const nameMatch = smartText.match(/(?:name|client):\s*([a-zA-Z\s]+)/i);
        if (nameMatch) updatedClient.name = nameMatch[1].trim();
    }

    // Advanced Brand extraction (looks for "for [Brand]")
    const forMatch = smartText.match(/for\s+([A-Z][a-zA-Z0-9'\s]+?(?=\.|\n))/);
    if (forMatch) {
        updatedClient.brandName = forMatch[1].trim();
    } else {
        const organizations = doc.organizations().out('array');
        if (organizations.length > 0) {
            updatedClient.brandName = organizations[0].replace(/[.,;:!?]$/, '').trim();
        } else {
            const brandMatch = smartText.match(/(?:brand|company):\s*([a-zA-Z\s0-9&]+)/i);
            if (brandMatch) updatedClient.brandName = brandMatch[1].trim();
        }
    }
    
    setClientDetails(updatedClient);

    // 4. Extract Items/Prices using Advanced Heuristics + NLP
    const newItems = [];
    const lines = smartText.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
        // Skip grand total lines
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        if (line.match(/Total Investment/i)) return;
        
        let qty = 1;
        let rate = 0;
        let desc = "";
        
        // Format 1: Item (qty): rate each
        let m1 = line.match(/^[-*•]?\s*(.*?)\s*\((\d+)\)\s*[:-]?\s*[$€£₹]?\s*([\d,.]+)\s*each/i);
        if (m1) {
            desc = m1[1].trim();
            qty = parseInt(m1[2]);
            rate = parseFloat(m1[3].replace(/,/g, ''));
            newItems.push({desc, qty, rate});
            return;
        }
        
        // Format 2: Item = total
        let m2 = line.match(/^[-*•]?\s*(.*?)\s*=\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m2) {
             if (m2[1].toLowerCase().includes('total')) return;
             desc = m2[1].trim();
             rate = parseFloat(m2[2].replace(/,/g, ''));
             newItems.push({desc, qty: 1, rate});
             return;
        }
        
        // Format 3: Item - rate
        let m3 = line.match(/^[-*•]?\s*(.*?)\s*-\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m3) {
             desc = m3[1].trim();
             rate = parseFloat(m3[2].replace(/,/g, ''));
             newItems.push({desc, qty: 1, rate});
             return;
        }

        // Format 4: NLP Sentence Fallback
        const sDoc = nlp(line);
        const money = sDoc.money().out('array');
        if (money.length > 0) {
            const rateStr = money[0];
            rate = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
            if (!isNaN(rate)) {
                desc = line.replace(rateStr, '').replace(/for|at|costing|cost|USD|EUR|GBP|INR|\$|€|£|₹/gi, '');
                desc = desc.replace(/we need to do (a|an)?/i, '').replace(/we need (a|an)?/i, '').replace(/they want (a|an)?/i, '');
                desc = desc.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '').trim();
                if (desc) {
                    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
                    newItems.push({ desc, qty: 1, rate });
                }
            }
        }
    });

    if (newItems.length > 0) {
        setItems(newItems);
    }
    
    // 5. Extract Long Message / Quality Promise
    const paragraphs = smartText.split('\n\n');
    if (paragraphs.length > 0) {
        // Look for a paragraph > 50 chars with no money symbols
        const lastPara = paragraphs.slice(-2).find(p => p.length > 50 && !p.match(/₹|\$|£|€/));
        if (lastPara) {
            updatedQuote.message = lastPara.replace(/\n/g, ' ').trim();
        }
    }

    // 6. Look for modality hints
    if (smartText.toLowerCase().includes('monthly') || smartText.toLowerCase().includes('retainer') || smartText.toLowerCase().includes('/mo') || smartText.toLowerCase().includes('per month')) {
        setPackageType('monthly');
    } else if (smartText.toLowerCase().includes('project')) {
        setPackageType('project');
    }

    // 7. Extract Currency
    if (smartText.includes('₹') || smartText.includes('INR')) updatedQuote.currency = '₹';
    else if (smartText.includes('€') || smartText.includes('EUR')) updatedQuote.currency = '€';
    else if (smartText.includes('£') || smartText.includes('GBP')) updatedQuote.currency = '£';
    else if (smartText.includes('$') || smartText.includes('USD')) updatedQuote.currency = '$';

    setQuoteDetails(updatedQuote);
    setSmartText(''); 
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear the entire form and start over?')) {
      setClientDetails({
        name: '',
        brandName: '',
        email: '',
        mobile: '',
        date: new Date().toISOString().split('T')[0]
      });
      setQuoteDetails({
        number: 'QT-' + Math.floor(1000 + Math.random() * 9000),
        currency: '$',
        projectDuration: '',
        expectedDelivery: '',
        message: "At Dripp Media, we believe in delivering nothing short of excellence. Our focus is entirely on producing high-end, uncompromising quality. While our rates reflect this premium standard, our results ensure you never have to second-guess the investment."
      });
      setItems([{ desc: 'Project Discovery & Strategy', qty: 1, rate: 0 }]);
      setPackageType('project');
      setSmartText('');
    }
  };

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
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, 210, 297, 'F'); // Dark background
    
    pdf.setTextColor(235, 215, 63); // Dripp Yellow
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text("DRIPP MEDIA", 15, 30);
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Premium Digital Solutions", 15, 38);
    
    // Quote Info
    pdf.setTextColor(235, 215, 63);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROPOSAL", 195, 30, { align: 'right' });
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(quoteDetails.number, 195, 38, { align: 'right' });
    pdf.text(`Date: ${clientDetails.date}`, 195, 44, { align: 'right' });

    pdf.setDrawColor(235, 215, 63);
    pdf.setLineWidth(0.5);
    pdf.line(15, 55, 195, 55);
    
    // Client Details
    pdf.setTextColor(235, 215, 63);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("PREPARED FOR:", 15, 65);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.text(clientDetails.name || "Client Name", 15, 72);
    pdf.setFont("helvetica", "normal");
    if(clientDetails.brandName) pdf.text(clientDetails.brandName, 15, 78);
    pdf.setTextColor(150, 150, 150);
    if(clientDetails.email) pdf.text(clientDetails.email, 15, 84);
    if(clientDetails.mobile) pdf.text(clientDetails.mobile, 15, 90);

    // Package Details
    if(packageType === 'project') {
       pdf.setTextColor(235, 215, 63);
       pdf.setFontSize(12);
       pdf.setFont("helvetica", "bold");
       pdf.text("PROJECT DETAILS:", 195, 65, { align: 'right' });
       pdf.setTextColor(255, 255, 255);
       pdf.setFontSize(10);
       pdf.setFont("helvetica", "normal");
       pdf.text(`Duration: ${quoteDetails.projectDuration}`, 195, 72, { align: 'right' });
       pdf.text(`Delivery: ${quoteDetails.expectedDelivery}`, 195, 78, { align: 'right' });
    } else {
       pdf.setTextColor(235, 215, 63);
       pdf.setFontSize(12);
       pdf.setFont("helvetica", "bold");
       pdf.text("PACKAGE DETAILS:", 195, 65, { align: 'right' });
       pdf.setTextColor(255, 255, 255);
       pdf.setFontSize(10);
       pdf.setFont("helvetica", "normal");
       pdf.text("Recurring Monthly Retainer", 195, 72, { align: 'right' });
    }

    // Creative Message
    let messageY = 105;
    if (quoteDetails.message) {
      pdf.setDrawColor(235, 215, 63);
      pdf.setLineWidth(1);
      pdf.line(15, 95, 15, 115);
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      
      const splitText = pdf.splitTextToSize(`"${quoteDetails.message}"`, 170);
      pdf.text(splitText, 19, 100);
      messageY = 100 + (splitText.length * 5) + 10;
    }

    // Services Table
    const tableData = items.map(item => [
      item.desc || 'Service Item',
      item.qty.toString(),
      `${quoteDetails.currency}${parseFloat(item.rate || 0).toFixed(2)}`,
      `${quoteDetails.currency}${(item.qty * item.rate).toFixed(2)}`
    ]);

    import('jspdf-autotable').then(({ default: autoTable }) => {
      autoTable(pdf, {
        startY: messageY,
        head: [['Description', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        theme: 'plain',
        headStyles: { fillColor: [20, 20, 20], textColor: [235, 215, 63], fontStyle: 'bold' },
        bodyStyles: { fillColor: [10, 10, 10], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [15, 15, 15] },
        columnStyles: {
           1: { halign: 'center' },
           2: { halign: 'right' },
           3: { halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      // Total
      const finalY = pdf.lastAutoTable.finalY + 15;
      pdf.setDrawColor(235, 215, 63);
      pdf.setLineWidth(0.5);
      pdf.line(120, finalY - 5, 195, finalY - 5);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Total:", 120, finalY + 2);
      
      pdf.setTextColor(235, 215, 63);
      pdf.text(`${quoteDetails.currency}${total.toFixed(2)}`, 195, finalY + 2, { align: 'right' });
      
      if(packageType === 'monthly') {
         pdf.setTextColor(150, 150, 150);
         pdf.setFontSize(9);
         pdf.setFont("helvetica", "normal");
         pdf.text("*Billed monthly", 195, finalY + 8, { align: 'right' });
      }

      pdf.save(`Dripp_Media_Quote_${quoteDetails.number}.pdf`);
    });
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
          
          {/* Smart Paste Section */}
          <div className={styles.card} style={{ border: '1px dashed #ebd73f', background: 'rgba(235, 215, 63, 0.05)' }}>
            <h3 style={{ marginBottom: '10px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} /> AI Smart Paste
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px', lineHeight: 1.4 }}>
              Paste an unstructured paragraph of client requirements, meeting notes, or chat messages. 
              We'll automatically extract emails, phone numbers, names, and service prices to build your quote instantly.
            </p>
            <textarea 
              value={smartText} 
              onChange={(e) => setSmartText(e.target.value)} 
              placeholder="e.g. Client: John Doe. Phone: 555-1234. Email: john@doe.com. We need a Website Redesign for $1500 and Monthly SEO for $500."
              className={styles.inputField} 
              rows={4} 
              style={{ resize: 'vertical', marginBottom: '15px' }} 
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSmartPaste} style={{ background: '#ebd73f', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
                Auto-Fill Form
              </button>
              <button onClick={handleClearForm} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Clear Form
              </button>
            </div>
          </div>

          {/* Section 1: Client Details */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Client Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Client Name</label>
                 <input type="text" value={clientDetails.name} onChange={e => handleClientChange('name', e.target.value)} placeholder="John Doe" className={styles.inputField}  />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Brand Name</label>
                 <input type="text" value={clientDetails.brandName} onChange={e => handleClientChange('brandName', e.target.value)} placeholder="Acme Corp" className={styles.inputField}  />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Email Address</label>
                 <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="john@acme.com" className={styles.inputField}  />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Mobile Number</label>
                 <input type="text" value={clientDetails.mobile} onChange={e => handleClientChange('mobile', e.target.value)} placeholder="+1 555-0199" className={styles.inputField}  />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Date</label>
                 <input type="date" value={clientDetails.date} onChange={e => handleClientChange('date', e.target.value)} className={styles.inputField}  />
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
                 <input type="text" value={quoteDetails.number} onChange={e => handleQuoteChange('number', e.target.value)} className={styles.inputField}  />
              </div>
              <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Currency</label>
                 <select value={quoteDetails.currency} onChange={e => handleQuoteChange('currency', e.target.value)} className={styles.inputField} >
                    {CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                 </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className={styles.label}>Modality</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPackageType('project')} className={styles.btn} style={{ flex: 1, borderColor: packageType === 'project' ? '#ebd73f' : 'rgba(255,255,255,0.1)', background: packageType === 'project' ? 'rgba(235, 215, 63, 0.1)' : 'rgba(255,255,255,0.05)', color: packageType === 'project' ? '#ebd73f' : 'white' }}>Project Basis</button>
                <button onClick={() => setPackageType('monthly')} className={styles.btn} style={{ flex: 1, borderColor: packageType === 'monthly' ? '#ebd73f' : 'rgba(255,255,255,0.1)', background: packageType === 'monthly' ? 'rgba(235, 215, 63, 0.1)' : 'rgba(255,255,255,0.05)', color: packageType === 'monthly' ? '#ebd73f' : 'white' }}>Monthly / Retainer Basis</button>
              </div>
            </div>

            {packageType === 'project' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Project Duration (e.g. 4 Weeks)</label>
                   <input type="text" value={quoteDetails.projectDuration} onChange={e => handleQuoteChange('projectDuration', e.target.value)} className={styles.inputField}  />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Expected Delivery Date</label>
                   <input type="date" value={quoteDetails.expectedDelivery} onChange={e => handleQuoteChange('expectedDelivery', e.target.value)} className={styles.inputField}  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>Creative Message / Quality Promise</label>
              <textarea value={quoteDetails.message} onChange={e => handleQuoteChange('message', e.target.value)} className={styles.inputField} rows={4} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Section 3: Services & Rates */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Services List</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 2 }}>
                    <input 
                       list="services-list"
                       type="text" 
                       value={item.desc} 
                       onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                       placeholder="Service Description"
                       className={styles.inputField}
                       style={{ padding: '8px 12px' }}
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
                      className={styles.inputField}
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{color: '#888'}}>{quoteDetails.currency}</span>
                    <input 
                      type="number" 
                      value={item.rate} 
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className={styles.inputField}
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <button onClick={() => removeItem(index)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity=1} onMouseOut={(e) => e.currentTarget.style.opacity=0.7}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addItem} className={styles.btn}>
              <Plus size={16} /> Add Another Service
            </button>
          </div>
          
        </div>
        
        {/* RIGHT COLUMN: TEMPLATES & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           {/* Actions */}
           <div className={styles.card}>
             <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Export & Share</h3>
             <button onClick={generatePDF} className={styles.btnPrimary} style={{ width: '100%', padding: '12px', justifyContent: 'center', marginBottom: '15px' }}>
               <Download size={18} /> Download as PDF
             </button>
             <button onClick={generateSecureLink} className={styles.btn} style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
               <Lock size={18} /> Generate Secure Link
             </button>
             
             {shareLink && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '0.75rem' }}>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Secure Link Generated:</p>
                   <input type="text" readOnly value={shareLink} className={styles.inputField} style={{ padding: '8px', marginBottom: '10px' }} />
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Client Password:</p>
                   <input type="text" readOnly value={sharePassword} className={styles.inputField} style={{ padding: '8px', letterSpacing: '2px', fontWeight: 'bold' }} />
                </div>
             )}
           </div>

           {/* Templates Manager */}
           <div className={styles.card}>
             <h3 style={{ marginBottom: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
               Templates
               <button onClick={saveCurrentAsPackage} className={styles.btn} style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Save Current</button>
             </h3>
             <div style={{ position: 'relative', marginBottom: '15px' }}>
               <Search size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
               <input type="text" placeholder="Search templates..." value={searchTemplate} onChange={e => setSearchTemplate(e.target.value)} className={styles.inputField} style={{ paddingLeft: '40px' }} />
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
               {filteredTemplates.length === 0 ? (
                 <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', padding: '20px 0' }}>No templates found.</p>
               ) : (
                 filteredTemplates.map((pkg, idx) => (
                   <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
                     <div>
                       <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{pkg.name}</div>
                       <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px' }}>{pkg.type === 'project' ? 'Project' : 'Monthly'} • {pkg.items.length} items</div>
                     </div>
                     <button onClick={() => loadPackage(pkg)} className={styles.btn} style={{ padding: '5px 10px', fontSize: '0.8rem', borderColor: 'rgba(235, 215, 63, 0.3)', color: '#ebd73f' }}>Load</button>
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
