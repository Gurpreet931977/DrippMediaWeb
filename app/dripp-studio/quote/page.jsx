'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  
  // Custom Dialog State
  const [customDialog, setCustomDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, onCancel: null });
  const showAlert = (message, title = 'Notification') => setCustomDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null, onCancel: null });
  const showConfirm = (message, onConfirm, onCancel = null, title = 'Confirm Action') => setCustomDialog({ isOpen: true, type: 'confirm', title, message, onConfirm, onCancel });
  const closeDialog = () => setCustomDialog(prev => ({ ...prev, isOpen: false }));

  const [clientDetails, setClientDetails] = useState({
    name: '',
    brandName: '',
    email: '',
    mobile: '',
    date: new Date().toISOString().split('T')[0],
    gst: ''
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
  const [packageTiers, setPackageTiers] = useState([{ id: Date.now(), name: 'Standard Package', items: [] }]);
  
  // PMP Modality
  const [includePMP, setIncludePMP] = useState(true);
  const [pmpStrategy, setPmpStrategy] = useState('');

  // PDF Pages State (Dynamic Builder)
  const [pdfPages, setPdfPages] = useState([
    { id: 'cover_1', type: 'cover', title: 'Immersive Visual Narratives & Strategic Growth', subtitle: 'Prepared Exclusively For', hideHeading: false },
    { id: 'pmp_1', type: 'pmp', title: 'PMP Strategy', hideHeading: false },
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
  
  // Conflict Resolution State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [pendingAutoFillData, setPendingAutoFillData] = useState(null);

  const handleSmartPaste = async () => {
    if (!smartText.trim()) return;

    setIsAutoFilling(true);
    await new Promise(r => setTimeout(r, 800));
    const nlp = (await import('compromise')).default;
    const doc = nlp(smartText);

    let parsedClient = {};
    let parsedQuote = {};
    
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

    // Pre-normalize '28k' / '28K' to numeric values
    let normalizedText = smartText.replace(/(\d+)\s*k\b/gi, (match, p1) => `${parseInt(p1) * 1000}`);

    // 4. Extract Name & Brand
    const brandPatternMatch = normalizedText.match(/(?:brand\s*name\s*[-:]?\s*|for\s+brand\s+)([\w\s]+?)(?=\.|\n|,|$)/i);
    if (brandPatternMatch) {
        parsedClient.brands = [brandPatternMatch[1].trim()];
    } else {
        const forMatch = normalizedText.match(/for\s+([A-Z][a-zA-Z0-9'\s]+?(?=\.|\n))/);
        if (forMatch) {
            parsedClient.brands = [forMatch[1].trim()];
        } else {
            const organizations = doc.organizations().out('array');
            if (organizations.length > 0) {
                parsedClient.brands = [organizations[0].replace(/[.,;:!?]$/, '').trim()];
            } else {
                const brandMatch = normalizedText.match(/(?:brand|company):\s*([a-zA-Z\s0-9&]+)/i);
                if (brandMatch) parsedClient.brands = [brandMatch[1].trim()];
            }
        }
    }

    const people = doc.people().out('array');
    if (people.length > 0) {
        parsedClient.names = [people[0].replace(/[.,;:!?]$/, '').trim()];
    } else {
        const nameMatch = normalizedText.match(/(?:name|client):\s*([a-zA-Z\s]+)/i);
        if (nameMatch) parsedClient.names = [nameMatch[1].trim()];
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

    const paragraphs = smartText.split('\n\n');
    if (paragraphs.length > 0) {
        const lastPara = paragraphs.slice(-2).find(p => p.length > 50 && !p.match(/₹|\$|£|€/));
        if (lastPara) parsedQuote.message = lastPara.replace(/\n/g, ' ').trim();
    }

    if (smartText.toLowerCase().includes('monthly') || smartText.toLowerCase().includes('retainer') || smartText.toLowerCase().includes('/mo') || smartText.toLowerCase().includes('per month')) {
        parsedQuote.packageType = 'monthly';
    } else if (smartText.toLowerCase().includes('project')) {
        parsedQuote.packageType = 'project';
    }

    if (smartText.includes('₹') || smartText.includes('INR')) parsedQuote.currency = '₹';
    else if (smartText.includes('€') || smartText.includes('EUR')) parsedQuote.currency = '€';
    else if (smartText.includes('£') || smartText.includes('GBP')) parsedQuote.currency = '£';
    else if (smartText.includes('$') || smartText.includes('USD')) parsedQuote.currency = '$';

    // --- CONFLICT DETECTION ---
    const detectedConflicts = [];

    // Helper for scalar fields
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
            // No conflict, just stage it
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
        const sim = packageTiers[0]?.items?.find(ex => ex.desc && ex.desc.toLowerCase().replace(/s$/, '') === pi.desc.toLowerCase().replace(/s$/, ''));
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
        parsedQuote,
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
            parsedQuote,
            pendingItems,
            stagedClient: parsedClient.staged || {}
        });
    }
  };

  const applySmartPaste = (data) => {
      let updatedClient = { ...clientDetails, ...data.stagedClient };
      let updatedQuote = { ...quoteDetails };
      
      if (data.parsedQuote.message) updatedQuote.message = data.parsedQuote.message;
      if (data.parsedQuote.currency) updatedQuote.currency = data.parsedQuote.currency;
      if (data.parsedQuote.packageType) setPackageType(data.parsedQuote.packageType);
      
      setClientDetails(updatedClient);
      setQuoteDetails(updatedQuote);
      
      if (data.pendingItems.length > 0) {
          // Add non-empty items to Tier 1
          const validCurrent = packageTiers[0]?.items?.filter(i => i.desc || i.rate > 0) || [];
          const newTiers = [...packageTiers];
          if(newTiers.length === 0) newTiers.push({ id: Date.now(), name: 'Standard Package', items: [] });
          newTiers[0].items = [...validCurrent, ...data.pendingItems];
          setPackageTiers(newTiers);
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
              const newTiers = [...packageTiers];
              const itemsCopy = [...(newTiers[0]?.items || [])];
              const idx = itemsCopy.findIndex(i => i === conflict.existingItem);
              if (idx !== -1) {
                  itemsCopy[idx].qty += conflict.item.qty;
                  if (valueOverride === 'new' && conflict.type === 'item_diff_rate') {
                       itemsCopy[idx].rate = conflict.item.rate;
                  }
                  newTiers[0].items = itemsCopy;
                  setPackageTiers(newTiers);
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
    setPackageTiers([{ id: Date.now(), name: 'Standard Package', items: [] }]);
    setPackageType('project');
    setSmartText('');
    setShowClearModal(false);
  };

  useEffect(() => {
    setIsClient(true);
    const localPackages = localStorage.getItem('dripp_advanced_packages');
    
    const defaultTemplates = [
      {
        id: 'tpl_1',
        name: 'Standard vs Premium (8 Reels)',
        type: 'monthly',
        message: 'At Dripp Media, we believe in delivering nothing short of excellence. Our focus is entirely on producing high-end, uncompromising quality.',
        packageTiers: [
          {
            id: 'tier_1',
            name: 'Standard Package',
            items: [
              { desc: 'Reels / Short-form Videos', qty: 8, rate: 2250, details: 'High-retention editing, sound design, color grading.' }
            ]
          },
          {
            id: 'tier_2',
            name: 'Premium Package (8 Reels + 8 Posts)',
            items: [
              { desc: 'Reels / Short-form Videos', qty: 8, rate: 2250, details: 'High-retention editing, sound design, color grading.' },
              { desc: 'Graphic Design Posts', qty: 8, rate: 500, details: 'Custom designed carousel or static posts for Instagram/Facebook.' }
            ]
          }
        ]
      },
      {
        id: 'tpl_2',
        name: 'Website Project (3 Tiers)',
        type: 'project',
        message: 'A structured approach to your digital presence.',
        packageTiers: [
          {
            id: 'tier_1',
            name: 'Landing Page',
            items: [
              { desc: 'Custom Landing Page Design', qty: 1, rate: 15000, details: 'Single page conversion optimized design.' }
            ]
          },
          {
            id: 'tier_2',
            name: 'Standard Website',
            items: [
              { desc: 'Custom Website Design (Up to 5 pages)', qty: 1, rate: 35000, details: 'Full website design and development.' }
            ]
          },
          {
            id: 'tier_3',
            name: 'E-commerce Platform',
            items: [
              { desc: 'E-commerce Development', qty: 1, rate: 65000, details: 'Shopify / WooCommerce setup with up to 50 products.' }
            ]
          }
        ]
      }
    ];

    if (localPackages) {
      try {
        const parsed = JSON.parse(localPackages);
        if (parsed.length > 0) {
          setSavedPackages(parsed);
        } else {
          setSavedPackages(defaultTemplates);
          localStorage.setItem('dripp_advanced_packages', JSON.stringify(defaultTemplates));
        }
      } catch (e) {
        setSavedPackages(defaultTemplates);
        localStorage.setItem('dripp_advanced_packages', JSON.stringify(defaultTemplates));
      }
    } else {
      setSavedPackages(defaultTemplates);
      localStorage.setItem('dripp_advanced_packages', JSON.stringify(defaultTemplates));
    }
  }, []);

  const parseQuotePayload = (payload) => {
    if (!payload) return;
    if (payload.clientName) setClientDetails(prev => ({ ...prev, name: payload.clientName }));
    if (payload.brandName) setClientDetails(prev => ({ ...prev, brandName: payload.brandName }));
    if (payload.clientEmail) setClientDetails(prev => ({ ...prev, email: payload.clientEmail }));
    if (payload.clientMobile) setClientDetails(prev => ({ ...prev, mobile: payload.clientMobile }));
    if (payload.clientAddress) setClientDetails(prev => ({ ...prev, address: payload.clientAddress }));
    if (payload.gstNumber) setClientDetails(prev => ({ ...prev, gst: payload.gstNumber }));
    
    if (payload.packageType) {
      const pType = payload.packageType.toLowerCase();
      setPackageType(pType.includes('month') || pType.includes('retain') ? 'monthly' : 'project');
    }
    
    if (payload.pmpStrategy) {
      setIncludePMP(true);
      const strategyString = typeof payload.pmpStrategy === 'object' ? 
        `Overview:\n${payload.pmpStrategy.overview || ''}\n\nTarget Audience:\n${payload.pmpStrategy.targetAudience || ''}\n\nPhases:\n${(payload.pmpStrategy.phases || []).map(p => `- ${p.title}: ${p.description}`).join('\n')}` : 
        payload.pmpStrategy;
      setPmpStrategy(strategyString);
      setPdfPages(prev => {
        if (!prev.find(p => p.type === 'pmp')) {
          const newPages = [...prev];
          newPages.splice(1, 0, { id: 'pmp_1', type: 'pmp', title: 'Marketing Strategy & Concept', hideHeading: false });
          return newPages;
        }
        return prev;
      });
    }
    
    // Number parser helper for amounts (e.g. "15k", "15 K", "15,000", "₹15000", etc.)
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

    const targetBudget = parseNum(payload.totalBudget);
    const normalizeItems = (rawItems) => {
      let mapped = (rawItems || []).map(s => {
        const title = typeof s === 'string' ? s : (s.desc || s.name || 'Service Item');
        return {
          name: title,
          desc: title,
          qty: parseNum(s.qty) || 1,
          rate: parseNum(s.rate) || 0,
          details: s.details || ''
        };
      });

      if (targetBudget > 0 && mapped.length > 0) {
        const sum = mapped.reduce((acc, it) => acc + (it.qty * it.rate), 0);
        if (sum === 0) {
          const perItemRate = Math.round(targetBudget / mapped.length);
          let runningSum = 0;
          mapped = mapped.map((it, idx) => {
            if (idx === mapped.length - 1) {
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
          mapped = mapped.map((it, idx) => {
            if (idx === mapped.length - 1) {
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
      return mapped;
    };

    let allItems = [];
    if (payload.packageTiers && Array.isArray(payload.packageTiers) && payload.packageTiers.length > 0) {
      payload.packageTiers.forEach(t => {
        const tierItems = (t.items && Array.isArray(t.items) && t.items.length > 0) ? t.items : 
                          (t.services && Array.isArray(t.services) && t.services.length > 0) ? t.services : [];
        if (tierItems.length > 0) {
          allItems.push(...tierItems);
        }
      });
    }

    if (allItems.length === 0) {
      if (payload.services && Array.isArray(payload.services) && payload.services.length > 0) {
        allItems = payload.services;
      } else if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
        allItems = payload.items;
      }
    }

    if (allItems.length > 0) {
      if (payload.packageTiers && Array.isArray(payload.packageTiers) && payload.packageTiers.some(t => ((t.items && t.items.length > 0) || (t.services && t.services.length > 0)))) {
        setPackageTiers(payload.packageTiers.map((t, idx) => {
          const tierItems = (t.items && Array.isArray(t.items) && t.items.length > 0) ? t.items : 
                            (t.services && Array.isArray(t.services) && t.services.length > 0) ? t.services : allItems;
          return {
            id: Date.now() + idx,
            name: t.name || `Package ${idx + 1}`,
            items: normalizeItems(tierItems)
          };
        }));
      } else {
        setPackageTiers([{
          id: Date.now(),
          name: payload.brandName ? `${payload.brandName} Package` : 'Standard Package',
          items: normalizeItems(allItems)
        }]);
      }
    }
  };

  useEffect(() => {
    const pendingDataStr = sessionStorage.getItem('pendingPackageData');
    if (pendingDataStr) {
      try {
        const data = JSON.parse(pendingDataStr);
        parseQuotePayload(data);
        sessionStorage.removeItem('pendingPackageData');
      } catch (err) {
        console.error('Failed to parse pending package data', err);
      }
    }

    const handleCopilotAction = (e) => {
      const data = e.detail;
      if (['quote', 'package', 'pmp'].includes(data?.intent) && data?.payload) {
        parseQuotePayload(data.payload);
      } else if (data?.payload && (data.payload.packageTiers || data.payload.services || data.payload.items || data.payload.totalBudget || data.payload.pmpStrategy)) {
        parseQuotePayload(data.payload);
      }
    };
    
    window.addEventListener('copilot-action', handleCopilotAction);
    return () => window.removeEventListener('copilot-action', handleCopilotAction);
  }, []);

  useEffect(() => {
    window._drippFormContext = { clientDetails, packageTiers, quoteDetails, packageType, pmpStrategy };
  }, [clientDetails, packageTiers, quoteDetails, packageType, pmpStrategy]);

  const handleClientChange = (field, value) => setClientDetails(prev => ({ ...prev, [field]: value }));
  const handleQuoteChange = (field, value) => setQuoteDetails(prev => ({ ...prev, [field]: value }));
  
  const handleItemChange = (tierIndex, index, field, value) => {
    const newTiers = [...packageTiers];
    const val = (field === 'qty' || field === 'rate') ? (value === '' ? '' : Number(value)) : value;
    newTiers[tierIndex].items[index][field] = val;
    setPackageTiers(newTiers);
  };
  const addItem = (tierIndex) => {
    const newTiers = [...packageTiers];
    newTiers[tierIndex].items.push({ desc: '', qty: 1, rate: 0 });
    setPackageTiers(newTiers);
  };
  const removeItem = (tierIndex, index) => {
    const newTiers = [...packageTiers];
    newTiers[tierIndex].items.splice(index, 1);
    setPackageTiers(newTiers);
  };
  const addTier = () => setPackageTiers([...packageTiers, { id: Date.now(), name: `Option ${packageTiers.length + 1}`, items: [] }]);
  const removeTier = (tierIndex) => {
    if (packageTiers.length > 1) {
      const newTiers = [...packageTiers];
      newTiers.splice(tierIndex, 1);
      setPackageTiers(newTiers);
    } else {
      showAlert("You must have at least one package option.");
    }
  };
  const updateTierName = (tierIndex, name) => {
    const newTiers = [...packageTiers];
    newTiers[tierIndex].name = name;
    setPackageTiers(newTiers);
  };

  const saveCurrentAsPackage = () => {
    const name = prompt("Enter a name for this package template:");
    if (name && name.trim()) {
      const newPackage = { 
        id: Date.now(),
        name: name.trim(), 
        type: packageType,
        packageTiers: JSON.parse(JSON.stringify(packageTiers)),
        message: quoteDetails.message
      };
      const updatedPackages = [...savedPackages, newPackage];
      setSavedPackages(updatedPackages);
      localStorage.setItem('dripp_advanced_packages', JSON.stringify(updatedPackages));
      showAlert(`Template "${name}" saved!`);
    }
  };

  const loadPackage = (pkg) => {
    showConfirm(`Load template "${pkg.name}"? This will replace your current items.`, () => {
       if (pkg.packageTiers) { setPackageTiers(JSON.parse(JSON.stringify(pkg.packageTiers))); } else if (pkg.items) { setPackageTiers([{ id: Date.now(), name: 'Standard Package', items: [...pkg.items] }]); }
       setPackageType(pkg.type || 'project');
    });
  };

  const getTierTotal = (tier) => tier.items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);
  const isMultiTier = packageTiers.length > 1;
  const highestTotal = isMultiTier ? Math.max(...packageTiers.map(t => getTierTotal(t))) : (packageTiers[0] ? getTierTotal(packageTiers[0]) : 0);
  const total = highestTotal;

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
    
    try {
        const payload = {
            clientDetails,
            quoteDetails,
            packageTiers,
            packageType,
            total,
            includePMP,
            pmpStrategy,
            password: pass
        };
        
        const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
        
        if (response.ok) {
            const data = await response.json();
            setShareLink(`${window.location.origin}/quote/${data.id}`);
        } else {
            showAlert("Failed to save quote securely.");
        }
    } catch(err) {
        console.error(err);
        showAlert("API error while generating secure link.");
    }
  };

  if (!isClient) return <div style={{padding: '50px', color: 'white'}}>Loading Package Maker...</div>;

  const filteredTemplates = savedPackages.filter(p => p.name.toLowerCase().includes(searchTemplate.toLowerCase()));

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
                        Item already exists with the same rate ({quoteDetails.currency}{conflicts[currentConflictIdx].item.rate}).
                    </div>
                )}
                {conflicts[currentConflictIdx].type === 'item_diff_rate' && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        Existing Item Rate: {quoteDetails.currency}{conflicts[currentConflictIdx].existingItem.rate}<br/>
                        Pasted Item Rate: {quoteDetails.currency}{conflicts[currentConflictIdx].item.rate}
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
      <div className={styles.headerTop}>
        <div>
          <div className={styles.genzPill}>GEN-Z</div>
          <h1 className={styles.titleModern}>PERSONAL <span className={styles.titleHighlight}>MARKETING</span> PLAN</h1>
          <p className={styles.subtitleModern}>Design a personalized PMP for your clients</p>
        </div>
        <div className={styles.headerActions}>
           <button onClick={generatePDF} className={styles.btnModernSecondary}>
             <Download size={18} /> Export PDF
           </button>
           <button onClick={generateSecureLink} className={styles.btnModernPrimary}>
             <Share2 size={18} /> SHARE PACKAGE
           </button>
        </div>
      </div>

      {/* TOP HEADER SHARE LINK & PIN CARD */}
      {shareLink && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(20, 20, 20, 0.95) 100%)',
          border: '1px solid #ebd73f',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#ebd73f" />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontFamily: 'Clash Display, sans-serif' }}>
                Secure Proposal Share Link Created!
              </h4>
            </div>
            <button 
              onClick={() => setShareLink('')}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>

          <div className="quote-share-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                Secure Link:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  style={{ 
                    width: '100%', 
                    background: '#0a0a0a', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    color: '#ebd73f', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.9rem' 
                  }}
                />
                <button 
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  style={{ background: 'rgba(235, 215, 63, 0.2)', border: '1px solid #ebd73f', color: '#ebd73f', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                Security PIN:
              </label>
              <div style={{ background: '#0a0a0a', border: '1px solid #ebd73f', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '2px', textAlign: 'center' }}>
                {sharePassword}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <button 
                onClick={copyShareMessage}
                style={{ background: '#ebd73f', border: 'none', color: '#000', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
              >
                <Share2 size={16} /> Copy Full Message
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .quote-share-grid {
          display: grid;
          grid-template-columns: 1fr 180px auto;
          gap: 16px;
          align-items: center;
        }
        .quote-main-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
          align-items: start;
        }
        .quote-pdf-builder-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
          align-items: stretch;
        }
        @media (max-width: 1024px) {
          .quote-share-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .quote-main-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .quote-pdf-builder-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
      
      <div className="quote-main-grid">
        
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
          <div className={styles.cardModern}>
            <div className={styles.cardHeaderModern}>
              <Package size={20} color="#ebd73f" />
              <h3 className={styles.cardTitleModern}>Client Details</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                 <label className={styles.inputLabelModern}>BRAND / CLIENT NAME</label>
                 <input type="text" value={clientDetails.brandName || clientDetails.name} onChange={e => handleClientChange('brandName', e.target.value)} placeholder="e.g. Habivana Stays" className={styles.inputModern}  />
              </div>
              <div>
                 <label className={styles.inputLabelModern}>PACKAGE MODALITY</label>
                 <select value={packageType} onChange={e => setPackageType(e.target.value)} className={styles.inputModern}>
                    <option value="project">Project Basis</option>
                    <option value="monthly">Monthly Retainer</option>
                 </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                   <label className={styles.inputLabelModern}>Email Address</label>
                   <input type="email" value={clientDetails.email} onChange={e => handleClientChange('email', e.target.value)} placeholder="Contact email" className={styles.inputModern}  />
                </div>
                <div style={{ flex: 1 }}>
                   <label className={styles.inputLabelModern}>Mobile Number</label>
                   <input type="text" value={clientDetails.mobile} onChange={e => handleClientChange('mobile', e.target.value)} placeholder="Contact number" className={styles.inputModern}  />
                </div>
              </div>
            </div>
          </div>

          {/* Strategy / Concept Pitch (PMP) */}
          <div className={styles.cardModern}>
            <div className={styles.cardHeaderModern} style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="#ebd73f" />
                <h3 className={styles.cardTitleModern}>PMP Strategy & Concept Pitch</h3>
              </div>
              
              {/* Interactive PMP Toggle Switch */}
              <label 
                onClick={() => {
                  const nextVal = !includePMP;
                  setIncludePMP(nextVal);
                  if (nextVal) {
                    if (!pdfPages.find(p => p.type === 'pmp')) {
                      const newPages = [...pdfPages];
                      newPages.splice(1, 0, { id: 'pmp_' + Date.now(), type: 'pmp', title: 'PMP Strategy', hideHeading: false });
                      setPdfPages(newPages);
                    }
                  } else {
                    setPdfPages(pdfPages.filter(p => p.type !== 'pmp'));
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: '0.75rem', color: includePMP ? '#ebd73f' : '#888', fontWeight: '600', letterSpacing: '0.5px' }}>
                  {includePMP ? 'PMP SLIDE INCLUDED' : 'PMP SLIDE EXCLUDED'}
                </span>
                <div 
                  style={{
                    width: '42px',
                    height: '24px',
                    borderRadius: '12px',
                    background: includePMP ? '#ebd73f' : 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${includePMP ? '#ebd73f' : 'rgba(255, 255, 255, 0.2)'}`,
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div 
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: includePMP ? '#000' : '#888',
                      position: 'absolute',
                      top: '2px',
                      left: includePMP ? '20px' : '2px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '-5px 0 12px 0' }}>
              This section populates the PMP (Personal Marketing Plan) slide in your proposal presentation.
            </p>
            {includePMP ? (
              <textarea 
                value={pmpStrategy} 
                onChange={e => { 
                  setPmpStrategy(e.target.value); 
                }} 
                className={styles.inputModern} 
                rows={5} 
                placeholder="e.g. A storytelling UGC campaign targeting high-income demographics..."
                style={{ resize: 'vertical' }} 
              />
            ) : (
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>
                PMP Strategy slide is currently excluded from this proposal. Toggle ON above to include a PMP Strategy slide.
              </div>
            )}
          </div>

          {/* Section 3: Services & Tiers */}
          <div className={styles.cardModern}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div className={styles.cardHeaderModern}><Layers size={20} color="#ebd73f" /><h3 className={styles.cardTitleModern}>Scope of Services</h3></div>
                <button onClick={addTier} className={styles.addServiceBtn} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add Tier
                </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
              {packageTiers.map((tier, tierIndex) => (
                <div key={tier.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                     <input type="text" value={tier.name} onChange={(e) => { const nt = [...packageTiers]; nt[tierIndex].name = e.target.value; setPackageTiers(nt); }} className={styles.inputModern} style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '300px', background: 'rgba(0,0,0,0.2)' }} />
                     {packageTiers.length > 1 && <button onClick={() => { const nt = [...packageTiers]; nt.splice(tierIndex, 1); setPackageTiers(nt); }} className={styles.btnDanger} style={{ padding: '5px 10px', fontSize: '0.8rem' }}><Trash2 size={14} /> Remove Tier</button>}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {tier.items.map((item, index) => (
                      <div key={index} className={styles.serviceItemRow} style={{ flexWrap: 'wrap', background: '#111', border: '1px solid rgba(235, 215, 63, 0.25)', padding: '12px 16px', borderRadius: '12px' }}>
                        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
                          <input 
                             list="services-list"
                             type="text" 
                             value={item.desc || item.name || ''} 
                             onChange={(e) => handleItemChange(tierIndex, index, 'desc', e.target.value)}
                             placeholder="Service Item Description"
                             className={styles.inputModern}
                             style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontWeight: '600' }}
                          />
                        </div>
                        <div style={{ flex: '0 0 110px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 'bold' }}>Qty</span>
                          <input 
                            type="number" 
                            value={item.qty ?? ''} 
                            onChange={(e) => handleItemChange(tierIndex, index, 'qty', e.target.value)}
                            placeholder="1"
                            className={styles.inputModern}
                            style={{ 
                              width: '70px', 
                              minWidth: '70px',
                              padding: '8px 10px', 
                              background: 'rgba(255, 255, 255, 0.12)', 
                              border: '1px solid #ebd73f', 
                              color: '#ffffff', 
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              textAlign: 'center',
                              borderRadius: '8px'
                            }}
                          />
                        </div>
                        <div style={{ flex: '0 0 145px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#ebd73f', fontWeight: 'bold', fontSize: '0.95rem' }}>{quoteDetails.currency}</span>
                          <input 
                            type="number" 
                            value={item.rate ?? ''} 
                            onChange={(e) => handleItemChange(tierIndex, index, 'rate', e.target.value)}
                            placeholder="0"
                            className={styles.inputModern}
                            style={{ 
                              width: '105px', 
                              minWidth: '105px',
                              padding: '8px 10px', 
                              background: 'rgba(255, 255, 255, 0.12)', 
                              border: '1px solid #ebd73f', 
                              color: '#ffffff', 
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              borderRadius: '8px'
                            }}
                          />
                        </div>
                        <div style={{ flex: '0 0 120px', padding: '0 5px', color: '#ebd73f', fontWeight: 'bold', fontSize: '1rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                           <span style={{ color: '#666', fontWeight: 'normal' }}>=</span> {quoteDetails.currency}{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}
                        </div>
                        <button onClick={() => removeItem(tierIndex, index)} className={styles.serviceItemDelete} style={{ flexShrink: 0 }}>
                          <Trash2 size={18} />
                        </button>
                        <div style={{ flexBasis: '100%', marginTop: '10px' }}>
                           <textarea 
                             value={item.details || ''} 
                             onChange={(e) => handleItemChange(tierIndex, index, 'details', e.target.value)}
                             placeholder="e.g. Detailed breakdown of deliverables..."
                             className={styles.inputModern}
                             style={{ padding: '8px 12px', fontSize: '0.88rem', width: '100%', minHeight: '50px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#ddd' }}
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '15px' }}>
                      <button onClick={() => addItem(tierIndex)} className={styles.addServiceBtn} style={{ padding: '8px 15px', fontSize: '0.85rem' }}>
                        + Add Service
                      </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '1.1rem', color: '#888' }}>Total Amount:</span>
               <span style={{ fontSize: '1.3rem', color: '#ebd73f', fontWeight: 'bold' }}>{quoteDetails.currency}{total.toFixed(2)}</span>
            </div>
          </div>

          </div>
          
        {/* RIGHT COLUMN: TEMPLATES & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
                    {/* PACKAGE SUMMARY */}
          <div className={styles.cardSummary}>
            <h3 className={styles.summaryTitle}>Package Summary</h3>
            
            <div style={{ marginBottom: '25px' }}>
              <span className={styles.inputLabelModern}>Target Client</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>{clientDetails.brandName || clientDetails.name || 'Unnamed Client'}</div>
            </div>

            <div className={styles.summaryAmountBox}>
              <span className={styles.summaryAmountLabel}>$ Total Budget Quoted</span>
              <h2 className={styles.summaryAmountValue}>
                {quoteDetails.currency}{total.toLocaleString()}
              </h2>
            </div>

            <div>
              <h4 className={styles.summarySectionTitle}>Included Services</h4>
              {includePMP && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemIncluded}>✓ Personal Marketing Plan</span>
                  <span className={styles.summaryItemBadge}>INCLUDED</span>
                </div>
              )}
              {packageTiers.map((tier, tIdx) => (
                  <div key={tIdx}>
                     {packageTiers.length > 1 && <div style={{ fontSize: '0.8rem', color: '#ebd73f', marginBottom: '8px', marginTop: '10px' }}>{tier.name}</div>}
                     {tier.items.map((s, i) => (
                       <div key={i} className={styles.summaryItem}>
                         <span>{s.qty}x {s.desc || 'Custom Strategy'}</span>
                         <span style={{ color: '#888' }}>{s.rate > 0 ? `${quoteDetails.currency}${s.rate}` : ''}</span>
                       </div>
                     ))}
                  </div>
              ))}
            </div>
            
            <div className={styles.summaryFooterText}>
              This is a {packageType === 'monthly' ? 'recurring monthly' : 'project / one-time'} package.
            </div>
          </div>

          <CurrencyConverter />

           {/* Actions */}
           <div className={styles.card}>
             <div style={{display: "none"}}><h3 style={{ marginBottom: '15px', color: '#ebd73f' }}>Export & Share</h3>
             <button onClick={generatePDF} className={styles.btnPrimary} style={{ width: '100%', padding: '12px', justifyContent: 'center', marginBottom: '15px' }}>
               <Download size={18} /> Download as PDF
             </button>
             <button onClick={generateSecureLink} className={styles.btn} style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
               <Lock size={18} /> Generate Secure Link
             </button></div>
             
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
                       <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px' }}>{pkg.type === 'project' ? 'Project' : 'Monthly'} • {pkg.packageTiers ? pkg.packageTiers.flatMap(t => t.items || []).length : pkg.items?.length || 0} items</div>
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
            
            <div className="quote-pdf-builder-grid">
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
                             {page.type === 'pmp' && <Edit3 size={16} color="#ebd73f" />}
                             {page.type === 'services' && <FileText size={16} color="#888" />}
                             {page.type === 'investment' && <Package size={16} color="#888" />}
                             {page.type === 'next_steps' && <CheckCircle size={16} color="#888" />}
                             {page.type === 'custom_text' && <Type size={16} color="#888" />}
                             {page.type === 'infographic' && <Layers size={16} color="#888" />}
                             <span style={{ fontSize: '0.9rem', color: selectedPageIndex === index ? '#fff' : '#aaa' }}>
                                {page.type === 'pmp' ? 'PMP Strategy' : page.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
              {packageTiers.flatMap(t => t.items).map((item, i) => (
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
                             {clientDetails.gst && <p style={{ fontSize: '24px', color: '#aaa', margin: '10px 0 0 0' }}>GST: {clientDetails.gst}</p>}
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
                          {!page.hideHeading && (
                              <div style={{ marginBottom: '40px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '30px' }}>
                                  <h1 className={styles.pdfTitle} style={{ margin: 0, fontFamily: "'Panchang', sans-serif" }}>{page.title}</h1>
                              </div>
                          )}
                          
                          {packageTiers.length > 1 ? (
                              packageTiers.map((tier, tIdx) => (
                                  <div key={tIdx} style={{ marginBottom: '30px' }}>
                                      <h3 style={{ fontSize: '28px', color: '#ebd73f', margin: '0 0 15px 0' }}>{tier.name || `Option ${tIdx + 1}`}</h3>
                                      {tier.items.slice(0, 5).map((item, i) => (
                                          <div key={i} className={styles.pdfServiceCard} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', marginBottom: '15px' }}>
                                              <div style={{ flex: 1, paddingRight: '30px' }}>
                                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '26px', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>{item.desc || 'Service Item'}</h4>
                                                  {item.details && <p style={{ margin: 0, fontSize: '18px', color: '#888', lineHeight: 1.4 }}>{item.details}</p>}
                                              </div>
                                              <div style={{ textAlign: 'right' }}>
                                                  <div style={{ fontSize: '20px', color: '#888', marginBottom: '5px' }}>QTY: {item.qty}</div>
                                                  {item.rate > 0 && <div className={styles.pdfAmount} style={{ fontSize: '24px' }}>{quoteDetails.currency} {item.rate.toLocaleString()}</div>}
                                              </div>
                                          </div>
                                      ))}
                                      {tier.items.length > 5 && (
                                          <div style={{ fontSize: '20px', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                                              + {tier.items.length - 5} more items.
                                          </div>
                                      )}
                                  </div>
                              ))
                          ) : (
                              <>
                                  {packageTiers.flatMap(t => t.items).slice(0, 5).map((item, i) => (
                                      <div key={i} className={styles.pdfServiceCard}>
                                          <div style={{ flex: 1, paddingRight: '30px' }}>
                                              <h4 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>{item.desc || 'Service Item'}</h4>
                                              {item.details && <p style={{ margin: 0, fontSize: '20px', color: '#888', lineHeight: 1.4 }}>{item.details}</p>}
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                              <div style={{ fontSize: '24px', color: '#888', marginBottom: '5px' }}>QTY: {item.qty}</div>
                                              {item.rate > 0 && <div className={styles.pdfAmount}>{quoteDetails.currency} {item.rate.toLocaleString()}</div>}
                                          </div>
                                      </div>
                                  ))}
                                  {packageTiers.flatMap(t => t.items || []).length > 5 && (
                                      <div style={{ fontSize: '24px', color: '#888', textAlign: 'center', marginTop: '20px' }}>
                                          + {packageTiers.flatMap(t => t.items || []).length - 5} more items detailed in the full agreement.
                                      </div>
                                  )}
                              </>
                          )}
                      </div>
                  )}

                  {/* PMP PAGE */}
                  {page.type === 'pmp' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1 }}>
                          <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderLeft: '8px solid #ebd73f', padding: '50px', borderRadius: '16px', flex: 1, borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderRight: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                              <p style={{ fontSize: '28px', color: '#fff', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>
                                  {pmpStrategy || 'Strategy outline goes here...'}
                              </p>
                          </div>
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
                            
                            {packageTiers.length > 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', alignItems: 'center' }}>
                                    {packageTiers.map((tier, tIdx) => {
                                        const tierTotal = tier.items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);
                                        return (
                                            <div key={tIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 50px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(235, 215, 63, 0.1)', width: '100%', maxWidth: '800px' }}>
                                                <span style={{ fontSize: '24px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>{tier.name || `Option ${tIdx + 1}`}</span>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                                                    <span style={{ fontSize: '50px', color: '#ebd73f', fontWeight: '500' }}>{quoteDetails.currency}</span>
                                                    <span style={{ fontSize: '130px', color: '#ebd73f', fontWeight: '900', letterSpacing: '-3px', lineHeight: 1, fontFamily: "'Panchang', sans-serif" }}>{tierTotal.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                                    <span style={{ fontSize: '60px', color: '#ebd73f', fontWeight: '500' }}>{quoteDetails.currency}</span>
                                    <span style={{ fontSize: '180px', color: '#ebd73f', fontWeight: '900', letterSpacing: '-5px', lineHeight: 1, fontFamily: "'Panchang', sans-serif" }}>{total.toLocaleString()}</span>
                                </div>
                            )}
                            
                            {packageType === 'monthly' && (
                                <p style={{ fontSize: '24px', color: '#aaa', marginTop: '40px' }}>*Billed monthly. Cancel anytime with 30 days notice.</p>
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
