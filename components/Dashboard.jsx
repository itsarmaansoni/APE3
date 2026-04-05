import React, { useEffect, useState } from 'react';
import { supabase } from '../src/supabaseClient';
import './Dashboard.css';

const Dashboard = ({ onViewInvoice, onCreateNew , onEditInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_no,
          date,
          grand_total,
          ewb_no,
          customer:customers(name)
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- DELETE FUNCTION ---
async function handleDelete(id, invoiceNo) {
    // 1. Force the user to type the exact invoice number
    const userInput = window.prompt(
      `⚠️ WARNING: You are about to permanently delete this invoice.\n\nTo confirm, please type the exact invoice number: ${invoiceNo}`
    );

    // 2. If they click Cancel, userInput will be null. Just exit safely.
    if (userInput === null) {
      return; 
    }

    // 3. If they typed it wrong, block the deletion.
    if (userInput !== invoiceNo) {
      alert("❌ The invoice number did not match. Deletion cancelled.");
      return;
    }

    // 4. If it matches perfectly, proceed with the hard delete
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Instantly remove it from the React UI
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== id));
      
    } catch (err) {
      console.error("Error deleting invoice:", err.message);
      alert("Failed to delete invoice: " + err.message);
    }
  }

  const getEwbStatus = (ewbNo, grandTotal) => {
    if (ewbNo) return <span className="badge badge-success">{ewbNo}</span>;
    if (grandTotal > 50000) return <span className="badge badge-danger">Pending (&gt;₹50k)</span>;
    return <span className="badge badge-gray">Not Required</span>;
  };

  if (loading) return <div className="dashboard-msg">Loading dashboard...</div>;
  if (error) return <div className="dashboard-msg error">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Invoice Dashboard</h2>
        <button className="btn-primary" onClick={onCreateNew}>
          + Create New Invoice
        </button>
      </div>

      <div className="table-card">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Grand Total</th>
              <th>E-Way Bill Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">No invoices found. Create one to get started!</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-bold">{inv.invoice_no}</td>
                  <td>{inv.date}</td>
                  <td>{inv.customer?.name || 'Unknown'}</td>
                  <td className="font-bold">₹{Number(inv.grand_total).toFixed(2)}</td>
                  <td>{getEwbStatus(inv.ewb_no, Number(inv.grand_total))}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
    className="btn-view" 
    onClick={() => onViewInvoice(inv.invoice_no)}
  >
    View / Print
  </button>
  
  {/* NEW EDIT BUTTON */}
  <button 
    className="btn-edit" 
    onClick={() => onEditInvoice(inv.invoice_no)}
  >
    Edit
  </button>

  <button 
    className="btn-delete" 
    onClick={() => handleDelete(inv.id, inv.invoice_no)}
  >
    Delete
  </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;