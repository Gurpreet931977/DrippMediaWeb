'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronLeft, Grid, Bookmark, MoreHorizontal, ArrowLeft, Heart, MessageCircle, Send as SendIcon, Bookmark as BookmarkIcon } from 'lucide-react';
import OrloIcon from './OrloIcon';
import gsap from 'gsap';

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
  
  const chatRef = useRef(null);
  const btnRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const keypressCountRef = useRef(0);
  const keypressTimeoutRef = useRef(null);
  const speechBubbleTimeoutRef = useRef(null);

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
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

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

      setTimeout(() => {
        gsap.fromTo(chatRef.current, 
          { opacity: 0, y: 80, scale: 0.85 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.5)' }
        );
      }, 10);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);
    setEmotion('thinking');

    try {
      const currentContext = window._drippEmailContext || {};
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userPrompt: userText,
          chatHistory: messages,
          context: currentContext, 
          currentDate: new Date().toString() 
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to process command');

      if (data.intent === 'unsupported' || (!data.payload && data.intent !== 'learn' && data.intent !== 'chat')) {
        setEmotion('disappointed');
        setTimeout(() => setEmotion('idle'), 4000);
      } else {
        setEmotion('success');
        setTimeout(() => setEmotion('idle'), 3000);
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.replyMessage || "Done. Check your form!" }]);
      
      // Dispatch event to window so forms can pick it up
      if (data.intent && data.payload) {
        window.dispatchEvent(new CustomEvent('copilot-action', { detail: data }));
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
          border-radius: 30px;
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.4;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(235, 215, 63, 0.05);
          width: fit-content;
          max-width: 400px;
          white-space: nowrap;
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
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(235, 215, 63, 0.4);
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.2), inset 0 0 15px rgba(235, 215, 63, 0.1);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
          animation: pulseOrb 3s infinite alternate;
        }
        
        .copilot-orb:hover {
          box-shadow: 0 0 35px rgba(235, 215, 63, 0.4), inset 0 0 20px rgba(235, 215, 63, 0.2);
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
          height: 500px;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          z-index: 9998;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
          overflow: hidden;
        }
        
        .chat-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to right, rgba(235, 215, 63, 0.1), transparent);
        }
        
        .chat-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .msg-ai {
          background: rgba(255, 255, 255, 0.05);
          color: #ddd;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 4px;
          align-self: flex-start;
        }
        .msg-user {
          background: rgba(235, 215, 63, 0.15);
          color: #fff;
          border: 1px solid rgba(235, 215, 63, 0.3);
          border-top-right-radius: 4px;
          align-self: flex-end;
        }
        
        .chat-input-area {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.4);
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border-top-left-radius: 4px;
          align-self: flex-start;
          align-items: center;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: #ebd73f;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
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
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='#888'}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-body">
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

          <form className="chat-input-area" onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me to draft an email..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 45px 12px 16px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
                disabled={isTyping}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: input.trim() ? '#ebd73f' : '#555',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex'
                }}
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
