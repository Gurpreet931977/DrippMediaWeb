const text = `Hey! 👋

As discussed, here's the monthly content package for Bunny's Food Truck.

**Package Includes (Per Month):**
• 4 Reels
• 8 Static Posts/Carousels
• Shooting, Editing & Creative Direction
• Travel costs included

**Total Investment:** ₹20,000/month

**Cost Distribution:**
• Reels (4): ₹2,000 each = ₹8,000
• Static Posts/Carousels (8): ₹800 each = ₹6,400
• Travel & Logistics = ₹5,600

**Total = ₹20,000/month**

This package ensures a consistent flow of high-quality content throughout the month while covering the travel required for shoots and maintaining the overall production quality.

Let me know if this works for you. We'd be happy to get started and plan the content calendar.`;

function parseInvoice(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let brandName = "";
    // Look for "for [Brand Name]"
    const forMatch = text.match(/for\s+([A-Z][a-zA-Z0-9'\s]+?(?=\.|\n))/);
    if (forMatch) {
        brandName = forMatch[1].trim();
    }
    
    let items = [];
    
    // Improved Regex for item lines:
    // Looks for: [Description] [(Qty)] : [Rate] each = [Total] OR [Description] = [Total]
    lines.forEach(line => {
        // Skip lines with "Total Investment" or "Total =" if it's an aggregate
        if (line.match(/\bTotal\b/i) && !line.match(/each/i) && line.match(/=/)) return;
        if (line.match(/Total Investment/i)) return;
        
        // Match: • Reels (4): ₹2,000 each = ₹8,000
        // Match: Reels (4): 2000 each
        // Match: Travel & Logistics = ₹5,600
        
        let qty = 1;
        let rate = 0;
        let desc = "";
        
        // Format 1: Item (qty): rate each = total
        let m1 = line.match(/^[-*•]?\s*(.*?)\s*\((\d+)\)\s*[:-]?\s*[$€£₹]?\s*([\d,.]+)\s*each/i);
        if (m1) {
            desc = m1[1].trim();
            qty = parseInt(m1[2]);
            rate = parseFloat(m1[3].replace(/,/g, ''));
            items.push({desc, qty, rate});
            return;
        }
        
        // Format 2: Item = total
        let m2 = line.match(/^[-*•]?\s*(.*?)\s*=\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m2) {
             if (m2[1].toLowerCase().includes('total')) return; // skip totals
             desc = m2[1].trim();
             rate = parseFloat(m2[2].replace(/,/g, ''));
             items.push({desc, qty: 1, rate});
             return;
        }
        
        // Format 3: Item - rate
        let m3 = line.match(/^[-*•]?\s*(.*?)\s*-\s*[$€£₹]?\s*([\d,.]+)/i);
        if (m3) {
             desc = m3[1].trim();
             rate = parseFloat(m3[2].replace(/,/g, ''));
             items.push({desc, qty: 1, rate});
             return;
        }
    });
    
    // Extract long message at the end
    let message = "";
    const pLines = text.split('\n\n');
    if (pLines.length > 0) {
        // Find a paragraph that has > 100 characters and no numbers/prices, likely a description
        const lastPara = pLines.slice(-2).find(p => p.length > 50 && !p.match(/₹|\$|£|€/));
        if (lastPara) {
            message = lastPara.replace(/\n/g, ' ').trim();
        }
    }
    
    let type = text.toLowerCase().includes('month') ? 'monthly' : 'project';
    
    console.log("Brand:", brandName);
    console.log("Items:", items);
    console.log("Message:", message);
    console.log("Type:", type);
}

parseInvoice(text);
