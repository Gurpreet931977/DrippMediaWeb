'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Download, Package, Search, Share2, FileText, Lock, Edit3, Save, CheckCircle, ShieldCheck, Loader, CheckCircle2, Copy, MessageCircle } from 'lucide-react';
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
  const [customDialog, setCustomDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, onCancel: null });
  const showAlert = (message, title = 'Notification') => setCustomDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null, onCancel: null });
  const showConfirm = (message, onConfirm, onCancel = null, title = 'Confirm Action') => setCustomDialog({ isOpen: true, type: 'confirm', title, message, onConfirm, onCancel });
  const closeDialog = () => setCustomDialog(prev => ({ ...prev, isOpen: false }));

  const [clientDetails, setClientDetails] = useState({
    name: '',
    brandName: '',
    address: '',
    email: '',
    mobile: '',
    gst: ''
  });

  const [items, setItems] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // -- SMART PASTE & SHARING --
  const [smartText, setSmartText] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [sharePassword, setSharePassword] = useState('');

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
    
    // 1. Pre-process address lines and GST so they don't interfere
    const lines = smartText.split('\n').map(l => l.trim()).filter(l => l);
    const addressLines = [];
    
    // Extract GST upfront if present, and remove from lines
    let gstFound = '';
    const gstMatch = smartText.match(/GST(?:[\s:-]+)?([0-9A-Z]{15})/i);
    if (gstMatch) {
        gstFound = gstMatch[1].toUpperCase();
        // Remove GST from individual lines to prevent it matching as an item
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes('gst')) {
                lines[i] = lines[i].replace(/GST(?:[\s:-]+)?([0-9A-Z]{15})/i, '').trim();
            }
        }
    }
    
    // 2. Extract Emails (All)
    const emailMatches = [...smartText.matchAll(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g)].map(m => m[0]);
    if (emailMatches.length > 0) parsedClient.emails = [...new Set(emailMatches)];

    // 3. Extract Phones (All)
    const phoneRegex = /(?:\+\d{1,3}[\s-]*)?(?:\d{10}|\d{5}[\s-]\d{5}|\(?\d{3}\)?[\s-]\d{3}[\s-]\d{4})/g;
    const rawPhoneMatches = [...smartText.matchAll(phoneRegex)].map(m => m[0]);
    
    const confirmedPhones = [];
    for (let phone of [...new Set(rawPhoneMatches)]) {
        if (!phone.includes('+')) {
            const isPhone = await new Promise(resolve => {
                 showConfirm(
                     `We detected the number "${phone}". Is this a mobile/contact number?`,
                     () => resolve(true),
                     () => resolve(false),
                     'Confirm Contact Number'
                 );
            });
            if (isPhone) {
                confirmedPhones.push(phone);
            }
        } else {
            confirmedPhones.push(phone);
        }
    }
    
    if (confirmedPhones.length > 0) parsedClient.phones = confirmedPhones;

    // 4. Extract Name & Brand
    const people = doc.people().out('array');
    if (people.length > 0) {
        parsedClient.names = [people[0].replace(/[.,;:!?]$/, '').trim()];
    } else {
        const nameMatch = smartText.match(/(?:name|client):\s*([a-zA-Z\s]+)/i);
        if (nameMatch) parsedClient.names = [nameMatch[1].trim()];
    }

    const forMatch = smartText.match(/for\s+([A-Z][a-zA-Z0-9'\s]+?(?=\.|\n))/);
    if (forMatch) {
        parsedClient.brands = [forMatch[1].trim()];
    } else {
        const organizations = doc.organizations().out('array');
        if (organizations.length > 0) {
            parsedClient.brands = [organizations[0].replace(/[.,;:!?]$/, '').trim()];
        } else {
            const brandMatch = smartText.match(/(?:brand|company):\s*([a-zA-Z\s0-9&]+)/i);
            if (brandMatch) parsedClient.brands = [brandMatch[1].trim()];
        }
    }

    // 5. Extract Items/Prices using Advanced Heuristics + NLP
    const parsedItems = [];
    
    lines.forEach(line => {
        if (!line) return;
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        if (line.match(/Total Investment/i)) return;
        if (line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)) return;
        // Don't parse phones as items if they were confirmed
        let isPhoneLine = false;
        for (let cp of confirmedPhones) {
             if (line.includes(cp)) isPhoneLine = true;
        }
        if (isPhoneLine) return;
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
        
        if (finalAddress) {
            parsedClient.address = [finalAddress];
        }
    }
    
    if (gstFound) {
        parsedClient.gst = [gstFound];
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
    checkScalarConflict('brandName', parsedClient.brands, clientDetails.brandName, 'Brand Name');
    checkScalarConflict('address', parsedClient.address, clientDetails.address, 'Address');
    checkScalarConflict('gst', parsedClient.gst, clientDetails.gst, 'GST Number');

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
        setItems([]);
    });
  };

  const handleCopyAllDetails = () => {
    const data = {
      clientDetails,
      invoiceDetails,
      items,
      selectedBankId,
      includeGST,
      myDetails
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => showAlert('All form details copied to clipboard! You can paste them later.'))
      .catch(() => showAlert('Failed to copy to clipboard.'));
  };

  const handlePasteAllDetails = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (data.clientDetails) setClientDetails(data.clientDetails);
      if (data.invoiceDetails) setInvoiceDetails(data.invoiceDetails);
      if (data.items) setItems(data.items);
      if (data.selectedBankId) setSelectedBankId(data.selectedBankId);
      if (data.includeGST !== undefined) setIncludeGST(data.includeGST);
      if (data.myDetails) setMyDetails(data.myDetails);
      showAlert('All form details pasted successfully!');
    } catch (err) {
      showAlert('Failed to paste. Make sure you copied valid form details earlier.');
    }
  };


  // -- PDF GENERATION (PRESENTATION STYLE) --
  const generatePDF = async () => {
    const pdf = new jsPDF('l', 'px', [1920, 1080]);
    
    // Build array of page IDs to capture
    const validItems = items.filter(i => i.desc || i.rate > 0);
    const pages = ['cover'];
    for (let i = 0; i < validItems.length; i += 5) {
        pages.push(`items_${i}`);
    }
    pages.push('payment');
    
    for (let i = 0; i < pages.length; i++) {
        const pageId = pages[i];
        const slide = document.getElementById(`inv-slide-${pageId}`);
        if (slide) {
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
    }
    
    const brandNameStr = clientDetails.brandName ? `_${clientDetails.brandName.replace(/\s+/g, '_')}` : (clientDetails.name ? `_${clientDetails.name.replace(/\s+/g, '_')}` : '');
    pdf.save(`Dripp_Media_Invoice${brandNameStr}_${invoiceDetails.number}.pdf`);
    
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
    showAlert('Message copied to clipboard!');
  };

  const generateSecureLink = async () => {
    const pass = Math.floor(1000 + Math.random() * 9000).toString();
    setSharePassword(pass);
    try {
        const payload = {
            clientDetails,
            invoiceDetails,
            items,
            myDetails,
            selectedBank: { ...(bankAccounts.find(b => b.id === selectedBankId) || {}), qrCode: qrCodeDataUrl },
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
            setShareLink(`${window.location.origin}/invoice/${data.id}`);
        } else {
            showAlert("Failed to save invoice securely.");
        }
    } catch(err) {
        showAlert("API error while generating secure link.");
    }
  };

  if (!isClient) return <div style={{padding: '50px', color: 'white'}}>Loading Invoice Maker...</div>;

  return (

      <div style={{ color: 'white', maxWidth: '1400px', margin: '0 auto' }}>

      {/* CUSTOM DIALOG (ALERT / CONFIRM) */}
      {customDialog.isOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div style={{ background: '#111', border: '1px solid rgba(235, 215, 63, 0.2)', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '24px', color: '#ebd73f', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif" }}>{customDialog.title}</h3>
            <p style={{ fontSize: '16px', color: '#ccc', marginBottom: '30px', lineHeight: '1.5' }}>{customDialog.message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {customDialog.type === 'confirm' && (
                <button 
                  onClick={() => {
                    if (customDialog.onCancel) customDialog.onCancel();
                    closeDialog();
                  }} 
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
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
      , document.body)}

      {/* CONFLICT RESOLUTION MODAL */}
      {showConflictModal && conflicts[currentConflictIdx] && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '24px', padding: '40px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#ebd73f', marginBottom: '20px' }}>Resolve Auto-Fill Conflict</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <strong style={{ display: 'block', marginBottom: '10px', color: '#fff' }}>{conflicts[currentConflictIdx].label}</strong>
                
                {conflicts[currentConflictIdx].type === 'scalar_multiple' && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        Multiple values found in pasted text: <br/>
                        {conflicts[currentConflictIdx].values.map((v, i) => <div key={i}>- {v}</div>)}
                    </div>
                )}
                {conflicts[currentConflictIdx].type === 'scalar_exists' && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        Current form has: <strong>{conflicts[currentConflictIdx].currentValue}</strong><br/>
                        Pasted text has: <strong>{conflicts[currentConflictIdx].value}</strong>
                    </div>
                )}
                {conflicts[currentConflictIdx].type === 'item_match_rate' && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        Item already exists with the same rate ({invoiceDetails.currency}{conflicts[currentConflictIdx].item.rate}).
                    </div>
                )}
                {conflicts[currentConflictIdx].type === 'item_diff_rate' && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        Existing Item Rate: {invoiceDetails.currency}{conflicts[currentConflictIdx].existingItem.rate}<br/>
                        Pasted Item Rate: {invoiceDetails.currency}{conflicts[currentConflictIdx].item.rate}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {conflicts[currentConflictIdx].type.startsWith('scalar') && (
                    <>
                        <button onClick={() => handleConflictResolution('overwrite', conflicts[currentConflictIdx].values ? conflicts[currentConflictIdx].values[0] : null)} className={styles.btn} style={{ borderColor: '#ebd73f', color: '#ebd73f' }}>
                            Overwrite Current Value
                        </button>
                        <button onClick={() => handleConflictResolution('append')} className={styles.btn}>
                            Append / Keep Both
                        </button>
                    </>
                )}
                
                {conflicts[currentConflictIdx].type === 'item_match_rate' && (
                    <>
                        <button onClick={() => handleConflictResolution('merge')} className={styles.btn} style={{ borderColor: '#ebd73f', color: '#ebd73f' }}>
                            Merge (Add +{conflicts[currentConflictIdx].item.qty} Quantity)
                        </button>
                        <button onClick={() => handleConflictResolution('add_new')} className={styles.btn}>
                            Add as Separate Line Item
                        </button>
                    </>
                )}
                
                {conflicts[currentConflictIdx].type === 'item_diff_rate' && (
                    <>
                        <button onClick={() => handleConflictResolution('merge', 'new')} className={styles.btn} style={{ borderColor: '#ebd73f', color: '#ebd73f' }}>
                            Update Rate & Add Quantity
                        </button>
                        <button onClick={() => handleConflictResolution('merge', 'old')} className={styles.btn}>
                            Keep Old Rate & Add Quantity
                        </button>
                        <button onClick={() => handleConflictResolution('add_new')} className={styles.btn}>
                            Add as Separate Line Item
                        </button>
                    </>
                )}

                <button onClick={() => handleConflictResolution('skip')} className={styles.btn} style={{ marginTop: '10px', borderColor: '#ff4d4d', color: '#ff4d4d' }}>
                    Skip / Ignore Pasted Value
                </button>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
                Conflict {currentConflictIdx + 1} of {conflicts.length}
            </div>
          </div>
        </div>
      , document.body)}

    
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
              <button onClick={handleSmartPaste} disabled={isAutoFilling || isAutoFillSuccess || isAutoFillDone} style={{ background: (isAutoFillSuccess || isAutoFillDone) ? '#ebd73f' : '#ebd73f', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: (isAutoFilling || isAutoFillSuccess || isAutoFillDone) ? 'wait' : 'pointer', fontWeight: 'bold', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
                {isAutoFilling ? (
                   <><Loader size={18} className={styles.spin} /> Analyzing text...</>
                ) : isAutoFillSuccess ? (
                   <><div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #000', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> Filling form...</>
                ) : isAutoFillDone ? (
                   <><CheckCircle2 size={18} color="#000" /> Success!</>
                ) : (
                   'Auto-Fill Invoice'
                )}
              </button>
              <button onClick={handleClearForm} className={styles.btnDanger} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                Clear Form
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleCopyAllDetails} className={styles.btn} style={{ padding: '10px 20px', borderRadius: '8px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Copy size={18} /> Copy Form Details
              </button>
              <button onClick={handlePasteAllDetails} className={styles.btn} style={{ padding: '10px 20px', borderRadius: '8px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Paste Form Details
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
                 <select value={invoiceDetails.currency} onChange={e => setInvoiceDetails({...invoiceDetails, currency: e.target.value})} className={styles.inputField}>
                    {allCurrencies.map(c => (
                        <option key={c.code} value={c.symbol}>{c.code} ({c.symbol})</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className={styles.label}>Date</label>
                 <input type="date" value={invoiceDetails.date} onChange={e => handleInvoiceChange('date', e.target.value)} className={styles.inputField} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                 <label className={styles.label}>Client Name</label>
                 <input type="text" value={clientDetails.name} onChange={e => handleClientChange('name', e.target.value)} placeholder="John Doe" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Brand Name</label>
                 <input type="text" value={clientDetails.brandName} onChange={e => handleClientChange('brandName', e.target.value)} placeholder="Acme Corp" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Client Email</label>
                 <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="john@acme.com" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>Client Mobile</label>
                 <input type="text" value={clientDetails.mobile} onChange={e => handleClientChange('mobile', e.target.value)} placeholder="+1 555-0199" className={styles.inputField} />
              </div>
              <div>
                 <label className={styles.label}>GST Number (Optional)</label>
                 <input type="text" value={clientDetails.gst} onChange={e => handleClientChange('gst', e.target.value)} placeholder="22AAAAA0000A1Z5" className={styles.inputField} />
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
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                  <div style={{ flex: '2 1 250px', minWidth: '250px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                         type="text" 
                         value={item.desc} 
                         onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                         placeholder="Item Title"
                         className={styles.inputField}
                         onFocus={() => setActiveDropdown(index)}
                         onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                         style={{ padding: '12px 40px 12px 15px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#ebd73f', pointerEvents: 'none', fontSize: '0.8rem' }}>
                         ▼
                      </div>
                    </div>
                    {activeDropdown === index && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 'calc(100% + 8px)', 
                        left: 0, 
                        width: '100%', 
                        background: '#1a1a1a', 
                        border: '1px solid #333', 
                        borderRadius: '12px', 
                        zIndex: 50, 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)' 
                      }}>
                         <div style={{ position: 'absolute', top: '-6px', left: '20px', width: '12px', height: '12px', background: '#1a1a1a', borderTop: '1px solid #333', borderLeft: '1px solid #333', transform: 'rotate(45deg)' }} />
                         <div style={{ padding: '10px 0', position: 'relative', zIndex: 2, background: '#1a1a1a', borderRadius: '12px' }}>
                           {DEFAULT_SERVICES.map((s, i) => (
                              <div 
                                 key={s} 
                                 onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleItemChange(index, 'desc', s);
                                    setActiveDropdown(null);
                                 }}
                                 style={{ 
                                   padding: '12px 20px', 
                                   cursor: 'pointer', 
                                   color: '#fff', 
                                   fontWeight: '500',
                                   fontSize: '0.9rem',
                                   transition: 'background 0.2s',
                                   borderBottom: i < DEFAULT_SERVICES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                 }}
                                 onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                 onMouseOut={(e) => e.target.style.background = 'transparent'}
                              >
                                 {s}
                              </div>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{color: '#888'}}>Qty</span>
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      placeholder="1"
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
                      placeholder="0"
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
                  <div style={{ flexBasis: '100%', marginTop: '10px' }}>
                     <textarea 
                       value={item.details || ''} 
                       onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                       placeholder="e.g. Includes 5 custom pages, responsive design, and 1 year of hosting..."
                       className={styles.inputField}
                       style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', minHeight: '60px' }}
                     />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={addItem} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#ebd73f'; e.currentTarget.style.color = '#ebd73f'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; }}
            >
              <Plus size={16} /> Another Item
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
                             {(() => {
                                 const b = bankAccounts.find(b => b.id === selectedBankId);
                                 if (!b.bankName && b.details) {
                                     return b.details.split('\n').map((line, i) => <div key={i}>{line}</div>);
                                 }
                                 return (
                                     <>
                                         <div>Bank: {b.bankName}</div>
                                         <div>Name: {b.accountName}</div>
                                         <div style={{ fontFamily: 'monospace' }}>A/C: {b.accountNumber}</div>
                                         {b.ifsc && <div style={{ fontFamily: 'monospace' }}>IFSC: {b.ifsc}</div>}
                                         {b.swift && <div style={{ fontFamily: 'monospace' }}>SWIFT: {b.swift}</div>}
                                     </>
                                 );
                             })()}
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
                <strong style={{ fontSize: '1.1rem', whiteSpace: 'nowrap' }}>Total Due:</strong>
                <strong style={{ fontSize: '1.2rem', color: '#ebd73f', wordBreak: 'break-word', textAlign: 'right' }}>{invoiceDetails.currency}{total.toFixed(2)}</strong>
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
                   <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input type="text" readOnly value={shareLink} onClick={() => window.open(`${shareLink}?pwd=${sharePassword}`, '_blank')} className={styles.inputField} style={{ padding: '8px', flex: 1, cursor: 'pointer' }} title="Click to open link directly" />
                      <button onClick={() => copyToClipboard(shareLink)} className={styles.btn} style={{ padding: '8px', background: 'rgba(235, 215, 63, 0.1)', borderColor: 'rgba(235, 215, 63, 0.3)' }} title="Copy Link"><Copy size={16} /></button>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Client Password:</p>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" readOnly value={sharePassword} className={styles.inputField} style={{ padding: '8px', letterSpacing: '2px', fontWeight: 'bold', flex: 1 }} />
                      <button onClick={() => copyToClipboard(sharePassword)} className={styles.btn} style={{ padding: '8px', background: 'rgba(235, 215, 63, 0.1)', borderColor: 'rgba(235, 215, 63, 0.3)' }} title="Copy Password"><Copy size={16} /></button>
                   </div>
                   <button onClick={handleCopyMessage} className={styles.btnShare}>
                     <Share2 size={18} /> Copy Share Message
                   </button>
                </div>
             )}
           </div>


      {/* HIDDEN INVOICE SLIDES FOR PDF GENERATION */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          
          {/* COVER SLIDE */}
          <div id={`inv-slide-cover`} style={{ width: '1920px', height: '1080px', background: '#050505', color: 'white', padding: '100px 120px', display: 'none', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.15) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.1) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h1 style={{ fontSize: '120px', color: '#ebd73f', margin: 0, letterSpacing: '-4px', fontWeight: '900', fontFamily: "'Panchang', sans-serif" }}>{myDetails.companyName.toUpperCase()}</h1>
                  <p style={{ fontSize: '32px', color: '#888', margin: '10px 0 0 0', fontWeight: '300' }}>TAX INVOICE</p>
              </div>
              
              <div style={{ position: 'relative', zIndex: 1, flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '24px', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Billed To</p>
                  <h2 style={{ fontSize: '80px', color: '#fff', margin: '0 0 10px 0', lineHeight: 1.1, fontFamily: "'Panchang', sans-serif" }}>{clientDetails.brandName || clientDetails.name || 'Client'}</h2>
                  <p style={{ fontSize: '30px', color: '#aaa', margin: 0 }}>{clientDetails.name ? clientDetails.name + ' | ' : ''}{clientDetails.email}</p>
                  {clientDetails.gst && <p style={{ fontSize: '24px', color: '#aaa', margin: '10px 0 0 0' }}>GST: {clientDetails.gst}</p>}
              </div>
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', borderTop: '2px solid rgba(235, 215, 63, 0.3)', paddingTop: '40px', marginTop: 'auto' }}>
                  <div>
                      <p style={{ fontSize: '20px', color: '#666', margin: '0 0 5px 0' }}>Invoice Date</p>
                      <p style={{ fontSize: '28px', color: '#fff', margin: 0 }}>{clientDetails.date}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '20px', color: '#666', margin: '0 0 5px 0' }}>Invoice Number</p>
                      <p style={{ fontSize: '28px', color: '#fff', margin: 0 }}>{invoiceDetails.number}</p>
                  </div>
              </div>
          </div>

          {/* ITEM SLIDES */}
          {(() => {
              const validItems = items.filter(i => i.desc || i.rate > 0);
              const slides = [];
              for (let i = 0; i < validItems.length; i += 5) {
                  const chunk = validItems.slice(i, i + 5);
                  slides.push(
                      <div key={i} id={`inv-slide-items_${i}`} style={{ width: '1920px', height: '1080px', background: '#050505', color: 'white', padding: '100px 120px', display: 'none', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: '10%', left: '20%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />
                          
                          <div style={{ position: 'relative', zIndex: 1, marginBottom: '60px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '30px' }}>
                              <h1 style={{ fontSize: '50px', color: '#ebd73f', margin: 0, fontFamily: "'Panchang', sans-serif" }}>Line Items {validItems.length > 5 ? `(Part ${Math.floor(i/5)+1})` : ''}</h1>
                          </div>
                          
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                              {chunk.map((item, idx) => (
                                  <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '30px 40px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div style={{ flex: 1, paddingRight: '30px' }}>
                                          <h3 style={{ fontSize: '36px', color: '#fff', margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif" }}>{item.desc || 'Service Item'}</h3>
                                          {item.details && (
                                              <p style={{ fontSize: '20px', color: '#ccc', margin: '0 0 15px 0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{item.details}</p>
                                          )}
                                          <p style={{ fontSize: '24px', color: '#888', margin: 0 }}>Qty: {item.qty} &nbsp;|&nbsp; Rate: {invoiceDetails.currency}{parseFloat(item.rate || 0).toLocaleString()}</p>
                                      </div>
                                      <div style={{ fontSize: '42px', color: '#fff', fontWeight: 'bold', paddingTop: '5px' }}>
                                          <span style={{ color: '#666' }}>=</span> {invoiceDetails.currency}{(item.qty * item.rate).toLocaleString()}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              }
              return slides;
          })()}

          {/* PAYMENT & TOTAL SLIDE */}
          <div id={`inv-slide-payment`} style={{ width: '1920px', height: '1080px', background: '#050505', color: 'white', padding: '100px 120px', display: 'none', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.1) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1, marginBottom: '60px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '30px' }}>
                  <h1 style={{ fontSize: '50px', color: '#ebd73f', margin: 0, fontFamily: "'Panchang', sans-serif" }}>Payment Details</h1>
              </div>
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '60px', flex: 1 }}>
                  {/* Left: Bank Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      {(() => {
                          const bank = bankAccounts.find(b => b.id === selectedBankId);
                          if (!bank) return <p style={{ fontSize: '24px', color: '#888' }}>No payment details selected.</p>;
                          
                          // Handle fallback schema (name, details)
                          if (!bank.bankName && bank.details) {
                              const lines = bank.details.split('\n');
                              return (
                                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '50px', borderRadius: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                      {lines.map((line, idx) => (
                                          <div key={idx} style={{ marginBottom: '20px' }}>
                                              <p style={{ fontSize: '30px', color: '#fff', margin: 0 }}>{line}</p>
                                          </div>
                                      ))}
                                  </div>
                              );
                          }

                          return (
                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '50px', borderRadius: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <div style={{ marginBottom: '30px' }}>
                                      <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>Bank Name</p>
                                      <p style={{ fontSize: '36px', color: '#fff', margin: 0 }}>{bank.bankName}</p>
                                  </div>
                                  <div style={{ marginBottom: '30px' }}>
                                      <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>Account Name</p>
                                      <p style={{ fontSize: '36px', color: '#fff', margin: 0 }}>{bank.accountName}</p>
                                  </div>
                                  <div style={{ marginBottom: '30px' }}>
                                      <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>Account Number</p>
                                      <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: 'monospace' }}>{bank.accountNumber}</p>
                                  </div>
                                  {bank.ifsc && (
                                      <div style={{ marginBottom: '30px' }}>
                                          <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>Routing / IFSC</p>
                                          <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: 'monospace' }}>{bank.ifsc}</p>
                                      </div>
                                  )}
                                  {bank.swift && (
                                      <div style={{ marginBottom: '30px' }}>
                                          <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>SWIFT Code</p>
                                          <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: 'monospace' }}>{bank.swift}</p>
                                      </div>
                                  )}
                                  {bank.upi && (
                                      <div>
                                          <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>UPI ID</p>
                                          <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: 'monospace' }}>{bank.upi}</p>
                                      </div>
                                  )}
                              </div>
                          );
                      })()}
                  </div>
                  
                  {/* Right: QR Code and Total */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      {(() => {
                          const bank = bankAccounts.find(b => b.id === selectedBankId);
                          if (bank && qrCodeDataUrl) {
                              return (
                                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '50px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 20px 0' }}>Scan to Pay via UPI</p>
                                      <div style={{ background: '#fff', padding: '20px', borderRadius: '16px' }}>
                                          <img src={qrCodeDataUrl} alt="QR Code" style={{ width: '250px', height: '250px', objectFit: 'contain' }} />
                                      </div>
                                  </div>
                              );
                          }
                          return null;
                      })()}
                      
                      <div style={{ background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.2)', padding: '50px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: '0' }}>
                          <p style={{ fontSize: '24px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0', whiteSpace: 'nowrap' }}>Total Amount Due</p>
                          <h2 style={{ fontSize: 'clamp(40px, 5vw, 70px)', color: '#ebd73f', margin: 0, fontFamily: "'Panchang', sans-serif", wordBreak: 'break-word', textAlign: 'center' }}>{invoiceDetails.currency}{parseFloat(total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                      </div>
                  </div>
              </div>
          </div>
      </div>

        </div>
      </div>
    </div>
  );
}
