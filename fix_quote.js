const fs = require('fs');

let content = fs.readFileSync('app/admin-panel/quote/page.jsx', 'utf8');

// The file got severely corrupted around checkScalarConflict('gst') and setClientDetails.
// Let's find checkScalarConflict('address', ...) and replace everything down to setQuoteDetails({

const addressCheck = "    checkScalarConflict('address', parsedClient.address, clientDetails.address, 'Address');";

const startIndex = content.indexOf(addressCheck);
if (startIndex === -1) {
    console.error("Could not find start index");
    process.exit(1);
}

const afterClearForm = "    setClientDetails({";
const endIndex = content.indexOf(afterClearForm, startIndex);
if (endIndex === -1) {
    console.error("Could not find end index");
    process.exit(1);
}

const replacement = `    checkScalarConflict('address', parsedClient.address, clientDetails.address, 'Address');
    checkScalarConflict('gst', parsedClient.gst, clientDetails.gst, 'GST Number');

    // Helper for Items
    const pendingItems = [];
    
    // First, consolidate parsed items themselves
    const consolidatedParsedItems = [];
    parsedItems.forEach(pi => {
        const sim = consolidatedParsedItems.find(c => c.desc.toLowerCase().replace(/s$/, '') === pi.desc.toLowerCase().replace(/s$/, ''));
        if (sim && sim.rate === pi.rate) {
            sim.qty += pi.qty;
        } else {
            consolidatedParsedItems.push(pi);
        }
    });

    consolidatedParsedItems.forEach(pi => {
        const sim = packageTiers[0]?.items?.find(ex => ex.desc && ex.desc.toLowerCase().replace(/s$/, '') === pi.desc.toLowerCase().replace(/s$/, ''));
        if (sim) {
            if (sim.rate === pi.rate) {
                detectedConflicts.push({
                    type: 'item_match_rate',
                    item: pi,
                    existingItem: sim,
                    label: \`Duplicate Item Found: \${pi.desc}\`
                });
            } else {
                detectedConflicts.push({
                    type: 'item_diff_rate',
                    item: pi,
                    existingItem: sim,
                    label: \`Item with different rate found: \${pi.desc}\`
                });
            }
        } else {
            pendingItems.push(pi);
        }
    });

    setPendingAutoFillData({
        parsedClient,
        parsedQuote,
        pendingItems,
        stagedClient: parsedClient.staged || {}
    });

    setIsAutoFilling(false);

    if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setCurrentConflictIdx(0);
        setShowConflictModal(true);
    } else {
        applySmartPaste({
            parsedClient,
            parsedQuote,
            pendingItems,
            stagedClient: parsedClient.staged || {}
        });
    }
  };

  const applySmartPaste = (data) => {
      let updatedClient = { ...clientDetails, ...data.stagedClient };
      let updatedQuote = { ...quoteDetails };
      
      if (data.parsedQuote.message) updatedQuote.message = data.parsedQuote.message;
      if (data.parsedQuote.currency) updatedQuote.currency = data.parsedQuote.currency;
      if (data.parsedQuote.packageType) setPackageType(data.parsedQuote.packageType);
      
      setClientDetails(updatedClient);
      setQuoteDetails(updatedQuote);
      
      if (data.pendingItems.length > 0) {
          // Add non-empty items to Tier 1
          const validCurrent = packageTiers[0]?.items?.filter(i => i.desc || i.rate > 0) || [];
          const newTiers = [...packageTiers];
          if(newTiers.length === 0) newTiers.push({ id: Date.now(), name: 'Standard Package', items: [] });
          newTiers[0].items = [...validCurrent, ...data.pendingItems];
          setPackageTiers(newTiers);
      }
      
      setSmartText('');
      setIsAutoFillSuccess(true);
      setTimeout(() => {
          setIsAutoFillSuccess(false);
          setIsAutoFillDone(true);
          setTimeout(() => setIsAutoFillDone(false), 2000);
      }, 600);
  };

  const handleConflictResolution = (action, valueOverride = null) => {
      const conflict = conflicts[currentConflictIdx];
      const data = { ...pendingAutoFillData };
      
      if (conflict.type.startsWith('scalar')) {
          if (action === 'overwrite') {
              data.stagedClient[conflict.field] = valueOverride || conflict.value || conflict.values[0];
          } else if (action === 'append') {
              const current = data.stagedClient[conflict.field] || conflict.currentValue;
              const toAppend = valueOverride || conflict.value || conflict.values.join(' / ');
              data.stagedClient[conflict.field] = current ? \`\${current} / \${toAppend}\` : toAppend;
          }
      } else if (conflict.type.startsWith('item')) {
          if (action === 'merge') {
              const newTiers = [...packageTiers];
              const itemsCopy = [...(newTiers[0]?.items || [])];
              const idx = itemsCopy.findIndex(i => i === conflict.existingItem);
              if (idx !== -1) {
                  itemsCopy[idx].qty += conflict.item.qty;
                  if (valueOverride === 'new' && conflict.type === 'item_diff_rate') {
                       itemsCopy[idx].rate = conflict.item.rate;
                  }
                  newTiers[0].items = itemsCopy;
                  setPackageTiers(newTiers);
              }
          } else if (action === 'add_new') {
              data.pendingItems.push(conflict.item);
          }
      }
      
      setPendingAutoFillData(data);
      
      if (currentConflictIdx < conflicts.length - 1) {
          setCurrentConflictIdx(currentConflictIdx + 1);
      } else {
          setShowConflictModal(false);
          applySmartPaste(data);
      }
  };

  const handleClearFormClick = () => {
    setShowClearModal(true);
  };

  const confirmClearForm = () => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(Date.now() - tzOffsetMs).toISOString().split('T')[0];
    `;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex + "    ".length);

fs.writeFileSync('app/admin-panel/quote/page.jsx', content);
console.log("Successfully patched");
