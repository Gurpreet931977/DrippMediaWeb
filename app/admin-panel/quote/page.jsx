'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Package, Search, Share2, FileText, Lock, Edit3, Save, CheckCircle, ShieldCheck, Loader, CheckCircle2, ArrowUp, ArrowDown, Layers, Type, Image, EyeOff, Eye, Copy, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../admin.module.css';
import CurrencyConverter from '../components/CurrencyConverter';
import { allCurrencies } from '../components/currencies';

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

const DEFAULT_MODALITIES = [
  'Project Basis',
  'Monthly / Retainer Basis',
  'Hourly Rate',
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
    date: new Date().toISOString().split('T')[0],
    currency: '₹',
    projectDuration: '',
    expectedDelivery: '',
    message: "At Dripp Media, we believe in delivering nothing short of excellence. Our focus is entirely on producing high-end, uncompromising quality. While our rates reflect this premium standard, our results ensure you never have to second-guess the investment."
  });

  // Fix timezone issue on mount
  useEffect(() => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(Date.now() - tzOffsetMs).toISOString().split('T')[0];
    setQuoteDetails(prev => ({ ...prev, date: localDate }));
    setClientDetails(prev => ({ ...prev, date: localDate }));
  }, []);

  // Services
  const [items, setItems] = useState([
    { desc: 'Project Discovery & Strategy', qty: 1, rate: 0 }
  ]);

  // PDF Pages State (Dynamic Builder)
  const [pdfPages, setPdfPages] = useState([
    { id: 'cover_1', type: 'cover', title: 'Immersive Visual Narratives & Strategic Growth', subtitle: 'Prepared Exclusively For', hideHeading: false },
    { id: 'services_1', type: 'services', title: 'Scope of Work', hideHeading: false },
    { id: 'investment_1', type: 'investment', title: 'Investment Overview', hideHeading: false },
    { id: 'next_steps_1', type: 'next_steps', title: 'Next Steps', hideHeading: false }
  ]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const movePage = (index, direction) => {
      const newPages = [...pdfPages];
      if (direction === 'up' && index > 0) {
          [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
          setSelectedPageIndex(index - 1);
      } else if (direction === 'down' && index < newPages.length - 1) {
          [newPages[index + 1], newPages[index]] = [newPages[index], newPages[index + 1]];
          setSelectedPageIndex(index + 1);
      }
      setPdfPages(newPages);
  };

  const removePage = (index) => {
      if (pdfPages.length <= 1) return;
      const newPages = [...pdfPages];
      newPages.splice(index, 1);
      setPdfPages(newPages);
      setSelectedPageIndex(Math.max(0, index - 1));
  };

  const addPage = (type) => {
      let newPage = { id: Date.now().toString(), type, hideHeading: false };
      
      if (type === 'custom_text') {
          newPage.title = 'Custom Details';
          newPage.content = 'Add your custom text here...';
      } else if (type === 'infographic') {
          newPage.title = 'Our Value Proposition';
          newPage.cards = [
              { title: 'Feature 1', desc: 'Description of this feature.' },
              { title: 'Feature 2', desc: 'Description of this feature.' }
          ];
      }
      
      setPdfPages([...pdfPages, newPage]);
      setSelectedPageIndex(pdfPages.length);
  };

  const updatePage = (index, field, value) => {
      const newPages = [...pdfPages];
      newPages[index] = { ...newPages[index], [field]: value };
      setPdfPages(newPages);
  };

  const updateCard = (pageIndex, cardIndex, field, value) => {
      const newPages = [...pdfPages];
      const updatedCards = [...newPages[pageIndex].cards];
      updatedCards[cardIndex] = { ...updatedCards[cardIndex], [field]: value };
      newPages[pageIndex].cards = updatedCards;
      setPdfPages(newPages);
  };

  const addCard = (pageIndex) => {
      const newPages = [...pdfPages];
      if (newPages[pageIndex].cards.length < 4) {
          newPages[pageIndex].cards.push({ title: 'New Feature', desc: 'Description here.' });
          setPdfPages(newPages);
      }
  };

  const removeCard = (pageIndex, cardIndex) => {
      const newPages = [...pdfPages];
      newPages[pageIndex].cards.splice(cardIndex, 1);
      setPdfPages(newPages);
  };

  // Templates
  const [savedPackages, setSavedPackages] = useState([]);
  const [searchTemplate, setSearchTemplate] = useState('');
  
  // Sharing
  const [shareLink, setShareLink] = useState('');
  const [sharePassword, setSharePassword] = useState('');

  // Smart Paste State
  const [smartText, setSmartText] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isAutoFillSuccess, setIsAutoFillSuccess] = useState(false);
  const [isAutoFillDone, setIsAutoFillDone] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleSmartPaste = async () => {
    if (!smartText.trim()) return;
    
    const hasExistingClient = clientDetails.name || clientDetails.address || clientDetails.email || clientDetails.mobile || clientDetails.brandName;
    const hasExistingItems = items.length > 1 || (items[0] && items[0].rate > 0);
    if (hasExistingClient || hasExistingItems) {
        if (!confirm('Existing data found. Do you want to overwrite it with the smart paste? Click OK to overwrite, or Cancel to abort.')) {
            return;
        }
    }

    setIsAutoFilling(true);
    
    // Simulate dramatic AI processing time
    await new Promise(r => setTimeout(r, 800));
    
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
    const addressLines = [];
    const lines = smartText.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
        // Skip grand total lines
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        if (line.match(/Total Investment/i)) return;
        
        // Skip Email
        if (line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)) return;
        // Skip Phone
        if (line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)) return;
        // Skip Name/Brand label lines
        if (line.match(/^(?:name|client|brand|company|for):\s*/i)) return;
        
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
            const hasCurrency = rateStr.match(/[$€£₹]/) || line.match(/[$€£₹]|dollars?|usd|eur|gbp|inr|rupees?|bucks?|cents?/i);
            
            if (!hasCurrency && rateStr.trim().match(/^[\d,.\s]+$/)) {
                // Ignore false positive money match
            } else {
                rate = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
                if (!isNaN(rate)) {
                    desc = line.replace(rateStr, '').replace(/for|at|costing|cost|USD|EUR|GBP|INR|\$|€|£|₹/gi, '');
                    // Common filler word cleanup
                    desc = desc.replace(/we need to do (a|an)?/i, '').replace(/we need (a|an)?/i, '').replace(/they want (a|an)?/i, '');
                    desc = desc.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '').trim();
                    if (desc) {
                        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
                        newItems.push({ desc, qty: 1, rate });
                    }
                    return;
                }
            }
        }
        
        // If not matched as an item, consider it part of address or notes
        addressLines.push(line);
    });

    if (addressLines.length > 0) {
        updatedClient.address = addressLines.join('\n').replace(/^(?:Address|Addr|Location):\s*/i, '').trim();
    }

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
    
    // Switch to Filling animation phase
    setIsAutoFilling(false);
    setIsAutoFillSuccess(true);
    
    // Simulate typing effect / UI update delay
    await new Promise(r => setTimeout(r, 600));
    setIsAutoFillSuccess(false);
    setIsAutoFillDone(true);
    
    setTimeout(() => {
        setIsAutoFillDone(false);
        setSmartText('');
    }, 2000);
  };

  const handleClearFormClick = () => {
    setShowClearModal(true);
  };

  const confirmClearForm = () => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(Date.now() - tzOffsetMs).toISOString().split('T')[0];
    setClientDetails({
      name: '',
      brandName: '',
      email: '',
      mobile: '',
      date: localDate
    });
    setQuoteDetails({
      number: 'QT-' + Math.floor(1000 + Math.random() * 9000),
      date: localDate,
      currency: '₹',
      projectDuration: '',
      expectedDelivery: '',
      message: "At Dripp Media, we believe in delivering nothing short of excellence. Our focus is entirely on producing high-end, uncompromising quality. While our rates reflect this premium standard, our results ensure you never have to second-guess the investment."
    });
    setItems([{ desc: 'Project Discovery & Strategy', qty: 1, rate: 0 }]);
    setPackageType('project');
    setSmartText('');
    setShowClearModal(false);
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
    // We will generate the PDF using the hidden DOM elements via html2canvas
    const pdf = new jsPDF('l', 'px', [1920, 1080]);
    
    for (let i = 0; i < pdfPages.length; i++) {
        const pageId = pdfPages[i].id;
        const slide = document.getElementById(`pdf-slide-${pageId}`);
        if (slide) {
            slide.style.display = 'flex'; // Ensure it's rendered for canvas
            try {
                const canvas = await html2canvas(slide, { scale: 2, backgroundColor: '#050505' });
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                if (i > 0) pdf.addPage([1920, 1080], 'l');
                pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
            } catch (err) {
                console.error(`Error rendering slide ${i}`, err);
            }
            slide.style.display = 'none'; // Hide again
        }
    }
    
    const brandNameStr = clientDetails.brandName ? `_${clientDetails.brandName.replace(/\s+/g, '_')}` : (clientDetails.name ? `_${clientDetails.name.replace(/\s+/g, '_')}` : '');
    pdf.save(`Dripp_Media_Proposal${brandNameStr}_${quoteDetails.number}.pdf`);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    if (id) {
        setCopiedItem(id);
        setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  const handleCopyMessage = () => {
    const clientName = clientDetails.name ? clientDetails.name.split(' ')[0] : (clientDetails.brandName || 'Client');
    const msg = `Hey ${clientName}!\n\nHere is your secure proposal from Dripp Media.\n\n🔗 Link: ${shareLink}\n🔑 PIN: ${sharePassword}\n\nLet me know if you have any questions!`;
    copyToClipboard(msg, 'message');
  };

  const generateSecureLink = async () => {
    const pass = Math.floor(1000 + Math.random() * 9000).toString();
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
      
      {/* Clear Form Modal */}
      {showClearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ background: '#111', border: '1px solid rgba(235, 215, 63, 0.2)', padding: '40px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{ background: 'rgba(255, 77, 77, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                 <Trash2 size={30} color="#ff4d4d" />
              </div>
              <h2 style={{ color: '#fff', marginBottom: '15px', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem' }}>Clear Entire Form?</h2>
              <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '0.9rem', lineHeight: '1.5' }}>This action cannot be undone. All client details, services, and customizations will be permanently erased.</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                 <button onClick={() => setShowClearModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancel</button>
                 <button onClick={confirmClearForm} style={{ background: '#ff4d4d', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(255,77,77,0.3)' }}>Yes, Clear It</button>
              </div>
           </div>
        </div>
      )}
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
              <button onClick={handleSmartPaste} disabled={isAutoFilling || isAutoFillSuccess || isAutoFillDone} style={{ background: (isAutoFillSuccess || isAutoFillDone) ? '#ebd73f' : '#ebd73f', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: (isAutoFilling || isAutoFillSuccess || isAutoFillDone) ? 'wait' : 'pointer', fontWeight: 'bold', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
                {isAutoFilling ? (
                   <><Loader size={18} className={styles.spin} /> Analyzing text...</>
                ) : isAutoFillSuccess ? (
                   <><div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #000', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> Filling form...</>
                ) : isAutoFillDone ? (
                   <><CheckCircle2 size={18} color="#000" /> Success!</>
                ) : (
                   'Auto-Fill Package'
                )}
              </button>
              <button 
                onClick={handleClearFormClick} 
                style={{ background: 'rgba(255, 77, 77, 0.05)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 77, 77, 0.15)'; e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 77, 77, 0.05)'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                <Trash2 size={16} /> Clear Form
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
                    {allCurrencies.map(c => <option key={c.code} value={c.symbol}>{c.code} ({c.symbol})</option>)}
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
                  <div style={{ padding: '0 10px', color: '#ebd73f', fontWeight: 'bold', fontSize: '0.9rem', width: '100px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                     <span style={{color: '#666', fontWeight: 'normal'}}>=</span> {quoteDetails.currency}{(item.qty * item.rate).toFixed(2)}
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
            
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '1.1rem', color: '#888' }}>Total Amount:</span>
               <span style={{ fontSize: '1.3rem', color: '#ebd73f', fontWeight: 'bold' }}>{quoteDetails.currency}{total.toFixed(2)}</span>
            </div>
          </div>

          </div>
          
        {/* RIGHT COLUMN: TEMPLATES & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           <CurrencyConverter />

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
                   <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input type="text" readOnly value={shareLink} onClick={() => window.open(`${shareLink}?pwd=${sharePassword}`, '_blank')} className={styles.inputField} style={{ padding: '8px', flex: 1, cursor: 'pointer' }} title="Click to open link directly" />
                      <button onClick={() => copyToClipboard(shareLink, 'link')} className={styles.btn} style={{ padding: '8px', background: 'rgba(235, 215, 63, 0.1)', borderColor: 'rgba(235, 215, 63, 0.3)' }} title="Copy Link">
                        {copiedItem === 'link' ? <CheckCircle2 size={16} color="#ebd73f" /> : <Copy size={16} />}
                      </button>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Client PIN:</p>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" readOnly value={sharePassword} className={styles.inputField} style={{ padding: '8px', letterSpacing: '2px', fontWeight: 'bold', flex: 1 }} />
                      <button onClick={() => copyToClipboard(sharePassword, 'password')} className={styles.btn} style={{ padding: '8px', background: 'rgba(235, 215, 63, 0.1)', borderColor: 'rgba(235, 215, 63, 0.3)' }} title="Copy PIN">
                        {copiedItem === 'password' ? <CheckCircle2 size={16} color="#ebd73f" /> : <Copy size={16} />}
                      </button>
                   </div>
                    <button onClick={handleCopyMessage} className={styles.btnShare}>
                      {copiedItem === 'message' ? (
                          <><CheckCircle2 size={18} /> Message Copied!</>
                      ) : (
                          <><Share2 size={18} /> Copy Share Message</>
                      )}
                    </button>
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

      {/* PDF PAGE BUILDER - FULL WIDTH */}
      <div style={{ marginTop: "40px" }}>
          {/* PDF PAGE BUILDER */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '30px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', borderBottom: '1px solid rgba(235, 215, 63, 0.2)', paddingBottom: '15px' }}>
              <Layers size={20} /> PDF Pages & Layout
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'stretch' }}>
               {/* Left: Page List */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pdfPages.map((page, index) => (
                      <div key={page.id} 
                           onClick={() => setSelectedPageIndex(index)}
                           style={{ 
                             padding: '12px', 
                             background: selectedPageIndex === index ? 'rgba(235, 215, 63, 0.1)' : 'rgba(255,255,255,0.02)', 
                             border: `1px solid ${selectedPageIndex === index ? '#ebd73f' : 'rgba(255,255,255,0.05)'}`, 
                             borderRadius: '8px', 
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between',
                             transition: 'all 0.2s'
                           }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                             {page.type === 'cover' && <Image size={16} color="#888" />}
                             {page.type === 'services' && <FileText size={16} color="#888" />}
                             {page.type === 'investment' && <Package size={16} color="#888" />}
                             {page.type === 'next_steps' && <CheckCircle size={16} color="#888" />}
                             {page.type === 'custom_text' && <Type size={16} color="#888" />}
                             {page.type === 'infographic' && <Layers size={16} color="#888" />}
                             <span style={{ fontSize: '0.9rem', color: selectedPageIndex === index ? '#fff' : '#aaa' }}>
                                {page.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                             </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                             <button onClick={() => movePage(index, 'up')} disabled={index === 0} style={{ background: 'transparent', border: 'none', color: index === 0 ? '#333' : '#ebd73f', cursor: index === 0 ? 'not-allowed' : 'pointer' }}><ArrowUp size={14} /></button>
                             <button onClick={() => movePage(index, 'down')} disabled={index === pdfPages.length - 1} style={{ background: 'transparent', border: 'none', color: index === pdfPages.length - 1 ? '#333' : '#ebd73f', cursor: index === pdfPages.length - 1 ? 'not-allowed' : 'pointer' }}><ArrowDown size={14} /></button>
                             {pdfPages.length > 1 && (
                               <button onClick={() => removePage(index)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', marginLeft: '5px' }}><Trash2 size={14} /></button>
                             )}
                          </div>
                      </div>
                  ))}
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => addPage('custom_text')} className={styles.btn} style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}>+ Text Page</button>
                      <button onClick={() => addPage('infographic')} className={styles.btn} style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}>+ Infographic</button>
                  </div>
               </div>

               {/* Right: Page Editor */}
               <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(235, 215, 63, 0.1)', borderRadius: '16px', padding: '30px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)', position: 'relative' }}>
                  {pdfPages[selectedPageIndex] && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                             <h4 style={{ color: '#ebd73f', margin: 0, textTransform: 'capitalize' }}>
                                 {pdfPages[selectedPageIndex].type.replace('_', ' ')} Settings
                             </h4>
                             <button 
                                onClick={() => updatePage(selectedPageIndex, 'hideHeading', !pdfPages[selectedPageIndex].hideHeading)}
                                style={{ background: 'transparent', border: '1px solid #333', padding: '5px 10px', borderRadius: '6px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                             >
                                 {pdfPages[selectedPageIndex].hideHeading ? <><EyeOff size={14}/> Heading Hidden</> : <><Eye size={14}/> Heading Visible</>}
                             </button>
                         </div>
                         
                         {(pdfPages[selectedPageIndex].type === 'cover' || pdfPages[selectedPageIndex].type === 'services' || pdfPages[selectedPageIndex].type === 'investment' || pdfPages[selectedPageIndex].type === 'next_steps' || pdfPages[selectedPageIndex].type === 'custom_text' || pdfPages[selectedPageIndex].type === 'infographic') && (
                             <div>
                                <label className={styles.label}>Heading Text</label>
                                <input 
                                  type="text" 
                                  value={pdfPages[selectedPageIndex].title || ''} 
                                  onChange={e => updatePage(selectedPageIndex, 'title', e.target.value)} 
                                  className={styles.inputField} 
                                />
                             </div>
                         )}

                         {pdfPages[selectedPageIndex].type === 'cover' && (
                             <div>
                                <label className={styles.label}>Subtitle / Prepared For Label</label>
                                <input 
                                  type="text" 
                                  value={pdfPages[selectedPageIndex].subtitle || ''} 
                                  onChange={e => updatePage(selectedPageIndex, 'subtitle', e.target.value)} 
                                  className={styles.inputField} 
                                />
                             </div>
                         )}
                         
                         {pdfPages[selectedPageIndex].type === 'custom_text' && (
                             <div>
                                <label className={styles.label}>Page Content</label>
                                <textarea 
                                  value={pdfPages[selectedPageIndex].content || ''} 
                                  onChange={e => updatePage(selectedPageIndex, 'content', e.target.value)} 
                                  className={styles.inputField} 
                                  style={{ minHeight: '200px', resize: 'vertical' }}
                                />
                             </div>
                         )}

                         {pdfPages[selectedPageIndex].type === 'infographic' && (
                             <div>
                                <label className={styles.label} style={{ marginBottom: '15px', display: 'block' }}>Design Cards</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {pdfPages[selectedPageIndex].cards?.map((card, cIdx) => (
                                        <div key={cIdx} style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#888' }}>Card {cIdx + 1}</span>
                                                <button onClick={() => removeCard(selectedPageIndex, cIdx)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                            </div>
                                            <input type="text" value={card.title} onChange={e => updateCard(selectedPageIndex, cIdx, 'title', e.target.value)} className={styles.inputField} style={{ padding: '8px', marginBottom: '10px', fontSize: '0.9rem' }} placeholder="Card Title" />
                                            <textarea value={card.desc} onChange={e => updateCard(selectedPageIndex, cIdx, 'desc', e.target.value)} className={styles.inputField} style={{ padding: '8px', fontSize: '0.8rem', minHeight: '60px', resize: 'vertical' }} placeholder="Card Description" />
                                        </div>
                                    ))}
                                </div>
                                {pdfPages[selectedPageIndex].cards?.length < 4 && (
                                    <button onClick={() => addCard(selectedPageIndex)} className={styles.btn} style={{ marginTop: '15px', padding: '8px 15px', fontSize: '0.85rem' }}>+ Add Card</button>
                                )}
                             </div>
                         )}

                         {pdfPages[selectedPageIndex].type === 'services' && (
                             <div style={{ padding: '15px', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '8px', color: '#888', fontSize: '0.85rem' }}>
                                 The Scope of Work details are managed in the "Services & Scope" section above. This page simply formats them for the PDF.
                             </div>
                         )}
                         {pdfPages[selectedPageIndex].type === 'investment' && (
                             <div style={{ padding: '15px', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '8px', color: '#888', fontSize: '0.85rem' }}>
                                 The Investment breakdown is calculated automatically from your Services above.
                             </div>
                         )}
                         {pdfPages[selectedPageIndex].type === 'next_steps' && (
                             <div style={{ padding: '15px', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '8px', color: '#888', fontSize: '0.85rem' }}>
                                 The personal message is pulled from the "Quality Promise / Message" field in the Package Configuration section.
                             </div>
                         )}
                     </div>
                  )}
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

      {/* HIDDEN PDF TEMPLATE - ONLY VISIBLE DURING EXPORT */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          {pdfPages.map((page, index) => (
              <div key={page.id} id={`pdf-slide-${page.id}`} className={styles.pdfSlide} style={{ display: 'none', flexDirection: 'column', justifyContent: page.type === 'cover' || page.type === 'next_steps' || page.type === 'custom_text' ? 'space-between' : 'flex-start' }}>
                  <div className={styles.pdfGlowOrb1} />
                  <div className={styles.pdfGlowOrb2} />
                  
                  {/* Common Header if not hidden and not cover/investment */}
                  {!page.hideHeading && page.type !== 'cover' && page.type !== 'investment' && (
                      <div style={{ marginBottom: '60px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '30px' }}>
                          <h1 className={styles.pdfTitle} style={{ margin: 0, fontFamily: "'Panchang', sans-serif" }}>{page.title}</h1>
                      </div>
                  )}

                  {/* COVER PAGE */}
                  {page.type === 'cover' && (
                      <>
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                             <h1 style={{ fontSize: '120px', color: '#ebd73f', margin: 0, letterSpacing: '-4px', fontWeight: '900', fontFamily: "'Panchang', sans-serif" }}>DRIPP MEDIA</h1>
                             {!page.hideHeading && <p style={{ fontSize: '32px', color: '#888', margin: '10px 0 0 0', fontWeight: '300' }}>{page.title}</p>}
                         </div>
                         
                         <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                             <p style={{ fontSize: '24px', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>{page.subtitle}</p>
                             <h2 style={{ fontSize: '80px', color: '#fff', margin: '0 0 10px 0', lineHeight: 1.1, fontFamily: "'Panchang', sans-serif" }}>{clientDetails.brandName || clientDetails.name || 'Client'}</h2>
                             <p style={{ fontSize: '30px', color: '#aaa', margin: 0 }}>{clientDetails.name ? clientDetails.name + ' | ' : ''}{clientDetails.email}</p>
                         </div>
                         
                         <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid rgba(235, 215, 63, 0.3)', paddingTop: '40px', marginTop: 'auto' }}>
                             <div>
                                 <p style={{ fontSize: '20px', color: '#666', margin: '0 0 5px 0' }}>Date</p>
                                 <p style={{ fontSize: '28px', color: '#fff', margin: 0 }}>{clientDetails.date}</p>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                 <p style={{ fontSize: '20px', color: '#666', margin: '0 0 5px 0' }}>Proposal Number</p>
                                 <p style={{ fontSize: '28px', color: '#fff', margin: 0 }}>{quoteDetails.number}</p>
                             </div>
                         </div>
                      </>
                  )}

                  {/* SERVICES PAGE */}
                  {page.type === 'services' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                          {items.slice(0, 5).map((item, i) => (
                              <div key={i} className={styles.pdfServiceCard}>
                                  <div style={{ flex: 1 }}>
                                      <h3 style={{ fontSize: '36px', color: '#fff', margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif" }}>{item.desc || 'Service Item'}</h3>
                                      <p style={{ fontSize: '24px', color: '#888', margin: 0 }}>Qty: {item.qty} &nbsp;|&nbsp; Rate: {quoteDetails.currency}{parseFloat(item.rate || 0).toLocaleString()}</p>
                                  </div>
                                  <div className={styles.pdfAmount}>
                                      <span style={{ color: '#666' }}>=</span> {quoteDetails.currency}{(item.qty * item.rate).toLocaleString()}
                                  </div>
                              </div>
                          ))}
                          {items.length > 5 && (
                              <div style={{ fontSize: '24px', color: '#888', textAlign: 'center', marginTop: '20px' }}>
                                  + {items.length - 5} more items detailed in the full agreement.
                              </div>
                          )}
                      </div>
                  )}

                  {/* INVESTMENT PAGE */}
                  {page.type === 'investment' && (
                      <>
                        {!page.hideHeading && (
                            <div style={{ marginBottom: '80px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '30px' }}>
                                <h1 className={styles.pdfTitle} style={{ margin: 0, fontFamily: "'Panchang', sans-serif" }}>{page.title}</h1>
                            </div>
                        )}
                        <div style={{ background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '24px', padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <p style={{ fontSize: '30px', color: '#888', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px' }}>Total {packageType === 'monthly' ? 'Monthly ' : ''}Investment</p>
                            
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                                <span style={{ fontSize: '60px', color: '#ebd73f', fontWeight: '500' }}>{quoteDetails.currency}</span>
                                <span style={{ fontSize: '180px', color: '#ebd73f', fontWeight: '900', letterSpacing: '-5px', lineHeight: 1, fontFamily: "'Panchang', sans-serif" }}>{total.toLocaleString()}</span>
                            </div>
                            
                            {packageType === 'monthly' && (
                                <p style={{ fontSize: '24px', color: '#aaa', marginTop: '20px' }}>*Billed monthly. Cancel anytime with 30 days notice.</p>
                            )}
                            {packageType === 'project' && (
                                <div style={{ display: 'flex', gap: '40px', marginTop: '40px' }}>
                                    <p style={{ fontSize: '24px', color: '#aaa' }}><strong style={{color: '#fff'}}>Duration:</strong> {quoteDetails.projectDuration}</p>
                                    <p style={{ fontSize: '24px', color: '#aaa' }}><strong style={{color: '#fff'}}>Delivery:</strong> {quoteDetails.expectedDelivery}</p>
                                </div>
                            )}
                        </div>
                      </>
                  )}

                  {/* NEXT STEPS PAGE */}
                  {page.type === 'next_steps' && (
                      <>
                        {quoteDetails.message && (
                            <div style={{ borderLeft: '8px solid #ebd73f', paddingLeft: '40px', margin: '60px 0', maxWidth: '1400px' }}>
                                <p style={{ fontSize: '36px', color: '#fff', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                                    "{quoteDetails.message}"
                                </p>
                            </div>
                        )}
                        <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#111', padding: '60px', borderRadius: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '32px', color: '#ebd73f', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif" }}>How to Proceed</h3>
                                <ol style={{ fontSize: '24px', color: '#ccc', lineHeight: 1.8, margin: 0, paddingLeft: '30px' }}>
                                    <li>Review this proposal and ensure it aligns with your vision.</li>
                                    <li>Let us know if you need any adjustments.</li>
                                    <li>Once approved, we will send over the formal agreement and first invoice.</li>
                                </ol>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '32px', color: '#ebd73f', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif" }}>Contact Us</h3>
                                <p style={{ fontSize: '24px', color: '#ccc', margin: '0 0 10px 0' }}>Founder: Gurpreet Singh</p>
                                <p style={{ fontSize: '24px', color: '#ccc', margin: '0 0 10px 0' }}>Email: mediadripp@gmail.com</p>
                                <p style={{ fontSize: '24px', color: '#ccc', margin: '0 0 10px 0' }}>Instagram: @drippmedia_</p>
                                <p style={{ fontSize: '24px', color: '#ccc', margin: '0' }}>Web: www.drippmedia.com</p>
                            </div>
                        </div>
                      </>
                  )}

                  {/* CUSTOM TEXT PAGE */}
                  {page.type === 'custom_text' && (
                      <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '32px', color: '#ddd', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginTop: '40px' }}>
                              {page.content}
                          </div>
                      </div>
                  )}

                  {/* INFOGRAPHIC PAGE */}
                  {page.type === 'infographic' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flex: 1, alignContent: 'center' }}>
                          {page.cards?.map((card, idx) => (
                              <div key={idx} style={{ background: '#111', border: '1px solid #333', borderRadius: '24px', padding: '60px' }}>
                                  <h3 style={{ fontSize: '42px', color: '#ebd73f', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif" }}>{card.title}</h3>
                                  <p style={{ fontSize: '28px', color: '#ccc', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                              </div>
                          ))}
                      </div>
                  )}

              </div>
          ))}
      </div>

    </div>
  </div>
  );
}
