# APE3 🚀
> **Arman Enterprises - Billing System 3**

A modern, full-stack billing and invoicing application designed specifically for Arman Enterprises. Built to streamline the creation, management, and printing of GST-compliant A4 invoices with zero hassle.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## ✨ Key Features

* **Secure Authentication:** Locked-down access using Supabase Auth. Only authorized personnel can view or generate financial records.
* **Smart Dashboard:** A central command center to view all historical invoices, track grand totals, and instantly identify high-value shipments missing an E-Way Bill.
* **Intelligent Auto-Incrementing:** Automatically generates the next invoice number based on the current Financial Year (e.g., `ARM/25-26/011`), gracefully resetting every April 1st.
* **Dynamic Data Entry:** * Live calculation of Taxable Value, CGST (9%), SGST (9%), and Grand Totals.
    * Smart autocomplete for returning customers (auto-fills GSTIN/Aadhaar and Addresses).
    * Smart autocomplete for frequently used Vehicle Numbers.
* **Full CRUD Capabilities:** Seamlessly Create, Read, Update, and Delete invoices. Updating an invoice automatically syncs all nested line items.
* **Print-Perfect A4 Invoices:** Custom `@media print` CSS ensures that clicking "Print" generates a flawless, professional physical invoice without any UI clutter.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (via Vite)
* **Backend & Database:** Supabase (Managed PostgreSQL)
* **Styling:** Custom CSS (Optimized for both Web & Print)

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Clone and Install
```bash
# Navigate to your project directory
cd ape3

# Install dependencies
npm install