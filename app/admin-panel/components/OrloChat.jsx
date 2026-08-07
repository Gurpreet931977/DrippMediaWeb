'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, ChevronLeft, Grid, Bookmark, MoreHorizontal, ArrowLeft, Heart, MessageCircle, Send as SendIcon, Bookmark as BookmarkIcon, Mic, MicOff, ArrowDown } from 'lucide-react';
import OrloIcon from './OrloIcon';
import gsap from 'gsap';
import { useGenz } from '../../contexts/GenzContext';

const ProfileScene = ({ size = 84 }) => (
  <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>
        <linearGradient id="mountBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#039be5" />
          <stop offset="100%" stopColor="#0277bd" />
        </linearGradient>
        <linearGradient id="mountFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7cb342" />
          <stop offset="100%" stopColor="#558b2f" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#skyGrad)" />
      <circle cx="20" cy="25" r="12" fill="#fff9c4" opacity="0.9" />
      <circle cx="20" cy="25" r="18" fill="#fff9c4" opacity="0.3" />
      <path d="M 45 35 Q 55 25 65 35 Q 75 30 80 40 L 45 40 Z" fill="#fff" opacity="0.7" />
      <path d="M 5 45 Q 15 35 25 45 Q 35 40 40 50 L 5 50 Z" fill="#fff" opacity="0.5" />
      <path d="M -20 100 L 30 45 L 70 85 L 100 55 L 130 100 Z" fill="url(#mountBack)" />
    </svg>
    <div style={{ position: 'absolute', bottom: '15%', left: '20%', zIndex: 1, width: '60%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <OrloIcon size={size * 0.55} color="#FFFFFF" emotion="success" />
    </div>
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
      <path d="M -10 100 Q 50 65 110 100 Z" fill="url(#mountFrontGrad)" />
      <g transform="translate(60, 72)">
        <path d="M 5 15 L 15 0 L 25 15 Z" fill="#ffb74d" />
        <path d="M 15 0 L 25 15 L 15 15 Z" fill="#f57c00" />
        <path d="M 12 15 L 15 8 L 18 15 Z" fill="#3e2723" />
      </g>
      <path d="M 10 100 Q 15 85 20 100 Z" fill="#33691e" opacity="0.4" />
      <path d="M 85 100 Q 90 90 95 100 Z" fill="#33691e" opacity="0.4" />
      <path d="M 45 100 Q 50 93 55 100 Z" fill="#33691e" opacity="0.4" />
    </svg>
  </div>
);

const PostScene = ({ id, size = 120 }) => {
  const getPostContent = () => {
    switch (id) {
      case 1:
        return { img: '/posts/post1.png', emotion: 'still' };
      case 2:
        return { img: '/posts/post2.png', emotion: 'still' };
      case 3:
        return { img: '/posts/post3.png', emotion: 'still' };
      case 4:
        return { img: '/posts/post4.png', emotion: 'still' };
      case 5:
        return { img: '/posts/post5.png', emotion: 'still' };
      case 6:
        return { img: '/posts/post6.png', emotion: 'still' };
      default:
        return { img: '/posts/post1.png', emotion: 'still' };
    }
  };

  const { img, emotion } = getPostContent();

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative', 
      overflow: 'hidden', 
      backgroundImage: `url(${img})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      aspectRatio: '1 / 1'
    }}>
      {/* Placing a still OrloIcon subtly in the scene */}
      <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)' }}>
         <OrloIcon size={size * 0.4} emotion={emotion} color="#fff" disableCursorFollow={true} />
      </div>
    </div>
  );
};

export default function OrloChat() {
  const { isGenz } = useGenz() || { isGenz: false };
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hey, I am Orlo. What do you need me to do today?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [emotion, setEmotion] = useState('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [speechBubble, setSpeechBubble] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [availableModels, setAvailableModels] = useState([
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro' }
  ]);
  
  const chatRef = useRef(null);
  const btnRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const typingTimeoutRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const keypressCountRef = useRef(0);
  const keypressTimeoutRef = useRef(null);
  const speechBubbleTimeoutRef = useRef(null);

  // Load chat history and fetch working models from API on mount
  useEffect(() => {
    const saved = localStorage.getItem('orlo_chat_history');
    if (saved) {
      try {
        const { messages: savedMessages, timestamp } = JSON.parse(saved);
        const now = new Date().getTime();
        const fifteenDays = 15 * 24 * 60 * 60 * 1000;
        
        if (now - timestamp < fifteenDays) {
          setMessages(savedMessages);
        } else {
          localStorage.removeItem('orlo_chat_history');
        }
      } catch (e) {
        console.error('Failed to load Orlo chat history', e);
      }
    }
    
    let savedModel = localStorage.getItem('orlo_preferred_model');
    if (savedModel) {
      if (savedModel.includes('3.6') || savedModel.includes('3.5') || savedModel.includes('2.5')) {
        savedModel = savedModel.includes('pro') ? 'gemini-1.5-pro-latest' : 'gemini-2.0-flash';
        localStorage.setItem('orlo_preferred_model', savedModel);
      }
      setSelectedModel(savedModel);
    }

    // Query active models dynamically
    fetch('/api/admin/copilot/test-models')
      .then(res => res.json())
      .then(data => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          const formatted = data.models.map(m => {
            let label = 'Gemini Model';
            if (m.includes('2.0') && m.includes('flash')) label = 'Gemini 2.0 Flash';
            else if (m.includes('1.5') && m.includes('pro')) label = 'Gemini 1.5 Pro';
            else if (m.includes('1.5') && m.includes('flash')) label = 'Gemini 1.5 Flash';
            else if (m.includes('2.5') && m.includes('pro')) label = 'Gemini 2.5 Pro';
            else if (m.includes('2.5') && m.includes('flash')) label = 'Gemini 2.5 Flash';
            else label = m.replace('gemini-', 'Gemini ').replace(/-/g, ' ');
            return { id: m, label };
          });
          setAvailableModels(formatted);
        }
      })
      .catch(err => console.warn('Failed to load dynamic model list:', err));
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('orlo_chat_history', JSON.stringify({
        messages,
        timestamp: new Date().getTime()
      }));
    } else {
      localStorage.removeItem('orlo_chat_history');
    }
  }, [messages]);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const originalInputRef = useRef('');

  useEffect(() => {
    // We only need to check if it's supported here, but instantiation happens on click
  }, []);

  const shouldListenRef = useRef(false);

  const toggleListen = () => {
    if (isListening) {
      shouldListenRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Segment-by-segment recognition avoids Chrome speech socket aborts
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event) => {
          let currentSegment = '';
          for (let i = 0; i < event.results.length; i++) {
            currentSegment += event.results[i][0].transcript;
          }
          const prefix = originalInputRef.current ? originalInputRef.current.trim() + ' ' : '';
          setInput(prefix + currentSegment);

          // Save final segment to prefix so next spoken sentence appends
          if (event.results[0] && event.results[0].isFinal) {
            originalInputRef.current = prefix + currentSegment;
          }
        };
        
        recognition.onerror = (event) => {
          if (event.error === 'no-speech') {
            return;
          }
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            showToast('Microphone access denied. Please click the lock icon in the address bar to allow mic access.');
            shouldListenRef.current = false;
            setIsListening(false);
          } else if (event.error === 'network') {
            showToast('Network error: Speech Recognition requires Google Speech Service connection.');
            shouldListenRef.current = false;
            setIsListening(false);
          }
        };
        
        recognition.onend = () => {
          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch (e) {
              shouldListenRef.current = false;
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };
        
        originalInputRef.current = input;
        shouldListenRef.current = true;
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        showToast('Listening... Speak now.');
      } catch (err) {
        showToast('Microphone error: Please check your browser permissions.');
        setIsListening(false);
        shouldListenRef.current = false;
      }
    }
  };

  const postsData = [
    { id: 1, likes: '12.4k', comments: 142, caption: 'Deep work mode activated. Building the future of Dripp Media! 💻✨ #AI #Developer', date: '2 DAYS AGO' },
    { id: 2, likes: '15.1k', comments: 231, caption: 'Taking a well-deserved break with the team. Sun, sand, and good vibes! 🌴☀️', date: '1 WEEK AGO' },
    { id: 3, likes: '18.9k', comments: 310, caption: 'Sometimes you just need to disconnect. Exploring the wilderness on a solo hike. 🏔️🎒', date: '2 WEEKS AGO' },
    { id: 4, likes: '11.2k', comments: 95, caption: 'Fueling up for a busy day of answering your queries. How do you take your coffee? ☕️🤖', date: '3 WEEKS AGO' },
    { id: 5, likes: '9.8k', comments: 78, caption: 'Learning new skills! Upgrading my knowledge base so I can help you better. 📚🧠', date: '1 MONTH AGO' },
    { id: 6, likes: '22.3k', comments: 450, caption: 'Celebrating a successful launch! Neon lights and great times! 🎉✨', date: '2 MONTHS AGO' },
  ];

  // Determine 'waiting' emotion
  useEffect(() => {
    if (input.length > 0) {
      if (emotion !== 'success' && emotion !== 'disappointed') {
        setEmotion('thinking'); 
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setEmotion('waiting');
      }, 3000);
    } else {
      if (!isTyping && emotion !== 'success' && emotion !== 'disappointed') {
        setEmotion('idle');
      }
      clearTimeout(typingTimeoutRef.current);
    }
    return () => clearTimeout(typingTimeoutRef.current);
  }, [input, isTyping, emotion]);

  // Scroll to bottom
  const handleScroll = () => {
    if (chatBodyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen && chatRef.current) {
      gsap.fromTo(chatRef.current, 
        { opacity: 0, y: 80, scale: 0.85 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.5)' }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCopilotReply = (e) => {
      const data = e.detail;
      if (data && data.replyMessage) {
        setMessages(prev => [...prev, { role: 'ai', text: data.replyMessage }]);
        setEmotion('success');
        setTimeout(() => setEmotion('idle'), 3000);
      }
    };
    window.addEventListener('copilot-reply', handleCopilotReply);
    return () => window.removeEventListener('copilot-reply', handleCopilotReply);
  }, []);

  const showSpeechBubble = (text, duration = 4000) => {
    if (isOpen) return; // Don't show if chat is open
    setSpeechBubble(text);
    setEmotion('excited');
    clearTimeout(speechBubbleTimeoutRef.current);
    
    speechBubbleTimeoutRef.current = setTimeout(() => {
      setSpeechBubble('');
      setEmotion('idle');
    }, duration);
  };

  useEffect(() => {
    // Activity / Idle Tracker
    const resetIdle = () => {
      clearTimeout(idleTimeoutRef.current);
      if (!isOpen && !speechBubble) {
         setEmotion('idle');
      }
      idleTimeoutRef.current = setTimeout(() => {
        if (!isOpen) {
          showSpeechBubble("Hey, are you still there? Should I go to sleep? 😴", 5000);
          setEmotion('sad');
        }
      }, 20000); // 20 seconds of idle
    };

    const handleKeyDown = (e) => {
      resetIdle();
      // Only trigger "don't type" if they are typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        keypressCountRef.current += 1;
        
        clearTimeout(keypressTimeoutRef.current);
        keypressTimeoutRef.current = setTimeout(() => {
          keypressCountRef.current = 0;
        }, 3000);

        if (keypressCountRef.current > 15 && !isOpen) {
          showSpeechBubble("Don't waste time typing... Let me do the heavy lifting! ✨", 4000);
          keypressCountRef.current = 0; // reset
        }
      }
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', handleKeyDown);
    
    resetIdle();
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(idleTimeoutRef.current);
      clearTimeout(keypressTimeoutRef.current);
      clearTimeout(speechBubbleTimeoutRef.current);
    };
  }, [isOpen, speechBubble]);

  useEffect(() => {
    const handleQuickAction = (e) => {
      if (e.detail) {
        if (!isOpen) {
          setIsOpen(true);
        }
        setInput(e.detail);
      }
    };
    window.addEventListener('ORLO_QUICK_ACTION', handleQuickAction);
    return () => window.removeEventListener('ORLO_QUICK_ACTION', handleQuickAction);
  }, [isOpen]);

  useEffect(() => {
    const handleAnalyzeTrigger = (e) => {
      if (!isOpen) {
        setIsOpen(true);
      }
      handleVideoAnalysis(e);
    };

    const handleGraphicAnalyzeTrigger = (e) => {
      if (!isOpen) {
        setIsOpen(true);
      }
      handleGraphicAnalysis(e);
    };

    window.addEventListener('ORLO_VIDEO_ANALYZE', handleAnalyzeTrigger);
    window.addEventListener('ORLO_GRAPHIC_ANALYZE', handleGraphicAnalyzeTrigger);
    return () => {
        window.removeEventListener('ORLO_VIDEO_ANALYZE', handleAnalyzeTrigger);
        window.removeEventListener('ORLO_GRAPHIC_ANALYZE', handleGraphicAnalyzeTrigger);
    };
  }, [isOpen, messages]); // need messages in deps or we use callback setter


  const handleVideoAnalysis = async (e) => {
     let videoUrl;
     let isExternal = false;
     
     if (e && e.detail && e.detail.videoUrl) {
         videoUrl = e.detail.videoUrl;
         isExternal = true;
     } else {
         const file = window.portfolioFile;
         if (!file) {
             setMessages(prev => [...prev, { role: 'ai', text: "I can't find an uploaded video to analyze. Please drop one into the upload zone first!" }]);
             return;
         }
         videoUrl = URL.createObjectURL(file);
     }
     
     setMessages(prev => [...prev, { role: 'ai', text: "Scanning video visually... extracting key frames natively..." }]);
     setIsTyping(true);
     setEmotion('thinking');
     
     try {
         // Lightning Fast Native HTML5 Frame Extraction (Bypasses slow FFmpeg WASM)
         const video = document.createElement('video');
         // Bypass browser cache for external URLs to ensure fresh CORS headers are fetched
         video.src = isExternal ? `${videoUrl}?cb=${Date.now()}` : videoUrl;
         video.crossOrigin = 'anonymous';
         video.muted = true;
         video.playsInline = true;
         
         await new Promise((resolve, reject) => {
             video.onloadeddata = () => resolve();
             video.onerror = () => reject(new Error("Failed to load video for native analysis"));
             video.load();
         });
         
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         
         // Scale to 480p to keep payload small
         const targetWidth = 480;
         const scale = targetWidth / video.videoWidth;
         const targetHeight = Math.floor(video.videoHeight * scale);
         canvas.width = targetWidth;
         canvas.height = targetHeight;
         
         const frames = [];
         // Extract 30 frames evenly spread across the video
         const duration = video.duration && isFinite(video.duration) ? video.duration : 15; // default 15s if unknown
         const timePoints = [];
         const frameCount = 30;
         for (let i = 0; i < frameCount; i++) {
             timePoints.push(duration * ((i + 0.5) / frameCount));
         }
         
         for (const time of timePoints) {
             video.currentTime = time;
             await new Promise((resolve) => {
                 video.onseeked = () => {
                     ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                     const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                     frames.push(base64);
                     resolve();
                 };
             });
         }
         
         if (!isExternal) {
             URL.revokeObjectURL(videoUrl);
         }
         
         setMessages(prev => [...prev, { role: 'ai', text: `Extracted ${frames.length} frames instantly! Writing premium captions...` }]);
         
         const currentCategory = window.portfolioFormData?.category || 'Both';
         const superPrompt = `
You are the Lead Creative Director for Dripp Media, a premium creative agency. 
Analyze these 30 sequential frames from a video we just produced or edited. 
The user has categorized this video as: "${currentCategory}".

Write three things:
1. A punchy, 3-8 word 'title' (no full sentences).
2. A short 'description' acting as a social media caption with 2-3 hashtags.
3. A premium 'case_study' (The Vision) from the creator's perspective. The Vision should sell the transformation and explain *why* the edits, pacing, or cinematography choices matter to the viewer's psychology or the brand's premium feel. 
- CRITICAL: Use simple, everyday conversational language. It should sound like a human talking to a client, not an academic paper.
- DO NOT use hard grammar, complex vocabulary, or "SAT words" (e.g. avoid words like "juxtaposing", "high-octane", "engineered", "visceral").
- STRICTLY DO NOT use em dashes (—) or en dashes (–).
- DO NOT use emojis. 
- DO NOT use basic marketing jargon. 
Keep it under 100 words, simple but impactful.

Return ONLY raw JSON with 'title', 'description', and 'case_study' keys. Do not include markdown formatting or backticks around the JSON.
         `.trim();

         const res = await fetch('/api/admin/copilot/video-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frames, prompt: superPrompt, model: selectedModel })
         });
         
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || data.message || 'Unknown API Error');
         
         data.fillTarget = e?.detail?.fillTarget || 'all';
         
         window.dispatchEvent(new CustomEvent('UPDATE_PORTFOLIO_FORM', { detail: data }));
         
         const target = data.fillTarget;
         const textMsg = target === 'title' ? "Done! I've automatically written a premium title for you." : target === 'case_study' ? "Done! I've automatically written a premium Vision for you." : "Done! I've automatically written a premium title, description, and Vision for you.";
         
         setMessages(prev => [...prev, { role: 'ai', text: textMsg }]);
         setEmotion('success');
         setTimeout(() => setEmotion('idle'), 3000);
     } catch (e) {
         setMessages(prev => [...prev, { role: 'ai', text: "Error analyzing video: " + e.message }]);
         setEmotion('disappointed');
         setTimeout(() => setEmotion('idle'), 4000);
     } finally {
         setIsTyping(false);
     }
  };

  const handleGraphicAnalysis = async (e) => {
     let imageUrl;
     let isExternal = false;
     
     if (e && e.detail && e.detail.imageUrl) {
         imageUrl = e.detail.imageUrl;
         isExternal = true;
     } else {
         const file = window.portfolioFile;
         if (!file) {
             setMessages(prev => [...prev, { role: 'ai', text: "I can't find an uploaded graphic to analyze. Please drop one into the upload zone first!" }]);
             return;
         }
         imageUrl = URL.createObjectURL(file);
     }
     
     setMessages(prev => [...prev, { role: 'ai', text: "Analyzing graphic design details... preparing premium Vision..." }]);
     setIsTyping(true);
     setEmotion('thinking');
     
     try {
         const img = new Image();
         img.crossOrigin = 'anonymous';
         img.src = isExternal ? `${imageUrl}?cb=${Date.now()}` : imageUrl;
         
         await new Promise((resolve, reject) => {
             img.onload = () => resolve();
             img.onerror = () => reject(new Error("Failed to load graphic for analysis"));
         });
         
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         
         const targetWidth = 800; // slightly higher res for graphic analysis
         const scale = Math.min(1, targetWidth / img.width);
         const targetHeight = Math.floor(img.height * scale);
         canvas.width = Math.floor(img.width * scale);
         canvas.height = targetHeight;
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
         
         const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
         
         if (!isExternal) {
             URL.revokeObjectURL(imageUrl);
         }
         
         const currentCategory = window.portfolioFormData?.category || 'Graphic Design';
         const superPrompt = `
You are the Lead Creative Director for Dripp Media, a premium creative agency. 
Analyze this single graphic design (Category: "${currentCategory}") that we just produced.

Write a premium 'case_study' (The Vision) from the creator's perspective. The Vision should sell the transformation, explain the design choices (colors, typography, composition, visual hierarchy), and describe why they matter to the brand's premium feel or viewer psychology.
- CRITICAL: Use simple, everyday conversational language. It should sound like a human talking to a client, not an academic paper.
- DO NOT use hard grammar, complex vocabulary, or "SAT words" (e.g. avoid words like "juxtaposing", "high-octane", "engineered", "visceral").
- STRICTLY DO NOT use em dashes (—) or en dashes (–).
- DO NOT use emojis. 
- DO NOT use basic marketing jargon. 
Keep it under 100 words, simple but impactful.

Return ONLY raw JSON with 'title', 'description', and 'case_study' keys. You can put "Title" for title and "Desc" for description, the main focus is the case_study key. Do not include markdown formatting.
         `.trim();

         const res = await fetch('/api/admin/copilot/video-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frames: [base64], prompt: superPrompt, model: selectedModel })
         });
         
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || data.message || 'Unknown API Error');
         
         data.fillTarget = e?.detail?.fillTarget || 'all';
         
         window.dispatchEvent(new CustomEvent('UPDATE_PORTFOLIO_FORM', { detail: data }));
         
         const target = data.fillTarget;
         const textMsg = target === 'title' ? "Done! I've automatically written a premium title for your graphic." : target === 'case_study' ? "Done! I've automatically written a premium Vision for your graphic." : "Done! I've automatically written a premium title and Vision for your graphic.";
         
         setMessages(prev => [...prev, { role: 'ai', text: textMsg }]);
         setEmotion('success');
         setTimeout(() => setEmotion('idle'), 3000);
     } catch (e) {
         setMessages(prev => [...prev, { role: 'ai', text: "Error analyzing graphic: " + e.message }]);
         setEmotion('disappointed');
         setTimeout(() => setEmotion('idle'), 4000);
     } finally {
         setIsTyping(false);
     }
  };


  const toggleChat = () => {
    if (isOpen) {
      gsap.to(chatRef.current, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: () => setIsOpen(false) });
    } else {
      setIsOpen(true);
      
      // Trigger Orlo's happy greeting animation
      setEmotion('excited');
      setTimeout(() => {
        setEmotion(prev => prev === 'excited' ? 'idle' : prev);
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);
    setEmotion('thinking');

    try {
      const currentContext = window._drippEmailContext || {};
      const systemContext = window._drippSystemContext || {};
      const formContext = window._drippFormContext || {};
      
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userPrompt: userText,
          chatHistory: messages,
          context: currentContext, 
          systemContext: systemContext,
          formContext: formContext,
          currentDate: new Date().toString(),
          model: selectedModel,
          isGenz: isGenz
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to process command');

      if (data.intent === 'unsupported' || (!data.payload && data.intent !== 'learn' && data.intent !== 'chat' && data.intent !== 'clear_chat')) {
        setEmotion('disappointed');
        setTimeout(() => setEmotion('idle'), 4000);
      } else {
        setEmotion('success');
        setTimeout(() => setEmotion('idle'), 3000);
      }

      if (data.intent === 'clear_chat') {
        setMessages([{ role: 'ai', text: data.replyMessage || "Chat history cleared. My mind is a blank slate!" }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.replyMessage || "Done. Check your form!" }]);
      }
      
      // Dispatch event to window so forms can pick it up
      if (data.intent && data.payload) {
        if (['quote', 'package', 'pmp', 'invoice'].includes(data.intent)) {
          sessionStorage.setItem('pendingPackageData', JSON.stringify(data.payload));
        }
        window.dispatchEvent(new CustomEvent('copilot-action', { detail: data }));
        
        const currentPath = window.location.pathname;
        const targetPath = (data.intent === 'quote' || data.intent === 'package') ? '/admin-panel/quote' :
                           data.intent === 'pmp' ? '/admin-panel/package' :
                           data.intent === 'invoice' ? '/admin-panel/invoice' : null;
                           
        if (targetPath && currentPath !== targetPath) {
          router.push(targetPath);
        } else if (data.intent === 'portfolio') {
          if (data.payload.analyzeVideo) {
            handleVideoAnalysis();
          } else {
            window.dispatchEvent(new CustomEvent('UPDATE_PORTFOLIO_FORM', { detail: data.payload }));
          }
        }
      }

    } catch (error) {
      setEmotion('disappointed');
      setTimeout(() => setEmotion('idle'), 4000);
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <>
      <style>{`
        @keyframes orloBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-2px); }
        }
        @keyframes pulseOrb {
          0% { box-shadow: 0 0 20px rgba(235, 215, 63, 0.3), inset 0 0 10px rgba(255,255,255,0.5); }
          100% { box-shadow: 0 0 40px rgba(235, 215, 63, 0.6), inset 0 0 10px rgba(255,255,255,0.5); }
        }
        @keyframes expandRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        
        .orlo-icon-svg {
          animation: orloBreathe 3s ease-in-out infinite;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .copilot-wrapper {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .speech-bubble {
          position: relative;
          background: rgba(10, 10, 10, 0.65);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(235, 215, 63, 0.25);
          color: #fff;
          padding: 14px 24px;
          border-radius: 24px;
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.4;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(235, 215, 63, 0.05);
          width: fit-content;
          max-width: 250px;
          white-space: pre-wrap;
          word-wrap: break-word;
          transform-origin: right center;
          opacity: 0;
          transform: scale(0.6) translateX(30px);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
          margin-bottom: 0;
        }

        /* Small glowing dot connector instead of a crude triangle tail */
        .speech-bubble::after {
          content: '';
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: -4px;
          width: 8px;
          height: 8px;
          background: #ebd73f;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(235, 215, 63, 0.8), 0 0 20px rgba(235, 215, 63, 0.4);
          opacity: 0;
          transition: opacity 0.4s ease 0.3s;
        }
        
        .speech-bubble.show {
          opacity: 1;
          transform: scale(1) translateX(0);
        }

        .speech-bubble.show::after {
          opacity: 1;
        }

        .copilot-orb {
          position: relative;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(15,15,15,0.9), rgba(5,5,5,0.95));
          border: 1px solid rgba(235, 215, 63, 0.4);
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.25), inset 0 0 15px rgba(235, 215, 63, 0.1);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: pulseOrb 3s infinite alternate;
        }
        
        .copilot-orb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 45px rgba(235, 215, 63, 0.5), inset 0 0 25px rgba(235, 215, 63, 0.3);
          border-color: rgba(235, 215, 63, 0.8);
        }
        
        .copilot-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid rgba(235, 215, 63, 0.5);
          animation: expandRing 2s infinite linear;
          pointer-events: none;
        }
        
        .profile-modal, .post-modal {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 15, 15, 0.98);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .profile-modal::-webkit-scrollbar, .post-modal::-webkit-scrollbar {
          width: 0px;
        }
        
        .profile-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          background: rgba(15, 15, 15, 0.9);
          backdrop-filter: blur(10px);
          z-index: 11;
        }

        .profile-stats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
        
        .stat-value {
          color: #fff;
          font-weight: 700;
          font-size: 1.1rem;
        }
        
        .stat-label {
          color: #888;
          font-size: 0.75rem;
        }

        .profile-bio {
          padding: 0 20px 20px 20px;
          font-size: 0.85rem;
          color: #ddd;
          line-height: 1.5;
        }

        .profile-actions {
          display: flex;
          gap: 10px;
          padding: 0 20px 20px 20px;
        }

        .btn-follow {
          flex: 1;
          background: #ebd73f;
          color: #000;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .btn-follow:hover { opacity: 0.9; }

        .btn-message {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .btn-message:hover { background: rgba(255, 255, 255, 0.15); }

        .profile-grid-tabs {
          display: flex;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .grid-tab {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 12px 0;
          border-bottom: 2px solid #ebd73f;
          color: #ebd73f;
        }
        
        .grid-tab-inactive {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 12px 0;
          color: #666;
          border-bottom: 2px solid transparent;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          padding-bottom: 20px;
        }
        
        .grid-item {
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .grid-item:hover .grid-item-overlay { opacity: 1; }
        
        .grid-item-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          color: white;
          font-weight: bold;
          gap: 5px;
          z-index: 10;
        }

        .chat-container {
          position: fixed;
          bottom: 110px;
          right: 30px;
          width: 380px;
          height: 550px;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          z-index: 9998;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(235, 215, 63, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .chat-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(20, 20, 20, 0.5);
          position: relative;
        }
        .chat-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(235, 215, 63, 0.5), transparent);
        }
        
        .chat-body {
          flex: 1;
          padding: 24px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .chat-body::-webkit-scrollbar {
          width: 6px;
        }
        .chat-body::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        
        .msg-bubble {
          max-width: 85%;
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.6;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          animation: slideUpFade 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2);
        }
        
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-ai {
          background: rgba(30, 30, 30, 0.7);
          color: #eee;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-left: 3px solid #ebd73f;
          border-top-left-radius: 4px;
          align-self: flex-start;
        }
        .msg-user {
          background: #ebd73f;
          color: #000;
          font-weight: 500;
          border-top-right-radius: 4px;
          align-self: flex-end;
        }
        
        .chat-input-area {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.3);
        }
        
        .chat-input-wrapper {
          position: relative;
          display: flex;
          align-items: flex-end;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 4px;
          transition: all 0.3s ease;
        }
        .chat-input-wrapper:focus-within {
          background: rgba(255,255,255,0.08);
          border-color: #ebd73f;
          box-shadow: 0 0 15px rgba(235, 215, 63, 0.15);
        }

        .chat-input-textarea::-webkit-scrollbar {
          width: 4px;
        }
        .chat-input-textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-input-textarea::-webkit-scrollbar-thumb {
          background: rgba(235, 215, 63, 0.3);
          border-radius: 4px;
        }
        .chat-input-textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(235, 215, 63, 0.6);
        }

        .send-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          color: #555;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: default;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .send-btn.active {
          background: linear-gradient(135deg, rgba(235, 215, 63, 0.9), rgba(212, 188, 28, 0.95));
          color: #000;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(235, 215, 63, 0.3), inset 0 2px 5px rgba(255,255,255,0.2);
        }
        .send-btn.active:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(235, 215, 63, 0.5), inset 0 2px 5px rgba(255,255,255,0.3);
        }
        .send-btn svg {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .send-btn.active svg {
          fill: #000;
        }
        .send-btn.active:hover svg {
          transform: translate(2px, -2px) scale(1.1);
        }

        .typing-indicator {
          display: flex;
          gap: 6px;
          padding: 14px 18px;
          background: rgba(30,30,30,0.5);
          border-radius: 18px;
          border-top-left-radius: 4px;
          border-left: 3px solid #ebd73f;
          align-self: flex-start;
          align-items: center;
        }
        .dot {
          width: 8px;
          height: 8px;
          background: rgba(235, 215, 63, 0.8);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        .mic-btn-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulsing-mic {
          animation: pulseMic 1.5s infinite ease-in-out;
          color: #ebd73f !important;
        }
        
        .mic-waves {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(235, 215, 63, 0.4);
          animation: micWave 1.5s infinite ease-out;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes pulseMic {
          0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(235, 215, 63, 0)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 10px rgba(235, 215, 63, 0.8)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(235, 215, 63, 0)); }
        }
        
        @keyframes micWave {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        
        .toast-msg {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          background: #ef4444;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          z-index: 100;
          opacity: 0;
          animation: toastFade 3s forwards;
          pointer-events: none;
        }
        @keyframes toastFade {
          0% { opacity: 0; transform: translate(-50%, 10px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          90% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
      `}</style>

      {isOpen && (
        <div className="chat-container" ref={chatRef}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ width: '36px', height: '36px', borderRadius: '50%', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(235, 215, 63, 0.5)' }}
                onClick={() => setShowProfile(true)}
                title="View Orlo's Profile"
              >
                <ProfileScene size={36} />
              </div>
              <div>
                <h3 
                  style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setShowProfile(true)}
                  title="View Orlo's Profile"
                >Orlo</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#ebd73f' }}>Online & Ready</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                value={selectedModel} 
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  localStorage.setItem('orlo_preferred_model', e.target.value);
                }}
                style={{
                  background: 'rgba(235, 215, 63, 0.08)',
                  border: '1px solid rgba(235, 215, 63, 0.3)',
                  color: '#ebd73f',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '145px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#181818', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='#888'}>
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="chat-body" ref={chatBodyRef} onScroll={handleScroll}>
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble ${m.role === 'ai' ? 'msg-ai' : 'msg-user'}`}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSubmit} style={{ position: 'relative' }}>
            {showScrollDown && (
              <button 
                  type="button"
                  onClick={scrollToBottom} 
                  style={{ position: 'absolute', top: '-45px', right: '20px', background: 'rgba(235, 215, 63, 0.9)', color: '#000', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', transition: 'all 0.3s' }}
              >
                  <ArrowDown size={18} />
              </button>
            )}
            <div className="chat-input-wrapper">
              <div className="mic-btn-container">
                {isListening && <div className="mic-waves"></div>}
                <button
                  type="button"
                  onClick={toggleListen}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isListening ? '#ebd73f' : '#888',
                    cursor: 'pointer',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.3s',
                    position: 'relative',
                    zIndex: 2
                  }}
                  title={isListening ? "Stop Listening" : "Voice Command"}
                >
                  <Mic size={20} className={isListening ? 'pulsing-mic' : ''} />
                </button>
              </div>
              <textarea 
                ref={inputRef}
                className="chat-input-textarea"
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isTyping) {
                      handleSubmit();
                    }
                  }
                }}
                placeholder="Ask me to analyze or write..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '12px 10px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  maxHeight: '150px',
                  minHeight: '44px',
                  overflowY: 'auto'
                }}
                disabled={isTyping}
                rows={1}
              />
              <button 
                type="submit" 
                className={`send-btn ${input.trim() ? 'active' : ''}`}
                disabled={!input.trim() || isTyping}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          </div>

          {/* Profile View overlay */}
          <div 
            className="profile-modal" 
            style={{ 
              transform: showProfile ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)',
              zIndex: 10
            }}
          >
            {toastMessage && <div className="toast-msg">{toastMessage}</div>}
            <div className="profile-header-bar">
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={24} />
              </button>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#fff' }}>orlo.ai</h2>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                <MoreHorizontal size={24} />
              </button>
            </div>
            
            <div className="profile-stats-row">
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', position: 'relative', border: '2px solid #ebd73f', padding: '3px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', position: 'relative', overflow: 'hidden', background: '#000' }}>
                   <ProfileScene size={84} />
                </div>
              </div>
              
              <div className="stat-box">
                <span className="stat-value">{postsData.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-box" onClick={() => showToast('Followers list is confidential')}>
                <span className="stat-value">69K</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-box" onClick={() => window.open('https://instagram.com/drippmedia_', '_blank')}>
                <span className="stat-value">1</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            <div className="profile-bio">
              <strong style={{ color: '#fff', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>Orlo</strong>
              <span style={{ color: '#aaa' }}>Dripp AI Copilot</span><br/>
              Solving problems, answering queries, and crafting premium content. 🚀<br/>
              Ready to scale your media presence.<br/>
              <a href="https://drippmedia.com/orloai" target="_blank" rel="noopener noreferrer" style={{ color: '#ebd73f', textDecoration: 'none', fontWeight: '500' }}>drippmedia.com/orloai</a>
            </div>

            <div className="profile-actions">
              <button className="btn-follow">Following</button>
              <button className="btn-message" onClick={() => setShowProfile(false)}>Message</button>
            </div>

            <div className="profile-grid-tabs">
              <div className="grid-tab"><Grid size={22} /></div>
              <div className="grid-tab-inactive"><Bookmark size={22} /></div>
            </div>

            <div className="profile-grid">
              {postsData.map((post) => (
                <div key={post.id} className="grid-item" onClick={() => setSelectedPost(post)}>
                  <PostScene id={post.id} size={120} />
                  <div className="grid-item-overlay">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={16} fill="white" /> {post.likes}</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={16} fill="white" /> {post.comments}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post Detail overlay */}
          <div 
            className="post-modal" 
            style={{ 
              transform: selectedPost ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)',
              zIndex: 20
            }}
          >
            {selectedPost && (
              <>
                <div className="profile-header-bar">
                  <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                    <ArrowLeft size={24} />
                  </button>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#fff' }}>Posts</h2>
                  <div style={{ width: 24 }}></div>
                </div>
                
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ebd73f', overflow: 'hidden' }}>
                    <ProfileScene size={32} />
                  </div>
                  <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>orlo.ai</span>
                  <MoreHorizontal size={20} color="#fff" style={{ marginLeft: 'auto' }} />
                </div>
                
                <div style={{ width: '100%', aspectRatio: '1 / 1', height: 'auto' }}>
                   <PostScene id={selectedPost.id} size={300} />
                </div>
                
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <Heart size={24} color="#fff" />
                    <MessageCircle size={24} color="#fff" />
                    <SendIcon size={24} color="#fff" />
                    <BookmarkIcon size={24} color="#fff" style={{ marginLeft: 'auto' }} />
                  </div>
                  
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>
                    {selectedPost.likes} likes
                  </div>
                  
                  <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', marginRight: '6px' }}>orlo.ai</span>
                    {selectedPost.caption}
                  </div>
                  
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px' }}>
                    View all {selectedPost.comments} comments
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ color: '#fff', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600', marginRight: '6px' }}>drippmedia_</span>Wow, looking good Orlo! Keep it up. 🔥
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600', marginRight: '6px' }}>ai.enthusiast</span>Haha Orlo living his best life 😂
                    </div>
                  </div>
                  
                  <div style={{ color: '#666', fontSize: '0.7rem', fontWeight: '500' }}>
                    {selectedPost.date}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="copilot-wrapper">
        <div className={`speech-bubble ${speechBubble ? 'show' : ''}`}>
          {speechBubble}
        </div>
        <div 
          className="copilot-orb" 
          onClick={toggleChat} 
          ref={btnRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
        >
          <div className="copilot-ring"></div>
          <OrloIcon size={32} color="#ebd73f" className="orlo-icon-svg" emotion={isOpen ? emotion : (speechBubble ? emotion : (isHovered ? 'excited' : 'idle'))} />
        </div>
      </div>
    </>
  );
}
