import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { BudgetItem } from "../../types";
import { formatIDR } from "../../lib/formatters";
import { DollarSign } from "lucide-react";

interface BudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BudgetItem>) => Promise<void>;
  editingItem?: BudgetItem | null;
}

export const BudgetItemModal: React.FC<BudgetItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
}) => {
  const isEditing = Boolean(editingItem);

  const [name, setName] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState<number | string>("");
  const [actualAmount, setActualAmount] = useState<number | string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || "");
      setEstimatedAmount(editingItem.estimated_amount || "");
      setActualAmount(editingItem.actual_amount || "");
      setNotes(editingItem.notes || "");
    } else {
      setName("");
      setEstimatedAmount("");
      setActualAmount("");
      setNotes("");
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        estimated_amount: Number(estimatedAmount) || 0,
        actual_amount: Number(actualAmount) || 0,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save budget item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Budget Item" : "Add Budget Item"}
      subtitle="Track estimated expected costs versus actual spent amounts."
      maxWidth="md"
    >
      <div>
        {error && (
          <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Item Name <span className="text-[#E11D48]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Garden Venue Rental, Catering, Photography"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Estimated Amount (IDR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-black">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  placeholder="20000000"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-mono font-bold focus:outline-none focus:bg-white"
                />
              </div>
              {estimatedAmount ? (
                <p className="text-[11px] text-black font-mono font-bold mt-1">
                  {formatIDR(Number(estimatedAmount))}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Actual Spent (IDR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-black">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-mono font-bold focus:outline-none focus:bg-white"
                />
              </div>
              {actualAmount ? (
                <p className="text-[11px] text-black font-mono font-bold mt-1">
                  {formatIDR(Number(actualAmount))}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Notes & Payment Terms <span className="opacity-50 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% down payment paid on signing, balance due on D-7"
              className="w-full px-4 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-medium text-black focus:outline-none focus:bg-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-black hover:bg-[#F0F0F0] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Item" : "Add Budget Item"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
