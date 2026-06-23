'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../admin.module.css';
import PDFTemplate from '../components/PDFTemplate';

export default function InvoiceMaker() {
  const [isClient, setIsClient] = useState(false);
  const pdfRef = useRef(null);
  
  const [data, setData] = useState({
    number: 'INV-001',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientAddress: '',
    notes: 'Payment is due within 15 days. Thank you for your business!'
  });

  const [items, setItems] = useState([
    { desc: 'Video Production - 1 Minute Edit', qty: 1, rate: 500 }
  ]);

  useEffect(() => {
    setIsClient(true);
    // Load from local storage if exists
    const savedInvoices = localStorage.getItem('dripp_invoices');
    if (savedInvoices) {
      try {
        const parsed = JSON.parse(savedInvoices);
        // We could load the last invoice number here to auto-increment
        if (parsed.length > 0) {
          const lastInv = parsed[parsed.length - 1];
          // Simple auto increment logic (assuming format like INV-001)
          const match = lastInv.number.match(/INV-(\d+)/);
          if (match) {
            const nextNum = parseInt(match[1]) + 1;
            setData(prev => ({ ...prev, number: `INV-${nextNum.toString().padStart(3, '0')}` }));
          }
        }
      } catch (e) { console.error('Failed to parse invoices'); }
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
      pdf.save(`DrippMedia_Invoice_${data.number}.pdf`);

      // Save to local storage history
      const savedInvoices = JSON.parse(localStorage.getItem('dripp_invoices') || '[]');
      savedInvoices.push({ ...data, items, total, id: Date.now() });
      localStorage.setItem('dripp_invoices', JSON.stringify(savedInvoices));

    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Check console.');
    }
  };

  if (!isClient) return null; // Avoid hydration mismatch on initial render

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoice Maker</h1>
        <p className={styles.subtitle}>Create and export professional invoices.</p>
      </div>

      <div className={styles.row}>
        {/* Left Column: Form */}
        <div className={styles.col} style={{ flex: 2 }}>
          <div className={styles.card}>
            <h3 style={{ marginBottom: '1.5rem', color: '#ebd73f' }}>Invoice Details</h3>
            
            <div className={styles.row}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Invoice Number</label>
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
              <label className={styles.label}>Client Name</label>
              <input 
                type="text" 
                className={styles.input} 
                value={data.clientName}
                placeholder="e.g. Acme Corp"
                onChange={(e) => handleDataChange('clientName', e.target.value)}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Client Address / Email</label>
              <textarea 
                className={styles.input} 
                rows={3}
                value={data.clientAddress}
                placeholder="123 Business St&#10;contact@acmecorp.com"
                onChange={(e) => handleDataChange('clientAddress', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ebd73f', margin: 0 }}>Line Items</h3>
              <button className={styles.btn} onClick={addItem} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> Add Item
              </button>
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
                <span>Total Due</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.card}>
             <div className={styles.formGroup}>
              <label className={styles.label}>Footer Notes</label>
              <textarea 
                className={styles.input} 
                rows={2}
                value={data.notes}
                onChange={(e) => handleDataChange('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className={styles.col} style={{ flex: 1 }}>
          <div className={styles.card} style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Actions</h3>
            <button 
              className={styles.btnPrimary} 
              style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem', padding: '1rem' }}
              onClick={generatePDF}
            >
              <Download size={20} /> Download PDF
            </button>
            <p style={{ fontSize: '0.875rem', color: '#888', textAlign: 'center' }}>
              Downloading will automatically save this invoice to your local history.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden PDF Template Container */}
      <div style={{ overflow: 'hidden', height: 0, width: 0 }}>
        <PDFTemplate ref={pdfRef} type="INVOICE" data={data} items={items} total={total} />
      </div>
    </div>
  );
}
