'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Lock, FileText, CheckCircle2, Globe, Mail, Instagram } from 'lucide-react';

export default function SharedQuote() {
  const params = useParams();
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [quoteData, setQuoteData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pwdParam = urlParams.get('pwd');
      if (pwdParam) {
        setPassword(pwdParam);
        setLoading(true);
        fetch(`/api/quote/${params?.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwdParam })
        })
        .then(res => {
          if (res.ok) {
            return res.json().then(data => {
              setQuoteData(data.quote);
              setIsLocked(false);
            });
          } else {
            setError('Incorrect password or quote not found.');
          }
        })
        .catch(() => setError('An error occurred. Please try again.'))
        .finally(() => setLoading(false));
      }
    }
  }, [params?.id]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/quote/${params?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const data = await res.json();
        setQuoteData(data.quote);
        setIsLocked(false);
      } else {
        setError('Incorrect password or quote not found.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
      return <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ebd73f' }}>Loading secure link...</div>;
  }

  if (isLocked) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#050505', color: 'white', position: 'relative', overflow: 'hidden' }}>
         {/* Background Glows */}
         <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', zIndex: 0 }}></div>
         <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.03) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', zIndex: 0 }}></div>

        <form onSubmit={handleUnlock} style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.02)', padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', borderTop: '2px solid #ebd73f', textAlign: 'center', maxWidth: '450px', width: '90%', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(235, 215, 63, 0.1)', marginBottom: '25px', boxShadow: '0 0 30px rgba(235, 215, 63, 0.2)' }}>
             <Lock size={40} color="#ebd73f" />
          </div>
          <h2 style={{ marginBottom: '10px', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontFamily: "'Panchang', sans-serif", letterSpacing: '1px' }}>Secure Proposal</h2>
          <p style={{ color: '#888', marginBottom: '35px', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', lineHeight: '1.6' }}>Please enter the private password provided by Dripp Media to access your tailored proposal.</p>
          
          <div style={{ position: 'relative', marginBottom: '20px' }}>
             <input 
               type="password" 
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="Enter Password" 
               style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.4)', color: 'white', textAlign: 'center', letterSpacing: '3px', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s' }} 
               onFocus={(e) => { e.target.style.border = '1px solid #ebd73f'; e.target.style.boxShadow = '0 0 15px rgba(235, 215, 63, 0.2)'; }}
               onBlur={(e) => { e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
               required
             />
          </div>
          {error && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '20px', padding: '10px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>{error}</p>}
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', fontFamily: "'Clash Display', sans-serif", letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.3s ease' }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 10px 20px rgba(235, 215, 63, 0.3)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
          >
            {loading ? 'Decrypting...' : 'View Proposal'}
          </button>
        </form>
      </div>
    );
  }

  // Calculate Subtotals
  const items = quoteData.items || [];
  const currency = quoteData.quoteDetails.currency;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: 'clamp(20px, 5vw, 60px) clamp(15px, 4vw, 20px)', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 'clamp(400px, 80vw, 800px)', height: 'clamp(400px, 80vw, 800px)', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, rgba(5, 5, 5, 0) 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 'clamp(300px, 60vw, 600px)', height: 'clamp(300px, 60vw, 600px)', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, rgba(5, 5, 5, 0) 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <style>{`
        .quote-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
        }
        .quote-header {
          text-align: center;
          padding: clamp(30px, 8vw, 60px) 0;
          border-bottom: 1px solid rgba(235, 215, 63, 0.2);
          margin-bottom: 20px;
        }
        .quote-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .quote-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 950px) {
          .quote-grid {
            grid-template-columns: 1fr 1.3fr;
            align-items: flex-start;
            gap: 50px;
          }
          .quote-header {
            grid-column: 1 / -1;
            padding: 40px 0;
          }
          .quote-left {
            position: sticky;
            top: 40px;
          }
        }
      `}</style>

      <div className="quote-grid">
        
        {/* Cover Header Section */}
        <div className="quote-header">
          <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#ebd73f', margin: '0 0 10px 0', letterSpacing: '-2px', fontWeight: '900', fontFamily: "'Panchang', sans-serif", textShadow: '0 0 20px rgba(235, 215, 63, 0.3)', wordBreak: 'break-word' }}>DRIPP MEDIA</h1>
          <p style={{ fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', color: '#888', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Proposal & Investment Overview</p>
        </div>

        {/* LEFT PANEL */}
        <div className="quote-left">
          {/* Client Details */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: 'clamp(20px, 6vw, 40px)', borderRadius: '24px', backdropFilter: 'blur(10px)', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.9rem)', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Prepared For</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 7vw, 2.5rem)', color: '#fff', margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif", wordBreak: 'break-word' }}>{quoteData.clientDetails.brandName || quoteData.clientDetails.name}</h2>
            {quoteData.clientDetails.brandName && <p style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: '#aaa', margin: '0 0 5px 0' }}>{quoteData.clientDetails.name}</p>}
            <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)', color: '#666', margin: '0 0 20px 0', wordBreak: 'break-all' }}>{quoteData.clientDetails.email}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px', textAlign: 'left', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                 <div style={{ flex: '1 1 auto' }}>
                    <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.8rem)', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Project Type</p>
                    <p style={{ fontSize: 'clamp(0.85rem, 4vw, 1rem)', color: '#fff', margin: 0, fontWeight: '600' }}>
                       {quoteData.packageType === 'project' ? 'One-time Project' : 'Monthly Retainer'}
                    </p>
                 </div>
                 
                 {quoteData.packageType === 'project' && (
                    <>
                       <div style={{ flex: '1 1 auto' }}>
                          <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.8rem)', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Duration</p>
                          <p style={{ fontSize: 'clamp(0.85rem, 4vw, 1rem)', color: '#ddd', margin: 0 }}>{quoteData.quoteDetails.projectDuration || 'N/A'}</p>
                       </div>
                       <div style={{ flex: '1 1 auto' }}>
                          <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.8rem)', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Est. Delivery</p>
                          <p style={{ fontSize: 'clamp(0.85rem, 4vw, 1rem)', color: '#ddd', margin: 0 }}>{quoteData.quoteDetails.expectedDelivery || 'N/A'}</p>
                       </div>
                    </>
                 )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
                 <div style={{ flex: '1 1 auto' }}>
                    <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.8rem)', color: '#666', margin: '0 0 5px 0' }}>Date</p>
                    <p style={{ fontSize: 'clamp(0.85rem, 4vw, 1rem)', color: '#ddd', margin: 0 }}>{quoteData.clientDetails.date}</p>
                 </div>
                 <div style={{ textAlign: 'right', flex: '1 1 auto' }}>
                    <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.8rem)', color: '#666', margin: '0 0 5px 0' }}>Proposal #</p>
                    <p style={{ fontSize: 'clamp(0.85rem, 4vw, 1rem)', color: '#ddd', margin: 0 }}>{quoteData.quoteDetails.number}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Message Section */}
          {quoteData.quoteDetails.message && (
            <div style={{ background: 'rgba(235, 215, 63, 0.03)', padding: 'clamp(20px, 6vw, 40px)', borderRadius: '24px', borderLeft: '4px solid #ebd73f', border: '1px solid rgba(235, 215, 63, 0.1)' }}>
              <p style={{ fontStyle: 'italic', margin: 0, lineHeight: '1.8', color: '#ddd', fontSize: 'clamp(1rem, 4vw, 1.2rem)', textAlign: 'center' }}>"{quoteData.quoteDetails.message}"</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="quote-right">
          {/* Services Section */}
          <div>
            <h3 style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', color: '#ebd73f', margin: '0 0 20px 0', fontFamily: "'Panchang', sans-serif", textAlign: 'left' }}>Proposed Services</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(quoteData.items || []).map((item, i) => {
                const qty = parseFloat(item.qty || 0);
                const rate = parseFloat(item.rate || 0);
                const rowTotal = qty * rate;
                return (
                  <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(235, 215, 63, 0.15)', borderRadius: '12px', padding: 'clamp(15px, 3vw, 20px) clamp(15px, 4vw, 20px)', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ flex: '1 1 200px' }}>
                        <h4 style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: '#fff', margin: '0 0 8px 0', fontFamily: "'Panchang', sans-serif" }}>{item.desc || 'Service Item'}</h4>
                        <p style={{ fontSize: 'clamp(0.75rem, 3vw, 0.85rem)', color: '#888', margin: 0 }}>Qty: {item.qty} &nbsp;|&nbsp; Rate: {currency}{rate.toLocaleString()}</p>
                     </div>
                     <div style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: 'bold', color: '#ebd73f', textShadow: '0 0 10px rgba(235, 215, 63, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#666', fontSize: 'clamp(0.9rem, 3vw, 1rem)', fontWeight: 'normal' }}>=</span> {currency}{rowTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Investment Section */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '20px', padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)', color: '#888', textTransform: 'uppercase', letterSpacing: 'clamp(1px, 1vw, 2px)', margin: '0 0 10px 0', textAlign: 'center' }}>Total {quoteData.packageType === 'monthly' ? 'Monthly ' : ''}Investment</p>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', textShadow: '0 0 20px rgba(235, 215, 63, 0.4)', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: '#ebd73f', fontWeight: '500' }}>{currency}</span>
                    <span style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: '#ebd73f', fontWeight: '800', fontFamily: "'Panchang', sans-serif", letterSpacing: '-1px', wordBreak: 'break-word', textAlign: 'center' }}>{parseFloat(quoteData.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px', width: '100%', maxWidth: '300px' }}>
                    <p style={{ color: '#888', fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', margin: '0 0 5px 0' }}>Thank you for considering Dripp Media.</p>
                    <p style={{ color: '#666', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', margin: 0 }}>This proposal is valid for 30 days.</p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div style={{ gridColumn: '1 / -1', marginTop: '40px', paddingTop: '40px', paddingBottom: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '35px', alignItems: 'center' }}>
            
            <div style={{ background: 'rgba(235, 215, 63, 0.05)', padding: 'clamp(20px, 4vw, 30px) clamp(30px, 6vw, 60px)', borderRadius: '100px', border: '1px solid rgba(235, 215, 63, 0.2)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(20px, 5vw, 40px)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <a href="https://www.drippmedia.com" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.85rem, 3vw, 1rem)', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Globe size={18} color="#ebd73f" /> www.drippmedia.com
                </a>
                <a href="mailto:mediadripp@gmail.com" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.85rem, 3vw, 1rem)', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Mail size={18} color="#ebd73f" /> mediadripp@gmail.com
                </a>
                <a href="https://instagram.com/drippmedia_" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.85rem, 3vw, 1rem)', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Instagram size={18} color="#ebd73f" /> instagram.com/drippmedia_
                </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'linear-gradient(90deg, rgba(235, 215, 63, 0) 0%, rgba(235, 215, 63, 0.2) 50%, rgba(235, 215, 63, 0) 100%)', width: '250px', height: '2px' }}></div>
              <p style={{ margin: 0, color: '#888', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', letterSpacing: '1px', textTransform: 'uppercase' }}>Founded by <span style={{ color: '#ebd73f', fontWeight: 'bold' }}>Gurpreet Singh</span></p>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#444', margin: 0, letterSpacing: '2px' }}>© {new Date().getFullYear()} DRIPP MEDIA. ALL RIGHTS RESERVED.</p>
        </div>

      </div>
    </div>
  );
}
