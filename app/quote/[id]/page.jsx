'use client';

import { useState } from 'react';
import { Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function SharedQuote({ params }) {
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [quoteData, setQuoteData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/quote/${params.id}`, {
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#111', borderRadius: '16px', overflow: 'hidden', border: '1px solid #222', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '40px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 5px 0', letterSpacing: '-1px' }}>DRIPP MEDIA</h1>
            <p style={{ color: '#ebd73f', margin: 0, fontWeight: '500' }}>Proposal & Investment Overview</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 5px 0' }}>{quoteData.quoteDetails.number}</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>{quoteData.clientDetails.date}</p>
          </div>
        </div>

        {/* Client Meta */}
        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#161616' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Prepared For</p>
            <p style={{ fontSize: '1.1rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>{quoteData.clientDetails.name}</p>
            <p style={{ margin: '0 0 5px 0', color: '#ccc' }}>{quoteData.clientDetails.brandName}</p>
            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '0.9rem' }}>{quoteData.clientDetails.email}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Project Specifications</p>
            {quoteData.packageType === 'project' ? (
              <>
                <p style={{ margin: '0 0 5px 0', color: '#ccc' }}>Duration: <span style={{color: 'white'}}>{quoteData.quoteDetails.projectDuration}</span></p>
                <p style={{ margin: 0, color: '#ccc' }}>Est. Delivery: <span style={{color: 'white'}}>{quoteData.quoteDetails.expectedDelivery}</span></p>
              </>
            ) : (
              <p style={{ margin: 0, color: '#ccc' }}>Type: <span style={{color: 'white'}}>Monthly Retainer</span></p>
            )}
          </div>
        </div>

        {/* Message */}
        <div style={{ padding: '40px' }}>
          <div style={{ background: 'rgba(235, 215, 63, 0.05)', padding: '30px', borderRadius: '12px', borderLeft: '4px solid #ebd73f' }}>
            <p style={{ fontStyle: 'italic', margin: 0, lineHeight: '1.7', color: '#ddd', fontSize: '1.05rem' }}>"{quoteData.quoteDetails.message}"</p>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ padding: '0 40px 40px 40px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <FileText size={20} color="#ebd73f" /> Proposed Services
          </h3>
          
          <div style={{ background: '#0a0a0a', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111', borderBottom: '1px solid #222' }}>
                  <th style={{ textAlign: 'left', padding: '15px 20px', color: '#888', fontWeight: '500', fontSize: '0.9rem' }}>Service Description</th>
                  <th style={{ textAlign: 'center', padding: '15px 20px', color: '#888', fontWeight: '500', fontSize: '0.9rem' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '15px 20px', color: '#888', fontWeight: '500', fontSize: '0.9rem' }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '15px 20px', color: '#888', fontWeight: '500', fontSize: '0.9rem' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: i !== items.length - 1 ? '1px solid #222' : 'none' }}>
                    <td style={{ padding: '20px', color: '#ddd' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <CheckCircle2 size={16} color="#ebd73f" /> {item.desc || 'Service Item'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '20px', color: '#888' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', padding: '20px', color: '#888' }}>{currency}{parseFloat(item.rate).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '20px', color: 'white', fontWeight: '500' }}>{currency}{(item.qty * item.rate).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div style={{ padding: '40px', background: '#161616', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 5px 0' }}>Thank you for considering Dripp Media.</p>
            <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>This quote is valid for 30 days.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#888', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Total Investment</p>
            <h2 style={{ fontSize: '2.5rem', color: '#ebd73f', margin: 0 }}>{currency}{quoteData.total.toFixed(2)}</h2>
            {quoteData.packageType === 'monthly' && <p style={{ color: '#888', fontSize: '0.85rem', margin: '5px 0 0 0' }}>*Billed monthly</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
