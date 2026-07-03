'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Package, Search, Share2, FileText, Lock, Edit3, Save, CheckCircle, ShieldCheck, Loader, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import styles from '../admin.module.css';
import CurrencyConverter from '../components/CurrencyConverter';

const DEFAULT_SERVICES = [
  'Video Production - 1 Minute Edit',
  'Social Media Content Strategy',
  'Graphic Design Retainer',
  'Web Development Retainer',
  'SEO Monthly Optimization',
];

const CURRENCIES = [
  { label: 'USD ($)', symbol: '$' },
  { label: 'EUR (€)', symbol: '€' },
  { label: 'GBP (£)', symbol: '£' },
  { label: 'INR (₹)', symbol: '₹' },
];

export default function InvoiceMaker() {
  const [isClient, setIsClient] = useState(false);
  
  // -- MY DETAILS (LOCKED BY DEFAULT) --
  const [myDetailsLocked, setMyDetailsLocked] = useState(true);
  const [myDetails, setMyDetails] = useState({
    companyName: 'Dripp Media',
    address: '123 Business St, Creative District\nNew Delhi, India',
    email: 'hello@drippmedia.com',
    phone: '+91 98765 43210',
    gst: '07AAACD1234E1Z5'
  });

  // -- BANK ACCOUNTS & PAYMENTS --
  const [includeGST, setIncludeGST] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([
    {
      id: 'default_bank',
      name: 'Primary Bank Transfer',
      details: 'Bank: HDFC Bank\nAccount Name: Dripp Media\nA/C No: 50200012345678\nIFSC: HDFC0001234',
      upi: 'drippmedia@hdfcbank'
    }
  ]);
  const [selectedBankId, setSelectedBankId] = useState('default_bank');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  
  // Bank Editor State
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editingBankDetails, setEditingBankDetails] = useState(null);

  // -- INVOICE STATE --
  const [invoiceDetails, setInvoiceDetails] = useState({
    number: 'INV-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString().split('T')[0],
    currency: '₹',
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: 'Payment is due within 15 days. Thank you for your business!'
  });

  const [clientDetails, setClientDetails] = useState({
    name: '',
    address: '',
    email: '',
    mobile: ''
  });

  const [items, setItems] = useState([
    { desc: 'Video Production Services', qty: 1, rate: 0 }
  ]);

  // -- SMART PASTE & SHARING --
  const [smartText, setSmartText] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [sharePassword, setSharePassword] = useState('');

  // -- INITIALIZATION & LOCAL STORAGE --
  useEffect(() => {
    setIsClient(true);
    // Load Defaults
    const localMyDetails = localStorage.getItem('dripp_my_details');
    if (localMyDetails) {
        try { setMyDetails(JSON.parse(localMyDetails)); } catch (e) {}
    }
    const localBankAccounts = localStorage.getItem('dripp_bank_accounts');
    if (localBankAccounts) {
        try { setBankAccounts(JSON.parse(localBankAccounts)); } catch (e) {}
    }
    const savedInvoices = localStorage.getItem('dripp_invoices');
    if (savedInvoices) {
      try {
        const parsed = JSON.parse(savedInvoices);
        if (parsed.length > 0) {
          const lastInv = parsed[parsed.length - 1];
          const match = lastInv.number.match(/INV-(\d+)/);
          if (match) {
            const nextNum = parseInt(match[1]) + 1;
            setInvoiceDetails(prev => ({ ...prev, number: `INV-${nextNum.toString().padStart(4, '0')}` }));
          }
        }
       const storedBanks = localStorage.getItem('dripp_bank_accounts');
       if (storedBanks) {
          try {
             const parsed = JSON.parse(storedBanks);
             if (parsed && parsed.length > 0) {
                 setBankAccounts(parsed);
                 setSelectedBankId(parsed[0].id);
             }
          } catch(e) {}
       }
      } catch (e) {}
    }
  }, []);

  // -- QR CODE GENERATION --
  useEffect(() => {
     const generateQR = async () => {
         const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
         if (selectedBank && selectedBank.upi) {
             try {
                // Generates a simple text QR, usually a UPI link format is upi://pay?pa=...
                // If they provide a direct upi string like "name@upi", we'll just format it as a UPI intent link
                const upiString = selectedBank.upi.includes('://') ? selectedBank.upi : `upi://pay?pa=${selectedBank.upi}&pn=${encodeURIComponent(myDetails.companyName)}&cu=INR`;
                const url = await QRCode.toDataURL(upiString, { margin: 1, color: { dark: '#000000', light: '#ffffff' } });
                setQrCodeDataUrl(url);
             } catch(err) {
                console.error("QR Error", err);
                setQrCodeDataUrl('');
             }
         } else {
             setQrCodeDataUrl('');
         }
     };
     generateQR();
  }, [selectedBankId, bankAccounts, myDetails.companyName]);


  // -- HANDLERS --
  const saveMyDetails = () => {
     localStorage.setItem('dripp_my_details', JSON.stringify(myDetails));
     setMyDetailsLocked(true);
     alert("Default details saved successfully!");
  };

  const handleSaveBank = () => {
      let updatedBanks = [...bankAccounts];
      const existingIdx = updatedBanks.findIndex(b => b.id === editingBankDetails.id);
      if (existingIdx >= 0) {
          updatedBanks[existingIdx] = editingBankDetails;
      } else {
          updatedBanks.push(editingBankDetails);
      }
      setBankAccounts(updatedBanks);
      setSelectedBankId(editingBankDetails.id);
      setIsEditingBank(false);
      localStorage.setItem('dripp_bank_accounts', JSON.stringify(updatedBanks));
  };
  
  const handleDeleteBank = (id) => {
      if(confirm("Are you sure you want to delete this payment method?")) {
          const updatedBanks = bankAccounts.filter(b => b.id !== id);
          if (updatedBanks.length === 0) {
              alert("You must have at least one payment method.");
              return;
          }
          setBankAccounts(updatedBanks);
          setSelectedBankId(updatedBanks[0].id);
          setIsEditingBank(false);
          localStorage.setItem('dripp_bank_accounts', JSON.stringify(updatedBanks));
      }
  };

  const handleMyDetailsChange = (field, value) => setMyDetails(prev => ({ ...prev, [field]: value }));
  const handleClientChange = (field, value) => setClientDetails(prev => ({ ...prev, [field]: value }));
  const handleInvoiceChange = (field, value) => setInvoiceDetails(prev => ({ ...prev, [field]: value }));
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  const addItem = () => setItems([...items, { desc: '', qty: 1, rate: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);

  // -- SMART PASTE (AI) --
  const handleSmartPaste = async () => {
    if (!smartText.trim()) return;
    
    setIsAutoFilling(true);
    
    // Simulate dramatic AI processing time
    await new Promise(r => setTimeout(r, 800));
    
    // Dynamically import compromise for NLP
    const nlp = (await import('compromise')).default;
    const doc = nlp(smartText);
    
    let updatedClient = { ...clientDetails };
    let updatedInvoice = { ...invoiceDetails };
    
    // Extract Email
    const emailMatch = smartText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) updatedClient.email = emailMatch[0];

    // Extract Phone
    const phoneMatch = smartText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) updatedClient.mobile = phoneMatch[0];

    // Extract Name
    const people = doc.people().out('array');
    if (people.length > 0) {
        updatedClient.name = people[0].replace(/[.,;:!?]$/, '').trim();
    } else {
        const nameMatch = smartText.match(/(?:name|client):\s*([a-zA-Z\s]+)/i);
        if (nameMatch) updatedClient.name = nameMatch[1].trim();
    }
    
    // Items extraction using identical heuristics to Quote Maker
    const newItems = [];
    const lines = smartText.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        
        let qty = 1;
        let rate = 0;
        let desc = "";
        
        let m1 = line.match(/^[-*•]?\s*(.*?)\s*\((\d+)\)\s*[:-]?\s*[$€£₹]?\s*([\d,.]+)\s*each/i);
        if (m1) {
            desc = m1[1].trim();
            qty = parseInt(m1[2]);
            rate = parseFloat(m1[3].replace(/,/g, ''));
            newItems.push({desc, qty, rate});
            return;
        }
        
        let m2 = line.match(/^[-*•]?\s*(.*?)\s*=\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m2) {
             if (m2[1].toLowerCase().includes('total')) return;
             desc = m2[1].trim();
             rate = parseFloat(m2[2].replace(/,/g, ''));
             newItems.push({desc, qty: 1, rate});
             return;
        }
        
        let m3 = line.match(/^[-*•]?\s*(.*?)\s*-\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m3) {
             desc = m3[1].trim();
             rate = parseFloat(m3[2].replace(/,/g, ''));
             newItems.push({desc, qty: 1, rate});
             return;
        }

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

    if (newItems.length > 0) setItems(newItems);
    
    // Extract Currency
    if (smartText.includes('₹') || smartText.includes('INR')) updatedInvoice.currency = '₹';
    else if (smartText.includes('€') || smartText.includes('EUR')) updatedInvoice.currency = '€';
    else if (smartText.includes('£') || smartText.includes('GBP')) updatedInvoice.currency = '£';
    else if (smartText.includes('$') || smartText.includes('USD')) updatedInvoice.currency = '$';

    setClientDetails(updatedClient);
    setInvoiceDetails(updatedInvoice);
    setSmartText(''); 
    
    setIsAutoFilling(false);
    setIsAutoFillSuccess(true);
    setTimeout(() => setIsAutoFillSuccess(false), 2000);
  };

  const handleClearForm = () => {
    if(confirm('Are you sure you want to clear the entire form?')) {
        setClientDetails({ name: '', address: '', email: '', mobile: '' });
        setInvoiceDetails(prev => ({ ...prev, number: 'INV-' + Math.floor(1000 + Math.random() * 9000), notes: 'Payment is due within 15 days. Thank you for your business!' }));
        setItems([{ desc: 'Video Production Services', qty: 1, rate: 0 }]);
    }
  };

  // -- PDF GENERATION (NATIVE jsPDF) --
  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header & Background (Same premium aesthetic as Quote Maker)
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Logo / Company Name
    pdf.setTextColor(235, 215, 63); // Dripp Yellow
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text(myDetails.companyName.toUpperCase(), 15, 30);
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    if (includeGST && myDetails.gst) pdf.text(`GSTIN: ${myDetails.gst}`, 15, 38);
    
    // Invoice Title & Info
    pdf.setTextColor(235, 215, 63);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("TAX INVOICE", 195, 30, { align: 'right' });
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoiceDetails.number, 195, 38, { align: 'right' });
    pdf.text(`Date: ${invoiceDetails.date}`, 195, 44, { align: 'right' });
    pdf.text(`Due Date: ${invoiceDetails.dueDate}`, 195, 50, { align: 'right' });

    pdf.setDrawColor(235, 215, 63);
    pdf.setLineWidth(0.5);
    pdf.line(15, 58, 195, 58);
    
    // Split Section: Bill From vs Bill To
    // BILL FROM
    pdf.setTextColor(235, 215, 63);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL FROM:", 15, 68);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(myDetails.companyName, 15, 75);
    pdf.setTextColor(150, 150, 150);
    const splitMyAddress = pdf.splitTextToSize(myDetails.address, 70);
    pdf.text(splitMyAddress, 15, 80);
    let currentY = 80 + (splitMyAddress.length * 4) + 2;
    if(myDetails.email) { pdf.text(myDetails.email, 15, currentY); currentY += 5; }
    if(myDetails.phone) { pdf.text(myDetails.phone, 15, currentY); }

    // BILL TO
    pdf.setTextColor(235, 215, 63);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL TO:", 195, 68, { align: 'right' });
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(clientDetails.name || "NIL (not provided)", 195, 75, { align: 'right' });
    pdf.setTextColor(150, 150, 150);
    if(clientDetails.address) {
       const splitClientAddress = pdf.splitTextToSize(clientDetails.address, 70);
       let addrY = 80;
       // align right for arrays requires drawing line by line or a specific plugin, we'll draw line by line
       splitClientAddress.forEach(line => {
           pdf.text(line, 195, addrY, { align: 'right' });
           addrY += 5;
       });
       currentY = Math.max(currentY, addrY);
    } else {
       pdf.text("NIL (not provided)", 195, 80, { align: 'right' });
       currentY = Math.max(currentY, 85);
    }
    
    if(clientDetails.email) { 
        pdf.text(clientDetails.email, 195, currentY, { align: 'right' }); 
        currentY += 5; 
    } else {
        pdf.text("NIL (not provided)", 195, currentY, { align: 'right' }); 
        currentY += 5; 
    }
    
    if(clientDetails.mobile) { 
        pdf.text(clientDetails.mobile, 195, currentY, { align: 'right' }); 
    } else {
        pdf.text("NIL (not provided)", 195, currentY, { align: 'right' }); 
    }

    // Services Table
    const tableData = items.map(item => [
      item.desc || 'Service Item',
      item.qty.toString(),
      `${invoiceDetails.currency}${parseFloat(item.rate || 0).toFixed(2)}`,
      `${invoiceDetails.currency}${(item.qty * item.rate).toFixed(2)}`
    ]);

    let finalY = currentY + 15;

    import('jspdf-autotable').then(({ default: autoTable }) => {
      autoTable(pdf, {
        startY: finalY,
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

      // Total Section
      finalY = pdf.lastAutoTable.finalY + 15;
      pdf.setDrawColor(235, 215, 63);
      pdf.setLineWidth(0.5);
      pdf.line(120, finalY - 5, 195, finalY - 5);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Total Due:", 120, finalY + 2);
      
      pdf.setTextColor(235, 215, 63);
      pdf.text(`${invoiceDetails.currency}${total.toFixed(2)}`, 195, finalY + 2, { align: 'right' });

      // Bank Details & QR Code section at the bottom
      const bottomStartY = finalY + 25;
      
      const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
      if (selectedBank) {
         pdf.setTextColor(235, 215, 63);
         pdf.setFontSize(11);
         pdf.setFont("helvetica", "bold");
         pdf.text("PAYMENT DETAILS:", 15, bottomStartY);
         
         pdf.setTextColor(200, 200, 200);
         pdf.setFontSize(10);
         pdf.setFont("helvetica", "normal");
         const splitBankDetails = pdf.splitTextToSize(selectedBank.details, 100);
         pdf.text(splitBankDetails, 15, bottomStartY + 7);
         
         // Inject QR Code if available
         if (qrCodeDataUrl) {
             // Add QR Code at the bottom right
             pdf.addImage(qrCodeDataUrl, 'PNG', 160, bottomStartY - 5, 35, 35);
             pdf.setTextColor(150, 150, 150);
             pdf.setFontSize(8);
             pdf.text("Scan to Pay", 177, bottomStartY + 33, { align: 'center' });
         }
      }

      // Footer Notes
      if (invoiceDetails.notes) {
          const notesY = bottomStartY + 45;
          pdf.setDrawColor(50, 50, 50);
          pdf.line(15, notesY, 195, notesY);
          
          pdf.setTextColor(150, 150, 150);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "italic");
          const splitNotes = pdf.splitTextToSize(invoiceDetails.notes, 180);
          pdf.text(splitNotes, 15, notesY + 8);
      }

      pdf.save(`Dripp_Media_Invoice_${invoiceDetails.number}.pdf`);
      
      // Save to local history
      const savedInvoices = JSON.parse(localStorage.getItem('dripp_invoices') || '[]');
      savedInvoices.push({ ...invoiceDetails, clientDetails, items, total, id: Date.now() });
      localStorage.setItem('dripp_invoices', JSON.stringify(savedInvoices));
    });
  };

  const generateSecureLink = async () => {
    const pass = Math.random().toString(36).slice(-6).toUpperCase();
    setSharePassword(pass);
    try {
        const payload = {
            clientDetails,
            invoiceDetails,
            items,
            myDetails,
            selectedBank: bankAccounts.find(b => b.id === selectedBankId),
            total,
            password: pass,
            type: 'invoice'
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
            alert("Failed to save invoice securely.");
        }
    } catch(err) {
        alert("API error while generating secure link.");
    }
  };

  if (!isClient) return <div style={{padding: '50px', color: 'white'}}>Loading Invoice Maker...</div>;

  return (
    <div style={{ color: 'white', maxWidth: '1400px', margin: '0 auto' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoice Maker Pro</h1>
        <p className={styles.subtitle}>Generate premium, secure invoices with integrated payment codes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: BUILDER FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Smart Paste Section */}
          <div className={styles.smartPasteCard}>
            <h3 style={{ marginBottom: '10px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} /> AI Smart Paste
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px', lineHeight: 1.4 }}>
              Paste unstructured project details here. We'll extract the client name, contact info, and line items automatically.
            </p>
            <textarea 
              value={smartText} 
              onChange={(e) => setSmartText(e.target.value)} 
              placeholder="e.g. Invoice for John Doe. Email: john@doe.com. Web Dev for $1500 and Hosting for $200."
              className={styles.inputField} 
              rows={3} 
              style={{ resize: 'vertical', marginBottom: '15px' }} 
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSmartPaste} disabled={isAutoFilling} style={{ background: isAutoFillSuccess ? '#4ade80' : '#ebd73f', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: isAutoFilling ? 'wait' : 'pointer', fontWeight: 'bold', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
                {isAutoFilling ? (
                   <><Loader size={18} className={styles.spin} /> Analyzing text...</>
                ) : isAutoFillSuccess ? (
                   <><CheckCircle2 size={18} /> Success!</>
                ) : (
                   'Auto-Fill Invoice'
                )}
              </button>
              <button onClick={handleClearForm} className={styles.btnDanger} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                Clear Form
              </button>
            </div>
          </div>

          {/* Section 1: My Details (Defaults) */}
          <div className={styles.card} style={{ borderLeft: '4px solid #ebd73f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  {myDetailsLocked ? <Lock size={20} /> : <Edit3 size={20} />} My Default Details
                </h3>
                {myDetailsLocked ? (
                   <button onClick={() => setMyDetailsLocked(false)} className={styles.btn} style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Unlock to Edit</button>
                ) : (
                   <button onClick={saveMyDetails} className={styles.btnPrimary} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '5px' }}><Save size={14}/> Save Defaults</button>
                )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', opacity: myDetailsLocked ? 0.6 : 1, transition: 'opacity 0.3s' }}>
              <div>
                 <label className={styles.label}>Company Name</label>
                 <input type="text" value={myDetails.companyName} onChange={e => handleMyDetailsChange('companyName', e.target.value)} disabled={myDetailsLocked} className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    GST Number
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ebd73f', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal' }}>
                       <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)} /> Include in Invoice
                    </label>
                 </label>
                 <input type="text" value={myDetails.gst} onChange={e => handleMyDetailsChange('gst', e.target.value)} disabled={myDetailsLocked || !includeGST} className={styles.inputField} style={{ opacity: includeGST ? 1 : 0.5 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                 <label className={styles.label}>Official Address</label>
                 <textarea value={myDetails.address} onChange={e => handleMyDetailsChange('address', e.target.value)} disabled={myDetailsLocked} className={styles.inputField} rows={2} />
              </div>
              <div>
                 <label className={styles.label}>Email Address</label>
                 <input type="email" value={myDetails.email} onChange={e => handleMyDetailsChange('email', e.target.value)} disabled={myDetailsLocked} className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Phone Number</label>
                 <input type="text" value={myDetails.phone} onChange={e => handleMyDetailsChange('phone', e.target.value)} disabled={myDetailsLocked} className={styles.inputField} />
              </div>
            </div>
          </div>

          {/* Section 2: Client & Invoice Info */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Invoice & Client Info
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                 <label className={styles.label}>Invoice Number</label>
                 <input type="text" value={invoiceDetails.number} onChange={e => handleInvoiceChange('number', e.target.value)} className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Currency</label>
                 <select value={invoiceDetails.currency} onChange={e => handleInvoiceChange('currency', e.target.value)} className={styles.inputField}>
                    {CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                 </select>
              </div>
              <div>
                 <label className={styles.label}>Date</label>
                 <input type="date" value={invoiceDetails.date} onChange={e => handleInvoiceChange('date', e.target.value)} className={styles.inputField} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                 <label className={styles.label}>Client Name</label>
                 <input type="text" value={clientDetails.name} onChange={e => handleClientChange('name', e.target.value)} placeholder="Acme Corp" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Client Email</label>
                 <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="john@acme.com" className={styles.inputField} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                 <label className={styles.label}>Client Billing Address</label>
                 <textarea value={clientDetails.address} onChange={e => handleClientChange('address', e.target.value)} placeholder="123 Corporate Blvd" className={styles.inputField} rows={2} />
              </div>
            </div>
          </div>

          {/* Section 3: Services & Rates */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Line Items</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 2 }}>
                    <input 
                       list="inv-services-list"
                       type="text" 
                       value={item.desc} 
                       onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                       placeholder="Service Description"
                       className={styles.inputField}
                       style={{ padding: '8px 12px' }}
                    />
                    <datalist id="inv-services-list">
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
                    <span style={{color: '#888'}}>{invoiceDetails.currency}</span>
                    <input 
                      type="number" 
                      value={item.rate} 
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className={styles.inputField}
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ padding: '0 10px', color: '#ebd73f', fontWeight: 'bold', fontSize: '0.9rem', width: '100px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                     <span style={{color: '#666', fontWeight: 'normal'}}>=</span> {invoiceDetails.currency}{(item.qty * item.rate).toFixed(2)}
                  </div>
                  <button onClick={() => removeItem(index)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity=1} onMouseOut={(e) => e.currentTarget.style.opacity=0.7}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addItem} className={styles.btn}>
              <Plus size={16} /> Add Another Item
            </button>
            
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '1.1rem', color: '#888' }}>Total Amount:</span>
               <span style={{ fontSize: '1.3rem', color: '#ebd73f', fontWeight: 'bold' }}>{invoiceDetails.currency}{total.toFixed(2)}</span>
            </div>
          </div>
          
        </div>
        
        {/* RIGHT COLUMN: PAYMENT & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           <CurrencyConverter />

           {/* Payment Methods */}
           <div className={styles.card}>
              <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} /> Payment Methods
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Select Bank Account</label>
                  <select 
                      className={styles.inputField} 
                      value={selectedBankId} 
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      style={{ width: '100%' }}
                  >
                      {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {!isEditingBank ? (
                  <>
                      {selectedBankId && bankAccounts.find(b => b.id === selectedBankId) && (
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', fontSize: '0.85rem', color: '#ccc', lineHeight: '1.6', position: 'relative' }}>
                             <button onClick={() => {
                                 setEditingBankDetails(bankAccounts.find(b => b.id === selectedBankId));
                                 setIsEditingBank(true);
                             }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ebd73f', cursor: 'pointer' }}><Edit3 size={16} /></button>
                             {bankAccounts.find(b => b.id === selectedBankId).details.split('\n').map((line, i) => (
                                 <div key={i}>{line}</div>
                             ))}
                             {qrCodeDataUrl && (
                                 <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                     <img src={qrCodeDataUrl} alt="Payment QR" style={{ width: '120px', borderRadius: '8px', border: '2px solid #fff' }} />
                                     <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>Scan to Pay via UPI</div>
                                 </div>
                             )}
                          </div>
                      )}
                      <button onClick={() => {
                          setEditingBankDetails({ id: 'bank_' + Date.now(), name: '', details: '', upi: '' });
                          setIsEditingBank(true);
                      }} className={styles.btn} style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}>
                          <Plus size={16} /> Add New Payment Method
                      </button>
                  </>
              ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ marginBottom: '10px' }}>
                          <label className={styles.label}>Display Name</label>
                          <input type="text" value={editingBankDetails.name} onChange={e => setEditingBankDetails({...editingBankDetails, name: e.target.value})} placeholder="e.g., HDFC Current" className={styles.inputField} />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                          <label className={styles.label}>Bank Details (Account No, IFSC, etc.)</label>
                          <textarea value={editingBankDetails.details} onChange={e => setEditingBankDetails({...editingBankDetails, details: e.target.value})} placeholder="Bank: HDFC\nA/C No: 123456" className={styles.inputField} rows={4} />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                          <label className={styles.label}>UPI ID (optional, generates QR)</label>
                          <input type="text" value={editingBankDetails.upi} onChange={e => setEditingBankDetails({...editingBankDetails, upi: e.target.value})} placeholder="name@bank" className={styles.inputField} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={handleSaveBank} className={styles.btnPrimary} style={{ flex: 1, padding: '8px' }}>Save</button>
                          <button onClick={() => setIsEditingBank(false)} className={styles.btn} style={{ flex: 1, padding: '8px', justifyContent: 'center' }}>Cancel</button>
                      </div>
                      {editingBankDetails.id.includes('bank_') && bankAccounts.find(b => b.id === editingBankDetails.id) && (
                          <button onClick={() => handleDeleteBank(editingBankDetails.id)} className={styles.btnDanger} style={{ width: '100%', padding: '8px', marginTop: '10px' }}>
                              Delete Method
                          </button>
                      )}
                  </div>
              )}
           </div>

           <div className={styles.card}>
              <label className={styles.label}>Footer Notes (Optional)</label>
              <textarea 
                  className={styles.inputField} 
                  rows={3} 
                  value={invoiceDetails.notes} 
                  onChange={e => handleInvoiceChange('notes', e.target.value)} 
                  placeholder="Thank you for your business!" 
                  style={{ resize: 'vertical' }}
              />
           </div>

           {/* Actions */}
           <div className={styles.card} style={{ background: 'linear-gradient(145deg, #1a1a1a, #111)' }}>
             <h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Export & Share</h3>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                <strong style={{ fontSize: '1.1rem' }}>Total Due:</strong>
                <strong style={{ fontSize: '1.2rem', color: '#ebd73f' }}>{invoiceDetails.currency}{total.toFixed(2)}</strong>
             </div>

             <button onClick={generatePDF} className={styles.btnPrimary} style={{ width: '100%', padding: '12px', justifyContent: 'center', marginBottom: '15px' }}>
               <Download size={18} /> Download Invoice PDF
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

        </div>
      </div>
    </div>
  );
}
