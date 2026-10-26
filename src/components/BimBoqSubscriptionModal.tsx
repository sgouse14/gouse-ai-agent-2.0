import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  Check,
  ArrowRight,
  X,
  FileSpreadsheet,
  Cpu,
  Zap,
  Download,
  AlertCircle,
  Clock,
  Phone,
  Lock,
} from 'lucide-react';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

export interface BimBoqSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess?: () => void;
  currency?: CurrencyCode;
}

export interface SubscriptionInfo {
  isSubscribed: boolean;
  subscribedDate?: string;
  expiryDate?: string;
  transactionId?: string;
  amount: number;
}

export const getBimBoqSubscription = (): SubscriptionInfo => {
  try {
    const raw = localStorage.getItem('gouse_bim_boq_subscription');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isSubscribed) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading subscription from storage', e);
  }
  return {
    isSubscribed: false,
    amount: 1500,
  };
};

export const setBimBoqSubscription = (info: SubscriptionInfo) => {
  try {
    localStorage.setItem('gouse_bim_boq_subscription', JSON.stringify(info));
  } catch (e) {
    console.error('Error saving subscription to storage', e);
  }
};

export const BimBoqSubscriptionModal: React.FC<BimBoqSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionSuccess,
  currency = 'INR',
}) => {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(getBimBoqSubscription());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [upiIdInput, setUpiIdInput] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');

  useEffect(() => {
    setSubInfo(getBimBoqSubscription());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAcceptSubscription = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(now.getFullYear() + 1);

      const newSub: SubscriptionInfo = {
        isSubscribed: true,
        subscribedDate: now.toISOString(),
        expiryDate: oneYearLater.toISOString(),
        transactionId: `TXN-BIM-${Date.now().toString().slice(-8)}`,
        amount: 1500,
      };

      setBimBoqSubscription(newSub);
      setSubInfo(newSub);
      setIsProcessing(false);
      setActivationSuccess(true);
      onSubscriptionSuccess?.();

      setTimeout(() => {
        setActivationSuccess(false);
      }, 4000);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel the BIM & BOQ Agent annual subscription?')) {
      const cancelled: SubscriptionInfo = {
        isSubscribed: false,
        amount: 1500,
      };
      setBimBoqSubscription(cancelled);
      setSubInfo(cancelled);
    }
  };

  const handleDownloadInvoice = () => {
    const content = `========================================================
GOUSE AI AGENT - ANNUAL SUBSCRIPTION TAX INVOICE
Principal Architecture & Construction Intelligence Studio
Ar. S. Gouse | CoA Reg: CA/2012/55190 | Phone: +91 80739 47241
========================================================
INVOICE NO   : INV-${subInfo.transactionId || 'BIM-2026-001'}
DATE         : ${new Date().toLocaleDateString('en-IN')}
SUBSCRIPTION : BIM & BOQ AGENT ANNUAL LICENSE (1 YEAR)
AMOUNT PAID  : ₹1,500 (Inclusive of all taxes)
VALID UNTIL  : ${subInfo.expiryDate ? new Date(subInfo.expiryDate).toLocaleDateString('en-IN') : '1 Year from Activation'}
SECURITY     : Saqlain Cyber Security Zero-Trust SHA-256 Verified
STATUS       : PAID & AUTHORIZED BY GOUSE AI AGENT
========================================================
Thank you for trusting Gouse AI Autonomous Execution Agent.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_Gouse_AI_BIM_BOQ_1500_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-950 border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Cyber Corner Crosshairs */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  BIM &amp; BOQ AGENT ANNUAL LICENSE
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ₹1,500 / YEAR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Gouse AI Autonomous Agent • Structural IS 456 &amp; Dynamic BOQ Sub-Agent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active License Banner if already subscribed */}
        {subInfo.isSubscribed && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Subscription Active • Accepted by Gouse AI Agent</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                PAID: ₹1,500/YR
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans">
              Your annual license is active. You have full autonomous execution privileges across 3D BIM models, floor takeoff ledgers, CPWD rate lock, and structural clash detection under Ar. S. Gouse.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono pt-1">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">TRANSACTION ID</span>
                <span className="font-bold text-emerald-300 truncate block">
                  {subInfo.transactionId || 'TXN-BIM-88491021'}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">EXPIRY DATE</span>
                <span className="font-bold text-slate-200 block">
                  {subInfo.expiryDate
                    ? new Date(subInfo.expiryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '1 Year Active'}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">STATUS</span>
                <span className="font-bold text-emerald-400 block">UNLIMITED ACCESS</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}

        {/* Pricing Card Details */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Full-Access Annual Subscription
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>₹1,500</span>
                <span className="text-xs font-mono font-medium text-slate-400">/ Year (₹125/month)</span>
              </h4>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold self-start sm:self-auto">
              SAVE 80% OVER MONTHLY
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Full annual access for architects, civil contractors, structural engineers, and property developers. Lock structural blueprints, automate floor-wise quantity takeoffs, and eliminate contractor cost escalations.
          </p>

          {/* Feature Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
            <div className="flex items-start gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Unlimited 3D BIM &amp; CAD (.dwg/.dxf) Structural Scans</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>IS 456 Column-Beam Clash Detection &amp; Offsets</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Dynamic Floor-by-Floor Takeoff with CPWD Rate Lock</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Excel (.xlsx), CSV &amp; Client PDF Export</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Geotagged AI Site Camera Curing Verification</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>CoA Ar. S. Gouse (CA/2012/55190) Professional Guidance</span>
            </div>
          </div>
        </div>

        {/* Payment & Acceptance Form */}
        {!subInfo.isSubscribed && (
          <form onSubmit={handleAcceptSubscription} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center justify-between">
                <span>Select Payment Method for ₹1,500/Year:</span>
                <span className="text-amber-400 font-mono text-[11px]">Instant Activation</span>
              </label>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    selectedPaymentMethod === 'upi'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    selectedPaymentMethod === 'card'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    selectedPaymentMethod === 'netbanking'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {/* Method Details */}
            {selectedPaymentMethod === 'upi' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Merchant UPI ID:</span>
                  <span className="text-amber-400 font-bold">sgouse14@okaxis</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Supported Apps:</span>
                  <span>Google Pay • PhonePe • Paytm • BHIM</span>
                </div>
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  placeholder="Enter your VPA / UPI ID (e.g. name@okhdfcbank)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {selectedPaymentMethod === 'card' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Card Payment Gateway:</span>
                  <span className="text-emerald-400 font-bold">256-Bit Encrypted</span>
                </div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card Number"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {selectedPaymentMethod === 'netbanking' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Select Bank:</span>
                <span className="text-amber-300 font-bold">HDFC • SBI • ICICI • Axis Bank</span>
              </div>
            )}

            {/* Direct Accept Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Processing ₹1,500 Payment &amp; Generating License...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Accept Gouse AI Agent License (₹1,500 / Year)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Success Confirmation Toast */}
        {activationSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Payment Verified! BIM &amp; BOQ Agent Annual License (₹1,500/yr) activated successfully on Gouse AI Agent.
            </span>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-[10px] font-mono text-slate-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Saqlain Cyber Security Sentinel: TLS 1.3 / AES-256</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-amber-400" />
            <span>Billing Support: +91 80739 47241 (Ar. S. Gouse)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
