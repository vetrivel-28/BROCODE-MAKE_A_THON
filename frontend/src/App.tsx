import React, { useState } from 'react';
import { api } from './shared/api.js';
import { ToastProvider } from './shared/components/index.js';
import { TaxRulesPage } from './features/billing/TaxRulesPage.js';
import { InvoiceListPage } from './features/billing/InvoiceListPage.js';
import { InvoiceDetailPage } from './features/billing/InvoiceDetailPage.js';
import { PaymentListPage } from './features/payments/PaymentListPage.js';
import { PaymentModal } from './features/payments/PaymentModal.js';
import { Invoice } from './features/billing/types.js';

type Tab = 'invoices' | 'payments' | 'taxes';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('invoices');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Payment Modal state
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Active Role State for Testing RBAC
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'STAFF' | 'SUPER_ADMIN'>('ADMIN');

  const handleRoleChange = (newRole: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN') => {
    setCurrentRole(newRole);
    api.setRole(newRole);
  };

  const handleOpenRecordPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setIsPaymentModalOpen(true);
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setActiveTab('invoices');
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('invoices'); setSelectedInvoiceId(null); }}>
              <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                L
              </div>
              <span className="font-bold text-xl tracking-tight text-text">LoopDesk</span>
              <span className="ml-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-primary-light text-primary rounded-full">
                Billing & Payments
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveTab('invoices');
                  setSelectedInvoiceId(null);
                }}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-[12px] transition-colors ${
                  activeTab === 'invoices'
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-gray-600 hover:text-text hover:bg-gray-100'
                }`}
              >
                Invoices
              </button>

              <button
                onClick={() => {
                  setActiveTab('payments');
                  setSelectedInvoiceId(null);
                }}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-[12px] transition-colors ${
                  activeTab === 'payments'
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-gray-600 hover:text-text hover:bg-gray-100'
                }`}
              >
                Payments
              </button>

              <button
                onClick={() => {
                  setActiveTab('taxes');
                  setSelectedInvoiceId(null);
                }}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-[12px] transition-colors ${
                  activeTab === 'taxes'
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-gray-600 hover:text-text hover:bg-gray-100'
                }`}
              >
                Tax Rules
              </button>
            </nav>
          </div>

          {/* Role Switcher & Tenant Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-400">Current Role</p>
              <p className="text-xs font-semibold text-text">{currentRole}</p>
            </div>

            <select
              value={currentRole}
              onChange={(e) => handleRoleChange(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-gray-50 text-text border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="STAFF">STAFF (Invoices & Payments)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Read-Only)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'invoices' && (
          selectedInvoiceId ? (
            <InvoiceDetailPage
              invoiceId={selectedInvoiceId}
              onBack={() => setSelectedInvoiceId(null)}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          ) : (
            <InvoiceListPage
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          )
        )}

        {activeTab === 'payments' && (
          <PaymentListPage
            onSelectInvoice={(invId) => {
              setSelectedInvoiceId(invId);
              setActiveTab('invoices');
            }}
          />
        )}

        {activeTab === 'taxes' && <TaxRulesPage />}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentInvoice(null);
        }}
        invoice={paymentInvoice}
        onPaymentSuccess={() => {
          // Trigger refresh by updating state
          if (selectedInvoiceId) {
            setSelectedInvoiceId(selectedInvoiceId);
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
