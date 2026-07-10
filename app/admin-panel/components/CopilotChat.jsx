'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import OrloIcon from './OrloIcon';
import gsap from 'gsap';

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hey, I am Orlo. What do you need me to do today?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [emotion, setEmotion] = useState('idle');
  const [isHovered, setIsHovered] = useState(false);
  const chatRef = useRef(null);
  const btnRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

  const toggleChat = () => {
    if (isOpen) {
      gsap.to(chatRef.current, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: () => setIsOpen(false) });
    } else {
      setIsOpen(true);
      
      // Trigger Orlo's dramatic greeting animation
      setEmotion('greeting');
      setTimeout(() => {
        setEmotion(prev => prev === 'greeting' ? 'idle' : prev);
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
          context: currentContext, 
          currentDate: new Date().toISOString() 
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to process command');

      if (data.intent === 'unsupported' || !data.payload) {
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

  return (
    <>
      <style>{`
        @keyframes orloBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-2px); }
        }
        @keyframes orloSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .orlo-icon-svg {
          animation: orloBreathe 3s ease-in-out infinite;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .copilot-orb {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ebd73f, #d4c235);
          box-shadow: 0 0 20px rgba(235, 215, 63, 0.4), inset 0 0 10px rgba(255,255,255,0.5);
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: pulseOrb 3s infinite alternate;
        }
        @keyframes pulseOrb {
          0% { box-shadow: 0 0 20px rgba(235, 215, 63, 0.3), inset 0 0 10px rgba(255,255,255,0.5); }
          100% { box-shadow: 0 0 40px rgba(235, 215, 63, 0.6), inset 0 0 10px rgba(255,255,255,0.5); }
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
        @keyframes expandRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
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
      `}</style>

      {isOpen && (
        <div className="chat-container" ref={chatRef}>
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                  <defs>
                    <filter id="bokeh" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" />
                    </filter>
                    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e2024" />
                      <stop offset="100%" stopColor="#111216" />
                    </linearGradient>
                    <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4a3b2c" />
                      <stop offset="100%" stopColor="#1a120b" />
                    </linearGradient>
                    <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ebd73f" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ebd73f" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Blurred Background Environment */}
                  <g filter="url(#bokeh)">
                    <rect width="100" height="100" fill="url(#wallGrad)" />
                    
                    {/* Computer Monitor */}
                    <rect x="10" y="15" width="80" height="50" fill="#0a0a0c" rx="4" />
                    <rect x="14" y="19" width="72" height="42" fill="#15171e" rx="2" />
                    <rect x="20" y="25" width="30" height="8" fill="#ebd73f" opacity="0.6" rx="1" />
                    <rect x="20" y="38" width="40" height="4" fill="#fff" opacity="0.3" rx="1" />
                    <rect x="20" y="46" width="25" height="4" fill="#fff" opacity="0.3" rx="1" />
                    <circle cx="70" cy="35" r="8" fill="#ebd73f" opacity="0.4" />
                    
                    {/* Ambient Glow from screen */}
                    <rect x="0" y="0" width="100" height="100" fill="url(#screenGlow)" style={{ mixBlendMode: 'screen' }} />
                    
                    {/* Monitor Stand */}
                    <rect x="42" y="65" width="16" height="25" fill="#222" />
                    <path d="M 30 85 L 70 85 L 75 90 L 25 90 Z" fill="#111" />
                  </g>
                  
                  {/* Sharp Foreground Desk */}
                  <path d="M 0 85 L 100 85 L 100 100 L 0 100 Z" fill="url(#deskGrad)" />
                  <path d="M 0 85 L 100 85 L 100 86 L 0 86 Z" fill="rgba(255,255,255,0.2)" />

                  {/* Orlo's Drop Shadow */}
                  <ellipse cx="50" cy="94" rx="18" ry="3" fill="rgba(0,0,0,0.8)" filter="url(#bokeh)" />
                </svg>
                <div style={{ zIndex: 1, paddingBottom: '2px' }}>
                  <OrloIcon size={20} color="#000" emotion="still" />
                </div>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '600' }}>Orlo</h3>
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
      )}

      <div 
        className="copilot-orb" 
        onClick={toggleChat} 
        ref={btnRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
      >
        <div className="copilot-ring"></div>
        <OrloIcon size={32} color="#000" className="orlo-icon-svg" emotion={isOpen ? emotion : (isHovered ? 'disturbed' : 'idle')} />
      </div>
    </>
  );
}
