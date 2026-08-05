"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet,
  Building2,
  Edit2,
  X,
  Loader2,
} from "lucide-react";

interface AccountSummaryCardProps {
  netOwedToMe?: number;
  netIOwe?: number;
  refreshTrigger?: number;
}

export function AccountSummaryCard({
  netOwedToMe = 0,
  netIOwe = 0,
  refreshTrigger = 0,
}: AccountSummaryCardProps) {
  const [cashBalance, setCashBalance] = useState<number>(1500);
  const [bankBalance, setBankBalance] = useState<number>(12000);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCash, setEditCash] = useState("");
  const [editBank, setEditBank] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchBalances();
  }, [refreshTrigger]);

  async function fetchBalances() {
    setLoading(true);
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("user_id", userResp.user.id)
        .maybeSingle();

      if (!error && data) {
        setCashBalance(Number(data.cash_balance) || 0);
        setBankBalance(Number(data.bank_balance) || 0);
      }
    } catch {
      // Fallback
    }
    setLoading(false);
  }

  async function handleSaveBalances(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const parsedCash = parseFloat(editCash);
    const parsedBank = parseFloat(editBank);

    const newCash = isNaN(parsedCash) ? cashBalance : parsedCash;
    const newBank = isNaN(parsedBank) ? bankBalance : parsedBank;

    const { data: userResp } = await supabase.auth.getUser();
    if (userResp.user) {
      try {
        await supabase.from("user_accounts").upsert({
          user_id: userResp.user.id,
          cash_balance: newCash,
          bank_balance: newBank,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Fallback update local state
      }
    }

    setCashBalance(newCash);
    setBankBalance(newBank);
    setSaving(false);
    setIsModalOpen(false);
  }

  function openEditModal() {
    setEditCash(cashBalance.toString());
    setEditBank(bankBalance.toString());
    setIsModalOpen(true);
  }

  const netWorth = cashBalance + bankBalance + netOwedToMe - netIOwe;

  return (
    <div className="space-y-4 font-sans">
      {/* Total Net Worth Card */}
      <div className="p-6 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#706E6B] dark:text-[#A1A1AA]">
              Total Net Worth
            </span>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums mt-1 text-[#1A1A1A] dark:text-[#F4F4F5]">
              ₹{netWorth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={openEditModal}
            className="p-2.5 rounded-xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-[#FAF9F6] dark:bg-[#121212] hover:bg-[#EAE8E3]/60 dark:hover:bg-[#2D2D2D] text-[#1A1A1A] dark:text-[#F4F4F5] transition-colors flex items-center gap-1.5 text-xs font-semibold min-h-[44px]"
            title="Edit Account Balances"
          >
            <Edit2 className="w-4 h-4 text-[#706E6B] dark:text-[#A1A1AA]" />
            <span>Update Balances</span>
          </button>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Liquid Cash */}
        <div className="p-5 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] flex items-center justify-center text-[#2E6F40] dark:text-[#4ADE80] shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#706E6B] dark:text-[#A1A1AA]">
                Liquid Cash
              </span>
              <p className="text-xl font-semibold tracking-tight tabular-nums text-[#1A1A1A] dark:text-[#F4F4F5]">
                ₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Bank / Online Account */}
        <div className="p-5 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] flex items-center justify-center text-[#1A1A1A] dark:text-[#F4F4F5] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#706E6B] dark:text-[#A1A1AA]">
                Online / Bank Account
              </span>
              <p className="text-xl font-semibold tracking-tight tabular-nums text-[#1A1A1A] dark:text-[#F4F4F5]">
                ₹{bankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Balances Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#EAE8E3] dark:border-[#2D2D2D] rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] dark:border-[#2D2D2D] pb-3">
              <h3 className="text-xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
                Update Account Balances
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalances} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Liquid Cash Balance (₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 top-3 font-bold text-[#706E6B] dark:text-[#A1A1AA] text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editCash}
                    onChange={(e) => setEditCash(e.target.value)}
                    className="w-full pl-6 pr-2 py-3 text-lg font-semibold bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Bank / Online Balance (₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 top-3 font-bold text-[#706E6B] dark:text-[#A1A1AA] text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    className="w-full pl-6 pr-2 py-3 text-lg font-semibold bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] text-white dark:text-[#121212] transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
