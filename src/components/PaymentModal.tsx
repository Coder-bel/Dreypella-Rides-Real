/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 */
import { Copy, CheckCircle, X } from "lucide-react";
import { useState } from "react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmPaid: () => void;
  loading?: boolean;
}

const ACCOUNT_DETAILS = {
  name: "Beloved Okikioluwa Isiak",
  bank: "Opay",
  number: "9160581948",
};

const PaymentModal = ({ open, onClose, onConfirmPaid, loading }: PaymentModalProps) => {
  const [copied, setCopied] = useState("");

  if (!open) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 border max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-lg">Payment Instructions</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Make payment to the account below via Opay app, bank transfer, or USSD.
        </p>

        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm mb-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Bank:</span>
            <span className="font-semibold">{ACCOUNT_DETAILS.bank}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Account Name:</span>
            <span className="font-semibold">{ACCOUNT_DETAILS.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Account No:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-accent">{ACCOUNT_DETAILS.number}</span>
              <button
                onClick={() => copyToClipboard(ACCOUNT_DETAILS.number, "acct")}
                className="p-1 hover:bg-background rounded transition-colors"
                aria-label="Copy account number"
              >
                {copied === "acct" ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-accent/10 rounded-lg p-3 text-xs text-center mb-4">
          <p className="text-muted-foreground">
            Use your <strong>full name + booking reference</strong> as remark/narration for easy verification.
          </p>
        </div>

        <button
          onClick={onConfirmPaid}
          disabled={loading}
          className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle size={18} />
              I Have Made Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
