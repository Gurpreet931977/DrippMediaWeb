'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Download, Package, Search, Share2, FileText, Lock, Edit3, Save, CheckCircle, ShieldCheck, Loader, CheckCircle2, Copy, MessageCircle, ExternalLink, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import styles from '../admin.module.css';
import CurrencyConverter from '../components/CurrencyConverter';
import { allCurrencies } from '../components/currencies';
import { useGenz } from '../../contexts/GenzContext';

const DEFAULT_SERVICES = [
  'Video Production - 1 Minute Edit',
  'Social Media Content Strategy',
  'Graphic Design Retainer',
  'Web Development Retainer',
  'SEO Monthly Optimization',
];

export default function InvoiceMaker() {
  const [isClient, setIsClient] = useState(false);
  const { isGenz } = useGenz() || { isGenz: false };
  
  // -- MY DETAILS (LOCKED BY DEFAULT) --
  const [myDetailsLocked, setMyDetailsLocked] = useState(true);
  const [myDetails, setMyDetails] = useState({
    companyName: 'Dripp Media',
    address: '123 Business St, Creative District\nNew Delhi, India',
    email: 'gurpreet@drippmedia.com',
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
  const [copiedItem, setCopiedItem] = useState(null); // 'link' | 'password' | 'message'
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  // 'idle' | 'logging' | 'success' | 'skipped' | 'error'
  const [sheetLogStatus, setSheetLogStatus] = useState('idle');

  // -- INITIALIZATION & LOCAL STORAGE & SUPABASE --
  useEffect(() => {
    setIsClient(true);
    // Load Defaults
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const json = await res.json();
        
        if (json.data) {
            setMyDetails(json.data);
            localStorage.setItem('dripp_my_details', JSON.stringify(json.data)); // keep local in sync
        }
      } catch (err) {
        console.warn("Could not fetch settings from API. Falling back to local storage.", err);
        const localMyDetails = localStorage.getItem('dripp_my_details');
        if (localMyDetails) {
            try { setMyDetails(JSON.parse(localMyDetails)); } catch (e) {}
        }
      }
    };
    fetchSettings();
    
    const fetchBanks = async () => {
      try {
        const res = await fetch('/api/admin/bank');
        if (!res.ok) throw new Error('Failed to fetch bank accounts');
        const json = await res.json();
        const data = json.data;
        
        if (data && data.length > 0) {
           setBankAccounts(data);
           setSelectedBankId(data[0].id);
        } else {
           // Fallback to localStorage if API returns empty (potential first run)
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
        console.warn("Could not fetch from API. Falling back to local storage.", err);
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

  const parseInvoicePayload = (payload) => {
    if (!payload) return;
    if (payload.clientName) setClientDetails(prev => ({ ...prev, name: payload.clientName }));
    else if (payload.brandName) setClientDetails(prev => ({ ...prev, name: payload.brandName }));
    if (payload.brandName) setClientDetails(prev => ({ ...prev, brandName: payload.brandName }));
    if (payload.clientEmail) setClientDetails(prev => ({ ...prev, email: payload.clientEmail }));
    if (payload.clientMobile) setClientDetails(prev => ({ ...prev, mobile: payload.clientMobile }));
    if (payload.clientAddress) setClientDetails(prev => ({ ...prev, address: payload.clientAddress }));
    if (payload.gstNumber) setClientDetails(prev => ({ ...prev, gst: payload.gstNumber }));
    if (payload.notes) setInvoiceDetails(prev => ({ ...prev, notes: payload.notes }));
    if (payload.dueDate) setInvoiceDetails(prev => ({ ...prev, dueDate: payload.dueDate }));
    if (payload.invoiceNumber) setInvoiceDetails(prev => ({ ...prev, number: payload.invoiceNumber }));
    if (payload.currency) setInvoiceDetails(prev => ({ ...prev, currency: payload.currency }));
    if (payload.includeGST !== undefined) setIncludeGST(Boolean(payload.includeGST));
    
    // Number parser helper
    const parseNum = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val || typeof val !== 'string') return 0;
      const cleaned = val.toLowerCase().replace(/,/g, '').trim();
      if (cleaned.endsWith('k')) {
        const num = parseFloat(cleaned.slice(0, -1));
        return isNaN(num) ? 0 : Math.round(num * 1000);
      }
      if (cleaned.endsWith('m') || cleaned.endsWith('cr')) {
        const num = parseFloat(cleaned.slice(0, -2));
        return isNaN(num) ? 0 : Math.round(num * 1000000);
      }
      if (cleaned.endsWith('l') || cleaned.endsWith('lac') || cleaned.endsWith('lakh')) {
        const num = parseFloat(cleaned.replace(/lakh|lac|l/, ''));
        return isNaN(num) ? 0 : Math.round(num * 100000);
      }
      const match = cleaned.match(/[\d.]+/);
      if (match) {
        const num = parseFloat(match[0]);
        return isNaN(num) ? 0 : Math.round(num);
      }
      return 0;
    };

    let extracted = [];
    if (payload.packageTiers && Array.isArray(payload.packageTiers) && payload.packageTiers.length > 0) {
      payload.packageTiers.forEach(tier => {
        const tierList = (tier.items && Array.isArray(tier.items) && tier.items.length > 0) ? tier.items : 
                         (tier.services && Array.isArray(tier.services) && tier.services.length > 0) ? tier.services : [];
        tierList.forEach(item => {
          extracted.push({
            desc: typeof item === 'string' ? item : (item.desc || item.name || 'Service Item'),
            qty: parseNum(item.qty) || 1,
            rate: parseNum(item.rate) || 0
          });
        });
      });
    }

    if (extracted.length === 0 && payload.services && Array.isArray(payload.services) && payload.services.length > 0) {
      extracted = payload.services.map(s => ({
        desc: typeof s === 'string' ? s : (s.desc || s.name || 'Service Item'),
        qty: parseNum(s.qty) || 1,
        rate: parseNum(s.rate) || 0
      }));
    } else if (extracted.length === 0 && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
      extracted = payload.items.map(item => ({
        desc: typeof item === 'string' ? item : (item.desc || item.name || 'Service Item'),
        qty: parseNum(item.qty) || 1,
        rate: parseNum(item.rate) || 0
      }));
    }

    const targetBudget = parseNum(payload.totalBudget);
    if (extracted.length > 0) {
      if (targetBudget > 0) {
        const sum = extracted.reduce((acc, it) => acc + (it.qty * it.rate), 0);
        if (sum === 0) {
          const perItemRate = Math.round(targetBudget / extracted.length);
          let runningSum = 0;
          extracted = extracted.map((it, idx) => {
            if (idx === extracted.length - 1) {
              const rem = targetBudget - runningSum;
              const r = Math.max(0, Math.round(rem / (it.qty || 1)));
              return { ...it, rate: r };
            }
            const r = Math.round(perItemRate / (it.qty || 1));
            runningSum += (it.qty * r);
            return { ...it, rate: r };
          });
        } else if (Math.abs(sum - targetBudget) > 1) {
          const factor = targetBudget / sum;
          let runningSum = 0;
          extracted = extracted.map((it, idx) => {
            if (idx === extracted.length - 1) {
              const rem = targetBudget - runningSum;
              const r = Math.max(0, Math.round(rem / (it.qty || 1)));
              return { ...it, rate: r };
            }
            const r = Math.round(it.rate * factor);
            runningSum += (it.qty * r);
            return { ...it, rate: r };
          });
        }
      }
      setItems(extracted);
    }
  };

  useEffect(() => {
    const pendingDataStr = sessionStorage.getItem('pendingPackageData');
    if (pendingDataStr) {
      try {
        const data = JSON.parse(pendingDataStr);
        parseInvoicePayload(data);
        sessionStorage.removeItem('pendingPackageData');
      } catch (err) {
        console.error('Failed to parse pending invoice data', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleCopilotAction = (e) => {
      const data = e.detail;
      if (data && ['invoice', 'quote', 'package'].includes(data?.intent) && data.payload) {
        parseInvoicePayload(data.payload);
      } else if (data?.payload && (data.payload.services || data.payload.items || data.payload.packageTiers || data.payload.totalBudget)) {
        parseInvoicePayload(data.payload);
      }
    };

    const handleCopilotUndo = (e) => {
      const data = e.detail;
      if (data?.formContext) {
        const { clientDetails: c, services: s, invoiceDetails: inv } = data.formContext;
        if (c) setClientDetails(c);
        if (s) setItems(s);
        if (inv) setInvoiceDetails(inv);
      }
    };

    window.addEventListener('copilot-action', handleCopilotAction);
    window.addEventListener('copilot-undo', handleCopilotUndo);
    return () => {
      window.removeEventListener('copilot-action', handleCopilotAction);
      window.removeEventListener('copilot-undo', handleCopilotUndo);
    };
  }, []); // ensure we capture latest items to append if needed

  useEffect(() => {
    window._drippFormContext = { clientDetails, services: items, invoiceDetails };
    return () => { window._drippFormContext = null; };
  }, [clientDetails, items, invoiceDetails]);


  // -- HANDLERS --
  const saveMyDetails = async () => {
     try {
       const res = await fetch('/api/admin/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ myDetails })
       });
       if (!res.ok) throw new Error('API save failed');
       
       localStorage.setItem('dripp_my_details', JSON.stringify(myDetails));
       setMyDetailsLocked(true);
       showAlert("Default details saved successfully to database!");
     } catch (err) {
       console.error("API Error saving settings, falling back to local storage.", err);
       localStorage.setItem('dripp_my_details', JSON.stringify(myDetails));
       setMyDetailsLocked(true);
       showAlert("Default details saved locally (database sync failed).");
     }
  };

  const handleSaveBank = async () => {
      let updatedBanks = [...bankAccounts];
      const existingIdx = updatedBanks.findIndex(b => b.id === editingBankDetails.id);
      
      try {
        const payload = existingIdx >= 0 ? editingBankDetails : { ...editingBankDetails, id: 'new' };
        
        const res = await fetch('/api/admin/bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('API save bank failed');
        const json = await res.json();
        
        if (existingIdx >= 0) {
            updatedBanks[existingIdx] = json.data;
        } else {
            updatedBanks.push(json.data);
            editingBankDetails.id = json.data.id;
        }
      } catch (err) {
        console.error("API Error, saving to local storage fallback", err);
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
             const res = await fetch(`/api/admin/bank?id=${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error('API delete failed');
          } catch (err) {
             console.error("API delete failed", err);
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
  const addItem = () => setItems([...items, { desc: '', qty: 1, rate: 0, details: '' }]);
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
      includeGST
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => showAlert('All form details copied to clipboard! You can paste them later using the Paste button.'))
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

    // 📊 Log to Google Sheets on PDF download
    logToSalesSheet({ clientDetails, invoiceDetails, items, total, shareLink: shareLink || '', trigger: 'pdf' });
  };

  const copyToClipboard = (text, type = null) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (type) {
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2200);
    }
  };

  const getInvoiceShareMessage = () => {
    const clientName = clientDetails.name ? clientDetails.name.split(' ')[0].trim() : (clientDetails.brandName ? clientDetails.brandName.trim() : 'there');

    // Extract unique, non-empty service titles
    const activeServices = Array.from(new Set(
      (items || [])
        .map(item => item.desc?.trim())
        .filter(Boolean)
    ));

    if (activeServices.length === 1) {
      return `Hey ${clientName}!\n\nHere is your secure invoice from Dripp Media for ${activeServices[0]}.\n\n🔗 Link: ${shareLink}\n🔑 PIN: ${sharePassword}\n\nLet me know if you have any questions!`;
    } else if (activeServices.length > 1) {
      const servicesList = activeServices.map(s => `• ${s}`).join('\n');
      return `Hey ${clientName}!\n\nHere is your secure invoice from Dripp Media.\n\n📋 Services Included:\n${servicesList}\n\n🔗 Link: ${shareLink}\n🔑 PIN: ${sharePassword}\n\nLet me know if you have any questions!`;
    } else {
      return `Hey ${clientName}!\n\nHere is your secure invoice from Dripp Media.\n\n🔗 Link: ${shareLink}\n🔑 PIN: ${sharePassword}\n\nLet me know if you have any questions!`;
    }
  };

  const handleCopyMessage = () => {
    const msg = getInvoiceShareMessage();
    copyToClipboard(msg, 'message');
  };

  const handleWhatsAppShare = () => {
    const msg = getInvoiceShareMessage();
    const phone = clientDetails.phone ? clientDetails.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const generateSecureLink = async () => {
    setIsGeneratingLink(true);
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
            const generatedLink = `${window.location.origin}/invoice/${data.id}`;
            setShareLink(generatedLink);
            // 🔥 Silently log to Google Sheets sales tracker (fire-and-forget)
            logToSalesSheet({ clientDetails, invoiceDetails, items, total, shareLink: generatedLink });
        } else {
            showAlert("Failed to save invoice securely.");
        }
    } catch(err) {
        showAlert("API error while generating secure link.");
    } finally {
        setIsGeneratingLink(false);
    }
  };

  /**
   * Logs an invoice to Google Sheets with full duplicate detection.
   * Steps:
   *  1. GET /api/invoice/log?invoiceNumber=... → check if it already exists
   *  2. If found: show a 3-button dialog (Overwrite / Skip / Add as New Entry)
   *  3. POST with the chosen mode
   * Never throws - errors are swallowed so the invoice workflow is never blocked.
   */
  const logToSalesSheet = async (invoiceData) => {
    setSheetLogStatus('logging');
    try {
      // ── Step 1: Duplicate check ─────────────────────────────────────────────
      const invoiceNumber = invoiceData?.invoiceDetails?.number || '';
      let existingRowIndex = null;

      if (invoiceNumber) {
        const checkRes = await fetch(
          `/api/invoice/log?invoiceNumber=${encodeURIComponent(invoiceNumber)}`
        ).catch(() => null);
        if (checkRes && checkRes.ok) {
          const checkJson = await checkRes.json().catch(() => ({}));
          if (checkJson.exists) {
            existingRowIndex = checkJson.rowIndex;
          }
        }
      }

      // ── Step 2: If duplicate found, ask the user what to do ──────────────────
      if (existingRowIndex !== null) {
        const choice = await new Promise((resolve) => {
          setCustomDialog({
            isOpen: true,
            type: 'duplicate',
            title: 'Invoice Already Exists',
            message: `${invoiceNumber} is already in your Sales Sheet. What would you like to do?`,
            onOverwrite: () => resolve('overwrite'),
            onSkip:      () => resolve('skip'),
            onAddNew:    () => resolve('addNew'),
            onConfirm: null,
            onCancel: null,
          });
        });

        if (choice === 'skip') {
          setSheetLogStatus('skipped');
          setTimeout(() => setSheetLogStatus('idle'), 5000);
          return;
        }

        if (choice === 'overwrite') {
          const res = await fetch('/api/invoice/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...invoiceData, mode: 'overwrite', rowIndex: existingRowIndex }),
          });
          const json = await res.json().catch(() => ({}));
          setSheetLogStatus(res.ok && json.success ? 'success' : 'error');
          setTimeout(() => setSheetLogStatus('idle'), 5000);
          return;
        }

        // choice === 'addNew' - fall through to append below
      }

      // ── Step 3: Append new row ───────────────────────────────────────────────
      const res = await fetch('/api/invoice/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...invoiceData, mode: 'append' }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setSheetLogStatus('success');
      } else if (res.ok && json.skipped) {
        setSheetLogStatus('skipped');
      } else {
        setSheetLogStatus('error');
      }
    } catch {
      setSheetLogStatus('error');
    }
    // Auto-reset badge after 5 seconds
    setTimeout(() => setSheetLogStatus('idle'), 5000);
  };

  if (!isClient) return <div style={{padding: '50px', color: 'white'}}>Loading Invoice Maker...</div>;

  return (

      <div style={{ color: 'white', maxWidth: '1400px', margin: '0 auto' }}>

      {/* CUSTOM DIALOG (ALERT / CONFIRM) - Rock Solid Modal Chassis */}
      {customDialog.isOpen && createPortal(
        <div 
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <div 
            className={styles.modalCard}
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalBody} style={{ padding: '36px 32px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#ebd73f', margin: '0 0 16px 0', fontFamily: "'Panchang', sans-serif", fontWeight: 800 }}>
                {customDialog.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#ccc', marginBottom: '26px', lineHeight: '1.6', fontFamily: "'Clash Display', sans-serif" }}>
                {customDialog.message}
              </p>

              {/* 3-button duplicate resolution dialog */}
              {customDialog.type === 'duplicate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => { customDialog.onOverwrite?.(); closeDialog(); }}
                    style={{ width: '100%', padding: '13px 20px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.92rem', textAlign: 'left', fontFamily: "'Clash Display', sans-serif" }}
                  >
                    ✏️ Overwrite existing entry
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', fontWeight: '400', marginTop: '3px' }}>Replace the old row with the latest data</span>
                  </button>
                  <button
                    onClick={() => { customDialog.onSkip?.(); closeDialog(); }}
                    style={{ width: '100%', padding: '13px 20px', background: 'rgba(156, 163, 175, 0.08)', border: '1px solid rgba(156, 163, 175, 0.2)', color: '#9ca3af', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.92rem', textAlign: 'left', fontFamily: "'Clash Display', sans-serif" }}
                  >
                    ⏭ Skip - don't log again
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', fontWeight: '400', marginTop: '3px' }}>Keep the existing entry, do nothing</span>
                  </button>
                  <button
                    onClick={() => { customDialog.onAddNew?.(); closeDialog(); }}
                    style={{ width: '100%', padding: '13px 20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.92rem', textAlign: 'left', fontFamily: "'Clash Display', sans-serif" }}
                  >
                    ➕ Add as a new entry
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', fontWeight: '400', marginTop: '3px' }}>Keep both rows - useful for re-invoicing</span>
                  </button>
                </div>
              )}

              {/* Standard alert / confirm buttons */}
              {customDialog.type !== 'duplicate' && (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  {customDialog.type === 'confirm' && (
                    <button
                      onClick={() => { if (customDialog.onCancel) customDialog.onCancel(); closeDialog(); }}
                      style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'Clash Display', sans-serif" }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (customDialog.type === 'confirm' && customDialog.onConfirm) customDialog.onConfirm();
                      closeDialog();
                    }}
                    style={{ flex: 1, padding: '12px', background: '#ebd73f', border: 'none', color: '#111', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontFamily: "'Panchang', sans-serif", fontSize: '0.78rem' }}
                  >
                    {customDialog.type === 'confirm' ? 'Confirm' : 'OK'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* CONFLICT RESOLUTION MODAL - Rock Solid Modal Chassis */}
      {showConflictModal && conflicts[currentConflictIdx] && createPortal(
        <div 
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConflictModal(false); }}
        >
          <div 
            className={styles.modalCard}
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle} style={{ color: '#ebd73f' }}>
                  Resolve Auto-Fill Conflict
                </h3>
                <p className={styles.modalSubtitle}>
                  Choose how to handle conflicting pasted values
                </p>
              </div>
            </div>

            {/* Body */}
            <div className={styles.modalBody}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ display: 'block', marginBottom: '10px', color: '#fff', fontSize: '0.95rem' }}>{conflicts[currentConflictIdx].label}</strong>
                
                {conflicts[currentConflictIdx].type === 'scalar_multiple' && (
                  <div style={{ fontSize: '0.88rem', color: '#ccc', lineHeight: '1.6' }}>
                    Multiple values found in pasted text: <br/>
                    {conflicts[currentConflictIdx].values.map((v, i) => <div key={i} style={{ color: '#ebd73f' }}>• {v}</div>)}
                  </div>
                )}
                {conflicts[currentConflictIdx].type === 'scalar_exists' && (
                  <div style={{ fontSize: '0.88rem', color: '#ccc', lineHeight: '1.6' }}>
                    Current form has: <strong style={{ color: '#fff' }}>{conflicts[currentConflictIdx].currentValue}</strong><br/>
                    Pasted text has: <strong style={{ color: '#ebd73f' }}>{conflicts[currentConflictIdx].value}</strong>
                  </div>
                )}
                {conflicts[currentConflictIdx].type === 'item_match_rate' && (
                  <div style={{ fontSize: '0.88rem', color: '#ccc', lineHeight: '1.6' }}>
                    Item already exists with the same rate ({invoiceDetails.currency}{conflicts[currentConflictIdx].item.rate}).
                  </div>
                )}
                {conflicts[currentConflictIdx].type === 'item_diff_rate' && (
                  <div style={{ fontSize: '0.88rem', color: '#ccc', lineHeight: '1.6' }}>
                    Existing Item Rate: <strong style={{ color: '#fff' }}>{invoiceDetails.currency}{conflicts[currentConflictIdx].existingItem.rate}</strong><br/>
                    Pasted Item Rate: <strong style={{ color: '#ebd73f' }}>{invoiceDetails.currency}{conflicts[currentConflictIdx].item.rate}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {conflicts[currentConflictIdx].type.startsWith('scalar') && (
                  <>
                    <button onClick={() => handleConflictResolution('overwrite', conflicts[currentConflictIdx].values ? conflicts[currentConflictIdx].values[0] : null)} className={styles.addServiceBtn} style={{ borderColor: '#ebd73f', color: '#ebd73f' }}>
                      Overwrite Current Value
                    </button>
                    <button onClick={() => handleConflictResolution('append')} className={styles.addServiceBtn}>
                      Append / Keep Both
                    </button>
                  </>
                )}
                
                {conflicts[currentConflictIdx].type === 'item_match_rate' && (
                  <>
                    <button onClick={() => handleConflictResolution('merge')} className={styles.addServiceBtn} style={{ borderColor: '#ebd73f', color: '#ebd73f' }}>
                      Merge (Add +{conflicts[currentConflictIdx].item.qty} Quantity)
                    </button>
                    <button onClick={() => handleConflictResolution('add_new')} className={styles.addServiceBtn}>
                      Add as Separate Line Item
                    </button>
                  </>
                )}
                
                {conflicts[currentConflictIdx].type === 'item_diff_rate' && (
                  <>
                    <button onClick={() => handleConflictResolution('merge', 'new')} className={styles.addServiceBtn} style={{ borderColor: '#ebd73f', color: '#ebd73f' }}>
                      Update Rate & Add Quantity
                    </button>
                    <button onClick={() => handleConflictResolution('merge', 'old')} className={styles.addServiceBtn}>
                      Keep Old Rate & Add Quantity
                    </button>
                    <button onClick={() => handleConflictResolution('add_new')} className={styles.addServiceBtn}>
                      Add as Separate Line Item
                    </button>
                  </>
                )}

                <button onClick={() => handleConflictResolution('skip')} className={styles.addServiceBtn} style={{ marginTop: '8px', borderColor: '#ff4d4d', color: '#ff4d4d' }}>
                  Skip / Ignore Pasted Value
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
                Conflict {currentConflictIdx + 1} of {conflicts.length}
              </div>
            </div>
          </div>
        </div>
      , document.body)}

    
      <div className={styles.headerTop}>
        <div>
          <div className={styles.genzPill}>{isGenz ? 'gen-z' : 'INVOICE'}</div>
          <h1 className={styles.titleModern}>PREMIUM <span className={styles.titleHighlight}>INVOICE</span> MAKER</h1>
          <p className={styles.subtitleModern}>{isGenz ? 'drop receipts and get that bread.' : 'Generate premium, secure invoices with integrated payment codes.'}</p>
        </div>
        <div className={styles.headerActions}>
           <button onClick={generatePDF} className={styles.btnModernSecondary}>
             <Download size={18} /> Export PDF
           </button>
           <button onClick={generateSecureLink} className={styles.btnModernPrimary}>
             <Share2 size={18} /> SHARE INVOICE
           </button>
        </div>
      </div>

      <style jsx>{`
        .invoice-main-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .invoice-main-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
      <div className="invoice-main-grid">
        
        {/* LEFT COLUMN: BUILDER FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Smart Paste Section */}
          <div className={styles.smartPasteCard}>
            <h3 style={{ marginBottom: '10px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Panchang', sans-serif", fontSize: '0.98rem', fontWeight: 700 }}>
              <Search size={20} /> {isGenz ? 'ai brain dump' : 'AI Smart Paste'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px', lineHeight: 1.4 }}>
              {isGenz ? 'yap about your project here. ai will organize it.' : 'Paste unstructured project details here. We\'ll extract the client name, contact info, and line items automatically.'}
            </p>
            <textarea 
              value={smartText} 
              onChange={(e) => setSmartText(e.target.value)} 
              placeholder="e.g. Invoice for John Doe. Email: john@doe.com. Web Dev for $1500 and Hosting for $200."
              className={styles.inputModern} 
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
                   <><CheckCircle2 size={18} color="#000" /> {isGenz ? 'w' : 'Success!'}</>
                ) : (
                   isGenz ? 'cook invoice' : 'Auto-Fill Invoice'
                )}
              </button>
              <button onClick={handleClearForm} className={styles.btnDanger} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                Clear Form
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleCopyAllDetails} className={styles.addServiceBtn} style={{ padding: '10px 20px', borderRadius: '8px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Copy size={18} /> Copy Form Details
              </button>
              <button onClick={handlePasteAllDetails} className={styles.addServiceBtn} style={{ padding: '10px 20px', borderRadius: '8px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Paste Form Details
              </button>
            </div>
          </div>

          {/* Section 1: My Details (Defaults) */}
          <div className={styles.cardModern} style={{ borderLeft: '4px solid #ebd73f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 className={styles.cardTitleModern}>
                  {myDetailsLocked ? <Lock size={20} /> : <Edit3 size={20} />} My Default Details
                </h3>
                {myDetailsLocked ? (
                   <button onClick={() => setMyDetailsLocked(false)} className={styles.addServiceBtn} style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Unlock to Edit</button>
                ) : (
                   <button onClick={saveMyDetails} className={styles.btnPrimary} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '5px' }}><Save size={14}/> Save Defaults</button>
                )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', opacity: myDetailsLocked ? 0.6 : 1, transition: 'opacity 0.3s' }}>
              <div>
                 <label className={styles.label}>Company Name</label>
                 <input type="text" value={myDetails.companyName} onChange={e => handleMyDetailsChange('companyName', e.target.value)} disabled={myDetailsLocked} className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    GST Number
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ebd73f', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal' }}>
                       <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)} /> Include in Invoice
                    </label>
                 </label>
                 <input type="text" value={myDetails.gst} onChange={e => handleMyDetailsChange('gst', e.target.value)} disabled={myDetailsLocked || !includeGST} className={styles.inputModern} style={{ opacity: includeGST ? 1 : 0.5 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                 <label className={styles.label}>Official Address</label>
                 <textarea value={myDetails.address} onChange={e => handleMyDetailsChange('address', e.target.value)} disabled={myDetailsLocked} className={styles.inputModern} rows={2} />
              </div>
              <div>
                 <label className={styles.label}>Email Address</label>
                 <input type="email" value={myDetails.email} onChange={e => handleMyDetailsChange('email', e.target.value)} disabled={myDetailsLocked} className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label}>Phone Number</label>
                 <input type="text" value={myDetails.phone} onChange={e => handleMyDetailsChange('phone', e.target.value)} disabled={myDetailsLocked} className={styles.inputModern} />
              </div>
            </div>
          </div>

          {/* Section 2: Client & Invoice Info */}
          <div className={styles.card}>
            <h3 className={styles.cardTitleModern}>
              <FileText size={20} /> Invoice & Client Info
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                 <label className={styles.label}>Invoice Number</label>
                 <input type="text" value={invoiceDetails.number} onChange={e => handleInvoiceChange('number', e.target.value)} className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label}>Currency</label>
                 <select value={invoiceDetails.currency} onChange={e => setInvoiceDetails({...invoiceDetails, currency: e.target.value})} className={styles.inputModern}>
                    {allCurrencies.map(c => (
                        <option key={c.code} value={c.symbol}>{c.code} ({c.symbol})</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className={styles.label}>Date</label>
                 <input type="date" value={invoiceDetails.date} onChange={e => handleInvoiceChange('date', e.target.value)} className={styles.inputModern} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                 <label className={styles.label}>Client Name</label>
                 <input type="text" value={clientDetails.name} onChange={e => handleClientChange('name', e.target.value)} placeholder="John Doe" className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label}>Brand Name</label>
                 <input type="text" value={clientDetails.brandName} onChange={e => handleClientChange('brandName', e.target.value)} placeholder="Acme Corp" className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label}>Client Email</label>
                 <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="john@acme.com" className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label}>Client Mobile</label>
                 <input type="text" value={clientDetails.mobile} onChange={e => handleClientChange('mobile', e.target.value)} placeholder="+1 555-0199" className={styles.inputModern} />
              </div>
              <div>
                 <label className={styles.label}>GST Number (Optional)</label>
                 <input type="text" value={clientDetails.gst} onChange={e => handleClientChange('gst', e.target.value)} placeholder="22AAAAA0000A1Z5" className={styles.inputModern} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                 <label className={styles.label}>Client Billing Address</label>
                 <textarea value={clientDetails.address} onChange={e => handleClientChange('address', e.target.value)} placeholder="123 Corporate Blvd" className={styles.inputModern} rows={2} />
              </div>
            </div>
          </div>

          {/* Section 3: Services & Rates */}
          <div className={styles.card} style={{ position: 'relative', overflow: 'visible' }}>
            {/* Header with Title, Count Badge, and Quick Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ebd73f',
                  boxShadow: '0 0 12px rgba(235, 215, 63, 0.8)'
                }} />
                <h3 style={{
                  margin: 0,
                  color: '#ebd73f',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}>
                  Line Items
                </h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(235, 215, 63, 0.08)',
                  border: '1px solid rgba(235, 215, 63, 0.25)',
                  color: '#ebd73f',
                  fontSize: '0.74rem',
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.4px'
                }}>
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <button
                type="button"
                onClick={addItem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(235, 215, 63, 0.1)',
                  color: '#ebd73f',
                  border: '1px solid rgba(235, 215, 63, 0.3)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ebd73f';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)';
                  e.currentTarget.style.color = '#ebd73f';
                }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            {/* List of Line Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
              {items.map((item, index) => (
                <div 
                  key={index} 
                  style={{ 
                    position: 'relative',
                    background: 'linear-gradient(180deg, rgba(24, 24, 28, 0.85) 0%, rgba(14, 14, 18, 0.95) 100%)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '16px', 
                    padding: '18px 20px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.3)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(235, 215, 63, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
                  }}
                >
                  {/* Top Bar: Item Index, Title Dropdown, and Delete Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{
                      flexShrink: 0,
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(235, 215, 63, 0.1)',
                      border: '1px solid rgba(235, 215, 63, 0.25)',
                      color: '#ebd73f',
                      fontFamily: "'Panchang', sans-serif",
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={item.desc} 
                          onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                          placeholder="Deliverable / Service title (e.g. 4K Commercial Shoot)"
                          className={styles.inputModern}
                          onFocus={() => setActiveDropdown(index)}
                          onBlur={() => setTimeout(() => setActiveDropdown(null), 250)}
                          style={{ 
                            padding: '11px 40px 11px 14px', 
                            width: '100%', 
                            boxSizing: 'border-box',
                            background: 'rgba(8, 8, 10, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontFamily: "'Clash Display', sans-serif",
                            fontSize: '0.94rem',
                            fontWeight: 600
                          }}
                        />
                        <div style={{ 
                          position: 'absolute', 
                          right: '12px', 
                          color: activeDropdown === index ? '#ebd73f' : '#888', 
                          pointerEvents: 'none', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s, transform 0.2s',
                          transform: activeDropdown === index ? 'rotate(180deg)' : 'none'
                        }}>
                          <ChevronDown size={15} />
                        </div>
                      </div>

                      {activeDropdown === index && (
                        <div style={{ 
                          position: 'absolute', 
                          top: 'calc(100% + 6px)', 
                          left: 0, 
                          right: 0, 
                          background: '#121216', 
                          border: '1px solid rgba(235, 215, 63, 0.35)', 
                          borderRadius: '12px', 
                          zIndex: 60, 
                          boxShadow: '0 16px 45px rgba(0,0,0,0.85), 0 0 20px rgba(235, 215, 63, 0.08)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '8px 16px',
                            background: 'rgba(235, 215, 63, 0.05)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            fontSize: '0.7rem',
                            color: '#ebd73f',
                            fontFamily: "'Panchang', sans-serif",
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px'
                          }}>
                            Select Quick Preset
                          </div>
                          <div style={{ padding: '6px 0', maxHeight: '220px', overflowY: 'auto' }}>
                            {DEFAULT_SERVICES.map((s, i) => (
                              <div 
                                key={s} 
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleItemChange(index, 'desc', s);
                                  setActiveDropdown(null);
                                }}
                                style={{ 
                                  padding: '10px 16px', 
                                  cursor: 'pointer', 
                                  color: '#eee', 
                                  fontWeight: 500, 
                                  fontSize: '0.88rem', 
                                  fontFamily: "'Clash Display', sans-serif",
                                  transition: 'background 0.15s, color 0.15s',
                                  borderBottom: i < DEFAULT_SERVICES.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(235, 215, 63, 0.12)';
                                  e.currentTarget.style.color = '#ebd73f';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#eee';
                                }}
                              >
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ebd73f', opacity: 0.7 }} />
                                {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={() => removeItem(index)} 
                      title="Remove item"
                      style={{ 
                        flexShrink: 0,
                        width: '38px', 
                        height: '38px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: 'rgba(255, 77, 77, 0.08)', 
                        border: '1px solid rgba(255, 77, 77, 0.22)', 
                        color: '#ff5c5c', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 77, 77, 0.22)';
                        e.currentTarget.style.borderColor = '#ff4d4d';
                        e.currentTarget.style.color = '#ff4d4d';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 77, 77, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.22)';
                        e.currentTarget.style.color = '#ff5c5c';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Middle: Scope & Deliverables Textarea */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#888',
                      fontSize: '0.7rem',
                      fontFamily: "'Panchang', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}>
                      Scope & Deliverables (Optional)
                    </label>
                    <textarea 
                      value={item.details || ''} 
                      onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                      placeholder="e.g. Includes 5 custom pages, responsive design, interactive animations, and 1 year hosting..."
                      className={styles.inputModern}
                      style={{ 
                        padding: '10px 14px', 
                        fontSize: '0.88rem', 
                        width: '100%', 
                        minHeight: '58px',
                        boxSizing: 'border-box',
                        background: 'rgba(8, 8, 10, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        color: '#ddd',
                        fontFamily: "'Clash Display', sans-serif",
                        lineHeight: '1.45',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Bottom: Financial Controls (Qty, Rate, Line Total) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}>
                    {/* Left: Quantity & Rate with dedicated minimum widths */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Quantity */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{
                          color: '#888',
                          fontSize: '0.66rem',
                          fontFamily: "'Panchang', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Qty
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          step="1"
                          value={item.qty} 
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          placeholder="1"
                          className={styles.inputModern}
                          style={{ 
                            width: '84px',
                            padding: '8px 12px',
                            textAlign: 'center',
                            background: 'rgba(12, 12, 16, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 600,
                            fontFamily: "'Clash Display', sans-serif",
                            fontSize: '0.92rem'
                          }}
                        />
                      </div>

                      {/* Unit Rate */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{
                          color: '#888',
                          fontSize: '0.66rem',
                          fontFamily: "'Panchang', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Rate ({invoiceDetails.currency})
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 12px',
                            height: '38px',
                            background: 'rgba(235, 215, 63, 0.1)',
                            border: '1px solid rgba(235, 215, 63, 0.25)',
                            borderRight: 'none',
                            borderRadius: '8px 0 0 8px',
                            color: '#ebd73f',
                            fontFamily: "'Panchang', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {invoiceDetails.currency}
                          </span>
                          <input 
                            type="number" 
                            min="0"
                            step="any"
                            value={item.rate} 
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            placeholder="0.00"
                            className={styles.inputModern}
                            style={{ 
                              width: '150px',
                              minWidth: '130px',
                              height: '38px',
                              padding: '8px 12px',
                              background: 'rgba(12, 12, 16, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '0 8px 8px 0',
                              color: '#fff',
                              fontWeight: 600,
                              fontFamily: "'Clash Display', sans-serif",
                              fontSize: '0.92rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Calculated Line Total */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', marginLeft: 'auto' }}>
                      <span style={{
                        color: '#777',
                        fontSize: '0.66rem',
                        fontFamily: "'Panchang', sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px'
                      }}>
                        Item Total
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#555', fontFamily: "'Clash Display', sans-serif", fontSize: '0.9rem' }}>=</span>
                        <span style={{
                          color: '#ebd73f',
                          fontFamily: "'Panchang', sans-serif",
                          fontWeight: 700,
                          fontSize: '1.08rem',
                          letterSpacing: '0.5px'
                        }}>
                          {invoiceDetails.currency}{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Another Item Button */}
            <button 
              type="button"
              onClick={addItem} 
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'rgba(235, 215, 63, 0.04)',
                border: '1.5px dashed rgba(235, 215, 63, 0.35)',
                color: '#ebd73f',
                padding: '15px 24px',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.92rem',
                fontFamily: "'Clash Display', sans-serif",
                transition: 'all 0.25s ease',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(235, 215, 63, 0.12)';
                e.currentTarget.style.borderColor = '#ebd73f';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(235, 215, 63, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(235, 215, 63, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Plus size={18} /> Add Line Item
            </button>
            
            {/* Grand Total Summary Box */}
            <div style={{ 
              marginTop: '20px', 
              padding: '18px 22px', 
              background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(20, 20, 24, 0.8) 100%)', 
              border: '1px solid rgba(235, 215, 63, 0.3)', 
              borderRadius: '14px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(235, 215, 63, 0.2)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
               <div>
                 <div style={{ fontSize: '0.74rem', color: '#999', fontFamily: "'Panchang', sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                   Total Amount Due
                 </div>
                 <div style={{ fontSize: '0.85rem', color: '#666', fontFamily: "'Clash Display', sans-serif" }}>
                   Calculated across {items.length} {items.length === 1 ? 'item' : 'items'}
                 </div>
               </div>
               <div style={{ 
                 fontSize: '1.45rem', 
                 color: '#ebd73f', 
                 fontFamily: "'Panchang', sans-serif", 
                 fontWeight: 700, 
                 letterSpacing: '0.5px',
                 textShadow: '0 0 20px rgba(235, 215, 63, 0.3)'
               }}>
                 {invoiceDetails.currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
            </div>
          </div>
          
        </div>
        
        {/* RIGHT COLUMN: PAYMENT & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           <CurrencyConverter />

           {/* Payment Methods */}
           <div className={styles.card}>
              <h3 className={styles.cardTitleModern}>
                  <ShieldCheck size={18} /> Payment Methods
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Select Bank Account</label>
                  <select 
                      className={styles.inputModern} 
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
                                         <div style={{ fontFamily: "'Clash Display', sans-serif" }}>A/C: {b.accountNumber}</div>
                                         {b.ifsc && <div style={{ fontFamily: "'Clash Display', sans-serif" }}>IFSC: {b.ifsc}</div>}
                                         {b.swift && <div style={{ fontFamily: "'Clash Display', sans-serif" }}>SWIFT: {b.swift}</div>}
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
                      }} className={styles.addServiceBtn} style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}>
                          <Plus size={16} /> Add New Payment Method
                      </button>
                  </>
              ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ marginBottom: '10px' }}>
                          <label className={styles.label}>Display Name</label>
                          <input type="text" value={editingBankDetails.name} onChange={e => setEditingBankDetails({...editingBankDetails, name: e.target.value})} placeholder="e.g., HDFC Current" className={styles.inputModern} />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                          <label className={styles.label}>Bank Details (Account No, IFSC, etc.)</label>
                          <textarea value={editingBankDetails.details} onChange={e => setEditingBankDetails({...editingBankDetails, details: e.target.value})} placeholder="Bank: HDFC\nA/C No: 123456" className={styles.inputModern} rows={4} />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                          <label className={styles.label}>UPI ID (optional, generates QR)</label>
                          <input type="text" value={editingBankDetails.upi} onChange={e => setEditingBankDetails({...editingBankDetails, upi: e.target.value})} placeholder="name@bank" className={styles.inputModern} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={handleSaveBank} className={styles.btnPrimary} style={{ flex: 1, padding: '8px' }}>Save</button>
                          <button onClick={() => setIsEditingBank(false)} className={styles.addServiceBtn} style={{ flex: 1, padding: '8px', justifyContent: 'center' }}>Cancel</button>
                      </div>
                      {editingBankDetails.id.includes('bank_') && bankAccounts.find(b => b.id === editingBankDetails.id) && (
                          <button onClick={() => handleDeleteBank(editingBankDetails.id)} className={styles.btnDanger} style={{ width: '100%', padding: '8px', marginTop: '10px' }}>
                              Delete Method
                          </button>
                      )}
                  </div>
              )}
           </div>

           <div className={styles.cardModern}>
              <label className={styles.labelModern}>Footer Notes (Optional)</label>
              <textarea 
                  className={styles.inputModern} 
                  rows={3} 
                  value={invoiceDetails.notes} 
                  onChange={e => handleInvoiceChange('notes', e.target.value)} 
                  placeholder="Thank you for your business!" 
                  style={{ resize: 'vertical' }}
              />
           </div>

           {/* Modern Executive Export & Share Card */}
           <div 
             style={{ 
               background: 'linear-gradient(180deg, #16161a 0%, #0d0d0f 100%)',
               border: '1px solid rgba(255, 255, 255, 0.08)',
               borderRadius: '18px',
               padding: '24px',
               boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
               position: 'relative',
               overflow: 'hidden'
             }}
           >
             {/* Soft ambient highlight */}
             <div 
               style={{ 
                 position: 'absolute', 
                 top: 0, 
                 right: 0, 
                 width: '180px', 
                 height: '180px', 
                 background: 'radial-gradient(circle at 100% 0%, rgba(235, 215, 63, 0.12) 0%, transparent 70%)', 
                 pointerEvents: 'none', 
                 zIndex: 0 
               }} 
             />

             {/* Card Header */}
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ebd73f', boxShadow: '0 0 10px #ebd73f' }} />
                 <h3 
                   style={{ 
                     margin: 0, 
                     fontSize: '0.98rem', 
                     color: '#ffffff', 
                     fontFamily: "'Panchang', sans-serif",
                     fontWeight: '700',
                     letterSpacing: '0.03em'
                   }}
                 >
                   Export & Share
                 </h3>
               </div>
               <span 
                 style={{ 
                   fontSize: '0.72rem', 
                   color: '#a1a1aa', 
                   fontFamily: "'Clash Display', sans-serif",
                   fontWeight: '500',
                   background: 'rgba(255, 255, 255, 0.04)',
                   padding: '3px 9px',
                   borderRadius: '999px',
                   border: '1px solid rgba(255, 255, 255, 0.07)'
                 }}
               >
                 Invoice #{invoiceDetails.number || '001'}
               </span>
             </div>
             
             {/* Total Due Callout */}
             <div 
               style={{ 
                 background: 'rgba(255, 255, 255, 0.025)',
                 border: '1px solid rgba(255, 255, 255, 0.07)',
                 borderRadius: '14px',
                 padding: '16px 18px',
                 marginBottom: '18px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 position: 'relative',
                 zIndex: 1
               }}
             >
               <div>
                 <div 
                   style={{ 
                     fontFamily: "'Clash Display', sans-serif",
                     fontSize: '0.72rem',
                     fontWeight: '600',
                     letterSpacing: '0.08em',
                     textTransform: 'uppercase',
                     color: '#71717a',
                     marginBottom: '3px'
                   }}
                 >
                   Total Due
                 </div>
                 <div 
                   style={{ 
                     fontFamily: "'Clash Display', sans-serif",
                     fontSize: '0.75rem',
                     color: '#a1a1aa'
                   }}
                 >
                   {items.length} {items.length === 1 ? 'item' : 'items'} billed
                 </div>
               </div>
               <div 
                 style={{ 
                   fontFamily: "'Clash Display', sans-serif",
                   fontSize: '1.45rem',
                   fontWeight: '700',
                   color: '#ebd73f',
                   letterSpacing: '0.02em',
                   textShadow: '0 0 20px rgba(235, 215, 63, 0.25)'
                 }}
               >
                 {invoiceDetails.currency}{total.toFixed(2)}
               </div>
             </div>

             {/* Main Actions */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1 }}>
               <button 
                 onClick={generatePDF} 
                 style={{ 
                   width: '100%', 
                   padding: '14px 20px', 
                   background: 'linear-gradient(135deg, #f7e76d 0%, #ebd73f 60%, #deb823 100%)',
                   color: '#09090b',
                   border: 'none',
                   borderRadius: '12px',
                   fontFamily: "'Clash Display', sans-serif",
                   fontSize: '0.92rem',
                   fontWeight: '650',
                   letterSpacing: '0.01em',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '9px',
                   boxShadow: '0 8px 22px -5px rgba(235, 215, 63, 0.38)',
                   transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                 }}
                 onMouseOver={e => {
                   e.currentTarget.style.transform = 'translateY(-1.5px)';
                   e.currentTarget.style.boxShadow = '0 12px 28px -5px rgba(235, 215, 63, 0.48)';
                 }}
                 onMouseOut={e => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '0 8px 22px -5px rgba(235, 215, 63, 0.38)';
                 }}
               >
                 <Download size={18} strokeWidth={2.4} /> Download Invoice PDF
               </button>

               <button 
                 onClick={generateSecureLink} 
                 disabled={isGeneratingLink}
                 style={{ 
                   width: '100%', 
                   padding: '13px 20px', 
                   background: 'rgba(255, 255, 255, 0.04)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                   color: '#ffffff',
                   borderRadius: '12px',
                   fontFamily: "'Clash Display', sans-serif",
                   fontSize: '0.9rem',
                   fontWeight: '600',
                   cursor: isGeneratingLink ? 'not-allowed' : 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '8px',
                   transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                 }}
                 onMouseOver={e => {
                   if (!isGeneratingLink) {
                     e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                     e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
                     e.currentTarget.style.color = '#ebd73f';
                   }
                 }}
                 onMouseOut={e => {
                   e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                   e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                   e.currentTarget.style.color = '#ffffff';
                 }}
               >
                 {isGeneratingLink ? (
                   <>
                     <Loader size={17} className={styles.spin} /> Generating Link...
                   </>
                 ) : (
                   <>
                     <Lock size={17} strokeWidth={2.2} /> Generate Secure Link
                   </>
                 )}
               </button>
             </div>
             
             {/* Generated Secure Portal Section */}
             {shareLink && (
               <div 
                 style={{ 
                   marginTop: '20px', 
                   padding: '18px', 
                   background: 'rgba(12, 12, 14, 0.85)', 
                   border: '1px solid rgba(235, 215, 63, 0.25)', 
                   borderRadius: '14px',
                   boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(235, 215, 63, 0.15)',
                   position: 'relative',
                   zIndex: 1
                 }}
               >
                 {/* Status header */}
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: "'Clash Display', sans-serif", fontSize: '0.8rem', fontWeight: '600', color: '#ebd73f', letterSpacing: '0.02em' }}>
                     <ShieldCheck size={16} /> Secure Portal Ready
                   </div>
                   <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.7rem', color: '#71717a', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                     Encrypted
                   </span>
                 </div>

                 {/* Secure Link Field */}
                 <div style={{ marginBottom: '14px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                     <label style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a1a1aa' }}>
                       Client Portal URL
                     </label>
                     <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.68rem', color: '#71717a' }}>
                       Click link to preview
                     </span>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.55)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '4px 6px 4px 12px', minWidth: 0 }}>
                     <input 
                       type="text" 
                       readOnly 
                       value={shareLink} 
                       onClick={() => window.open(`${shareLink}?pwd=${sharePassword}`, '_blank')} 
                       title="Click to open link directly" 
                       style={{ 
                         flex: 1, 
                         minWidth: 0, 
                         background: 'transparent', 
                         border: 'none', 
                         outline: 'none', 
                         color: '#f4f4f5', 
                         fontFamily: "'Clash Display', sans-serif", 
                         fontSize: '0.82rem', 
                         cursor: 'pointer', 
                         padding: '6px 0', 
                         textOverflow: 'ellipsis', 
                         overflow: 'hidden', 
                         whiteSpace: 'nowrap' 
                       }} 
                     />

                     <button 
                       type="button"
                       onClick={() => window.open(`${shareLink}?pwd=${sharePassword}`, '_blank')} 
                       title="Open portal in new tab"
                       style={{ 
                         background: 'rgba(255, 255, 255, 0.05)', 
                         border: '1px solid rgba(255, 255, 255, 0.1)', 
                         borderRadius: '7px', 
                         color: '#d4d4d8', 
                         padding: '7px 9px', 
                         cursor: 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center', 
                         flexShrink: 0,
                         transition: 'all 0.15s ease'
                       }}
                       onMouseOver={e => {
                         e.currentTarget.style.color = '#ebd73f';
                         e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
                       }}
                       onMouseOut={e => {
                         e.currentTarget.style.color = '#d4d4d8';
                         e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                       }}
                     >
                       <ExternalLink size={14} />
                     </button>

                     <button 
                       type="button"
                       onClick={() => copyToClipboard(shareLink, 'link')} 
                       title="Copy portal link"
                       style={{ 
                         background: copiedItem === 'link' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(235, 215, 63, 0.1)', 
                         border: `1px solid ${copiedItem === 'link' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(235, 215, 63, 0.3)'}`, 
                         borderRadius: '7px', 
                         color: copiedItem === 'link' ? '#4ade80' : '#ebd73f', 
                         padding: '7px 12px', 
                         fontFamily: "'Clash Display', sans-serif", 
                         fontSize: '0.75rem', 
                         fontWeight: '600', 
                         cursor: 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '5px', 
                         flexShrink: 0,
                         transition: 'all 0.15s ease'
                       }}
                     >
                       {copiedItem === 'link' ? (
                         <>
                           <CheckCircle2 size={13} />
                           <span>Copied!</span>
                         </>
                       ) : (
                         <>
                           <Copy size={13} />
                           <span>Copy</span>
                         </>
                       )}
                     </button>
                   </div>
                 </div>

                 {/* Client Password Field */}
                 <div style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'block', fontFamily: "'Clash Display', sans-serif", fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '6px' }}>
                     Client Access PIN
                   </label>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.55)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '4px 6px 4px 14px', minWidth: 0 }}>
                     <div style={{ flex: 1, minWidth: 0, fontFamily: "'Clash Display', sans-serif", fontSize: '1rem', fontWeight: '700', letterSpacing: '0.22em', color: '#ebd73f', padding: '5px 0' }}>
                       {sharePassword}
                     </div>

                     <button 
                       type="button"
                       onClick={() => copyToClipboard(sharePassword, 'password')} 
                       title="Copy PIN"
                       style={{ 
                         background: copiedItem === 'password' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(235, 215, 63, 0.1)', 
                         border: `1px solid ${copiedItem === 'password' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(235, 215, 63, 0.3)'}`, 
                         borderRadius: '7px', 
                         color: copiedItem === 'password' ? '#4ade80' : '#ebd73f', 
                         padding: '7px 12px', 
                         fontFamily: "'Clash Display', sans-serif", 
                         fontSize: '0.75rem', 
                         fontWeight: '600', 
                         cursor: 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '5px', 
                         flexShrink: 0,
                         transition: 'all 0.15s ease'
                       }}
                     >
                       {copiedItem === 'password' ? (
                         <>
                           <CheckCircle2 size={13} />
                           <span>Copied!</span>
                         </>
                       ) : (
                         <>
                           <Copy size={13} />
                           <span>Copy PIN</span>
                         </>
                       )}
                     </button>
                   </div>
                 </div>

                 {/* Share Actions Grid */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                   <button 
                     type="button"
                     onClick={handleCopyMessage} 
                     style={{ 
                       padding: '10px 12px', 
                       background: copiedItem === 'message' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                       border: `1px solid ${copiedItem === 'message' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`, 
                       borderRadius: '9px', 
                       color: copiedItem === 'message' ? '#4ade80' : '#ffffff', 
                       fontFamily: "'Clash Display', sans-serif", 
                       fontSize: '0.8rem', 
                       fontWeight: '600', 
                       cursor: 'pointer', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       gap: '6px',
                       transition: 'all 0.15s ease'
                     }}
                     onMouseOver={e => {
                       if (copiedItem !== 'message') {
                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                         e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
                         e.currentTarget.style.color = '#ebd73f';
                       }
                     }}
                     onMouseOut={e => {
                       if (copiedItem !== 'message') {
                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                         e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                         e.currentTarget.style.color = '#ffffff';
                       }
                     }}
                   >
                     {copiedItem === 'message' ? (
                       <>
                         <CheckCircle2 size={15} />
                         <span>Copied!</span>
                       </>
                     ) : (
                       <>
                         <Share2 size={15} />
                         <span>Copy Message</span>
                       </>
                     )}
                   </button>

                   <button 
                     type="button"
                     onClick={handleWhatsAppShare} 
                     style={{ 
                       padding: '10px 12px', 
                       background: 'rgba(37, 211, 102, 0.1)', 
                       border: '1px solid rgba(37, 211, 102, 0.3)', 
                       borderRadius: '9px', 
                       color: '#25d366', 
                       fontFamily: "'Clash Display', sans-serif", 
                       fontSize: '0.8rem', 
                       fontWeight: '600', 
                       cursor: 'pointer', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       gap: '6px',
                       transition: 'all 0.15s ease'
                     }}
                     onMouseOver={e => {
                       e.currentTarget.style.background = 'rgba(37, 211, 102, 0.18)';
                       e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.5)';
                     }}
                     onMouseOut={e => {
                       e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
                       e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.3)';
                     }}
                   >
                     <MessageCircle size={15} />
                     <span>WhatsApp</span>
                   </button>
                 </div>

                 {/* Generated Message Preview */}
                 <div style={{
                   marginTop: '12px',
                   padding: '10px 12px',
                   background: 'rgba(0, 0, 0, 0.45)',
                   border: '1px solid rgba(255, 255, 255, 0.08)',
                   borderRadius: '9px',
                   textAlign: 'left'
                 }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     marginBottom: '6px'
                   }}>
                     <span style={{
                       fontFamily: "'Clash Display', sans-serif",
                       fontSize: '0.68rem',
                       fontWeight: '600',
                       textTransform: 'uppercase',
                       letterSpacing: '0.06em',
                       color: '#ebd73f'
                     }}>
                       Client Message Preview
                     </span>
                     <span style={{
                       fontFamily: "'Clash Display', sans-serif",
                       fontSize: '0.65rem',
                       color: '#71717a'
                     }}>
                       Zero Prices Shown
                     </span>
                   </div>
                   <div style={{
                     fontFamily: "'Clash Display', sans-serif",
                     fontSize: '0.74rem',
                     lineHeight: '1.45',
                     color: '#d4d4d8',
                     whiteSpace: 'pre-wrap',
                     maxHeight: '90px',
                     overflowY: 'auto',
                     background: 'rgba(255, 255, 255, 0.02)',
                     padding: '6px 8px',
                     borderRadius: '6px',
                     border: '1px solid rgba(255, 255, 255, 0.04)'
                   }}>
                     {getInvoiceShareMessage()}
                   </div>
                 </div>

                 {/* Google Sheets log status badge */}
                 {sheetLogStatus !== 'idle' && (
                   <div style={{
                     marginTop: '14px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px',
                     padding: '8px 12px',
                     borderRadius: '9px',
                     fontSize: '0.75rem',
                     fontFamily: "'Clash Display', sans-serif",
                     fontWeight: '600',
                     background: sheetLogStatus === 'success'
                       ? 'rgba(34, 197, 94, 0.1)'
                       : sheetLogStatus === 'logging'
                       ? 'rgba(235, 215, 63, 0.08)'
                       : sheetLogStatus === 'skipped'
                       ? 'rgba(156, 163, 175, 0.08)'
                       : 'rgba(239, 68, 68, 0.1)',
                     border: `1px solid ${
                       sheetLogStatus === 'success'
                         ? 'rgba(34, 197, 94, 0.25)'
                         : sheetLogStatus === 'logging'
                         ? 'rgba(235, 215, 63, 0.2)'
                         : sheetLogStatus === 'skipped'
                         ? 'rgba(156, 163, 175, 0.15)'
                         : 'rgba(239, 68, 68, 0.25)'
                     }`,
                     color: sheetLogStatus === 'success'
                       ? '#4ade80'
                       : sheetLogStatus === 'logging'
                       ? '#ebd73f'
                       : sheetLogStatus === 'skipped'
                       ? '#9ca3af'
                       : '#f87171',
                   }}>
                     <span>
                       {sheetLogStatus === 'logging' && '⏳'}
                       {sheetLogStatus === 'success' && '✅'}
                       {sheetLogStatus === 'skipped' && 'ℹ️'}
                       {sheetLogStatus === 'error' && '⚠️'}
                     </span>
                     {sheetLogStatus === 'logging' && 'Logging to Sales Sheet…'}
                     {sheetLogStatus === 'success' && 'Logged to Sales Sheet'}
                     {sheetLogStatus === 'skipped' && 'Sheets not configured'}
                     {sheetLogStatus === 'error' && 'Sheet log failed (invoice saved OK)'}
                   </div>
                 )}
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
                                      <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{bank.accountNumber}</p>
                                  </div>
                                  {bank.ifsc && (
                                      <div style={{ marginBottom: '30px' }}>
                                          <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>Routing / IFSC</p>
                                          <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{bank.ifsc}</p>
                                      </div>
                                  )}
                                  {bank.swift && (
                                      <div style={{ marginBottom: '30px' }}>
                                          <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>SWIFT Code</p>
                                          <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{bank.swift}</p>
                                      </div>
                                  )}
                                  {bank.upi && (
                                      <div>
                                          <p style={{ fontSize: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>UPI ID</p>
                                          <p style={{ fontSize: '36px', color: '#fff', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{bank.upi}</p>
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
