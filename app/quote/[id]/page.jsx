'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Lock, FileText, CheckCircle2 } from 'lucide-react';

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
  }, []);

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
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white' }}>
        <form onSubmit={handleUnlock} style={{ background: '#111', padding: '40px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
          <Lock size={48} color="#ebd73f" style={{ marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '10px' }}>Secure Proposal</h2>
          <p style={{ color: '#888', marginBottom: '30px', fontSize: '0.9rem' }}>Please enter the password provided by Dripp Media to view your proposal.</p>
          
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: 'white', marginBottom: '15px', textAlign: 'center', letterSpacing: '2px' }} 
            required
          />
          {error && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '15px' }}>{error}</p>}
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Unlocking...' : 'View Proposal'}
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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 8vw, 60px)' }}>
        
        {/* Cover Section */}
        <div style={{ textAlign: 'center', padding: 'clamp(30px, 8vw, 60px) 0', borderBottom: '1px solid rgba(235, 215, 63, 0.2)' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#ebd73f', margin: '0 0 10px 0', letterSpacing: '-2px', fontWeight: '900', fontFamily: "'Panchang', sans-serif", textShadow: '0 0 20px rgba(235, 215, 63, 0.3)', wordBreak: 'break-word' }}>DRIPP MEDIA</h1>
          <p style={{ fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', color: '#888', margin: '0 0 40px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Proposal & Investment Overview</p>
          
          <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: 'clamp(20px, 6vw, 40px)', borderRadius: '24px', backdropFilter: 'blur(10px)', width: '100%', maxWidth: '600px', boxSizing: 'border-box' }}>
            <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.9rem)', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Prepared For</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 7vw, 2.5rem)', color: '#fff', margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif", wordBreak: 'break-word' }}>{quoteData.clientDetails.brandName || quoteData.clientDetails.name}</h2>
            {quoteData.clientDetails.brandName && <p style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: '#aaa', margin: '0 0 5px 0' }}>{quoteData.clientDetails.name}</p>}
            <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)', color: '#666', margin: '0 0 20px 0', wordBreak: 'break-all' }}>{quoteData.clientDetails.email}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px', textAlign: 'left' }}>
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

        {/* Services Section */}
        <div>
          <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', color: '#ebd73f', margin: '0 0 30px 0', fontFamily: "'Panchang', sans-serif", textAlign: 'center' }}>Proposed Services</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(235, 215, 63, 0.15)', borderRadius: '16px', padding: 'clamp(15px, 4vw, 25px) clamp(15px, 5vw, 30px)', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.3s ease', cursor: 'default' }}>
                 <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ fontSize: 'clamp(1.1rem, 5vw, 1.4rem)', color: '#fff', margin: '0 0 8px 0', fontFamily: "'Panchang', sans-serif" }}>{item.desc || 'Service Item'}</h4>
                    <p style={{ fontSize: 'clamp(0.8rem, 3.5vw, 0.9rem)', color: '#888', margin: 0 }}>Qty: {item.qty} &nbsp;|&nbsp; Rate: {currency}{parseFloat(item.rate).toLocaleString()}</p>
                 </div>
                 <div style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: 'bold', color: '#ebd73f', textShadow: '0 0 10px rgba(235, 215, 63, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#666', fontSize: 'clamp(1rem, 4vw, 1.2rem)', fontWeight: 'normal' }}>=</span> {currency}{(item.qty * item.rate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Section */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '24px', padding: 'clamp(40px, 10vw, 60px) clamp(15px, 5vw, 20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', width: '100%', boxSizing: 'border-box' }}>
              <p style={{ fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', color: '#888', textTransform: 'uppercase', letterSpacing: 'clamp(2px, 1vw, 4px)', margin: '0 0 20px 0', textAlign: 'center' }}>Total {quoteData.packageType === 'monthly' ? 'Monthly ' : ''}Investment</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', textShadow: '0 0 30px rgba(235, 215, 63, 0.4)', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', color: '#ebd73f', fontWeight: '500' }}>{currency}</span>
                  <span style={{ fontSize: 'clamp(2.2rem, 9vw, 4.5rem)', color: '#ebd73f', fontWeight: '800', fontFamily: "'Panchang', sans-serif", letterSpacing: '-2px', wordBreak: 'break-word', textAlign: 'center' }}>{quoteData.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '30px', width: '100%', maxWidth: '400px' }}>
                  <p style={{ color: '#888', fontSize: 'clamp(0.85rem, 3.5vw, 1rem)', margin: '0 0 10px 0' }}>Thank you for considering Dripp Media.</p>
                  <p style={{ color: '#666', fontSize: 'clamp(0.75rem, 3vw, 0.85rem)', margin: 0 }}>This proposal is valid for 30 days.</p>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}
