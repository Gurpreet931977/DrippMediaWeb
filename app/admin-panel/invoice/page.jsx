'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Package, Search, Share2, FileText, Lock, Edit3, Save, CheckCircle, ShieldCheck, Loader, CheckCircle2, Copy, MessageCircle , X, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import styles from '../admin.module.css';
import { supabase } from '../../utils/supabaseClient';
import CurrencyConverter from '../components/CurrencyConverter';
import { allCurrencies } from '../components/currencies';

const DEFAULT_SERVICES = [
  'Video Production - 1 Minute Edit',
  'Social Media Content Strategy',
  'Graphic Design Retainer',
  'Web Development Retainer',
  'SEO Monthly Optimization',
];

export default function InvoiceMaker() {
  const [isClient, setIsClient] = useState(false);
  
  // -- MY DETAILS (LOCKED BY DEFAULT) --
  const [myDetailsLocked, setMyDetailsLocked] = useState(true);
  const [myDetails, setMyDetails] = useState({
    companyName: 'Dripp Media',
    address: '123 Business St, Creative District\nNew Delhi, India',
    email: 'mediadripp@gmail.com',
    phone: '',
    gst: '07AAACD1234E1Z5'
  });

  // -- BANK ACCOUNTS & PAYMENTS --
  const [includeGST, setIncludeGST] = useState(false);
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
  
  // Smart Paste State
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isAutoFillSuccess, setIsAutoFillSuccess] = useState(false);
  const [isAutoFillDone, setIsAutoFillDone] = useState(false);
  
  // Conflict Resolution State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [pendingAutoFillData, setPendingAutoFillData] = useState(null);

  // -- INVOICE STATE --
  const [invoiceDetails, setInvoiceDetails] = useState({
    number: 'INV-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString().split('T')[0],
    currency: '₹',
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: 'Payment is due within 15 days. Thank you for your business!'
  });

  // Fix timezone issue on mount
  useEffect(() => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(Date.now() - tzOffsetMs).toISOString().split('T')[0];
    const dueLocalDate = new Date(Date.now() - tzOffsetMs + 15 * 86400000).toISOString().split('T')[0];
    setInvoiceDetails(prev => ({ ...prev, date: localDate, dueDate: dueLocalDate }));
  }, []);

  
  // Custom Dialog State
  const [customDialog, setCustomDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null });
  const showAlert = (message, title = 'Notification') => setCustomDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (message, onConfirm, title = 'Confirm Action') => setCustomDialog({ isOpen: true, type: 'confirm', title, message, onConfirm });
  const closeDialog = () => setCustomDialog(prev => ({ ...prev, isOpen: false }));

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
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // -- INITIALIZATION & LOCAL STORAGE & SUPABASE --
  useEffect(() => {
    setIsClient(true);
    // Load Defaults
    const localMyDetails = localStorage.getItem('dripp_my_details');
    if (localMyDetails) {
        try { setMyDetails(JSON.parse(localMyDetails)); } catch (e) {}
    }
    
    const fetchBanks = async () => {
      try {
        const { data, error } = await supabase.from('bank_accounts').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        
        if (data && data.length > 0) {
           setBankAccounts(data);
           setSelectedBankId(data[0].id);
        } else {
           // Fallback to localStorage if Supabase is empty (potential first run)
           const storedBanks = localStorage.getItem('dripp_bank_accounts');
           if (storedBanks) {
              const parsed = JSON.parse(storedBanks);
              if (parsed && parsed.length > 0) {
                  setBankAccounts(parsed);
                  setSelectedBankId(parsed[0].id);
              }
           }
        }
      } catch (err) {
        console.warn("Could not fetch from Supabase. Falling back to local storage.", err);
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
      }
    };
    fetchBanks();

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
     showAlert("Default details saved successfully!");
  };

  
  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMyDetailsChange('qrCode', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBank = async () => {
      let updatedBanks = [...bankAccounts];
      const existingIdx = updatedBanks.findIndex(b => b.id === editingBankDetails.id);
      
      try {
        if (existingIdx >= 0) {
            const { error } = await supabase.from('bank_accounts').update({
                name: editingBankDetails.name,
                details: editingBankDetails.details,
                upi: editingBankDetails.upi
            }).eq('id', editingBankDetails.id);
            if (error) throw error;
            updatedBanks[existingIdx] = editingBankDetails;
        } else {
            const { id, ...bankData } = editingBankDetails;
            const { data, error } = await supabase.from('bank_accounts').insert(bankData).select().single();
            if (error) throw error;
            if (data) {
                updatedBanks.push(data);
                editingBankDetails.id = data.id;
            } else {
                updatedBanks.push(editingBankDetails);
            }
        }
      } catch (err) {
        console.error("Supabase Error, saving to local storage fallback", err);
        if (existingIdx >= 0) {
           updatedBanks[existingIdx] = editingBankDetails;
        } else {
           updatedBanks.push(editingBankDetails);
        }
        localStorage.setItem('dripp_bank_accounts', JSON.stringify(updatedBanks));
      }

      setBankAccounts(updatedBanks);
      setSelectedBankId(editingBankDetails.id);
      setIsEditingBank(false);
  };
  
  const handleDeleteBank = async (id) => {
      showConfirm("Are you sure you want to delete this payment method?", async () => {
          const updatedBanks = bankAccounts.filter(b => b.id !== id);
          if (updatedBanks.length === 0) {
              showAlert("You must have at least one payment method.");
              return;
          }
          try {
             const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
             if (error) throw error;
          } catch (err) {
             console.error("Supabase delete failed", err);
             localStorage.setItem('dripp_bank_accounts', JSON.stringify(updatedBanks));
          }
          setBankAccounts(updatedBanks);
          setSelectedBankId(updatedBanks[0].id);
          setIsEditingBank(false);
      });
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
    await new Promise(r => setTimeout(r, 800));
    const nlp = (await import('compromise')).default;
    const doc = nlp(smartText);

    let parsedClient = {};
    let parsedInvoice = {};
    
    // 1. Extract Emails (All)
    const emailMatches = [...smartText.matchAll(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g)].map(m => m[0]);
    if (emailMatches.length > 0) parsedClient.emails = [...new Set(emailMatches)];

    // 2. Extract Phones (All)
    const phoneMatches = [...smartText.matchAll(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g)].map(m => m[0]);
    if (phoneMatches.length > 0) parsedClient.phones = [...new Set(phoneMatches)];

    // 3. Extract Name & Brand
    const people = doc.people().out('array');
    if (people.length > 0) {
        parsedClient.names = [people[0].replace(/[.,;:!?]$/, '').trim()];
    } else {
        const nameMatch = smartText.match(/(?:name|client):\s*([a-zA-Z\s]+)/i);
        if (nameMatch) parsedClient.names = [nameMatch[1].trim()];
    }

    // 4. Extract Items/Prices using Advanced Heuristics + NLP
    const parsedItems = [];
    const addressLines = [];
    const lines = smartText.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        if (line.match(/Total Investment/i)) return;
        if (line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)) return;
        if (line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)) return;
        if (line.match(/^(?:name|client|brand|company|for):\s*/i)) return;
        
        let qty = 1;
        let rate = 0;
        let desc = "";
        
        let m1 = line.match(/^[-*•]?\s*(.*?)\s*\((\d+)\)\s*[:-]?\s*[$€£₹]?\s*([\d,.]+)\s*each/i);
        if (m1) {
            parsedItems.push({desc: m1[1].trim(), qty: parseInt(m1[2]), rate: parseFloat(m1[3].replace(/,/g, ''))});
            return;
        }
        
        let m2 = line.match(/^[-*•]?\s*(.*?)\s*=\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m2) {
             if (m2[1].toLowerCase().includes('total')) return;
             parsedItems.push({desc: m2[1].trim(), qty: 1, rate: parseFloat(m2[2].replace(/,/g, ''))});
             return;
        }
        
        let m3 = line.match(/^[-*•]?\s*(.*?)\s*-\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m3) {
             parsedItems.push({desc: m3[1].trim(), qty: 1, rate: parseFloat(m3[2].replace(/,/g, ''))});
             return;
        }

        const sDoc = nlp(line);
        const money = sDoc.money().out('array');
        if (money.length > 0) {
            const rateStr = money[0];
            const hasCurrency = rateStr.match(/[$€£₹]/) || line.match(/[$€£₹]|dollars?|usd|eur|gbp|inr|rupees?|bucks?|cents?/i);
            
            if (hasCurrency || !rateStr.trim().match(/^[\d,.\s]+$/)) {
                rate = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
                if (!isNaN(rate)) {
                    desc = line.replace(rateStr, '').replace(/for|at|costing|cost|USD|EUR|GBP|INR|\$|€|£|₹/gi, '');
                    desc = desc.replace(/we need to do (a|an)?/i, '').replace(/we need (a|an)?/i, '').replace(/they want (a|an)?/i, '');
                    desc = desc.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '').trim();
                    if (desc) {
                        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
                        parsedItems.push({ desc, qty: 1, rate });
                    }
                    return;
                }
            }
        }
        
        addressLines.push(line);
    });

    if (addressLines.length > 0) {
        let rawAddress = addressLines.join('\n');
        
        // Extract GST if present (and remove it from raw address so it can be appended neatly at the end)
        let gstFound = '';
        const gstMatch = rawAddress.match(/GST(?:[\s:-]+)?([0-9A-Z]{15})/i);
        if (gstMatch) {
            gstFound = gstMatch[1].toUpperCase();
            rawAddress = rawAddress.replace(gstMatch[0], '');
        }

        // Remove typical address labels before the colon (e.g., "Building No./Flat No.:", "State:")
        let cleaned = rawAddress.replace(/(?:[a-zA-Z /.-]+:)/g, ',');
        
        // Split by commas or newlines, trim, and remove empty
        let parts = cleaned.replace(/\n/g, ',').split(',').map(s => s.trim()).filter(s => s);
        
        // Deduplicate sequential or identical words
        let uniqueParts = [];
        parts.forEach(p => {
            if (!uniqueParts.some(u => u.toLowerCase() === p.toLowerCase())) {
                uniqueParts.push(p);
            }
        });
        
        let finalAddress = uniqueParts.join(', ');
        if (gstFound) {
             finalAddress += `\nGST: ${gstFound}`;
        }
        
        if (finalAddress) {
            parsedClient.address = [finalAddress];
        }
    }

    if (smartText.includes('₹') || smartText.includes('INR')) parsedInvoice.currency = '₹';
    else if (smartText.includes('€') || smartText.includes('EUR')) parsedInvoice.currency = '€';
    else if (smartText.includes('£') || smartText.includes('GBP')) parsedInvoice.currency = '£';
    else if (smartText.includes('$') || smartText.includes('USD')) parsedInvoice.currency = '$';

    // --- CONFLICT DETECTION ---
    const detectedConflicts = [];

    const checkScalarConflict = (fieldName, parsedValues, currentValue, label) => {
        if (!parsedValues || parsedValues.length === 0) return;
        const uniqueValues = [...new Set(parsedValues)];
        
        if (uniqueValues.length > 1) {
            detectedConflicts.push({
                type: 'scalar_multiple',
                field: fieldName,
                label,
                values: uniqueValues,
                currentValue
            });
        } else if (currentValue && currentValue !== uniqueValues[0]) {
            detectedConflicts.push({
                type: 'scalar_exists',
                field: fieldName,
                label,
                value: uniqueValues[0],
                currentValue
            });
        } else {
            if (!parsedClient.staged) parsedClient.staged = {};
            parsedClient.staged[fieldName] = uniqueValues[0];
        }
    };

    checkScalarConflict('email', parsedClient.emails, clientDetails.email, 'Email Address');
    checkScalarConflict('mobile', parsedClient.phones, clientDetails.mobile, 'Phone Number');
    checkScalarConflict('name', parsedClient.names, clientDetails.name, 'Client Name');
    checkScalarConflict('address', parsedClient.address, clientDetails.address, 'Address');

    // Helper for Items
    const pendingItems = [];
    
    // First, consolidate parsed items themselves
    const consolidatedParsedItems = [];
    parsedItems.forEach(pi => {
        const sim = consolidatedParsedItems.find(c => c.desc.toLowerCase().replace(/s$/, '') === pi.desc.toLowerCase().replace(/s$/, ''));
        if (sim && sim.rate === pi.rate) {
            sim.qty += pi.qty;
        } else {
            consolidatedParsedItems.push(pi);
        }
    });

    consolidatedParsedItems.forEach(pi => {
        const sim = items.find(ex => ex.desc && ex.desc.toLowerCase().replace(/s$/, '') === pi.desc.toLowerCase().replace(/s$/, ''));
        if (sim) {
            if (sim.rate === pi.rate) {
                detectedConflicts.push({
                    type: 'item_match_rate',
                    item: pi,
                    existingItem: sim,
                    label: `Duplicate Item Found: ${pi.desc}`
                });
            } else {
                detectedConflicts.push({
                    type: 'item_diff_rate',
                    item: pi,
                    existingItem: sim,
                    label: `Item with different rate found: ${pi.desc}`
                });
            }
        } else {
            pendingItems.push(pi);
        }
    });

    setPendingAutoFillData({
        parsedClient,
        parsedInvoice,
        pendingItems,
        stagedClient: parsedClient.staged || {}
    });

    setIsAutoFilling(false);

    if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setCurrentConflictIdx(0);
        setShowConflictModal(true);
    } else {
        applySmartPaste({
            parsedClient,
            parsedInvoice,
            pendingItems,
            stagedClient: parsedClient.staged || {}
        });
    }
  };

  const applySmartPaste = (data) => {
      let updatedClient = { ...clientDetails, ...data.stagedClient };
      let updatedInvoice = { ...invoiceDetails };
      
      if (data.parsedInvoice.currency) updatedInvoice.currency = data.parsedInvoice.currency;
      
      setClientDetails(updatedClient);
      setInvoiceDetails(updatedInvoice);
      
      if (data.pendingItems.length > 0) {
          const validCurrent = items.filter(i => i.desc || i.rate > 0);
          setItems([...validCurrent, ...data.pendingItems]);
      }
      
      setSmartText('');
      setIsAutoFillSuccess(true);
      setTimeout(() => {
          setIsAutoFillSuccess(false);
          setIsAutoFillDone(true);
          setTimeout(() => setIsAutoFillDone(false), 2000);
      }, 600);
  };

  const handleConflictResolution = (action, valueOverride = null) => {
      const conflict = conflicts[currentConflictIdx];
      const data = { ...pendingAutoFillData };
      
      if (conflict.type.startsWith('scalar')) {
          if (action === 'overwrite') {
              data.stagedClient[conflict.field] = valueOverride || conflict.value || conflict.values[0];
          } else if (action === 'append') {
              const current = data.stagedClient[conflict.field] || conflict.currentValue;
              const toAppend = valueOverride || conflict.value || conflict.values.join(' / ');
              data.stagedClient[conflict.field] = current ? `${current} / ${toAppend}` : toAppend;
          }
      } else if (conflict.type.startsWith('item')) {
          if (action === 'merge') {
              const itemsCopy = [...items];
              const idx = itemsCopy.findIndex(i => i === conflict.existingItem);
              if (idx !== -1) {
                  itemsCopy[idx].qty += conflict.item.qty;
                  if (valueOverride === 'new' && conflict.type === 'item_diff_rate') {
                       itemsCopy[idx].rate = conflict.item.rate;
                  }
                  setItems(itemsCopy);
              }
          } else if (action === 'add_new') {
              data.pendingItems.push(conflict.item);
          }
      }
      
      setPendingAutoFillData(data);
      
      if (currentConflictIdx < conflicts.length - 1) {
          setCurrentConflictIdx(currentConflictIdx + 1);
      } else {
          setShowConflictModal(false);
          applySmartPaste(data);
      }
  };

  const handleClearForm = () => {
    showConfirm('Are you sure you want to clear the entire form?', () => {
        setClientDetails({ name: '', address: '', email: '', mobile: '' });
        setInvoiceDetails(prev => ({ ...prev, number: 'INV-' + Math.floor(1000 + Math.random() * 9000), notes: 'Payment is due within 15 days. Thank you for your business!' }));
        setItems([{ desc: 'Video Production Services', qty: 1, rate: 0 }]);
    });
  };

  // -- PDF GENERATION (A4 SINGLE PAGER) --
  
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const payload = {
        password: sharePassword,
        type: 'invoice',
        invoiceDetails,
        clientDetails,
        items,
        total,
        selectedBankId,
        bankAccounts
      };
      
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShareLink(`${window.location.origin}/quote/${data.id}`);
        setShowShareModal(true);
      } else {
        customAlert(data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error(error);
      customAlert('An error occurred');
    }
    setIsSharing(false);
  };

  const generatePDF = async () => {
    const slide = document.getElementById(`inv-a4-template`);
    if (slide) {
        slide.style.display = 'block';
        try {
            // A4 width in px at 96 DPI is ~794px. We'll use 800px for a clean container.
            // Scale up for better resolution
            const canvas = await html2canvas(slide, { scale: 3, backgroundColor: '#050505', useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Create portrait A4 pdf
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // Render as a single long page if it exceeds A4 height, 
            // by customizing the PDF size to match exactly the content height!
            // Wait, standard jsPDF addPage does not support dynamic sizes well if the document was init as A4.
            // Actually, we can just init the document with custom dimensions matching the ratio!
            // Let's create a custom sized PDF that perfectly fits the single pager.
            const customPdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
            customPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            const brandNameStr = clientDetails.brandName ? `_${clientDetails.brandName.replace(/\s+/g, '_')}` : (clientDetails.name ? `_${clientDetails.name.replace(/\s+/g, '_')}` : '');
            customPdf.save(`Dripp_Media_Invoice${brandNameStr}_${invoiceDetails.number}.pdf`);
            
        } catch (err) {
            console.error(`Error rendering PDF`, err);
        }
        slide.style.display = 'none';
    }
    
    // Save to local history
    const savedInvoices = JSON.parse(localStorage.getItem('dripp_invoices') || '[]');
    savedInvoices.push({ ...invoiceDetails, clientDetails, items, total, id: Date.now() });
    localStorage.setItem('dripp_invoices', JSON.stringify(savedInvoices));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyMessage = () => {
    const clientName = clientDetails.name ? clientDetails.name.split(' ')[0] : 'Client';
    const msg = `Hey ${clientName}!\n\nHere is your secure invoice from Dripp Media.\n\n🔗 Link: ${shareLink}\n🔑 Password: ${sharePassword}\n\nLet me know if you have any questions!`;
    copyToClipboard(msg);
    customAlert("Message copied to clipboard!");
  };

  const activeBank = bankAccounts.find(b => b.id === selectedBankId) || null;
  const validItems = items.filter(i => i.desc || i.rate > 0);

  return (
    <div style={{ color: invoiceDetails.theme === 'light' ? '#111111' : 'white', maxWidth: '1400px', margin: '0 auto' }}>
      {/* CUSTOM DIALOG (ALERT / CONFIRM) */}
      {customDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div style={{ background: '#111', border: '1px solid rgba(235, 215, 63, 0.2)', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '24px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif" }}>{customDialog.title}</h3>
            <p style={{ fontSize: '16px', color: '#ccc', marginBottom: '30px', lineHeight: '1.5' }}>{customDialog.message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {customDialog.type === 'confirm' && (
                <button onClick={closeDialog} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: invoiceDetails.theme === 'light' ? '#666666' : '#888', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              )}
              <button 
                onClick={() => {
                  if (customDialog.type === 'confirm' && customDialog.onConfirm) {
                    customDialog.onConfirm();
                  }
                  closeDialog();
                }} 
                style={{ flex: 1, padding: '12px', background: '#ebd73f', border: 'none', color: '#111', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {customDialog.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', border: '1px solid rgba(235, 215, 63, 0.2)', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: invoiceDetails.theme === 'light' ? '#111111' : 'white', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ fontSize: '28px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: '0 0 30px 0', fontFamily: "'Panchang', sans-serif" }}>Share Invoice</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <label className={styles.label}>Secure Link</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={shareLink} readOnly className={styles.inputField} style={{ flex: 1 }} />
                    <button onClick={() => { copyToClipboard(shareLink); customAlert('Link copied!'); }} className={styles.btn} style={{ padding: '0 20px' }}><Copy size={20} /></button>
                </div>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
                <label className={styles.label}>Password</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={sharePassword} readOnly className={styles.inputField} style={{ flex: 1 }} />
                    <button onClick={() => { copyToClipboard(sharePassword); customAlert('Password copied!'); }} className={styles.btn} style={{ padding: '0 20px' }}><Copy size={20} /></button>
                </div>
            </div>

            <button onClick={handleCopyMessage} className={styles.btn} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Share2 size={20} /> Copy Share Message
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT METHODS MODAL */}
      {showPaymentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
             <div style={{ background: '#111', border: '1px solid rgba(235, 215, 63, 0.2)', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <button onClick={() => {
                    setShowPaymentModal(false);
                    setIsEditingBank(false);
                }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: invoiceDetails.theme === 'light' ? '#111111' : 'white', cursor: 'pointer' }}><X size={24} /></button>
                <h2 style={{ fontSize: '28px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: '0 0 30px 0', fontFamily: "'Panchang', sans-serif" }}>Payment Methods</h2>
                
                {isEditingBank ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" value={myDetails.bankName} onChange={e => handleMyDetailsChange('bankName', e.target.value)} placeholder="Bank Name" className={styles.inputField} />
                        <input type="text" value={myDetails.accountName} onChange={e => handleMyDetailsChange('accountName', e.target.value)} placeholder="Account Name" className={styles.inputField} />
                        <input type="text" value={myDetails.accountNumber} onChange={e => handleMyDetailsChange('accountNumber', e.target.value)} placeholder="Account Number" className={styles.inputField} />
                        <input type="text" value={myDetails.ifsc} onChange={e => handleMyDetailsChange('ifsc', e.target.value)} placeholder="Routing / IFSC Code" className={styles.inputField} />
                        <input type="text" value={myDetails.swift} onChange={e => handleMyDetailsChange('swift', e.target.value)} placeholder="SWIFT Code (Optional)" className={styles.inputField} />
                        
                        <div style={{ marginTop: '10px' }}>
                            <label className={styles.label}>Upload QR Code (Optional)</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', cursor: 'pointer', border: '1px dashed rgba(255, 255, 255, 0.2)' }}>
                                <Upload size={20} /> {myDetails.qrCode ? 'Change QR Code' : 'Select Image'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQRUpload} />
                            </label>
                        </div>
                        {myDetails.qrCode && (
                            <img src={myDetails.qrCode} alt="QR Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', marginTop: '10px' }} />
                        )}
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                           <button onClick={() => setIsEditingBank(false)} className={styles.btn} style={{ flex: 1, background: 'transparent', border: '1px solid #444', color: invoiceDetails.theme === 'light' ? '#666666' : '#888' }}>Cancel</button>
                           <button onClick={handleSaveBank} className={styles.btn} style={{ flex: 1 }}>Save</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                            {bankAccounts.map(bank => (
                                <div key={bank.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: selectedBankId === bank.id ? '1px solid #ebd73f' : '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedBankId(bank.id)}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{bank.bankName}</h4>
                                        <p style={{ margin: 0, color: invoiceDetails.theme === 'light' ? '#666666' : '#888', fontSize: '14px' }}>{bank.accountNumber}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); startEditBank(bank); }} style={{ background: 'transparent', border: 'none', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBank(bank.id); }} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => {
                            setMyDetails({ id: '', bankName: '', accountName: '', accountNumber: '', ifsc: '', swift: '', qrCode: null });
                            setIsEditingBank(true);
                        }} className={styles.btn} style={{ width: '100%', background: 'rgba(235, 215, 63, 0.1)', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', border: '1px solid rgba(235, 215, 63, 0.3)' }}>
                            + Add New Payment Method
                        </button>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: invoiceDetails.theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)', padding: '20px 30px', borderRadius: '24px', border: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', background: '#ebd73f', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: invoiceDetails.theme === 'light' ? '#ffffff' : 'black', fontWeight: 'bold', fontSize: '20px', fontFamily: "'Panchang', sans-serif" }}>D</div>
            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', fontFamily: "'Panchang', sans-serif" }}>Invoice Maker</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={handleClearForm} className={styles.btn} style={{ background: 'rgba(255, 255, 255, 0.05)', color: invoiceDetails.theme === 'light' ? '#111111' : 'white' }}>Clear</button>
            
            <button 
                onClick={() => handleInvoiceChange('theme', invoiceDetails.theme === 'light' ? 'dark' : 'light')} 
                className={styles.btn} 
                style={{ background: invoiceDetails.theme === 'light' ? '#fff' : '#222', color: invoiceDetails.theme === 'light' ? '#000' : '#fff', border: '1px solid rgba(235, 215, 63, 0.3)' }}
            >
                {invoiceDetails.theme === 'light' ? 'Light Mode ☀️' : 'Dark Mode 🌙'}
            </button>
            <button onClick={handleShare} className={styles.btn} style={{ background: 'rgba(235, 215, 63, 0.1)', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', border: '1px solid rgba(235, 215, 63, 0.3)' }} disabled={isSharing}>
                {isSharing ? 'Saving...' : <><Share2 size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}/> Share Invoice</>}
            </button>
            <button onClick={generatePDF} className={styles.btn}>Download PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* MAIN EDITOR COLUMN */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Smart Paste Section */}
          <div className={styles.card} style={{ background: 'linear-gradient(145deg, rgba(235, 215, 63, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)', border: '1px solid rgba(235, 215, 63, 0.2)' }}>
              <h3 style={{ marginBottom: '15px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={20} /> AI Smart Paste
              </h3>
              <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', fontSize: '14px', marginBottom: '20px' }}>Paste a block of text (address, email, phone, gst) and our AI will instantly format it into the correct fields.</p>
              
              <textarea 
                  value={smartText}
                  onChange={(e) => setSmartText(e.target.value)}
                  placeholder="Paste details here (e.g. John Doe, +1 234 567 890, 123 Main St...)"
                  className={styles.inputField}
                  rows={3}
                  style={{ marginBottom: '15px' }}
              />
              
              <button 
                  onClick={handleSmartPaste} 
                  className={styles.btn} 
                  style={{ width: '100%', opacity: isAutoFilling ? 0.7 : 1 }}
                  disabled={isAutoFilling}
              >
                  {isAutoFilling ? 'Extracting Details...' : 'Auto-Fill Details'}
              </button>
          </div>

          {/* Section 2: Invoice & Client Info */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '20px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={20} /> Invoice & Client Info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                 <label className={styles.label}>Invoice Number</label>
                 <input type="text" value={invoiceDetails.number} onChange={e => handleInvoiceChange('number', e.target.value)} className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Currency</label>
                 <select value={invoiceDetails.currency} onChange={e => handleInvoiceChange('currency', e.target.value)} className={styles.inputField}>
                   <option value="$">USD ($)</option>
                   <option value="₹">INR (₹)</option>
                   <option value="€">EUR (€)</option>
                   <option value="£">GBP (£)</option>
                   <option value="A$">AUD (A$)</option>
                   <option value="C$">CAD (C$)</option>
                 </select>
              </div>
              <div>
                 <label className={styles.label}>Date</label>
                 <input type="date" value={invoiceDetails.date} onChange={e => handleInvoiceChange('date', e.target.value)} className={styles.inputField} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                 <label className={styles.label}>Client Name</label>
                 <input type="text" value={clientDetails.name} onChange={e => handleClientChange('name', e.target.value)} placeholder="Acme Corp" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Client Email</label>
                 <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="john@acme.com" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Client Mobile</label>
                 <input type="text" value={clientDetails.mobile} onChange={e => handleClientChange('mobile', e.target.value)} placeholder="+1 555-0199" className={styles.inputField} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                 <label className={styles.label}>Client Billing Address</label>
                 <textarea value={clientDetails.address} onChange={e => handleClientChange('address', e.target.value)} placeholder="123 Corporate Blvd" className={styles.inputField} rows={2} />
              </div>
            </div>
          </div>

          {/* Section 3: Services & Rates */}
          <div className={styles.card}>
            <h3 style={{ marginBottom: '15px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f' }}>Line Items</h3>
            
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <input type="text" placeholder="Service Description" value={item.desc} onChange={e => handleItemChange(idx, 'desc', e.target.value)} className={styles.inputField} />
                </div>
                <div style={{ width: '100px' }}>
                  <input type="number" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className={styles.inputField} />
                </div>
                <div style={{ width: '150px' }}>
                  <input type="number" placeholder="Rate" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} className={styles.inputField} />
                </div>
                <div style={{ width: '120px', display: 'flex', alignItems: 'center', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', justifyContent: 'center', fontWeight: 'bold' }}>
                   {invoiceDetails.currency}{(item.qty * item.rate).toLocaleString()}
                </div>
                <button onClick={() => removeItem(idx)} className={styles.btn} style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '0 15px', height: '50px' }}><X size={20} /></button>
              </div>
            ))}
            <button onClick={addItem} className={styles.btn} style={{ background: 'transparent', border: '1px dashed rgba(255, 255, 255, 0.2)', width: '100%' }}>+ Add Item</button>
            
            <div style={{ marginTop: '20px' }}>
                <label className={styles.label}>Invoice Notes (Terms/Conditions)</label>
                <textarea value={invoiceDetails.notes} onChange={e => handleInvoiceChange('notes', e.target.value)} className={styles.inputField} rows={3} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (TOTALS & PAYMENT) */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className={styles.card} style={{ background: 'linear-gradient(180deg, rgba(235, 215, 63, 0.1) 0%, rgba(5, 5, 5, 0) 100%)', border: '1px solid rgba(235, 215, 63, 0.2)' }}>
            <h3 style={{ color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: '0 0 20px 0', fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>Total Amount Due</h3>
            <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif" }}>{invoiceDetails.currency}{parseFloat(total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h1>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', color: invoiceDetails.theme === 'light' ? '#666666' : '#888' }}>
                <span>Subtotal</span>
                <span>{invoiceDetails.currency}{total.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: 0 }}>Payment Method</h3>
                  <button onClick={() => setShowPaymentModal(true)} style={{ background: 'transparent', border: 'none', color: invoiceDetails.theme === 'light' ? '#666666' : '#888', cursor: 'pointer', textDecoration: 'underline' }}>Manage</button>
              </div>

              {activeBank ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>{activeBank.bankName}</p>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: '0 0 5px 0', fontSize: '14px' }}>Name: {activeBank.accountName}</p>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: '0 0 5px 0', fontSize: '14px', fontFamily: 'monospace' }}>A/C: {activeBank.accountNumber}</p>
                      {activeBank.ifsc && <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: '0 0 5px 0', fontSize: '14px', fontFamily: 'monospace' }}>IFSC/Routing: {activeBank.ifsc}</p>}
                      {activeBank.qrCode && (
                          <div style={{ marginTop: '15px', background: invoiceDetails.theme === 'light' ? '#000' : '#fff', padding: '10px', borderRadius: '12px', display: 'inline-block' }}>
                              <img src={activeBank.qrCode} alt="QR Code" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                          </div>
                      )}
                  </div>
              ) : (
                  <button onClick={() => setShowPaymentModal(true)} className={styles.btn} style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                      Select Payment Method
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* HIDDEN A4 TEMPLATE FOR PDF */}
      <div style={{ position: 'absolute', top: '-15000px', left: '-15000px' }}>
          <div id="inv-a4-template" style={{ 
              width: '800px', 
              background: invoiceDetails.theme === 'light' ? '#ffffff' : '#050505', 
              color: invoiceDetails.theme === 'light' ? '#111111' : 'white', 
              padding: '60px', 
              display: 'none', 
              flexDirection: 'column', 
              boxSizing: 'border-box', 
              position: 'relative', 
              overflow: 'hidden',
              fontFamily: "'Inter', sans-serif"
          }}>
              {/* Background Ambient Glow */}
              <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '60%', height: '60%', background: invoiceDetails.theme === 'light' ? 'radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, rgba(255, 255, 255, 0) 70%)' : 'radial-gradient(circle, rgba(235, 215, 63, 0.1) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '30px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h1 style={{ fontSize: '32px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: '0 0 5px 0', fontFamily: "'Panchang', sans-serif" }}>Dripp Media</h1>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: 0, fontSize: '14px' }}>hello@drippmedia.com</p>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: '5px 0 0 0', fontSize: '14px' }}>www.drippmedia.com</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <h1 style={{ fontSize: '36px', color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif", letterSpacing: '2px' }}>INVOICE</h1>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>#{invoiceDetails.number}</p>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: 0, fontSize: '14px' }}>Date: {invoiceDetails.date}</p>
                  </div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                  <div style={{ flex: 1, paddingRight: '20px' }}>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Billed To</p>
                      <h3 style={{ color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', fontSize: '20px', margin: '0 0 5px 0' }}>{clientDetails.name || 'Client Name'}</h3>
                      {clientDetails.email && <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', margin: '0 0 5px 0', fontSize: '14px' }}>{clientDetails.email}</p>}
                      {clientDetails.mobile && <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', margin: '0 0 5px 0', fontSize: '14px' }}>{clientDetails.mobile}</p>}
                      {clientDetails.address && <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: '0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{clientDetails.address}</p>}
                  </div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                      <thead>
                          <tr style={{ borderBottom: '2px solid rgba(235, 215, 63, 0.3)' }}>
                              <th style={{ textAlign: 'left', padding: '15px 10px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</th>
                              <th style={{ textAlign: 'center', padding: '15px 10px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', width: '80px' }}>Qty</th>
                              <th style={{ textAlign: 'right', padding: '15px 10px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', width: '120px' }}>Rate</th>
                              <th style={{ textAlign: 'right', padding: '15px 10px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', width: '120px' }}>Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          {validItems.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                                  <td style={{ padding: '20px 10px', color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', fontSize: '15px' }}>{item.desc || 'Service Item'}</td>
                                  <td style={{ padding: '20px 10px', color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', fontSize: '15px', textAlign: 'center' }}>{item.qty}</td>
                                  <td style={{ padding: '20px 10px', color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', fontSize: '15px', textAlign: 'right' }}>{invoiceDetails.currency}{parseFloat(item.rate || 0).toLocaleString()}</td>
                                  <td style={{ padding: '20px 10px', color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', fontSize: '15px', textAlign: 'right', fontWeight: 'bold' }}>{invoiceDetails.currency}{(item.qty * item.rate).toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                  <div style={{ width: '350px', background: invoiceDetails.theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)', padding: '25px', borderRadius: '16px', border: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', marginBottom: '15px', fontSize: '15px' }}>
                          <span>Subtotal</span>
                          <span>{invoiceDetails.currency}{parseFloat(total || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', borderTop: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '15px', alignItems: 'center' }}>
                          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Due</span>
                          <span style={{ fontSize: '28px', color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontWeight: 'bold', fontFamily: "'Panchang', sans-serif" }}>{invoiceDetails.currency}{parseFloat(total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                  </div>
              </div>

              {activeBank && (
                  <div style={{ position: 'relative', zIndex: 1, borderTop: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                          <p style={{ color: invoiceDetails.theme === 'light' ? '#b5a110' : '#ebd73f', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Payment Details</p>
                          <p style={{ color: invoiceDetails.theme === 'light' ? '#111111' : '#fff', margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold' }}>{activeBank.bankName}</p>
                          <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', margin: '0 0 5px 0', fontSize: '14px' }}>Name: {activeBank.accountName}</p>
                          <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', margin: '0 0 5px 0', fontSize: '14px', fontFamily: 'monospace' }}>A/C: {activeBank.accountNumber}</p>
                          {activeBank.ifsc && <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', margin: '0 0 5px 0', fontSize: '14px', fontFamily: 'monospace' }}>Routing/IFSC: {activeBank.ifsc}</p>}
                          {activeBank.swift && <p style={{ color: invoiceDetails.theme === 'light' ? '#444444' : '#aaa', margin: '0 0 5px 0', fontSize: '14px', fontFamily: 'monospace' }}>SWIFT: {activeBank.swift}</p>}
                      </div>
                      {activeBank.qrCode && (
                          <div style={{ background: invoiceDetails.theme === 'light' ? '#000' : '#fff', padding: '10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <img src={activeBank.qrCode} alt="QR Code" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
                              <span style={{ color: invoiceDetails.theme === 'light' ? '#ffffff' : 'black', fontSize: '10px', marginTop: '5px', fontWeight: 'bold' }}>Scan to Pay</span>
                          </div>
                      )}
                  </div>
              )}
              
              {invoiceDetails.notes && (
                  <div style={{ position: 'relative', zIndex: 1, marginTop: '30px', borderTop: invoiceDetails.theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
                      <p style={{ color: invoiceDetails.theme === 'light' ? '#666666' : '#888', margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>{invoiceDetails.notes}</p>
                  </div>
              )}
          </div>
    </div>
      </div>
  );
}
