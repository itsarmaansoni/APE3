import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Invoice from '../components/Invoice';
import Dashboard from '../components/Dashboard';
import NewInvoiceForm from '../src/NewInvoiceForm';
import Auth from '../components/Auth'; // <-- Import the Auth component

function App() {
  // --- NEW: Auth State ---
  const [session, setSession] = useState(null);
  
  // --- Existing App State ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // --- NEW: Check Auth Status on Load ---
  useEffect(() => {
    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Handle Logout ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('dashboard'); // Reset view on logout
  };

  // ... (Keep all your existing fetchSingleInvoice, handleViewInvoice, handleEditInvoice, handleCreateNew, handleBackToDashboard functions exactly as they are) ...

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
          invoiceId: data.id,
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
          items: data.items.map(item => {
            // Calculate rounded amounts per row
            const itemTaxable = Math.round(Number(item.quantity) * Number(item.rate));
            const cgstAmt = Math.round(itemTaxable * (Number(item.cgst_percent) / 100));
            const sgstAmt = Math.round(itemTaxable * (Number(item.sgst_percent) / 100));
            const total = itemTaxable + cgstAmt + sgstAmt;

            return {
              id: item.id,
              description: item.description,
              hsn: item.hsn,
              qty: Number(item.quantity),
              rate: Number(item.rate),
              taxableVal: itemTaxable,
              cgstRate: Number(item.cgst_percent),
              cgstAmt: cgstAmt,
              sgstRate: Number(item.sgst_percent),
              sgstAmt: sgstAmt,
              total: total
            };
          }),
          totals: {
            // Wrapping all historical database values in Math.round()
            taxableValue: Math.round(Number(data.total_taxable_value)),
            cgst: Math.round(Number(data.total_cgst)),
            sgst: Math.round(Number(data.total_sgst)),
            grandTotal: Math.round(Number(data.grand_total))
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

  useEffect(() => {
    if ((currentView === 'invoice' || currentView === 'edit') && selectedInvoiceNo) {
      fetchSingleInvoice(selectedInvoiceNo);
    }
  }, [currentView, selectedInvoiceNo]);

  const handleViewInvoice = (invoiceNo) => {
    setSelectedInvoiceNo(invoiceNo);
    setCurrentView('invoice');
  };

  const handleEditInvoice = (invoiceNo) => {
    setSelectedInvoiceNo(invoiceNo);
    setInvoiceData(null);
    setCurrentView('edit');
  };

  const handleCreateNew = () => {
    setInvoiceData(null);
    setCurrentView('new');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setInvoiceData(null);
    setSelectedInvoiceNo(null);
  };


  // --- NEW: The Gatekeeper Check ---
  // If there is no active session, ONLY render the Auth screen.
  if (!session) {
    return <Auth />;
  }

  // If session exists, render the main application
  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Navigation Bar */}
      <nav className="app-navbar" style={{ background: '#1e293b', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Arman Enterprises - Billing System</h1>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {currentView !== 'dashboard' && (
            <button onClick={handleBackToDashboard} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
              &larr; Back to Dashboard
            </button>
          )}
          
          {/* Sign Out Button */}
          <button 
            onClick={handleLogout} 
            style={{ background: '#dc2626', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      {currentView === 'dashboard' && (
        <Dashboard 
          onViewInvoice={handleViewInvoice} 
          onCreateNew={handleCreateNew} 
          onEditInvoice={handleEditInvoice}
        />
      )}

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