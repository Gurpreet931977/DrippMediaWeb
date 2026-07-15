'use client';

import { useState, useEffect } from 'react';
import { Package, Copy, CheckCircle2, RefreshCw, Share2, Layers, DollarSign, Calendar, Edit3, Trash2, Plus } from 'lucide-react';
import styles from '../admin.module.css';

export default function PackageMaker() {
  const [isClient, setIsClient] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [brandName, setBrandName] = useState('');
  const [packageType, setPackageType] = useState('monthly');
  const [totalBudget, setTotalBudget] = useState('0');
  const [services, setServices] = useState([
    { name: 'Custom Strategy', qty: 1, rate: 0 }
  ]);

  useEffect(() => {
    setIsClient(true);
    // Check if there is pending package data from Orlo
    const pendingDataStr = sessionStorage.getItem('pendingPackageData');
    if (pendingDataStr) {
      try {
        const data = JSON.parse(pendingDataStr);
        if (data.brandName) setBrandName(data.brandName);
        if (data.packageType) setPackageType(data.packageType.toLowerCase());
        if (data.totalBudget) setTotalBudget(data.totalBudget.toString());
        if (data.services && data.services.length > 0) {
          setServices(data.services);
        }
        // Clear it so it doesn't auto-fill again on refresh
        sessionStorage.removeItem('pendingPackageData');
      } catch (err) {
        console.error('Failed to parse package data', err);
      }
    }
  }, []);

  const handleServiceChange = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { name: '', qty: 1, rate: 0 }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const generateShareLink = () => {
    // Placeholder logic for sharing
    navigator.clipboard.writeText(`https://drippmedia.com/pmp/${Math.random().toString(36).substr(2, 9)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isClient) return <div style={{ padding: '50px', color: 'white' }}>Loading PMP Maker...</div>;

  return (
    <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pmp-card {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          margin-bottom: 24px;
        }
        .pmp-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: white;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }
        .pmp-input:focus {
          border-color: rgba(235, 215, 63, 0.5);
          box-shadow: 0 0 0 4px rgba(235, 215, 63, 0.1);
        }
        .pmp-label {
          display: block;
          font-size: 0.75rem;
          color: #888;
          margin-bottom: 8px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 500;
        }
        .header-title {
          font-family: 'Panchang', sans-serif;
          font-size: 2rem;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .accent-text {
          color: #ebd73f;
          -webkit-text-fill-color: #ebd73f;
        }
        .btn-primary {
          padding: 14px 24px;
          background: linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%);
          color: #000;
          border: none;
          border-radius: 12px;
          font-family: 'Clash Display', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(235, 215, 63, 0.3);
        }
        .btn-secondary {
          padding: 14px 24px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-family: 'Clash Display', sans-serif;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .service-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 16px;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 12px;
        }
        .summary-card {
          background: linear-gradient(135deg, rgba(235, 215, 63, 0.1) 0%, rgba(20, 20, 20, 0.8) 100%);
          border: 1px solid rgba(235, 215, 63, 0.2);
          border-radius: 24px;
          padding: 32px;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="header-title">PREMIUM <span className="accent-text">MARKETING</span> PACKAGE</h1>
          <p style={{ color: '#888', marginTop: '8px' }}>Design a personalized PMP for your clients</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={18} /> Reset
          </button>
          <button className="btn-primary" onClick={generateShareLink}>
            {copiedLink ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
            {copiedLink ? 'LINK COPIED' : 'SHARE PACKAGE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Editor Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="pmp-card">
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="#ebd73f" /> Client Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="pmp-label">Brand / Client Name</label>
                <input 
                  type="text" 
                  className="pmp-input" 
                  value={brandName} 
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Habivana Stays"
                />
              </div>
              <div>
                <label className="pmp-label">Package Modality</label>
                <select 
                  className="pmp-input" 
                  value={packageType} 
                  onChange={(e) => setPackageType(e.target.value)}
                >
                  <option value="monthly">Monthly Retainer</option>
                  <option value="project">One-time Project</option>
                  <option value="hourly">Hourly Billing</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pmp-card">
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#ebd73f" /> Scope of Services
            </h3>
            
            {services.map((service, index) => (
              <div key={index} className="service-row">
                <div>
                  <input 
                    type="text" 
                    className="pmp-input" 
                    placeholder="Service Name (e.g. 5 Reels/month)" 
                    value={service.name} 
                    onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    className="pmp-input" 
                    placeholder="Qty" 
                    value={service.qty} 
                    onChange={(e) => handleServiceChange(index, 'qty', e.target.value)}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>₹</span>
                  <input 
                    type="number" 
                    className="pmp-input" 
                    style={{ paddingLeft: '28px' }}
                    placeholder="Rate" 
                    value={service.rate} 
                    onChange={(e) => handleServiceChange(index, 'rate', e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => removeService(index)}
                  style={{ background: 'rgba(255, 77, 77, 0.1)', border: 'none', width: '42px', height: '42px', borderRadius: '10px', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px', borderStyle: 'dashed' }}
              onClick={addService}
            >
              <Plus size={18} /> Add Service
            </button>
          </div>

        </div>

        {/* Summary Column */}
        <div>
          <div className="summary-card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: '#ebd73f', fontFamily: "'Clash Display', sans-serif" }}>Package Summary</h3>
            
            <div style={{ marginBottom: '30px' }}>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '8px' }}>Target Client</p>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{brandName || 'Unnamed Client'}</div>
            </div>

            <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} /> Total Budget Quoted
              </p>
              <input 
                type="text" 
                className="pmp-input" 
                style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: 0, padding: '8px 0', color: '#ebd73f' }}
                value={totalBudget} 
                onChange={(e) => setTotalBudget(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>Included Services</p>
              {services.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                  <span style={{ color: '#ddd' }}>{s.qty}x {s.name || 'Unnamed Service'}</span>
                  <span style={{ color: '#888' }}>{s.rate > 0 ? `₹${s.rate}` : ''}</span>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center' }}>
                This is a {packageType === 'monthly' ? 'recurring monthly' : packageType === 'hourly' ? 'hourly billed' : 'one-time'} package.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
