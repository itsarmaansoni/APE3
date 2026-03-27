import React from 'react';
import './Invoice.css';

const Invoice = ({ data }) => {
  const invoiceData = data || {
    company: {
      name: "ARMAN ENTERPRISES",
      address: "68, Purani Basti, Naubasta, Hamirpur Road, Kanpur, PINCODE : 208021\nState: Uttar Pradesh",
      gstin: "09ADNPV1603N1ZZ"
    },
    customer: {
      name: "RAMAN SHUTTER WORKS",
      address: "NEAR SHANTI KUNJ, NEW MARKET, BANDA, BANDA, UTTAR PRADESH, 210001\nState: Uttar Pradesh",
      idLabel: "GSTIN",
      idValue: "982734987234"
    },
    meta: {
      invoiceNo: "INV-0190",
      date: "2026-03-01",
      vehicleNo: "UP77AN1461",
      ewbNo: "AOIWEI234" 
    },
    items: [
      {
        id: 1,
        description: "IRON DOOR (25 PIECES OF 6X3 SINGLE AND 6X2.6 SINGLE IRON DOOR)",
        hsn: "7308",
        qty: 650,
        rate: 57.00,
        taxableVal: 37050.00,
        cgstRate: 9,
        cgstAmt: 3334.50,
        sgstRate: 9,
        sgstAmt: 3334.50,
        total: 43719.00
      }
    ],
    totals: {
      taxableValue: 37050.00,
      cgst: 3334.50,
      sgst: 3334.50,
      grandTotal: 43719.00 
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const showEwb = invoiceData.meta.ewbNo || invoiceData.totals.grandTotal > 50000;

  return (
    <div className="invoice-wrapper">
      <div className="app-controls" style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <button className="btn-print" onClick={handlePrint}>Print A4 Invoice</button>
      </div>

      <div className="invoice-sheet">
        {/* Top Header Section */}
        <div className="header-section">
          <div className="company-info">
            <h1>{invoiceData.company.name}</h1>
            <p style={{ whiteSpace: 'pre-line' }}>{invoiceData.company.address}</p>
            <p className="bold-mt"><strong>GSTIN:</strong> {invoiceData.company.gstin}</p>
          </div>
          
          <div className="invoice-meta">
            <h2>TAX INVOICE</h2>
            <div className="meta-grid">
              <span className="meta-label">Invoice No:</span> 
              <span className="meta-value bold-text">{invoiceData.meta.invoiceNo}</span>
              
              <span className="meta-label">Date:</span> 
              <span className="meta-value">{invoiceData.meta.date}</span>
              
              <span className="meta-label">Vehicle No:</span> 
              <span className="meta-value">{invoiceData.meta.vehicleNo}</span>

              {showEwb && (
                <>
                  <span className="meta-label">E-Way Bill:</span>
                  <span className="meta-value">
                    {invoiceData.meta.ewbNo ? (
                      invoiceData.meta.ewbNo
                    ) : (
                      <span className="warning-text">Pending (&gt; ₹50k)</span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="thick-divider"></div>

        {/* Billed To Card */}
        <div className="billed-to-card">
          <h4>BILLED TO</h4>
          <h3>{invoiceData.customer.name}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{invoiceData.customer.address}</p>
          <p className="bold-mt"><strong>{invoiceData.customer.idLabel}:</strong> {invoiceData.customer.idValue}</p>
        </div>

        {/* Items Table */}
        <table className="modern-table">
          <thead>
            <tr>
              <th width="4%">#</th>
              <th width="32%">Item Description</th>
              <th width="8%">HSN</th>
              <th width="8%">Qty</th>
              <th width="10%">Rate</th>
              <th width="12%">Taxable Val</th>
              <th width="10%">CGST</th>
              <th width="10%">SGST</th>
              <th width="12%">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td className="desc-cell">{item.description}</td>
                <td>{item.hsn}</td>
                <td>{item.qty}</td>
                <td>₹{item.rate.toFixed(2)}</td>
                <td className="bold-text">₹{item.taxableVal.toFixed(2)}</td>
                <td className="tax-cell"><span className="tax-rate">({item.cgstRate}%)</span><br />₹{item.cgstAmt.toFixed(2)}</td>
                <td className="tax-cell"><span className="tax-rate">({item.sgstRate}%)</span><br />₹{item.sgstAmt.toFixed(2)}</td>
                <td className="bold-text">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Clean Totals Section */}
        <div className="clean-totals">
          <div className="total-row">
            <span className="total-label">Total Taxable Value</span>
            <span className="total-value bold-text">₹{invoiceData.totals.taxableValue.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span className="total-label">Total CGST</span>
            <span className="total-value bold-text">₹{invoiceData.totals.cgst.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span className="total-label">Total SGST</span>
            <span className="total-value bold-text">₹{invoiceData.totals.sgst.toFixed(2)}</span>
          </div>
          <div className="total-row grand-total-row">
            <span className="total-label grand-label">Grand Total</span>
            <span className="total-value grand-value">₹{invoiceData.totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="thick-divider"></div>

        {/* Footer */}
        <div className="footer">
          <div className="terms">
            <strong>Terms &amp; Conditions:</strong>
            <ol>
              <li>Payment is due within 15 days.</li>
              <li>Subject to Uttar Pradesh jurisdiction.</li>
              <li>This is a computer-generated invoice and does not require a physical signature.</li>
            </ol>
          </div>
          <div className="signature">
            <div className="sig-line"></div>
            <p><strong>Authorized Signatory</strong></p>
            <p className="sig-sub">For {invoiceData.company.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;