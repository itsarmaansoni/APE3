import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseclient';
import '../components/Dashboard.css';

const NewInvoiceForm = ({ onCancel, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = Boolean(initialData);

  // Autocomplete State
  const [knownCustomers, setKnownCustomers] = useState([]);
  const [knownVehicles, setKnownVehicles] = useState([]);

  // Form State
  const [customer, setCustomer] = useState({ name: '', address: '', idLabel: 'GSTIN', idValue: '' });
  const [meta, setMeta] = useState({ 
    invoiceNo: 'Loading...', 
    date: new Date().toISOString().split('T')[0], 
    vehicleNo: '', 
    ewbNo: '' 
  });
  const [items, setItems] = useState([
    { description: '', hsn: '7308', qty: 1, rate: 0, cgstPercent: 9, sgstPercent: 9 }
  ]);

  // Pre-fill form if editing, and fetch autocomplete data
useEffect(() => {
    if (isEditMode && initialData) {
      setCustomer(initialData.customer);
      setMeta(initialData.meta);
      setItems(initialData.items.map(item => ({
        description: item.description,
        hsn: item.hsn,
        qty: item.qty,
        rate: item.rate,
        cgstPercent: item.cgstRate,
        sgstPercent: item.sgstRate
      })));
    }

    // --- NEW: Function to generate the next Invoice Number ---
    async function fetchNextInvoiceNumber() {
      // 1. Calculate current Financial Year (e.g., "25-26" or "26-27")
      const today = new Date();
      const month = today.getMonth() + 1; // getMonth is 0-indexed
      const year = today.getFullYear();
      
      // If month is Jan, Feb, or Mar (<= 3), FY started last year. Otherwise, it starts this year.
      const startYear = month > 3 ? year : year - 1;
      const fyString = `${startYear.toString().slice(-2)}-${(startYear + 1).toString().slice(-2)}`;
      
      const prefix = `ARM/${fyString}/`;

      try {
        // 2. Fetch the most recent invoice from the database
        const { data, error } = await supabase
          .from('invoices')
          .select('invoice_no')
          .order('id', { ascending: false }) // Get the absolute latest entry
          .limit(1)
          .maybeSingle();

        // 3. Extract, verify, and increment the sequence
        if (data && data.invoice_no) {
          const parts = data.invoice_no.split('/');
          
          // Check if it matches the current FY format (e.g., it hasn't rolled over to April 1st yet)
          if (parts.length === 3 && parts[1] === fyString) {
            const lastNumber = parseInt(parts[2], 10);
            
            if (!isNaN(lastNumber)) {
              // Add 1, and pad it with leading zeros (e.g., 10 -> "011")
              const nextNumber = String(lastNumber + 1).padStart(3, '0');
              return `${prefix}${nextNumber}`;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching auto-increment ID:", err);
      }

      // 4. Fallback: If DB is empty, or a new Financial Year just started, reset to 001
      return `${prefix}001`;
    }

    // Fetch all required data on mount
    async function fetchFormData() {
      // Fetch customers and vehicles
      const { data: customers } = await supabase.from('customers').select('*');
      if (customers) setKnownCustomers(customers);

      const { data: vehicles } = await supabase.from('vehicles').select('*');
      if (vehicles) setKnownVehicles(vehicles);

      // If we are creating a NEW invoice, fetch the auto-incremented number
      if (!isEditMode) {
        const nextInvoiceNo = await fetchNextInvoiceNumber();
        setMeta(prevMeta => ({ ...prevMeta, invoiceNo: nextInvoiceNo }));
      }
    }
    
    fetchFormData();
  }, [initialData, isEditMode]);
  const handleCustomerNameChange = (e) => {
    const typedName = e.target.value;
    const matchedCustomer = knownCustomers.find(c => c.name === typedName);
    if (matchedCustomer) {
      setCustomer({
        name: matchedCustomer.name,
        address: matchedCustomer.address,
        idLabel: matchedCustomer.id_label || 'GSTIN',
        idValue: matchedCustomer.id_value || ''
      });
    } else {
      setCustomer({ ...customer, name: typedName });
    }
  };

  const calculateTotals = () => {
    let taxableValue = 0, cgst = 0, sgst = 0;
    items.forEach(item => {
      const itemTaxable = Number(item.qty) * Number(item.rate);
      taxableValue += itemTaxable;
      cgst += itemTaxable * (Number(item.cgstPercent) / 100);
      sgst += itemTaxable * (Number(item.sgstPercent) / 100);
    });
    return { taxableValue, cgst, sgst, grandTotal: taxableValue + cgst + sgst };
  };

  const totals = calculateTotals();

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', hsn: '7308', qty: 1, rate: 0, cgstPercent: 9, sgstPercent: 9 }]);
  const removeItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // --- 1. RESOLVE CUSTOMER ID ---
      let finalCustomerId;
      const existingCustomer = knownCustomers.find(c => c.name === customer.name && c.id_value === customer.idValue);

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        const { data: custData, error: custErr } = await supabase
          .from('customers')
          .insert([{ name: customer.name, address: customer.address, id_label: customer.idLabel, id_value: customer.idValue }])
          .select().single();
        if (custErr) throw new Error(`Customer Error: ${custErr.message}`);
        finalCustomerId = custData.id;
      }

      // --- 2. RESOLVE VEHICLE ID (NEW) ---
      let finalVehicleId = null;
      if (meta.vehicleNo && meta.vehicleNo.trim() !== '') {
        // Standardize to uppercase for exact matching
        const typedVehicle = meta.vehicleNo.trim().toUpperCase();
        const existingVehicle = knownVehicles.find(v => v.vehicle_no.toUpperCase() === typedVehicle);

        if (existingVehicle) {
          finalVehicleId = existingVehicle.id;
        } else {
          const { data: vehData, error: vehErr } = await supabase
            .from('vehicles')
            .insert([{ vehicle_no: typedVehicle }])
            .select().single();
          if (vehErr) throw new Error(`Vehicle Error: ${vehErr.message}`);
          finalVehicleId = vehData.id;
        }
      }

      // --- 3. SAVE INVOICE ---
      let invoiceIdToUse;

      // Notice 'vehicle_no' has been changed to 'vehicle_id: finalVehicleId'
      const invoicePayload = {
        invoice_no: meta.invoiceNo,
        date: meta.date,
        vehicle_id: finalVehicleId, 
        ewb_no: meta.ewbNo || null,
        customer_id: finalCustomerId,
        total_taxable_value: totals.taxableValue,
        total_cgst: totals.cgst,
        total_sgst: totals.sgst,
        grand_total: totals.grandTotal
      };

      if (isEditMode) {
        invoiceIdToUse = initialData.invoiceId; 
        const { error: invErr } = await supabase.from('invoices').update(invoicePayload).eq('id', invoiceIdToUse);
        if (invErr) throw new Error(`Invoice Update Error: ${invErr.message}`);

        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceIdToUse);
      } else {
        const { data: invData, error: invErr } = await supabase.from('invoices').insert([invoicePayload]).select().single();
        if (invErr) throw new Error(`Invoice Error: ${invErr.message}`);
        invoiceIdToUse = invData.id;
      }

      // --- 4. SAVE ITEMS ---
      const itemsToInsert = items.map(item => ({
        invoice_id: invoiceIdToUse, description: item.description, hsn: item.hsn,
        quantity: item.qty, rate: item.rate, cgst_percent: item.cgstPercent, sgst_percent: item.sgstPercent
      }));

      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemsErr) throw new Error(`Items Error: ${itemsErr.message}`);

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <datalist id="customer-names">{knownCustomers.map(c => <option key={c.id} value={c.name} />)}</datalist>
      <datalist id="vehicle-numbers">{knownVehicles.map(v => <option key={v.id} value={v.vehicle_no} />)}</datalist>

      <div className="dashboard-header">
        <h2>{isEditMode ? `Edit Invoice: ${meta.invoiceNo}` : 'Create New Invoice'}</h2>
        <button className="btn-view" onClick={onCancel}>Cancel</button>
      </div>

      {error && <div style={{ color: 'red', padding: '10px', background: '#fee2e2', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. Customer Details */}
        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>1. Customer Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input required list="customer-names" placeholder="Business Name" className="form-input" value={customer.name} onChange={handleCustomerNameChange} autoComplete="off"/>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="form-input" style={{ width: '100px' }} value={customer.idLabel} onChange={e => setCustomer({...customer, idLabel: e.target.value})}>
                <option value="GSTIN">GSTIN</option>
                <option value="AADHAAR">AADHAAR</option>
              </select>
              <input placeholder="ID Number" className="form-input" style={{ flex: 1 }} value={customer.idValue} onChange={e => setCustomer({...customer, idValue: e.target.value})} />
            </div>
            <textarea required placeholder="Billing Address" className="form-input" style={{ gridColumn: 'span 2', height: '60px' }} value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
          </div>
        </div>

        {/* 2. Invoice Details */}
        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>2. Invoice Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            {/* Disabled Invoice No if editing so they don't break the database uniqueness */}
            <div><label className="form-label">Invoice No.</label><input required className="form-input" disabled={isEditMode} value={meta.invoiceNo} onChange={e => setMeta({...meta, invoiceNo: e.target.value})} /></div>
            <div><label className="form-label">Date</label><input type="date" required className="form-input" value={meta.date} onChange={e => setMeta({...meta, date: e.target.value})} /></div>
            <div><label className="form-label">Vehicle No.</label><input list="vehicle-numbers" className="form-input" value={meta.vehicleNo} onChange={e => setMeta({...meta, vehicleNo: e.target.value})} autoComplete="off"/></div>
            <div><label className="form-label">E-Way Bill</label><input className="form-input" value={meta.ewbNo || ''} onChange={e => setMeta({...meta, ewbNo: e.target.value})} /></div>
          </div>
        </div>

        {/* 3. Line Items */}
        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>3. Line Items</h3>
            <button type="button" className="btn-primary" onClick={addItem} style={{ padding: '4px 8px', fontSize: '12px' }}>+ Add Row</button>
          </div>
          
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
              <input required placeholder="Description" className="form-input" style={{ flex: 2 }} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
              <input readOnly placeholder="HSN" className="form-input" style={{ width: '80px', backgroundColor: '#f1f5f9', color: '#64748b' }} value={item.hsn} />
              <input required type="number" placeholder="Qty" className="form-input" style={{ width: '80px' }} value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} />
              <input required type="number" step="0.01" placeholder="Rate" className="form-input" style={{ width: '100px' }} value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} />
              <button type="button" onClick={() => removeItem(index)} className="btn-delete" style={{ padding: '8px' }}>X</button>
            </div>
          ))}

          <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }}>
            <div>Taxable: ₹{totals.taxableValue.toFixed(2)} | CGST: ₹{totals.cgst.toFixed(2)} | SGST: ₹{totals.sgst.toFixed(2)}</div>
            <div style={{ fontSize: '18px', marginTop: '5px', color: '#0f172a' }}>Grand Total: ₹{totals.grandTotal.toFixed(2)}</div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '15px', fontSize: '16px', marginTop: '10px' }}>
          {loading ? 'Saving to Database...' : (isEditMode ? 'Update Invoice' : 'Save & Generate Invoice')}
        </button>

      </form>
    </div>
  );
};

export default NewInvoiceForm;