'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Download, Package, Search, Share2, FileText, Lock, Edit3, Save, CheckCircle, ShieldCheck, Loader, CheckCircle2, ArrowUp, ArrowDown, Layers, Type, Image, EyeOff, Eye, Copy, MessageCircle, History, Clock, ExternalLink, RefreshCw, ClipboardCheck, Sparkles, Globe, X, Check } from 'lucide-react';
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
    { id: 'pmp_1', type: 'pmp', title: 'Strategy & Concept Pitch', hideHeading: false },
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
  
  // Package / Quote History State
  const [historyQuotes, setHistoryQuotes] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('history'); // 'history' | 'templates'
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // 'all' | 'project' | 'monthly'
  const [activeEditingQuote, setActiveEditingQuote] = useState(null); // { id, password, brandName }
  const [isUpdatingLive, setIsUpdatingLive] = useState(false);

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

  // Fetch all quotes / packages history from cloud & resilient storage
  const fetchHistoryQuotes = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/quote');
      if (res.ok) {
        const data = await res.json();
        if (data.quotes && Array.isArray(data.quotes)) {
          setHistoryQuotes(data.quotes);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch package history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Format any package into structured text tailored specifically for AI Smart Paste
  const formatPackageForSmartPaste = (pkg) => {
    if (!pkg) return '';
    const qData = pkg.quote_data || pkg;
    const client = qData.clientDetails || {};
    const brand = client.brandName || qData.brandName || 'Client Brand';
    const cName = client.name || '';
    const email = client.email || '';
    const phone = client.phone || client.mobile || '';
    const address = client.address || '';
    const gst = client.gst || client.gstNumber || '';
    const pType = qData.packageType || qData.type || 'project';
    const curr = qData.quoteDetails?.currency || '₹';
    const tot = qData.total || '';
    const pmp = qData.pmpStrategy || '';
    const msg = qData.quoteDetails?.message || qData.message || '';

    const lines = [];
    lines.push(`Brand Name: ${brand}`);
    if (cName) lines.push(`Client Name: ${cName}`);
    if (email) lines.push(`Email: ${email}`);
    if (phone) lines.push(`Phone: ${phone}`);
    if (address) lines.push(`Address: ${address}`);
    if (gst) lines.push(`GST: ${gst}`);
    lines.push(`Package Type: ${pType}`);
    lines.push(`Currency: ${curr}`);
    if (tot) lines.push(`Total Budget: ${curr}${tot}`);

    lines.push('');
    lines.push('Deliverables:');

    if (qData.packageTiers && Array.isArray(qData.packageTiers) && qData.packageTiers.length > 0) {
      qData.packageTiers.forEach((tier, tIdx) => {
        if (qData.packageTiers.length > 1) {
          lines.push(`-- Tier ${tIdx + 1}: ${tier.name || 'Package Option'} --`);
        }
        (tier.items || []).forEach(it => {
          const title = it.desc || it.name || 'Service Item';
          const qty = it.qty || 1;
          const rate = it.rate || 0;
          const detailSuffix = it.details ? ` (${it.details})` : '';
          lines.push(`- ${title} (${qty}) : ${curr}${rate} each${detailSuffix}`);
        });
      });
    } else if (qData.items && Array.isArray(qData.items)) {
      qData.items.forEach(it => {
        const title = it.desc || it.name || 'Service Item';
        const qty = it.qty || 1;
        const rate = it.rate || 0;
        const detailSuffix = it.details ? ` (${it.details})` : '';
        lines.push(`- ${title} (${qty}) : ${curr}${rate} each${detailSuffix}`);
      });
    } else if (qData.services && Array.isArray(qData.services)) {
      qData.services.forEach(it => {
        const title = it.name || it.desc || 'Service Item';
        const qty = it.qty || 1;
        const rate = it.rate || 0;
        const detailSuffix = it.details ? ` (${it.details})` : '';
        lines.push(`- ${title} (${qty}) : ${curr}${rate} each${detailSuffix}`);
      });
    }

    if (pmp) {
      lines.push('');
      lines.push('PMP Strategy:');
      const stratStr = typeof pmp === 'object' ?
        `Overview: ${pmp.overview || ''}\nTarget Audience: ${pmp.targetAudience || ''}\nPhases: ${(pmp.phases || []).map(p => `${p.title}: ${p.description}`).join('; ')}` :
        pmp;
      lines.push(stratStr);
    }

    if (msg) {
      lines.push('');
      lines.push('Notes:');
      lines.push(msg);
    }

    return lines.join('\n');
  };

  // Copy full package details for AI Smart Paste with visual feedback
  const copyPackageForSmartPaste = (pkg, itemId = null) => {
    const text = formatPackageForSmartPaste(pkg);
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
      setCopiedItem(itemId || 'smartPasteCopy');
      setTimeout(() => setCopiedItem(null), 2500);
      showAlert('Package details copied to clipboard! You can paste this directly into AI Smart Paste.');
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  // Load a package from history directly into the live editor
  const loadQuoteFromHistory = (rec, skipConfirm = false) => {
    const doLoad = () => {
      const qData = rec.quote_data || rec;
      setActiveEditingQuote({
        id: rec.id,
        password: rec.password || '',
        brandName: rec.brandName || 'Client'
      });
      setShareLink(`${window.location.origin}/quote/${rec.id}`);
      setSharePassword(rec.password || '');

      parseQuotePayload(qData);

      if (qData.quoteDetails) {
        setQuoteDetails(prev => ({ ...prev, ...(qData.quoteDetails || {}) }));
      }
      if (qData.packageTiers && Array.isArray(qData.packageTiers) && qData.packageTiers.length > 0) {
        setPackageTiers(JSON.parse(JSON.stringify(qData.packageTiers)));
      } else if (qData.items && Array.isArray(qData.items)) {
        setPackageTiers([{ id: Date.now(), name: 'Standard Package', items: JSON.parse(JSON.stringify(qData.items)) }]);
      }
      if (qData.packageType) {
        setPackageType(qData.packageType);
      }
      if (qData.pmpStrategy) {
        const strat = typeof qData.pmpStrategy === 'object' ?
          `Overview:\n${qData.pmpStrategy.overview || ''}\n\nTarget Audience:\n${qData.pmpStrategy.targetAudience || ''}\n\nPhases:\n${(qData.pmpStrategy.phases || []).map(p => `- ${p.title}: ${p.description}`).join('\n')}` :
          qData.pmpStrategy;
        setPmpStrategy(strat);
        setIncludePMP(true);
      }

      setShowHistoryModal(false);
      showAlert(`Package for "${rec.brandName}" is now LIVE in the editor! You can make edits and click "Save to Live Link" to update the client link.`);
    };

    if (skipConfirm) {
      doLoad();
    } else {
      showConfirm(
        `Load package for "${rec.brandName}"? This will populate the editor live with all client info, services, and strategy.`,
        doLoad,
        () => {},
        'Load Package into Editor'
      );
    }
  };

  // Save changes back into the existing active package link in Supabase & cloud storage
  const updateLiveQuote = async () => {
    if (!activeEditingQuote?.id) return;
    setIsUpdatingLive(true);
    try {
      const payload = {
        clientDetails,
        quoteDetails,
        packageTiers,
        packageType,
        total,
        includePMP,
        pmpStrategy,
        password: sharePassword || activeEditingQuote.password
      };

      const res = await fetch('/api/quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeEditingQuote.id,
          password: sharePassword || activeEditingQuote.password,
          quote_data: payload
        })
      });

      if (res.ok) {
        showAlert(`Package for "${activeEditingQuote.brandName}" updated live! The existing client link now reflects your latest edits.`);
        fetchHistoryQuotes();
      } else {
        showAlert('Failed to update live package. Please check network.');
      }
    } catch (err) {
      console.error('Error updating live quote:', err);
      showAlert('API error updating live package.');
    } finally {
      setIsUpdatingLive(false);
    }
  };

  // Delete a package from history
  const deleteHistoryQuote = (id, name) => {
    showConfirm(
      `Are you sure you want to delete the package for "${name}"? This cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`/api/quote?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) {
            showAlert(`Package for "${name}" deleted.`);
            if (activeEditingQuote?.id === id) {
              setActiveEditingQuote(null);
            }
            fetchHistoryQuotes();
          }
        } catch (e) {
          showAlert('Failed to delete package.');
        }
      },
      () => {},
      'Delete Package'
    );
  };

  const loadQuoteFromHistoryRef = useRef(loadQuoteFromHistory);
  loadQuoteFromHistoryRef.current = loadQuoteFromHistory;
  const updateLiveQuoteRef = useRef(updateLiveQuote);
  updateLiveQuoteRef.current = updateLiveQuote;
  const historyQuotesRef = useRef(historyQuotes);
  historyQuotesRef.current = historyQuotes;
  const activeEditingQuoteRef = useRef(activeEditingQuote);
  activeEditingQuoteRef.current = activeEditingQuote;

  const handleSmartPaste = async () => {
    if (!smartText.trim()) return;

    // Check if user pasted structured JSON from a package export
    const trimmed = smartText.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const json = JSON.parse(trimmed);
        const qData = json.quote_data || json;
        parseQuotePayload(qData);
        if (qData.quoteDetails) setQuoteDetails(prev => ({ ...prev, ...(qData.quoteDetails || {}) }));
        if (qData.packageTiers && Array.isArray(qData.packageTiers) && qData.packageTiers.length > 0) {
          setPackageTiers(JSON.parse(JSON.stringify(qData.packageTiers)));
        } else if (qData.items && Array.isArray(qData.items)) {
          setPackageTiers([{ id: Date.now(), name: 'Standard Package', items: JSON.parse(JSON.stringify(qData.items)) }]);
        }
        if (qData.pmpStrategy) {
          setPmpStrategy(typeof qData.pmpStrategy === 'object' ? JSON.stringify(qData.pmpStrategy) : qData.pmpStrategy);
          setIncludePMP(true);
        }
        setSmartText('');
        setIsAutoFillSuccess(true);
        setTimeout(() => setIsAutoFillSuccess(false), 2000);
        showAlert('Package loaded directly from pasted JSON with 100% precision!');
        return;
      } catch (e) {
        // Continue to regular parser if JSON parsing fails
      }
    }

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
    const brandPatternMatch = normalizedText.match(/(?:brand\s*name\s*[-:]?\s*|brand\s*[-:]?\s*|for\s+brand\s+)([\w\s&'-]+?)(?=\.|\n|,|$)/i);
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

    const clientNameMatch = normalizedText.match(/(?:client\s*name\s*[-:]?\s*|client\s*[-:]?\s*|name\s*[-:]?\s*)([a-zA-Z0-9\s&'-]+?)(?=\.|\n|,|$)/i);
    if (clientNameMatch) {
        parsedClient.names = [clientNameMatch[1].trim()];
    } else {
        const people = doc.people().out('array');
        if (people.length > 0) {
            parsedClient.names = [people[0].replace(/[.,;:!?]$/, '').trim()];
        }
    }

    // 5. Extract PMP Strategy
    const pmpMatch = smartText.match(/(?:PMP\s*Strategy|Strategy\s*Overview|Strategy\s*Pitch|Strategy):\s*([\s\S]+?)(?=\nNotes:|\n---|\nDeliverables:|$)/i);
    if (pmpMatch) {
        parsedQuote.pmpStrategy = pmpMatch[1].trim();
    }

    // Explicit Address extraction
    const addressExplicit = smartText.match(/Address:\s*([^\n]+)/i);
    if (addressExplicit) {
        parsedClient.address = [addressExplicit[1].trim()];
    }

    // 6. Extract Items/Prices using Advanced Heuristics + NLP
    const parsedItems = [];
    
    lines.forEach(line => {
        if (!line) return;
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        if (line.match(/Total Investment/i) || line.match(/Total Budget/i)) return;
        if (line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)) return;
        if (line.match(/^Deliverables:/i) || line.match(/^---/)) return;
        if (line.match(/^PMP Strategy:/i) || line.match(/^Notes:/i)) return;
        
        let isPhoneLine = false;
        for (let cp of confirmedPhones) {
             if (line.includes(cp)) isPhoneLine = true;
        }
        if (isPhoneLine) return;
        if (line.match(/^(?:name|client|brand|company|for|package type|currency|address):\s*/i)) return;
        
        let qty = 1;
        let rate = 0;
        let desc = "";
        
        let m1 = line.match(/^[-*•]?\s*(.*?)\s*\((\d+)\)\s*[:-]?\s*[$€£₹]?\s*([\d,.]+)\s*each(?:\s*\((.*?)\))?/i);
        if (m1) {
            parsedItems.push({
              desc: m1[1].trim(), 
              qty: parseInt(m1[2]), 
              rate: parseFloat(m1[3].replace(/,/g, '')),
              details: m1[4] ? m1[4].trim() : ''
            });
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
        
        if (!addressExplicit) {
          addressLines.push(line);
        }
    });

    if (!addressExplicit && addressLines.length > 0) {
        let rawAddress = addressLines.join('\n');
        let cleaned = rawAddress.replace(/(?:[a-zA-Z /.-]+:)/g, ',');
        let parts = cleaned.replace(/\n/g, ',').split(',').map(s => s.trim()).filter(s => s);
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

    const pendingItems = [];
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
      if (data.parsedQuote.pmpStrategy) {
          setPmpStrategy(data.parsedQuote.pmpStrategy);
          setIncludePMP(true);
      }
      
      setClientDetails(updatedClient);
      setQuoteDetails(updatedQuote);
      
      if (data.pendingItems.length > 0) {
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
      date: localDate,
      gst: ''
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
    setPmpStrategy('');
    setIncludePMP(true);
    setSmartText('');
    setShareLink('');
    setSharePassword('');
    setShowClearModal(false);
  };

  useEffect(() => {
    setIsClient(true);
    fetchHistoryQuotes();
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

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const loadId = urlParams.get('loadId') || urlParams.get('quoteId') || urlParams.get('id');
      if (loadId) {
        fetch(`/api/quote?id=${encodeURIComponent(loadId)}`)
          .then(res => res.json())
          .then(data => {
            if (data.quote) {
              loadQuoteFromHistory(data.quote, true);
            }
          })
          .catch(e => console.warn('Could not auto-load quote from param:', e));
      }
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
          newPages.splice(1, 0, { id: 'pmp_1', type: 'pmp', title: 'Strategy & Concept Pitch', hideHeading: false });
          return newPages;
        }
        return prev;
      });
    }

    // Dynamic cover page title & subtitle generation
    if (payload.coverHeading || payload.coverTitle || payload.coverSubtitle || payload.coverDetails) {
      const title = payload.coverHeading || payload.coverTitle || payload.coverDetails?.title || payload.coverDetails?.heading;
      const subtitle = payload.coverSubtitle || payload.coverDetails?.subtitle;
      setPdfPages(prev => prev.map(p => {
        if (p.type === 'cover') {
          return {
            ...p,
            title: title || p.title,
            subtitle: subtitle !== undefined ? subtitle : p.subtitle
          };
        }
        return p;
      }));
    } else if (payload.brandName) {
      const bName = payload.brandName;
      const combined = (bName + ' ' + (typeof payload.pmpStrategy === 'string' ? payload.pmpStrategy : JSON.stringify(payload.pmpStrategy || ''))).toLowerCase();
      let autoTitle = 'Strategic Growth & Digital Architecture Proposal';
      if (combined.includes('real estate') || combined.includes('property')) {
        autoTitle = 'Strategic Real Estate Web Platform & Digital Growth';
      } else if (combined.includes('e-commerce') || combined.includes('ecommerce') || combined.includes('store') || combined.includes('shop')) {
        autoTitle = 'Omnichannel Commerce Architecture & Conversion Engine';
      } else if (combined.includes('brand') || combined.includes('identity')) {
        autoTitle = 'Bespoke Brand Identity & Market Authority Blueprint';
      } else if (combined.includes('video') || combined.includes('media') || combined.includes('production')) {
        autoTitle = 'High-Impact Cinematic Media & Creative Production';
      } else if (bName && bName.toLowerCase() !== 'client') {
        autoTitle = `Strategic ${bName} Growth & Digital Architecture`;
      }
      setPdfPages(prev => prev.map(p => {
        if (p.type === 'cover') {
          return {
            ...p,
            title: (p.title === 'Immersive Visual Narratives & Strategic Growth' ? autoTitle : p.title),
            subtitle: 'Prepared Exclusively For'
          };
        }
        return p;
      }));
    }
    
    // Number parser helper for amounts (e.g. "24k", "24 K", "24,000", "₹24000", "1.5L", "2 Lakhs", etc.)
    const parseNum = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
      if (!val || typeof val !== 'string') return 0;
      const str = val.trim();
      if (!str) return 0;

      const crMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:cr\b|crores?)/i);
      if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

      const mMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:m\b|millions?)/i);
      if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1000000);

      const lakhMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lac\b|l\b)/i);
      if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

      const kMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:k\b|thousands?)/i);
      if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

      const currMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/i);
      if (currMatch) return Math.round(parseFloat(currMatch[1].replace(/,/g, '')));

      const match = str.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/);
      if (match) {
        const num = parseFloat(match[0]);
        return isNaN(num) ? 0 : Math.round(num);
      }
      return 0;
    };

    const targetBudget = parseNum(payload.totalBudget) || parseNum(payload.budget) || parseNum(payload.total) || 0;
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
        if (data.id) {
          setActiveEditingQuote({
            id: data.id,
            password: data.password || '',
            brandName: data.brandName || 'Client'
          });
          setShareLink(`${window.location.origin}/quote/${data.id}`);
          if (data.password) setSharePassword(data.password);
        }
        parseQuotePayload(data);
        sessionStorage.removeItem('pendingPackageData');
      } catch (err) {
        console.error('Failed to parse pending package data', err);
      }
    }

    const pendingCopilotActionStr = sessionStorage.getItem('pendingCopilotAction');
    if (pendingCopilotActionStr) {
      try {
        const actionData = JSON.parse(pendingCopilotActionStr);
        sessionStorage.removeItem('pendingCopilotAction');
        setTimeout(() => {
          handleCopilotAction({ detail: actionData });
        }, 120);
      } catch (err) {
        console.error('Failed to parse pending copilot action', err);
      }
    }

    const handleCopilotAction = (e) => {
      const data = e.detail;
      if (!data) return;

      if ((data?.intent === 'save_template' || data?.payload?.action === 'save_template' || data?.payload?.saveAsTemplate) && data?.intent !== 'save_live_package' && data?.payload?.action !== 'save_live' && !String(data?.payload?.templateName || '').toLowerCase().includes('live')) {
        const live = window._drippFormContext || {};
        const liveClient = live.clientDetails || clientDetails || {};
        const liveTiers = live.packageTiers || packageTiers || [];
        const liveType = live.packageType || packageType || 'project';
        const livePmp = live.pmpStrategy !== undefined ? live.pmpStrategy : pmpStrategy;
        const liveQuote = live.quoteDetails || quoteDetails || {};

        const brand = liveClient.brandName || liveClient.name || '';
        const tName = data.payload?.templateName || (brand ? `${brand} Package` : 'Custom Package Template');
        const tiersToSave = (data.payload?.packageTiers && data.payload.packageTiers.length > 0) ? data.payload.packageTiers : liveTiers;
        
        const newPackage = {
          id: Date.now(),
          name: tName,
          type: liveType,
          packageTiers: JSON.parse(JSON.stringify(tiersToSave)),
          pmpStrategy: data.payload?.pmpStrategy || livePmp || '',
          message: liveQuote.message || ''
        };

        let existing = [];
        try {
          const stored = localStorage.getItem('dripp_advanced_packages');
          if (stored) existing = JSON.parse(stored);
        } catch (err) {
          existing = [];
        }

        const updated = [...existing, newPackage];
        try {
          localStorage.setItem('dripp_advanced_packages', JSON.stringify(updated));
        } catch (err) {}
        setSavedPackages(updated);
        showAlert(`Template "${tName}" saved successfully!`);
      } else if (data?.intent === 'load_package' || data?.payload?.action === 'load_package') {
        const targetId = data.payload?.id;
        const targetBrand = (data.payload?.brandName || '').toLowerCase().trim();
        const quotesList = historyQuotesRef.current || [];

        let match = null;
        if (targetId) {
          match = quotesList.find(q => q.id === targetId || String(q.id).toLowerCase() === String(targetId).toLowerCase());
        }
        if (!match && targetBrand) {
          match = quotesList.find(q => {
            const b = (q.brandName || q.clientDetails?.brandName || q.quote_data?.clientDetails?.brandName || '').toLowerCase();
            return b.includes(targetBrand) || targetBrand.includes(b);
          });
        }

        if (match) {
          loadQuoteFromHistoryRef.current(match, true);
          showAlert(`Package for "${match.brandName}" loaded live into editor via Orlo!`);
        } else if (data.payload?.quoteData || data.payload?.quote_data) {
          const raw = data.payload.quoteData || data.payload.quote_data;
          if (data.payload.id) {
            setActiveEditingQuote({
              id: data.payload.id,
              password: data.payload.password || '',
              brandName: data.payload.brandName || 'Client'
            });
            setShareLink(`${window.location.origin}/quote/${data.payload.id}`);
            setSharePassword(data.payload.password || '');
          }
          parseQuotePayload(raw);
          showAlert(`Loaded package into editor via Orlo!`);
        } else if (targetId) {
          fetch(`/api/quote?id=${encodeURIComponent(targetId)}`)
            .then(r => r.json())
            .then(res => {
              if (res.quote) {
                loadQuoteFromHistoryRef.current(res.quote, true);
                showAlert(`Package loaded into editor!`);
              }
            })
            .catch(err => console.error('Failed to load quote via ID:', err));
        }
      } else if (data?.intent === 'save_live_package' || data?.payload?.action === 'save_live' || String(data?.payload?.templateName || '').toLowerCase().includes('live')) {
        if (activeEditingQuoteRef.current?.id) {
          updateLiveQuoteRef.current();
        } else {
          showAlert("No live package is currently active in the editor. Load or create a package link first!");
        }
      } else if (data?.intent === 'edit_package' || data?.payload?.action === 'edit_package') {
        const itemUp = data.payload?.itemUpdate;
        const itemUps = Array.isArray(data.payload?.itemUpdates) ? data.payload.itemUpdates : (itemUp ? [itemUp] : []);
        const addItem = data.payload?.addItem;
        const removeItem = data.payload?.removeItem || data.payload?.deleteItem;

        if (itemUps.length > 0 || addItem || removeItem) {
          setPackageTiers(prev => {
            const next = JSON.parse(JSON.stringify(prev && prev.length > 0 ? prev : [{ id: Date.now(), name: 'Standard Package', items: [] }]));
            
            // 1. Process rate/qty updates
            for (const up of itemUps) {
              if (!up?.itemQuery) continue;
              const q = String(up.itemQuery).toLowerCase().trim();
              let found = false;
              for (const t of next) {
                for (const it of (t.items || [])) {
                  const itName = (it.name || it.desc || '').toLowerCase();
                  if (itName.includes(q) || q.includes(itName) || q.split(' ').some(w => w.length > 3 && itName.includes(w))) {
                    if (up.newRate !== undefined && up.newRate !== null) it.rate = Number(up.newRate);
                    if (up.newQty !== undefined && up.newQty !== null) it.qty = Number(up.newQty);
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
            }

            // 2. Process remove item
            if (removeItem) {
              const remQ = String(removeItem).toLowerCase().trim();
              for (const t of next) {
                t.items = (t.items || []).filter(it => {
                  const itName = (it.name || it.desc || '').toLowerCase();
                  return !(itName.includes(remQ) || remQ.includes(itName));
                });
              }
            }

            // 3. Process add item
            if (addItem) {
              const name = typeof addItem === 'string' ? addItem : (addItem.name || addItem.desc || 'New Deliverable');
              const targetTier = next[0];
              if (targetTier) {
                targetTier.items = targetTier.items || [];
                targetTier.items.push({
                  id: Date.now(),
                  name: name,
                  desc: name,
                  qty: Number(addItem.qty || 1),
                  rate: Number(addItem.rate || 0),
                  details: addItem.details || ''
                });
              }
            }

            return next;
          });

          const notes = [];
          if (itemUps.length > 0) notes.push(...itemUps.map(u => u.itemQuery));
          if (addItem) notes.push(`added ${typeof addItem === 'string' ? addItem : addItem.name}`);
          if (removeItem) notes.push(`removed ${removeItem}`);
          showAlert(`Package updated via Orlo (${notes.join(', ')})!`);
        }

        // Also process any client, brand, or strategy updates included in payload
        if (data.payload && (data.payload.packageTiers || data.payload.services || data.payload.clientName || data.payload.brandName || data.payload.pmpStrategy || data.payload.packageType)) {
          parseQuotePayload(data.payload);
        }
      } else if (['quote', 'package', 'pmp'].includes(data?.intent) && data?.payload) {
        if (data.payload.id) {
          setActiveEditingQuote({
            id: data.payload.id,
            password: data.payload.password || '',
            brandName: data.payload.brandName || 'Client'
          });
          setShareLink(`${window.location.origin}/quote/${data.payload.id}`);
          if (data.payload.password) setSharePassword(data.payload.password);
        }
        parseQuotePayload(data.payload);
      } else if (data?.payload && (data.payload.packageTiers || data.payload.services || data.payload.items || data.payload.totalBudget || data.payload.pmpStrategy)) {
        if (data.payload.id) {
          setActiveEditingQuote({
            id: data.payload.id,
            password: data.payload.password || '',
            brandName: data.payload.brandName || 'Client'
          });
          setShareLink(`${window.location.origin}/quote/${data.payload.id}`);
          if (data.payload.password) setSharePassword(data.payload.password);
        }
        parseQuotePayload(data.payload);
      }
    };

    const handleCopilotUndo = (e) => {
      const data = e.detail;
      if (data?.formContext) {
        const { clientDetails: c, packageTiers: pt, quoteDetails: q, packageType: pType, pmpStrategy: pmp, pdfPages: pages } = data.formContext;
        if (c) setClientDetails(c);
        if (pt) setPackageTiers(pt);
        if (q) setQuoteDetails(q);
        if (pType) setPackageType(pType);
        if (pmp !== undefined) setPmpStrategy(pmp);
        if (pages) setPdfPages(pages);
      }
    };
    
    window.addEventListener('copilot-action', handleCopilotAction);
    window.addEventListener('copilot-undo', handleCopilotUndo);
    return () => {
      window.removeEventListener('copilot-action', handleCopilotAction);
      window.removeEventListener('copilot-undo', handleCopilotUndo);
    };
  }, []);

  useEffect(() => {
    window._drippFormContext = { 
      clientDetails, 
      packageTiers, 
      quoteDetails, 
      packageType, 
      pmpStrategy, 
      pdfPages,
      activeEditingQuote,
      packageHistory: (historyQuotes || []).slice(0, 30).map(p => ({
        id: p.id,
        brandName: p.brandName || p.clientDetails?.brandName || 'Untitled Client',
        clientName: p.clientName || p.clientDetails?.name || '',
        total: p.total || 0,
        packageType: p.packageType || 'project',
        date: p.date || p.created_at || '',
        items: (p.quote_data?.packageTiers?.[0]?.items || p.quote_data?.items || p.items || []).map(i => `${i.name || i.desc} (₹${i.rate || 0})`).join(', ')
      }))
    };
  }, [clientDetails, packageTiers, quoteDetails, packageType, pmpStrategy, pdfPages, activeEditingQuote, historyQuotes]);

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

  const saveCurrentAsPackage = (customName) => {
    const name = (typeof customName === 'string' && customName.trim()) ? customName : prompt("Enter a name for this package template:");
    if (name && name.trim()) {
      const newPackage = { 
        id: Date.now(),
        name: name.trim(), 
        type: packageType,
        packageTiers: JSON.parse(JSON.stringify(packageTiers)),
        pmpStrategy: pmpStrategy || '',
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
       if (pkg.packageTiers) { 
         setPackageTiers(JSON.parse(JSON.stringify(pkg.packageTiers))); 
       } else if (pkg.items) { 
         setPackageTiers([{ id: Date.now(), name: 'Standard Package', items: [...pkg.items] }]); 
       }
       setPackageType(pkg.type || 'project');
       if (pkg.pmpStrategy) {
         setPmpStrategy(pkg.pmpStrategy);
         setIncludePMP(true);
       }
       if (pkg.message) {
         setQuoteDetails(prev => ({ ...prev, message: pkg.message }));
       }
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
    const msg = `Hey ${clientName}!\n\nHere is your secure proposal from Dripp Media.\n\nProposal Link: ${shareLink}\nSecurity PIN: ${sharePassword}\n\nLet me know if you have any questions!`;
    copyToClipboard(msg, 'message');
  };
  const copyShareMessage = handleCopyMessage;

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
            setActiveEditingQuote({
              id: data.id,
              password: pass,
              brandName: clientDetails.brandName || clientDetails.name || 'Client'
            });
            fetchHistoryQuotes();
        } else {
            showAlert("Failed to save quote securely.");
        }
    } catch(err) {
        console.error('Failed to generate secure quote link:', err);
        showAlert("API error while generating secure link.");
    }
  };

  if (!isClient) return <div style={{padding: '50px', color: 'white'}}>Loading Package Maker...</div>;

  const filteredTemplates = savedPackages.filter(p => p.name.toLowerCase().includes(searchTemplate.toLowerCase()));

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
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {customDialog.type === 'confirm' && (
                  <button 
                    onClick={() => {
                      if (customDialog.onCancel) customDialog.onCancel();
                      closeDialog();
                    }} 
                    style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'Clash Display', sans-serif" }}
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
                  style={{ flex: 1, padding: '12px', background: '#ebd73f', border: 'none', color: '#111', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontFamily: "'Panchang', sans-serif", fontSize: '0.78rem' }}
                >
                  {customDialog.type === 'confirm' ? 'Confirm' : 'OK'}
                </button>
              </div>
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
                    Item already exists with the same rate ({quoteDetails.currency}{conflicts[currentConflictIdx].item.rate}).
                  </div>
                )}
                {conflicts[currentConflictIdx].type === 'item_diff_rate' && (
                  <div style={{ fontSize: '0.88rem', color: '#ccc', lineHeight: '1.6' }}>
                    Existing Item Rate: <strong style={{ color: '#fff' }}>{quoteDetails.currency}{conflicts[currentConflictIdx].existingItem.rate}</strong><br/>
                    Pasted Item Rate: <strong style={{ color: '#ebd73f' }}>{quoteDetails.currency}{conflicts[currentConflictIdx].item.rate}</strong>
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

                <button onClick={() => handleConflictResolution('skip')} className={styles.btn} style={{ marginTop: '8px', borderColor: '#ff4d4d', color: '#ff4d4d' }}>
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

      {/* Clear Form Modal - Rock Solid Modal Chassis */}
      {showClearModal && (
        <div 
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearModal(false); }}
        >
          <div 
            className={styles.modalCard}
            style={{ maxWidth: '440px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalBody} style={{ padding: '36px 30px' }}>
              <div style={{ background: 'rgba(255, 77, 77, 0.12)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto', border: '1px solid rgba(255, 77, 77, 0.25)' }}>
                <Trash2 size={28} color="#ff4d4d" />
              </div>
              <h2 style={{ color: '#fff', marginBottom: '12px', fontFamily: "'Panchang', sans-serif", fontSize: '1.25rem', fontWeight: 800 }}>Clear Entire Form?</h2>
              <p style={{ color: '#aaa', marginBottom: '26px', fontSize: '0.9rem', lineHeight: '1.6', fontFamily: "'Clash Display', sans-serif" }}>This action cannot be undone. All client details, services, and customizations will be permanently erased.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => setShowClearModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1, fontWeight: 'bold', fontFamily: "'Clash Display', sans-serif" }}>Cancel</button>
                <button onClick={confirmClearForm} style={{ background: '#ff4d4d', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(255,77,77,0.4)', fontFamily: "'Panchang', sans-serif", fontSize: '0.74rem' }}>Yes, Clear It</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PACKAGE HISTORY MODAL - ALL PACKAGES FROM SUPABASE & RESILIENT STORAGE */}
      {showHistoryModal && createPortal(
        <div 
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}
        >
          <div 
            className={styles.modalCard}
            style={{ maxWidth: '980px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.modalHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={22} color="#ebd73f" />
                  <h3 className={styles.modalTitle} style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    PACKAGE & PROPOSAL HISTORY
                  </h3>
                </div>
                <p className={styles.modalSubtitle} style={{ marginTop: '6px', fontFamily: "'Clash Display', sans-serif" }}>
                  Every package created till now stored in Supabase & cloud. Edit lively or copy full details directly into AI Smart Paste.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={fetchHistoryQuotes}
                  className={styles.btn}
                  style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Clash Display', sans-serif" }}
                  title="Refresh from Supabase"
                >
                  <RefreshCw size={14} className={isLoadingHistory ? 'spin' : ''} /> Refresh
                </button>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter toolbar */}
            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  type="text"
                  placeholder="Search by Brand Name, Client, or Link ID..."
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  className={styles.inputField}
                  style={{ paddingLeft: '40px', fontSize: '0.9rem', fontFamily: "'Clash Display', sans-serif" }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'project', 'monthly'].map(t => (
                  <button
                    key={t}
                    onClick={() => setHistoryTypeFilter(t)}
                    style={{
                      background: historyTypeFilter === t ? '#ebd73f' : 'rgba(255,255,255,0.05)',
                      color: historyTypeFilter === t ? '#000' : '#888',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      fontFamily: "'Panchang', sans-serif",
                      cursor: 'pointer'
                    }}
                  >
                    {t === 'all' ? `All (${historyQuotes.length})` : t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Body: Package list */}
            <div className={styles.modalBody} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
              {isLoadingHistory && historyQuotes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontFamily: "'Clash Display', sans-serif" }}>
                  <Loader size={28} className="spin" style={{ margin: '0 auto 12px auto', color: '#ebd73f' }} />
                  Loading history from Supabase & cloud storage...
                </div>
              ) : historyQuotes.length === 0 ? (
                <div style={{ padding: '50px 20px', textAlign: 'center', color: '#777', fontFamily: "'Clash Display', sans-serif" }}>
                  <History size={36} color="#444" style={{ margin: '0 auto 14px auto' }} />
                  <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontFamily: "'Panchang', sans-serif" }}>No Packages Created Yet</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>When you create proposal links or standalone packages, they will automatically appear here with their Brand Names and details.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                  {historyQuotes
                    .filter(pkg => {
                      if (historyTypeFilter !== 'all' && (pkg.packageType || '').toLowerCase() !== historyTypeFilter) return false;
                      const q = searchHistory.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        (pkg.brandName || '').toLowerCase().includes(q) ||
                        (pkg.clientName || '').toLowerCase().includes(q) ||
                        (pkg.id || '').toLowerCase().includes(q)
                      );
                    })
                    .map(pkg => {
                      const isLive = activeEditingQuote?.id === pkg.id;
                      const isMonthly = (pkg.packageType || '').toLowerCase().includes('month') || (pkg.packageType || '').toLowerCase().includes('retain');
                      const isInvoice = (pkg.packageType || '').toLowerCase().includes('invoice');

                      const brandStr = (pkg.brandName || 'Client').trim();
                      const initials = brandStr
                        .replace(/[^a-zA-Z0-9\s]/g, '')
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(s => s[0].toUpperCase())
                        .join('') || brandStr.slice(0, 2).toUpperCase();

                      const formattedDate = pkg.created_at 
                        ? new Date(pkg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Saved';

                      return (
                        <div
                          key={pkg.id}
                          style={{
                            background: isLive 
                              ? 'linear-gradient(145deg, rgba(235, 215, 63, 0.09) 0%, rgba(18, 18, 20, 0.98) 100%)' 
                              : 'linear-gradient(145deg, rgba(28, 28, 32, 0.75) 0%, rgba(14, 14, 16, 0.95) 100%)',
                            border: isLive ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            padding: '22px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '18px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isLive 
                              ? '0 0 30px rgba(235, 215, 63, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
                              : '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        >
                          {/* Subtle decorative glowing corner accent */}
                          <div style={{
                            position: 'absolute',
                            top: '-30px',
                            right: '-30px',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: isLive 
                              ? 'radial-gradient(circle, rgba(235, 215, 63, 0.2) 0%, transparent 70%)'
                              : isMonthly 
                              ? 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)'
                              : 'radial-gradient(circle, rgba(235, 215, 63, 0.1) 0%, transparent 70%)',
                            pointerEvents: 'none'
                          }} />

                          {/* Top Header Section */}
                          <div>
                            {/* Status Badge & Price Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.8px',
                                  textTransform: 'uppercase',
                                  fontFamily: "'Clash Display', sans-serif",
                                  background: isMonthly 
                                    ? 'rgba(56, 189, 248, 0.14)' 
                                    : isInvoice 
                                    ? 'rgba(74, 222, 128, 0.14)' 
                                    : 'rgba(235, 215, 63, 0.14)',
                                  color: isMonthly ? '#38bdf8' : isInvoice ? '#4ade80' : '#ebd73f',
                                  border: `1px solid ${isMonthly ? 'rgba(56, 189, 248, 0.35)' : isInvoice ? 'rgba(74, 222, 128, 0.35)' : 'rgba(235, 215, 63, 0.35)'}`
                                }}>
                                  <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: isMonthly ? '#38bdf8' : isInvoice ? '#4ade80' : '#ebd73f',
                                    boxShadow: `0 0 8px ${isMonthly ? '#38bdf8' : isInvoice ? '#4ade80' : '#ebd73f'}`
                                  }} />
                                  {pkg.packageType || 'PROJECT'}
                                </span>

                                {isLive && (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    letterSpacing: '1px',
                                    fontFamily: "'Panchang', sans-serif",
                                    background: '#ebd73f',
                                    color: '#000',
                                    boxShadow: '0 0 14px rgba(235, 215, 63, 0.4)'
                                  }}>
                                    ● LIVE
                                  </span>
                                )}
                              </div>

                              {/* Price & Deliverables stats */}
                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  color: '#ebd73f',
                                  fontSize: '1.45rem',
                                  fontWeight: 800,
                                  fontFamily: "'Clash Display', sans-serif",
                                  letterSpacing: '-0.02em',
                                  lineHeight: '1.1',
                                  textShadow: '0 0 20px rgba(235, 215, 63, 0.25)'
                                }}>
                                  {pkg.currency}{Number(pkg.total || 0).toLocaleString()}
                                </div>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  marginTop: '5px',
                                  fontSize: '0.74rem',
                                  color: '#cbd5e1',
                                  fontFamily: "'Clash Display', sans-serif",
                                  fontWeight: 500
                                }}>
                                  <span>{pkg.itemsCount} {pkg.itemsCount === 1 ? 'deliverable' : 'deliverables'}</span>
                                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                                  <span>{pkg.tiersCount || 1} {pkg.tiersCount === 1 ? 'tier' : 'tiers'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Brand Name & Client Row with Monogram Avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: isLive 
                                  ? 'linear-gradient(135deg, #ebd73f 0%, #ca8a04 100%)' 
                                  : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                color: isLive ? '#000' : '#ebd73f',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: "'Panchang', sans-serif",
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                letterSpacing: '0.5px',
                                border: isLive ? 'none' : '1px solid rgba(235, 215, 63, 0.3)',
                                boxShadow: isLive ? '0 4px 16px rgba(235, 215, 63, 0.4)' : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>

                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h4 style={{
                                  color: isLive ? '#ebd73f' : '#ffffff',
                                  fontSize: '1.35rem',
                                  margin: 0,
                                  fontWeight: 700,
                                  fontFamily: "'Clash Display', sans-serif",
                                  letterSpacing: '-0.01em',
                                  lineHeight: '1.25',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {pkg.brandName}
                                </h4>
                                {pkg.clientName && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '3px',
                                    fontSize: '0.86rem',
                                    color: '#cbd5e1',
                                    fontFamily: "'Clash Display', sans-serif"
                                  }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Client:</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{pkg.clientName}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* High-Visibility Middle Cyber Ribbon */}
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.45)',
                              borderRadius: '12px',
                              padding: '10px 14px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                              display: 'grid',
                              gridTemplateColumns: '1.2fr 1fr 1fr',
                              gap: '10px',
                              alignItems: 'center'
                            }}>
                              {/* Link ID */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  background: 'rgba(235, 215, 63, 0.1)',
                                  border: '1px solid rgba(235, 215, 63, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Globe size={12} color="#ebd73f" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Clash Display', sans-serif" }}>LINK ID</div>
                                  <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, fontFamily: "'Clash Display', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {pkg.id}
                                  </div>
                                </div>
                              </div>

                              {/* PIN */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  background: 'rgba(235, 215, 63, 0.1)',
                                  border: '1px solid rgba(235, 215, 63, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Lock size={12} color="#ebd73f" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Clash Display', sans-serif" }}>PIN</div>
                                  <div style={{ fontSize: '0.88rem', color: '#ebd73f', fontWeight: 800, letterSpacing: '1px', fontFamily: "'Panchang', sans-serif" }}>
                                    {pkg.password || 'None'}
                                  </div>
                                </div>
                              </div>

                              {/* Date */}
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Clash Display', sans-serif" }}>DATE</div>
                                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, fontFamily: "'Clash Display', sans-serif" }}>
                                  {formattedDate}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingTop: '16px'
                          }}>
                            {/* Edit Live Button */}
                            <button
                              onClick={() => loadQuoteFromHistory(pkg)}
                              style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #ebd73f 0%, #facc15 100%)',
                                color: '#000',
                                border: 'none',
                                padding: '11px 16px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                fontFamily: "'Clash Display', sans-serif",
                                letterSpacing: '0.3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '7px',
                                boxShadow: '0 4px 14px rgba(235, 215, 63, 0.25)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(235, 215, 63, 0.4)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(235, 215, 63, 0.25)';
                              }}
                            >
                              <Edit3 size={15} color="#000" />
                              <span>Edit Live</span>
                            </button>

                            {/* Copy for Smart Paste Button */}
                            <button
                              onClick={() => copyPackageForSmartPaste(pkg, `modal_copy_${pkg.id}`)}
                              style={{
                                flex: 1.2,
                                background: copiedItem === `modal_copy_${pkg.id}` ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: copiedItem === `modal_copy_${pkg.id}` ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.12)',
                                color: copiedItem === `modal_copy_${pkg.id}` ? '#ebd73f' : '#ffffff',
                                padding: '11px 14px',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                fontFamily: "'Clash Display', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '7px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Copy all details of this package to clipboard for AI Smart Paste"
                              onMouseEnter={e => {
                                if (copiedItem !== `modal_copy_${pkg.id}`) {
                                  e.currentTarget.style.background = 'rgba(235, 215, 63, 0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
                                  e.currentTarget.style.color = '#ebd73f';
                                }
                              }}
                              onMouseLeave={e => {
                                if (copiedItem !== `modal_copy_${pkg.id}`) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                  e.currentTarget.style.color = '#ffffff';
                                }
                              }}
                            >
                              {copiedItem === `modal_copy_${pkg.id}` ? (
                                <>
                                  <CheckCircle2 size={15} color="#4ade80" />
                                  <span>Copied Details!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={15} color="#ebd73f" />
                                  <span>Copy for Smart Paste</span>
                                </>
                              )}
                            </button>

                            {/* Open Link Button */}
                            <button
                              onClick={() => window.open(`${window.location.origin}/quote/${pkg.id}?pwd=${pkg.password}`, '_blank')}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                              }}
                              title="Open Client View Link"
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#ebd73f';
                                e.currentTarget.style.color = '#ebd73f';
                                e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = '#cbd5e1';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                              }}
                            >
                              <ExternalLink size={16} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => deleteHistoryQuote(pkg.id, pkg.brandName)}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.06)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                              }}
                              title="Delete Package from History"
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                                e.currentTarget.style.borderColor = '#ef4444';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      <div className={styles.headerTop}>
        <div>
          <h1 className={styles.titleModern}>QUOTES & <span className={styles.titleHighlight}>PACKAGES</span></h1>
          <p className={styles.subtitleModern}>Design customized proposals, tier packages, and client quotations</p>
        </div>
        <div className={styles.headerActions}>
           <button 
             onClick={() => setShowHistoryModal(true)} 
             className={styles.btnModernSecondary} 
             style={{ borderColor: 'rgba(235, 215, 63, 0.4)', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px' }}
             title="View all packages created in Supabase & cloud"
           >
             <History size={18} /> Package History ({historyQuotes.length})
           </button>
           <button onClick={generatePDF} className={styles.btnModernSecondary}>
             <Download size={18} /> Export PDF
           </button>
           <button onClick={generateSecureLink} className={styles.btnModernPrimary}>
             <Share2 size={18} /> SHARE PROPOSAL
           </button>
        </div>
      </div>

      {/* UNIFIED LIVE EDIT & PROPOSAL SHARE LINK CONTROL BAR */}
      {activeEditingQuote ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(14, 14, 17, 0.98) 100%)',
          border: '1px solid rgba(235, 215, 63, 0.35)',
          borderRadius: '16px',
          padding: '22px 26px',
          marginBottom: '28px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(235, 215, 63, 0.15)',
          backdropFilter: 'blur(12px)'
        }}>
          {/* Top Row: Status badge, Client Title, ID & PIN badges, Exit Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            paddingBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(235, 215, 63, 0.12)',
                border: '1px solid rgba(235, 215, 63, 0.35)',
                color: '#ebd73f',
                borderRadius: '8px',
                padding: '6px 14px',
                fontFamily: "'Panchang', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '1px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ebd73f', boxShadow: '0 0 10px #ebd73f', display: 'inline-block' }} />
                LIVE EDITING
              </div>

              <div>
                <span style={{ color: '#888', fontSize: '0.9rem', fontFamily: "'Clash Display', sans-serif", marginRight: '8px' }}>
                  Client Package:
                </span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Clash Display', sans-serif" }}>
                  {activeEditingQuote.brandName || clientDetails.brandName || 'Untitled Client'}
                </span>
              </div>
            </div>

            {/* Badges for ID, PIN & Exit Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontFamily: "'Clash Display', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ color: '#888' }}>Link ID:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{activeEditingQuote.id}</span>
              </div>

              <div style={{
                background: 'rgba(235, 215, 63, 0.08)',
                border: '1px solid rgba(235, 215, 63, 0.25)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontFamily: "'Clash Display', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ color: '#888' }}>Security PIN:</span>
                <span style={{ color: '#ebd73f', fontWeight: 700, letterSpacing: '1.5px' }}>{sharePassword || activeEditingQuote.password || 'None'}</span>
              </div>

              <button
                onClick={() => setActiveEditingQuote(null)}
                style={{
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontFamily: "'Clash Display', sans-serif",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                title="Exit live edit mode"
              >
                <X size={14} />
                <span>Exit Live</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Direct Link Input with embedded copy button, and primary action buttons */}
          <div className="quote-live-action-grid">
            {/* Direct Link Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#08080a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '4px 6px 4px 14px',
              gap: '10px'
            }}>
              <Globe size={15} color="#888" style={{ flexShrink: 0 }} />
              <input
                type="text"
                readOnly
                value={shareLink || `${window.location.origin}/quote/${activeEditingQuote.id}`}
                onClick={() => window.open(`${shareLink || `${window.location.origin}/quote/${activeEditingQuote.id}`}?pwd=${sharePassword || activeEditingQuote.password}`, '_blank')}
                title="Click to preview proposal directly in a new tab"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ebd73f',
                  fontSize: '0.88rem',
                  fontFamily: "'Clash Display', sans-serif",
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              />
              <button
                onClick={() => copyToClipboard(shareLink || `${window.location.origin}/quote/${activeEditingQuote.id}`, 'live_link_copy')}
                style={{
                  background: copiedItem === 'live_link_copy' ? '#ebd73f' : 'rgba(255, 255, 255, 0.08)',
                  color: copiedItem === 'live_link_copy' ? '#000000' : '#ffffff',
                  border: copiedItem === 'live_link_copy' ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '8px 14px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  fontFamily: "'Clash Display', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                title="Copy client proposal share link"
              >
                {copiedItem === 'live_link_copy' ? <CheckCircle2 size={14} color="#000" /> : <Copy size={14} color="#ebd73f" />}
                <span>{copiedItem === 'live_link_copy' ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Action Buttons: Save Live, Copy Message, Copy for Smart Paste, Open Live */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={updateLiveQuote}
                disabled={isUpdatingLive}
                style={{
                  background: '#ebd73f',
                  color: '#000000',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: isUpdatingLive ? 'wait' : 'pointer',
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(235, 215, 63, 0.25)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <Save size={16} />
                <span>{isUpdatingLive ? 'Updating Link...' : 'Save to Live Link'}</span>
              </button>

              <button
                onClick={handleCopyMessage}
                style={{
                  background: copiedItem === 'message' ? '#ebd73f' : 'rgba(255, 255, 255, 0.06)',
                  color: copiedItem === 'message' ? '#000000' : '#ffffff',
                  border: copiedItem === 'message' ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedItem === 'message' ? <CheckCircle2 size={15} color="#000" /> : <Share2 size={15} color="#ebd73f" />}
                <span>{copiedItem === 'message' ? 'Message Copied!' : 'Copy Share Message'}</span>
              </button>

              <button
                onClick={() => copyPackageForSmartPaste({ clientDetails, quoteDetails, packageTiers, packageType, total, includePMP, pmpStrategy }, 'liveBannerCopy')}
                style={{
                  background: copiedItem === 'liveBannerCopy' ? '#ebd73f' : 'rgba(255, 255, 255, 0.06)',
                  color: copiedItem === 'liveBannerCopy' ? '#000000' : '#ffffff',
                  border: copiedItem === 'liveBannerCopy' ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                title="Copy package details formatted for AI Smart Paste"
              >
                {copiedItem === 'liveBannerCopy' ? <CheckCircle2 size={15} color="#000" /> : <Copy size={15} color="#ebd73f" />}
                <span>{copiedItem === 'liveBannerCopy' ? 'Details Copied!' : 'Copy for Smart Paste'}</span>
              </button>

              <button
                onClick={() => window.open(`${shareLink || `${window.location.origin}/quote/${activeEditingQuote.id}`}?pwd=${sharePassword || activeEditingQuote.password}`, '_blank')}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#cccccc',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                title="Preview client view in new tab"
              >
                <ExternalLink size={15} color="#ebd73f" />
                <span>Open Live</span>
              </button>
            </div>
          </div>
        </div>
      ) : shareLink ? (
        /* PROPOSAL SHARE LINK CARD (WHEN NOT ALREADY IN LIVE EDIT MODE) */
        <div style={{
          background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(14, 14, 17, 0.98) 100%)',
          border: '1px solid rgba(235, 215, 63, 0.35)',
          borderRadius: '16px',
          padding: '22px 26px',
          marginBottom: '28px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(235, 215, 63, 0.15)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(235, 215, 63, 0.15)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="#ebd73f" />
              </div>
              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontFamily: "'Clash Display', sans-serif", fontWeight: 700 }}>
                Secure Proposal Share Link Created
              </h4>
            </div>
            <button 
              onClick={() => setShareLink('')}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          <div className="quote-share-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', fontFamily: "'Clash Display', sans-serif" }}>
                Secure Link
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  onClick={() => window.open(`${shareLink}?pwd=${sharePassword}`, '_blank')}
                  title="Click to open proposal directly with PIN in a new tab"
                  style={{ 
                    width: '100%', 
                    background: '#08080a', 
                    border: '1px solid rgba(255,255,255,0.12)', 
                    color: '#ebd73f', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                />
                <button 
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  style={{ 
                    background: copiedItem === 'link' ? '#ebd73f' : 'rgba(255, 255, 255, 0.08)', 
                    border: copiedItem === 'link' ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.15)', 
                    color: copiedItem === 'link' ? '#000000' : '#ffffff', 
                    padding: '0 16px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 600, 
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.84rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedItem === 'link' ? <CheckCircle2 size={14} color="#000" /> : <Copy size={14} color="#ebd73f" />}
                  <span>{copiedItem === 'link' ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', fontFamily: "'Clash Display', sans-serif" }}>
                Security PIN
              </label>
              <div style={{ background: '#08080a', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#ebd73f', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '2px', textAlign: 'center', fontFamily: "'Clash Display', sans-serif" }}>
                {sharePassword}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleCopyMessage}
                style={{ 
                  background: copiedItem === 'message' ? '#ebd73f' : '#ebd73f', 
                  border: 'none', 
                  color: '#000000', 
                  padding: '11px 18px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  whiteSpace: 'nowrap',
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.86rem',
                  boxShadow: '0 4px 15px rgba(235, 215, 63, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedItem === 'message' ? (
                  <>
                    <CheckCircle2 size={15} color="#000" /> Copied Message!
                  </>
                ) : (
                  <>
                    <Share2 size={15} color="#000" /> Copy Share Message
                  </>
                )}
              </button>

              <button 
                onClick={() => copyPackageForSmartPaste({ clientDetails, quoteDetails, packageTiers, packageType, total, includePMP, pmpStrategy }, 'topSmartPaste')}
                style={{ 
                  background: copiedItem === 'topSmartPaste' ? '#ebd73f' : 'rgba(255, 255, 255, 0.06)', 
                  border: copiedItem === 'topSmartPaste' ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.15)', 
                  color: copiedItem === 'topSmartPaste' ? '#000000' : '#ffffff', 
                  padding: '11px 16px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  whiteSpace: 'nowrap',
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.84rem',
                  transition: 'all 0.2s ease'
                }}
                title="Copy all details of this package formatted for AI Smart Paste"
              >
                {copiedItem === 'topSmartPaste' ? (
                  <><CheckCircle2 size={15} color="#000" /> Copied for Smart Paste!</>
                ) : (
                  <><Copy size={15} color="#ebd73f" /> Copy Details for Smart Paste</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <style jsx>{`
        .quote-share-grid {
          display: grid;
          grid-template-columns: 1fr 140px auto;
          gap: 16px;
          align-items: center;
        }
        .quote-live-action-grid {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) auto;
          gap: 16px;
          align-items: center;
        }
        .quote-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 350px;
          gap: 25px;
          align-items: start;
        }
        .quote-sidebar-sticky {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(235, 215, 63, 0.3) transparent;
        }
        .quote-sidebar-sticky::-webkit-scrollbar {
          width: 5px;
        }
        .quote-sidebar-sticky::-webkit-scrollbar-thumb {
          background: rgba(235, 215, 63, 0.3);
          border-radius: 4px;
        }
        .quote-pdf-builder-grid {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 1100px) {
          .quote-pdf-builder-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
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
          .quote-sidebar-sticky {
            position: static !important;
            max-height: none !important;
            overflow-y: visible !important;
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
                   'Auto-Fill Quote'
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

          {/* Strategy / Concept Pitch */}
          <div className={styles.cardModern}>
            <div className={styles.cardHeaderModern} style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="#ebd73f" />
                <h3 className={styles.cardTitleModern}>Strategy & Concept Pitch</h3>
              </div>
              
              {/* Interactive Strategy Toggle Switch */}
              <label 
                onClick={() => {
                  const nextVal = !includePMP;
                  setIncludePMP(nextVal);
                  if (nextVal) {
                    if (!pdfPages.find(p => p.type === 'pmp')) {
                      const newPages = [...pdfPages];
                      newPages.splice(1, 0, { id: 'pmp_' + Date.now(), type: 'pmp', title: 'Strategy & Concept', hideHeading: false });
                      setPdfPages(newPages);
                    }
                  } else {
                    setPdfPages(pdfPages.filter(p => p.type !== 'pmp'));
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: '0.75rem', color: includePMP ? '#ebd73f' : '#888', fontWeight: '600', letterSpacing: '0.5px' }}>
                  {includePMP ? 'STRATEGY SLIDE INCLUDED' : 'STRATEGY SLIDE EXCLUDED'}
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
              This section populates the strategic concept & scope slide in your proposal presentation.
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
                Strategy slide is currently excluded from this proposal. Toggle ON above to include a Strategy slide.
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
            
            <div style={{ marginTop: '20px', padding: '16px 20px', background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(20, 20, 22, 0.8) 100%)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
               <span style={{ fontSize: '1.05rem', color: '#aaa', fontFamily: "'Clash Display', sans-serif", fontWeight: 600 }}>Total Amount:</span>
               <span style={{ fontSize: '1.5rem', color: '#ebd73f', fontWeight: 800, fontFamily: "'Panchang', sans-serif" }}>{quoteDetails.currency}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* PDF PAGE BUILDER */}
          <div className={styles.card} style={{ marginTop: '5px' }}>
            <h3 style={{ marginBottom: '24px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.35rem', borderBottom: '1px solid rgba(235, 215, 63, 0.2)', paddingBottom: '14px', fontFamily: "'Panchang', sans-serif" }}>
              <Layers size={20} /> PDF Pages & Layout
            </h3>
            
            <div className="quote-pdf-builder-grid">
               {/* Left: Page List */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pdfPages.map((page, index) => (
                      <div key={page.id} 
                           onClick={() => setSelectedPageIndex(index)}
                           style={{ 
                             padding: '12px 14px', 
                             background: selectedPageIndex === index ? 'linear-gradient(135deg, rgba(235, 215, 63, 0.14) 0%, rgba(20, 20, 22, 0.95) 100%)' : 'rgba(255,255,255,0.02)', 
                             border: `1px solid ${selectedPageIndex === index ? '#ebd73f' : 'rgba(255,255,255,0.06)'}`, 
                             borderRadius: '10px', 
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between',
                             transition: 'all 0.2s ease',
                             boxShadow: selectedPageIndex === index ? '0 0 15px rgba(235, 215, 63, 0.15)' : 'none'
                           }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                             {page.type === 'cover' && <Image size={16} color={selectedPageIndex === index ? "#ebd73f" : "#888"} />}
                             {page.type === 'pmp' && <Edit3 size={16} color="#ebd73f" />}
                             {page.type === 'services' && <FileText size={16} color={selectedPageIndex === index ? "#ebd73f" : "#888"} />}
                             {page.type === 'investment' && <Package size={16} color={selectedPageIndex === index ? "#ebd73f" : "#888"} />}
                             {page.type === 'next_steps' && <CheckCircle size={16} color={selectedPageIndex === index ? "#ebd73f" : "#888"} />}
                             {page.type === 'custom_text' && <Type size={16} color={selectedPageIndex === index ? "#ebd73f" : "#888"} />}
                             {page.type === 'infographic' && <Layers size={16} color={selectedPageIndex === index ? "#ebd73f" : "#888"} />}
                             <span style={{ fontSize: '0.86rem', fontWeight: selectedPageIndex === index ? 700 : 500, color: selectedPageIndex === index ? '#fff' : '#aaa', fontFamily: "'Clash Display', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {page.type === 'pmp' ? 'Strategy & Pitch' : page.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                             </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                             <button onClick={() => movePage(index, 'up')} disabled={index === 0} style={{ background: 'transparent', border: 'none', color: index === 0 ? '#333' : '#ebd73f', cursor: index === 0 ? 'not-allowed' : 'pointer', padding: '3px' }}><ArrowUp size={13} /></button>
                             <button onClick={() => movePage(index, 'down')} disabled={index === pdfPages.length - 1} style={{ background: 'transparent', border: 'none', color: index === pdfPages.length - 1 ? '#333' : '#ebd73f', cursor: index === pdfPages.length - 1 ? 'not-allowed' : 'pointer', padding: '3px' }}><ArrowDown size={13} /></button>
                             {pdfPages.length > 1 && (
                               <button onClick={() => removePage(index)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '3px' }}><Trash2 size={13} /></button>
                             )}
                          </div>
                      </div>
                  ))}
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => addPage('custom_text')} className={styles.btn} style={{ flex: 1, fontSize: '0.78rem', padding: '8px 6px', fontFamily: "'Clash Display', sans-serif" }}>+ Text Page</button>
                      <button onClick={() => addPage('infographic')} className={styles.btn} style={{ flex: 1, fontSize: '0.78rem', padding: '8px 6px', fontFamily: "'Clash Display', sans-serif" }}>+ Infographic</button>
                  </div>
               </div>

               {/* Right: Page Editor */}
               <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(235, 215, 63, 0.15)', borderRadius: '16px', padding: '24px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)', position: 'relative' }}>
                  {pdfPages[selectedPageIndex] && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                             <h4 style={{ color: '#ebd73f', margin: 0, textTransform: 'capitalize', fontFamily: "'Panchang', sans-serif", fontSize: '0.92rem' }}>
                                 {pdfPages[selectedPageIndex].type === 'pmp' ? 'Strategy & Concept Pitch Settings' : (pdfPages[selectedPageIndex].type.replace('_', ' ') + ' Settings')}
                             </h4>
                             <button 
                                onClick={() => updatePage(selectedPageIndex, 'hideHeading', !pdfPages[selectedPageIndex].hideHeading)}
                                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', padding: '5px 10px', borderRadius: '6px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', whiteSpace: 'nowrap', fontFamily: "'Clash Display', sans-serif" }}
                             >
                                 {pdfPages[selectedPageIndex].hideHeading ? <><EyeOff size={14}/> Heading Hidden</> : <><Eye size={14}/> Heading Visible</>}
                             </button>
                         </div>
                         
                         {(pdfPages[selectedPageIndex].type === 'cover' || pdfPages[selectedPageIndex].type === 'services' || pdfPages[selectedPageIndex].type === 'investment' || pdfPages[selectedPageIndex].type === 'next_steps' || pdfPages[selectedPageIndex].type === 'custom_text' || pdfPages[selectedPageIndex].type === 'infographic') && (
                             <div>
                                <label className={styles.label} style={{ fontFamily: "'Clash Display', sans-serif" }}>Heading Text</label>
                                <input 
                                  type="text" 
                                  value={pdfPages[selectedPageIndex].title || ''} 
                                  onChange={e => updatePage(selectedPageIndex, 'title', e.target.value)} 
                                  className={styles.inputField} 
                                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                                />
                             </div>
                         )}

                         {pdfPages[selectedPageIndex].type === 'cover' && (
                             <div>
                                <label className={styles.label} style={{ fontFamily: "'Clash Display', sans-serif" }}>Subtitle / Prepared For Label</label>
                                <input 
                                  type="text" 
                                  value={pdfPages[selectedPageIndex].subtitle || ''} 
                                  onChange={e => updatePage(selectedPageIndex, 'subtitle', e.target.value)} 
                                  className={styles.inputField} 
                                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                                />
                             </div>
                         )}
                         
                         {pdfPages[selectedPageIndex].type === 'custom_text' && (
                             <div>
                                <label className={styles.label} style={{ fontFamily: "'Clash Display', sans-serif" }}>Page Content</label>
                                <textarea 
                                  value={pdfPages[selectedPageIndex].content || ''} 
                                  onChange={e => updatePage(selectedPageIndex, 'content', e.target.value)} 
                                  className={styles.inputField} 
                                  style={{ minHeight: '200px', resize: 'vertical', fontFamily: "'Clash Display', sans-serif" }}
                                />
                             </div>
                         )}

                         {pdfPages[selectedPageIndex].type === 'infographic' && (
                             <div>
                                <label className={styles.label} style={{ marginBottom: '15px', display: 'block', fontFamily: "'Clash Display', sans-serif" }}>Design Cards</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {pdfPages[selectedPageIndex].cards?.map((card, cIdx) => (
                                        <div key={cIdx} style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#888', fontFamily: "'Clash Display', sans-serif" }}>Card {cIdx + 1}</span>
                                                <button onClick={() => removeCard(selectedPageIndex, cIdx)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                            </div>
                                            <input type="text" value={card.title} onChange={e => updateCard(selectedPageIndex, cIdx, 'title', e.target.value)} className={styles.inputField} style={{ padding: '8px', marginBottom: '10px', fontSize: '0.9rem', fontFamily: "'Clash Display', sans-serif" }} placeholder="Card Title" />
                                            <textarea value={card.desc} onChange={e => updateCard(selectedPageIndex, cIdx, 'desc', e.target.value)} className={styles.inputField} style={{ padding: '8px', fontSize: '0.8rem', minHeight: '60px', resize: 'vertical', fontFamily: "'Clash Display', sans-serif" }} placeholder="Card Description" />
                                        </div>
                                    ))}
                                </div>
                                {pdfPages[selectedPageIndex].cards?.length < 4 && (
                                    <button onClick={() => addCard(selectedPageIndex)} className={styles.btn} style={{ marginTop: '15px', padding: '8px 15px', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }}>+ Add Card</button>
                                )}
                             </div>
                         )}

                         {pdfPages[selectedPageIndex].type === 'services' && (
                             <div style={{ padding: '15px', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '8px', color: '#888', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }}>
                                 The Scope of Work details are managed in the "Services & Scope" section above. This page simply formats them for the PDF.
                             </div>
                         )}
                         {pdfPages[selectedPageIndex].type === 'investment' && (
                             <div style={{ padding: '15px', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '8px', color: '#888', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }}>
                                 The Investment breakdown is calculated automatically from your Services above.
                             </div>
                         )}
                         {pdfPages[selectedPageIndex].type === 'next_steps' && (
                             <div style={{ padding: '15px', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '8px', color: '#888', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }}>
                                 The personal message is pulled from the "Quality Promise / Message" field in the Package Configuration section.
                             </div>
                         )}
                     </div>
                  )}
               </div>
            </div>
          </div>

          </div>
          
        {/* RIGHT COLUMN: TEMPLATES & ACTIONS */}
        <div className="quote-sidebar-sticky">
           
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
                  <span className={styles.summaryItemIncluded} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#ebd73f" /> Strategy & Scope Pitch
                  </span>
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

            {/* Package History & Templates Manager */}
            <div className={styles.card}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', paddingBottom: '10px', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setSidebarTab('history')}
                    style={{
                      background: sidebarTab === 'history' ? '#ebd73f' : 'transparent',
                      color: sidebarTab === 'history' ? '#000' : '#888',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontFamily: "'Panchang', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <History size={12} /> History ({historyQuotes.length})
                  </button>
                  <button
                    onClick={() => setSidebarTab('templates')}
                    style={{
                      background: sidebarTab === 'templates' ? '#ebd73f' : 'transparent',
                      color: sidebarTab === 'templates' ? '#000' : '#888',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontFamily: "'Panchang', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Templates ({savedPackages.length})
                  </button>
                </div>
                
                {sidebarTab === 'history' ? (
                  <button 
                    onClick={fetchHistoryQuotes} 
                    className={styles.btn} 
                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)' }}
                    title="Refresh history from Supabase"
                  >
                    <RefreshCw size={12} className={isLoadingHistory ? 'spin' : ''} />
                  </button>
                ) : (
                  <button onClick={saveCurrentAsPackage} className={styles.btn} style={{ padding: '4px 8px', fontSize: '0.75rem', fontFamily: "'Clash Display', sans-serif" }}>Save Current</button>
                )}
              </div>

              {sidebarTab === 'history' ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                      <input 
                        type="text" 
                        placeholder="Search by brand name..." 
                        value={searchHistory} 
                        onChange={e => setSearchHistory(e.target.value)} 
                        className={styles.inputField} 
                        style={{ paddingLeft: '34px', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }} 
                      />
                    </div>
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      style={{
                        background: 'rgba(235, 215, 63, 0.12)',
                        border: '1px solid rgba(235, 215, 63, 0.3)',
                        color: '#ebd73f',
                        padding: '0 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: "'Clash Display', sans-serif",
                        whiteSpace: 'nowrap'
                      }}
                      title="Open full-screen history"
                    >
                      View All
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                    {isLoadingHistory && historyQuotes.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', padding: '20px 0', fontFamily: "'Clash Display', sans-serif" }}>Loading packages from cloud...</p>
                    ) : historyQuotes.filter(q => (q.brandName || '').toLowerCase().includes(searchHistory.toLowerCase()) || (q.clientName || '').toLowerCase().includes(searchHistory.toLowerCase())).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', padding: '20px 0', fontFamily: "'Clash Display', sans-serif" }}>No packages found.</p>
                    ) : (
                      historyQuotes
                        .filter(q => (q.brandName || '').toLowerCase().includes(searchHistory.toLowerCase()) || (q.clientName || '').toLowerCase().includes(searchHistory.toLowerCase()))
                        .map((pkg) => {
                          const isLive = activeEditingQuote?.id === pkg.id;
                          const isMonthly = (pkg.packageType || '').toLowerCase().includes('month') || (pkg.packageType || '').toLowerCase().includes('retain');
                          const brandStr = (pkg.brandName || 'Client').trim();
                          const initials = brandStr
                            .replace(/[^a-zA-Z0-9\s]/g, '')
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(s => s[0].toUpperCase())
                            .join('') || brandStr.slice(0, 2).toUpperCase();

                          return (
                            <div 
                              key={pkg.id} 
                              style={{ 
                                background: isLive 
                                  ? 'linear-gradient(135deg, rgba(235, 215, 63, 0.12) 0%, rgba(20, 20, 22, 0.95) 100%)' 
                                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(18, 18, 20, 0.85) 100%)', 
                                border: isLive ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.1)', 
                                padding: '14px', 
                                borderRadius: '14px', 
                                display: 'flex', 
                                flexDirection: 'column',
                                gap: '10px',
                                boxShadow: isLive ? '0 0 20px rgba(235, 215, 63, 0.2)' : '0 4px 15px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s ease' 
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: isLive ? '#ebd73f' : 'rgba(235, 215, 63, 0.15)',
                                    color: isLive ? '#000' : '#ebd73f',
                                    border: isLive ? 'none' : '1px solid rgba(235, 215, 63, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: "'Panchang', sans-serif",
                                    fontWeight: 800,
                                    fontSize: '0.74rem',
                                    flexShrink: 0
                                  }}>
                                    {initials}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.96rem', color: isLive ? '#ebd73f' : '#ffffff', fontFamily: "'Clash Display', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {pkg.brandName}
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px', fontFamily: "'Clash Display', sans-serif" }}>
                                      {pkg.clientName ? `Client: ${pkg.clientName}` : `${pkg.itemsCount} deliverables`}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ebd73f', fontFamily: "'Clash Display', sans-serif" }}>
                                    {pkg.currency}{Number(pkg.total || 0).toLocaleString()}
                                  </div>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    color: isMonthly ? '#38bdf8' : '#ebd73f',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontFamily: "'Clash Display', sans-serif"
                                  }}>
                                    {isLive ? '● LIVE' : pkg.packageType}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', gap: '6px' }}>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: "'Clash Display', sans-serif" }}>
                                  {pkg.created_at ? new Date(pkg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved'}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => copyPackageForSmartPaste(pkg, `side_hist_${pkg.id}`)}
                                    style={{
                                      background: copiedItem === `side_hist_${pkg.id}` ? 'rgba(235, 215, 63, 0.25)' : 'rgba(255,255,255,0.06)',
                                      border: copiedItem === `side_hist_${pkg.id}` ? '1px solid #ebd73f' : '1px solid rgba(255,255,255,0.14)',
                                      color: copiedItem === `side_hist_${pkg.id}` ? '#ebd73f' : '#cbd5e1',
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      fontFamily: "'Clash Display', sans-serif",
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title="Copy all details for AI Smart Paste"
                                  >
                                    {copiedItem === `side_hist_${pkg.id}` ? <CheckCircle2 size={12} color="#ebd73f" /> : <Copy size={12} color="#ebd73f" />}
                                    <span>{copiedItem === `side_hist_${pkg.id}` ? 'Copied' : 'Copy'}</span>
                                  </button>
                                  <button 
                                    onClick={() => loadQuoteFromHistory(pkg)} 
                                    style={{ 
                                      background: '#ebd73f', 
                                      border: 'none', 
                                      color: '#000',
                                      padding: '5px 11px', 
                                      borderRadius: '6px', 
                                      fontSize: '0.74rem', 
                                      fontWeight: 700,
                                      fontFamily: "'Clash Display', sans-serif",
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(235, 215, 63, 0.3)',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <Edit3 size={12} color="#000" />
                                    <span>Edit Live</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', marginBottom: '15px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input type="text" placeholder="Search templates..." value={searchTemplate} onChange={e => setSearchTemplate(e.target.value)} className={styles.inputField} style={{ paddingLeft: '40px', fontFamily: "'Clash Display', sans-serif" }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredTemplates.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', padding: '20px 0', fontFamily: "'Clash Display', sans-serif" }}>No templates found.</p>
                    ) : (
                      filteredTemplates.map((pkg, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', fontFamily: "'Clash Display', sans-serif" }}>{pkg.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px', fontFamily: "'Clash Display', sans-serif" }}>{pkg.type === 'project' ? 'Project' : 'Monthly'} • {pkg.packageTiers ? pkg.packageTiers.flatMap(t => t.items || []).length : pkg.items?.length || 0} items</div>
                          </div>
                          <button onClick={() => loadPackage(pkg)} className={styles.btn} style={{ padding: '5px 10px', fontSize: '0.8rem', borderColor: 'rgba(235, 215, 63, 0.3)', color: '#ebd73f', fontFamily: "'Clash Display', sans-serif" }}>Load</button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

        </div>
      </div>

      {/* HIDDEN RENDER AREA FOR PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef} style={{ width: '800px', background: '#0a0a0a', padding: '60px', color: 'white', fontFamily: "'Clash Display', sans-serif" }}>
          
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
                 <p style={{ margin: '0 0 5px 0' }}>Duration: {quoteDetails.projectDuration?.trim() || 'N/A'}</p>
                 <p style={{ margin: 0 }}>Expected Delivery: {quoteDetails.expectedDelivery?.trim() || 'N/A'}</p>
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
                      <div style={{ marginBottom: '40px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '24px' }}>
                          <h1 className={styles.pdfTitle} style={{ margin: 0, fontSize: '56px', fontFamily: "'Panchang', sans-serif" }}>{page.title}</h1>
                      </div>
                  )}

                  {/* COVER PAGE */}
                  {page.type === 'cover' && (
                      <>
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                             <h1 style={{ fontSize: '120px', color: '#ebd73f', margin: 0, letterSpacing: '-4px', fontWeight: '900', fontFamily: "'Panchang', sans-serif" }}>DRIPP MEDIA</h1>
                             {!page.hideHeading && <p style={{ fontSize: '32px', color: '#888', margin: '10px 0 0 0', fontWeight: '300', fontFamily: "'Clash Display', sans-serif" }}>{page.title}</p>}
                         </div>
                         
                         <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                             <p style={{ fontSize: '24px', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', fontFamily: "'Clash Display', sans-serif", fontWeight: '600' }}>
                                 {(() => {
                                     let sub = page.subtitle || 'Prepared Exclusively For';
                                     const bName = clientDetails.brandName || clientDetails.name;
                                     if (bName) {
                                         const escaped = bName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                         sub = sub.replace(new RegExp(`\\s*(?:for\\s+)?${escaped}\\s*$`, 'i'), (m) => m.toLowerCase().includes('for') ? ' Prepared Exclusively For' : '').trim();
                                     }
                                     return sub || 'PREPARED EXCLUSIVELY FOR';
                                 })()}
                             </p>
                             <h2 style={{ fontSize: '80px', color: '#fff', margin: '0 0 10px 0', lineHeight: 1.1, fontFamily: "'Panchang', sans-serif" }}>{clientDetails.brandName || clientDetails.name || 'Client'}</h2>
                             <p style={{ fontSize: '30px', color: '#aaa', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{clientDetails.name ? clientDetails.name + ' | ' : ''}{clientDetails.email}</p>
                             {clientDetails.gst && <p style={{ fontSize: '24px', color: '#aaa', margin: '10px 0 0 0', fontFamily: "'Clash Display', sans-serif" }}>GST: {clientDetails.gst}</p>}
                         </div>
                         
                         <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid rgba(235, 215, 63, 0.3)', paddingTop: '40px', marginTop: 'auto' }}>
                             <div>
                                 <p style={{ fontSize: '20px', color: '#666', margin: '0 0 5px 0', fontFamily: "'Clash Display', sans-serif" }}>Date</p>
                                 <p style={{ fontSize: '28px', color: '#fff', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{clientDetails.date}</p>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                 <p style={{ fontSize: '20px', color: '#666', margin: '0 0 5px 0', fontFamily: "'Clash Display', sans-serif" }}>Proposal Number</p>
                                 <p style={{ fontSize: '28px', color: '#fff', margin: 0, fontFamily: "'Panchang', sans-serif" }}>{quoteDetails.number}</p>
                             </div>
                         </div>
                      </>
                  )}

                  {/* SERVICES PAGE */}
                  {page.type === 'services' && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                          {packageTiers.length > 1 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: packageTiers.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '24px', flex: 1 }}>
                                  {packageTiers.map((tier, tIdx) => (
                                      <div key={tIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(235, 215, 63, 0.2)', borderRadius: '16px', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
                                          <h3 style={{ fontSize: '24px', color: '#ebd73f', margin: '0 0 16px 0', fontFamily: "'Panchang', sans-serif" }}>{tier.name || `Option ${tIdx + 1}`}</h3>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                              {tier.items.slice(0, 5).map((item, i) => (
                                                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                      <div style={{ flex: 1, paddingRight: '15px' }}>
                                                          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>{item.desc || 'Service Item'}</h4>
                                                          {item.details && <p style={{ margin: 0, fontSize: '14px', color: '#888', lineHeight: 1.3, fontFamily: "'Clash Display', sans-serif" }}>{item.details}</p>}
                                                      </div>
                                                      <div style={{ textAlign: 'right' }}>
                                                          <div style={{ fontSize: '14px', color: '#888', marginBottom: '3px', fontFamily: "'Clash Display', sans-serif" }}>QTY: {item.qty}</div>
                                                          {item.rate > 0 && <div className={styles.pdfAmount} style={{ fontSize: '18px', fontFamily: "'Panchang', sans-serif" }}>{quoteDetails.currency} {item.rate.toLocaleString()}</div>}
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              (() => {
                                  const allItems = packageTiers.flatMap(t => t.items || []);
                                  const useGrid = allItems.length > 4;
                                  return (
                                      <div style={useGrid ? {
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(2, 1fr)',
                                          gap: '16px 24px',
                                          alignContent: 'start'
                                      } : {
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '16px'
                                      }}>
                                          {allItems.slice(0, 8).map((item, i) => (
                                              <div key={i} className={styles.pdfServiceCard} style={{
                                                  marginBottom: 0,
                                                  padding: allItems.length <= 3 ? '24px 36px' : (allItems.length <= 4 ? '20px 30px' : '18px 24px'),
                                                  background: 'rgba(255, 255, 255, 0.025)',
                                                  border: '1px solid rgba(235, 215, 63, 0.22)',
                                                  borderRadius: '16px'
                                              }}>
                                                  <div style={{ flex: 1, paddingRight: '25px' }}>
                                                      <h4 style={{
                                                          margin: '0 0 6px 0',
                                                          fontSize: allItems.length <= 3 ? '28px' : (allItems.length <= 4 ? '24px' : '20px'),
                                                          color: '#fff',
                                                          fontFamily: "'Clash Display', sans-serif",
                                                          fontWeight: '600'
                                                      }}>
                                                          {item.desc || 'Service Item'}
                                                      </h4>
                                                      {item.details && (
                                                          <p style={{
                                                              margin: 0,
                                                              fontSize: allItems.length <= 3 ? '18px' : (allItems.length <= 4 ? '16px' : '14px'),
                                                              color: '#888',
                                                              lineHeight: 1.4,
                                                              fontFamily: "'Clash Display', sans-serif"
                                                          }}>
                                                              {item.details}
                                                          </p>
                                                      )}
                                                  </div>
                                                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                      <div style={{
                                                          fontSize: allItems.length <= 4 ? '18px' : '15px',
                                                          color: '#888',
                                                          marginBottom: '4px',
                                                          fontFamily: "'Clash Display', sans-serif"
                                                      }}>
                                                          QTY: {item.qty}
                                                      </div>
                                                      {item.rate > 0 && (
                                                          <div className={styles.pdfAmount} style={{
                                                              fontSize: allItems.length <= 3 ? '30px' : (allItems.length <= 4 ? '26px' : '22px'),
                                                              fontFamily: "'Panchang', sans-serif"
                                                          }}>
                                                              {quoteDetails.currency} {item.rate.toLocaleString()}
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                          ))}
                                          {allItems.length > 8 && (
                                              <div style={{ fontSize: '18px', color: '#888', textAlign: 'center', marginTop: '10px', fontFamily: "'Clash Display', sans-serif" }}>
                                                  + {allItems.length - 8} more deliverables specified in the schedule.
                                              </div>
                                          )}
                                      </div>
                                  );
                              })()
                          )}
                      </div>
                  )}

                  {/* PMP PAGE */}
                  {page.type === 'pmp' && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                          <div style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              borderLeft: '6px solid #ebd73f',
                              padding: '36px 45px',
                              borderRadius: '16px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '18px'
                          }}>
                              {(() => {
                                  const text = pmpStrategy || 'Strategy outline goes here...';
                                  const paragraphs = text.split(/\n\s*\n/);
                                  return paragraphs.map((para, pIdx) => {
                                      const trimmed = para.trim();
                                      if (!trimmed) return null;
                                      const headerMatch = trimmed.match(/^([A-Za-z\s&]+:)([\s\S]*)$/);
                                      if (headerMatch) {
                                          const sectionTitle = headerMatch[1].trim();
                                          const sectionBody = headerMatch[2].trim();
                                          return (
                                              <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                  <span style={{
                                                      color: '#ebd73f',
                                                      fontSize: '20px',
                                                      fontWeight: '700',
                                                      fontFamily: "'Panchang', sans-serif",
                                                      letterSpacing: '1px',
                                                      textTransform: 'uppercase'
                                                  }}>
                                                      {sectionTitle}
                                                  </span>
                                                  <p style={{
                                                      color: '#e0e0e0',
                                                      fontSize: '20px',
                                                      lineHeight: '1.55',
                                                      margin: 0,
                                                      whiteSpace: 'pre-wrap',
                                                      fontFamily: "'Clash Display', sans-serif"
                                                  }}>
                                                      {sectionBody}
                                                  </p>
                                              </div>
                                          );
                                      }
                                      return (
                                          <p key={pIdx} style={{
                                              color: '#e0e0e0',
                                              fontSize: '20px',
                                              lineHeight: '1.55',
                                              margin: 0,
                                              whiteSpace: 'pre-wrap',
                                              fontFamily: "'Clash Display', sans-serif"
                                          }}>
                                              {trimmed}
                                          </p>
                                      );
                                  });
                              })()}
                          </div>
                      </div>
                  )}

                  {/* INVESTMENT PAGE */}
                  {page.type === 'investment' && (
                      <>
                        {!page.hideHeading && (
                            <div style={{ marginBottom: '60px', borderBottom: '2px solid rgba(235, 215, 63, 0.3)', paddingBottom: '24px' }}>
                                <h1 className={styles.pdfTitle} style={{ margin: 0, fontSize: '56px', fontFamily: "'Panchang', sans-serif" }}>{page.title}</h1>
                            </div>
                        )}
                        <div style={{ background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '24px', padding: '60px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <p style={{ fontSize: '30px', color: '#888', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px', fontFamily: "'Clash Display', sans-serif" }}>Total {packageType === 'monthly' ? 'Monthly ' : ''}Investment</p>
                            
                            {packageTiers.length > 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', alignItems: 'center' }}>
                                    {packageTiers.map((tier, tIdx) => {
                                        const tierTotal = tier.items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);
                                        return (
                                            <div key={tIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 50px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(235, 215, 63, 0.1)', width: '100%', maxWidth: '800px' }}>
                                                <span style={{ fontSize: '22px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Clash Display', sans-serif" }}>{tier.name || `Option ${tIdx + 1}`}</span>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                                                    <span style={{ fontSize: '45px', color: '#ebd73f', fontWeight: '500', fontFamily: "'Panchang', sans-serif" }}>{quoteDetails.currency}</span>
                                                    <span style={{ fontSize: '110px', color: '#ebd73f', fontWeight: '900', letterSpacing: '-3px', lineHeight: 1, fontFamily: "'Panchang', sans-serif" }}>{tierTotal.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                                    <span style={{ fontSize: '60px', color: '#ebd73f', fontWeight: '500', fontFamily: "'Panchang', sans-serif" }}>{quoteDetails.currency}</span>
                                    <span style={{ fontSize: '160px', color: '#ebd73f', fontWeight: '900', letterSpacing: '-5px', lineHeight: 1, fontFamily: "'Panchang', sans-serif" }}>{total.toLocaleString()}</span>
                                </div>
                            )}
                            
                            {packageType === 'monthly' && (
                                <p style={{ fontSize: '24px', color: '#aaa', marginTop: '40px', fontFamily: "'Clash Display', sans-serif" }}>*Billed monthly. Cancel anytime with 30 days notice.</p>
                            )}
                            {packageType === 'project' && (
                                <div style={{ display: 'flex', gap: '40px', marginTop: '40px' }}>
                                    <p style={{ fontSize: '24px', color: '#aaa', fontFamily: "'Clash Display', sans-serif" }}><strong style={{color: '#fff'}}>Duration:</strong> {quoteDetails.projectDuration?.trim() || 'N/A'}</p>
                                    <p style={{ fontSize: '24px', color: '#aaa', fontFamily: "'Clash Display', sans-serif" }}><strong style={{color: '#fff'}}>Delivery:</strong> {quoteDetails.expectedDelivery?.trim() || 'N/A'}</p>
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
                                <p style={{ fontSize: '24px', color: '#ccc', margin: '0 0 10px 0' }}>Email: gurpreet@drippmedia.com</p>
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
  );
}
