'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../admin.module.css';
import PDFTemplate from '../components/PDFTemplate';

const DEFAULT_PACKAGES = [
  {
    name: 'Starter Web Package',
    items: [
      { desc: 'Custom Landing Page Design', qty: 1, rate: 800 },
      { desc: 'Basic SEO Setup', qty: 1, rate: 200 }
    ]
  },
  {
    name: 'Pro Social Media Retainer',
    items: [
      { desc: 'Monthly Social Media Strategy', qty: 1, rate: 500 },
      { desc: 'Short-form Video Edits (Reels/TikTok)', qty: 4, rate: 150 }
    ]
  }
];

export default function QuoteMaker() {
  const [isClient, setIsClient] = useState(false);
  const pdfRef = useRef(null);
  
  const [data, setData] = useState({
    number: 'QT-001',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientAddress: '',
    notes: 'This quote is valid for 30 days. Looking forward to working with you!'
  });

  const [items, setItems] = useState([
    { desc: 'Project Discovery & Strategy', qty: 1, rate: 0 }
  ]);

  const [savedPackages, setSavedPackages] = useState(DEFAULT_PACKAGES);

  useEffect(() => {
    setIsClient(true);
    // Load custom packages from local storage if exists
    const localPackages = localStorage.getItem('dripp_packages');
    if (localPackages) {
      try {
        setSavedPackages(JSON.parse(localPackages));
      } catch (e) { console.error('Failed to parse packages'); }
    }
  }, []);

  const handleDataChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { desc: '', qty: 1, rate: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const loadPackage = (pkg) => {
    // If the only item is empty, replace it. Otherwise append.
    if (items.length === 1 && items[0].desc === '' && items[0].rate === 0) {
      setItems([...pkg.items]);
    } else {
      setItems([...items, ...pkg.items]);
    }
  };

  const saveCurrentAsPackage = () => {
    const name = prompt("Enter a name for this package bundle:");
    if (name && name.trim()) {
      const newPackage = { name: name.trim(), items: [...items] };
      const updatedPackages = [...savedPackages, newPackage];
      setSavedPackages(updatedPackages);
      localStorage.setItem('dripp_packages', JSON.stringify(updatedPackages));
      alert(`Package "${name}" saved!`);
    }
  };

  const total = items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);

  const generatePDF = async () => {
    if (!pdfRef.current) return;
    
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DrippMedia_Quote_${data.number}.pdf`);

    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Check console.');
    }
  };

  if (!isClient) return null;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Quote / Package Maker</h1>
        <p className={styles.subtitle}>Build custom proposals or load predefined packages.</p>
      </div>

      <div className={styles.row}>
        {/* Left Column: Form */}
        <div className={styles.col} style={{ flex: 2 }}>
          <div className={styles.card}>
            <h3 style={{ marginBottom: '1.5rem', color: '#ebd73f' }}>Quote Details</h3>
            
            <div className={styles.row}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Quote Number</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={data.number}
                  onChange={(e) => handleDataChange('number', e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Date</label>
                <input 
                  type="date" 
                  className={styles.input} 
                  value={data.date}
                  onChange={(e) => handleDataChange('date', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Prepared For (Client Name)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={data.clientName}
                placeholder="e.g. Acme Corp"
                onChange={(e) => handleDataChange('clientName', e.target.value)}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Client Details</label>
              <textarea 
                className={styles.input} 
                rows={2}
                value={data.clientAddress}
                placeholder="Project Scope / Address / Email"
                onChange={(e) => handleDataChange('clientAddress', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ebd73f', margin: 0 }}>Proposed Services</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={styles.btn} onClick={saveCurrentAsPackage} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                   Save as Package
                </button>
                <button className={styles.btnPrimary} onClick={addItem} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  <Plus size={16} /> Add Item
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: '50%' }}>Description</th>
                  <th className={styles.th} style={{ width: '15%' }}>Qty</th>
                  <th className={styles.th} style={{ width: '20%' }}>Rate ($)</th>
                  <th className={styles.th} style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                  <th className={styles.th} style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className={styles.td}>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={item.desc}
                        onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                        placeholder="Service Description"
                      />
                    </td>
                    <td className={styles.td}>
                      <input 
                        type="number" 
                        className={styles.input} 
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        min="1"
                      />
                    </td>
                    <td className={styles.td}>
                      <input 
                        type="number" 
                        className={styles.input} 
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                      ${(parseFloat(item.qty || 0) * parseFloat(item.rate || 0)).toFixed(2)}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center' }}>
                      <button 
                        className={styles.btnDanger} 
                        style={{ padding: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => removeItem(index)}
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total Quote</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Packages */}
        <div className={styles.col} style={{ flex: 1 }}>
          <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Actions</h3>
            <button 
              className={styles.btnPrimary} 
              style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              onClick={generatePDF}
            >
              <Download size={20} /> Export Quote PDF
            </button>
          </div>

          <div className={styles.card}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} color="#ebd73f" /> Predefined Packages
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1rem' }}>
              Click to load a package into your quote.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {savedPackages.map((pkg, idx) => (
                <button 
                  key={idx}
                  className={styles.btn}
                  style={{ justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  onClick={() => loadPackage(pkg)}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#fff' }}>{pkg.name}</span>
                  <Plus size={16} color="#ebd73f" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden PDF Template Container */}
      <div style={{ overflow: 'hidden', height: 0, width: 0 }}>
        <PDFTemplate ref={pdfRef} type="QUOTE" data={data} items={items} total={total} />
      </div>
    </div>
  );
}
