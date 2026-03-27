import React, { useEffect, useState } from 'react';
import { supabase } from '../src/supabaseclient';
import Invoice from '../components/Invoice';
import Dashboard from '../components/Dashboard';
import NewInvoiceForm from '../src/NewInvoiceForm';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'invoice', 'new', 'edit'
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    // Fetch data if we are trying to View OR Edit an invoice
    if ((currentView === 'invoice' || currentView === 'edit') && selectedInvoiceNo) {
      fetchSingleInvoice(selectedInvoiceNo);
    }
  }, [currentView, selectedInvoiceNo]);

  async function fetchSingleInvoice(invoiceNo) {
    setLoadingInvoice(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, customer:customers(*), items:invoice_items(*), vehicle:vehicles(*)`)
        .eq('invoice_no', invoiceNo)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const formattedData = {
          invoiceId: data.id, // NEW: Required for Edit mode to update the database
          company: {
            name: "ARMAN ENTERPRISES",
            address: "68, Purani Basti, Naubasta, Hamirpur Road, Kanpur, PINCODE : 208021\nState: Uttar Pradesh",
            gstin: "09ADNPV1603N1ZZ"
          },
          customer: {
            name: data.customer.name,
            address: data.customer.address,
            idLabel: data.customer.id_label,
            idValue: data.customer.id_value
          },
          meta: {
            invoiceNo: data.invoice_no,
            date: data.date,
            vehicleNo: data.vehicle ? data.vehicle.vehicle_no : '',
            ewbNo: data.ewb_no
          },
          items: data.items.map(item => ({
            id: item.id,
            description: item.description,
            hsn: item.hsn,
            qty: Number(item.quantity),
            rate: Number(item.rate),
            taxableVal: Number(item.quantity) * Number(item.rate),
            cgstRate: Number(item.cgst_percent),
            cgstAmt: (Number(item.quantity) * Number(item.rate)) * (Number(item.cgst_percent) / 100),
            sgstRate: Number(item.sgst_percent),
            sgstAmt: (Number(item.quantity) * Number(item.rate)) * (Number(item.sgst_percent) / 100),
            total: (Number(item.quantity) * Number(item.rate)) * (1 + (Number(item.cgst_percent) + Number(item.sgst_percent)) / 100)
          })),
          totals: {
            taxableValue: Number(data.total_taxable_value),
            cgst: Number(data.total_cgst),
            sgst: Number(data.total_sgst),
            grandTotal: Number(data.grand_total)
          }
        };
        setInvoiceData(formattedData);
      }
    } catch (err) {
      console.error("Error fetching invoice:", err.message);
    } finally {
      setLoadingInvoice(false);
    }
  }

  const handleViewInvoice = (invoiceNo) => {
    setSelectedInvoiceNo(invoiceNo);
    setCurrentView('invoice');
  };

  // --- NEW: Edit Handler ---
  const handleEditInvoice = (invoiceNo) => {
    setSelectedInvoiceNo(invoiceNo);
    setInvoiceData(null); // Clear previous data so the form shows a loading state if needed
    setCurrentView('edit');
  };

  const handleCreateNew = () => {
    setInvoiceData(null); // Ensure form is blank for a new invoice
    setCurrentView('new');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setInvoiceData(null);
    setSelectedInvoiceNo(null);
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <nav className="app-navbar" style={{ background: '#1e293b', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Arman Enterprises - Billing System</h1>
        {currentView !== 'dashboard' && (
          <button onClick={handleBackToDashboard} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            &larr; Back to Dashboard
          </button>
        )}
      </nav>

      {currentView === 'dashboard' && (
        <Dashboard 
          onViewInvoice={handleViewInvoice} 
          onCreateNew={handleCreateNew} 
          onEditInvoice={handleEditInvoice} // Pass the edit function down
        />
      )}

      {/* Render form for BOTH 'new' and 'edit' views */}
      {(currentView === 'new' || currentView === 'edit') && (
        (currentView === 'edit' && loadingInvoice) ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading Invoice Data...</div>
        ) : (
          <NewInvoiceForm 
            initialData={currentView === 'edit' ? invoiceData : null} 
            onCancel={handleBackToDashboard} 
            onSuccess={handleBackToDashboard} 
          />
        )
      )}

      {currentView === 'invoice' && (
        loadingInvoice ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading Invoice...</div>
        ) : (
          invoiceData ? <Invoice data={invoiceData} /> : <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Invoice not found.</div>
        )
      )}
    </div>
  );
}

export default App;