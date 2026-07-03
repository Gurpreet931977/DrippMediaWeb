'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Calculator } from 'lucide-react';
import styles from '../admin.module.css';

export default function CurrencyConverter() {
  const [rates, setRates] = useState(null);
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Tab Mode
  const [mode, setMode] = useState('converter'); // 'converter' | 'calculator'
  const [calcDisplay, setCalcDisplay] = useState('');

  // Popular currencies at the top, others below
  const popularCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];
  const [allCurrencies, setAllCurrencies] = useState(popularCurrencies);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates) {
        setRates(data.rates);
        // Extract all currency codes and sort them
        const codes = Object.keys(data.rates).sort();
        // Move popular ones to top
        const sortedCodes = [
            ...popularCurrencies.filter(c => codes.includes(c)),
            ...codes.filter(c => !popularCurrencies.includes(c))
        ];
        setAllCurrencies(sortedCodes);
        
        // Format the last update time
        const date = new Date(data.time_last_update_unix * 1000);
        setLastUpdated(date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      }
    } catch (err) {
      console.error("Failed to fetch exchange rates", err);
    }
    setLoading(false);
  };

  const calculateResult = () => {
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) return '0.00';
    // Convert to USD first, then to target currency
    const inUSD = amount / rates[fromCurrency];
    const result = inUSD * rates[toCurrency];
    return result.toFixed(2);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleCalcInput = (val) => {
    if (val === 'C') setCalcDisplay('');
    else if (val === '=') {
        try {
            // Safe simple evaluation
            const result = new Function('return ' + calcDisplay)();
            if (Number.isFinite(result)) {
                // Round to max 4 decimal places to avoid floating point issues
                setCalcDisplay(Math.round(result * 10000) / 10000 + '');
            } else {
                setCalcDisplay('Error');
            }
        } catch(e) {
            setCalcDisplay('Error');
        }
    }
    else {
        if (calcDisplay === 'Error') setCalcDisplay(val);
        else setCalcDisplay(prev => prev + val);
    }
  };

  return (
    <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow effect */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: 'rgba(235, 215, 63, 0.1)', filter: 'blur(40px)', borderRadius: '50%', zIndex: 0 }} />
      
      <h3 style={{ marginBottom: '15px', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
        <Calculator size={18} /> Tools
      </h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
         <button onClick={() => setMode('converter')} style={{ flex: 1, padding: '8px', background: mode === 'converter' ? '#ebd73f' : 'transparent', color: mode === 'converter' ? '#000' : '#888', border: '1px solid #ebd73f', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Currency</button>
         <button onClick={() => setMode('calculator')} style={{ flex: 1, padding: '8px', background: mode === 'calculator' ? '#ebd73f' : 'transparent', color: mode === 'calculator' ? '#000' : '#888', border: '1px solid #ebd73f', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Calculator</button>
      </div>

      {mode === 'converter' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', zIndex: 1 }}>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Amount</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(Number(e.target.value))} 
                  className={styles.inputField} 
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>From</label>
                <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className={styles.inputField} style={{ width: '100%' }}>
                  {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-5px 0' }}>
                <button onClick={handleSwap} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ebd73f', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                   <RefreshCw size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>To</label>
                <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className={styles.inputField} style={{ width: '100%' }}>
                  {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                 <label className={styles.label}>Result</label>
                 <div style={{ padding: '10px', background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '8px', color: '#ebd73f', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {loading ? '...' : calculateResult()}
                 </div>
              </div>
            </div>
            
            {lastUpdated && (
               <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center', marginTop: '5px' }}>
                  Live rates updated: {lastUpdated}
               </div>
            )}

          </div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1 }}>
             <div style={{ padding: '15px', background: '#0a0a0a', borderRadius: '8px', fontSize: '24px', textAlign: 'right', minHeight: '60px', wordBreak: 'break-all', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'monospace' }}>
                {calcDisplay || '0'}
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                 {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','.','+','='].map(btn => (
                     <button 
                        key={btn} 
                        onClick={() => handleCalcInput(btn)}
                        style={{ 
                           padding: '12px', 
                           background: btn === '=' ? '#ebd73f' : btn === 'C' ? '#ef4444' : ['/','*','-','+'].includes(btn) ? 'rgba(235, 215, 63, 0.15)' : 'rgba(255,255,255,0.05)', 
                           color: btn === '=' || btn === 'C' ? '#000' : ['/','*','-','+'].includes(btn) ? '#ebd73f' : '#fff',
                           border: 'none', 
                           borderRadius: '6px', 
                           fontSize: '18px', 
                           fontWeight: 'bold', 
                           cursor: 'pointer',
                           gridColumn: btn === '=' ? 'span 4' : 'span 1',
                           transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
                     >
                        {btn}
                     </button>
                 ))}
             </div>
          </div>
      )}
    </div>
  );
}
