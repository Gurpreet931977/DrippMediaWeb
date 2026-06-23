import React from 'react';

// The template is designed to look like a standard A4 page (width: 794px, height: 1123px roughly)
const PDFTemplate = React.forwardRef(({ type, data, items, total }, ref) => {
  const isQuote = type === 'QUOTE';
  
  return (
    <div ref={ref} style={{
      width: '794px',
      minHeight: '1123px',
      padding: '60px',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Helvetica, Arial, sans-serif',
      position: 'absolute',
      left: '-9999px', // Hide off-screen
      top: 0
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '-1px' }}>DRIPP MEDIA</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>hello@drippmedia.com</p>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>www.drippmedia.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '32px', color: '#ebd73f', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
            {isQuote ? 'Quotation' : 'Invoice'}
          </h2>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{isQuote ? 'Quote' : 'Invoice'} #: {data.number || '0001'}</p>
          <p style={{ margin: 0 }}>Date: {data.date || new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '16px', color: '#666', textTransform: 'uppercase', marginBottom: '10px' }}>{isQuote ? 'Prepared For:' : 'Bill To:'}</h3>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '18px' }}>{data.clientName || 'Client Name'}</p>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{data.clientAddress || 'Client Address'}</p>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', width: '80px' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', width: '120px' }}>Rate</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', width: '120px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{item.desc}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.qty}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${parseFloat(item.rate || 0).toFixed(2)}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${(parseFloat(item.qty || 0) * parseFloat(item.rate || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontWeight: 'bold' }}>Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {/* Add tax here if needed in the future */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #000', marginTop: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Total:</span>
            <span style={{ fontWeight: 'bold', fontSize: '20px' }}>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Notes</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>{data.notes || 'Thank you for your business!'}</p>
      </div>
    </div>
  );
});

PDFTemplate.displayName = 'PDFTemplate';

export default PDFTemplate;
