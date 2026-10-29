"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  User as UserIcon,
  FileText,
  Wallet,
  Building2,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface DebtItem {
  id: string;
  lender_id: string;
  borrower_id: string;
  amount: number;
  status: "Pending" | "Settled";
  description: string | null;
  created_at: string;
  lender?: UserProfile;
  borrower?: UserProfile;
}

export default function DebtsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"owed_to_me" | "i_owe">("owed_to_me");
  const [showSettled, setShowSettled] = useState(false);

  // Add Debt Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debtType, setDebtType] = useState<"lender" | "borrower">("lender");
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settle Up Modal State
  const [settleModalDebt, setSettleModalDebt] = useState<DebtItem | null>(null);
  const [settleAccountType, setSettleAccountType] = useState<"Cash" | "Bank">("Bank");
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    initData();
  }, []);

  async function initData() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    setCurrentUser({
      id: userId,
      name: authData.user.user_metadata?.name || "Me",
      email: authData.user.email || "",
    });

    await fetchDebts(userId);
    setLoading(false);
  }

  async function fetchDebts(userId: string) {
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching debts:", error);
      return;
    }

    if (!data || data.length === 0) {
      setDebts([]);
      return;
    }

    const peerUserIds = Array.from(
      new Set(data.flatMap((d) => [d.lender_id, d.borrower_id]))
    );

    const { data: usersData } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", peerUserIds);

    const userMap = new Map<string, UserProfile>();
    usersData?.forEach((u) => userMap.set(u.id, u as UserProfile));

    const enrichedDebts: DebtItem[] = data.map((item) => ({
      ...item,
      lender: userMap.get(item.lender_id),
      borrower: userMap.get(item.borrower_id),
    }));

    setDebts(enrichedDebts);
  }

  async function handleSearchUsers(query: string) {
    setUserQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email")
      .ilike("email", `%${query.trim()}%`)
      .neq("id", currentUser?.id || "")
      .limit(5);

    if (!error && data) {
      setSearchResults(data as UserProfile[]);
    }
    setSearching(false);
  }

  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPeer) {
      setErrorMsg("Please select a user by searching their email.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!currentUser) {
      setErrorMsg("User session not found.");
      return;
    }

    setSubmitting(true);

    const lender_id = debtType === "lender" ? currentUser.id : selectedPeer.id;
    const borrower_id = debtType === "lender" ? selectedPeer.id : currentUser.id;

    const { data, error } = await supabase
      .from("debts")
      .insert({
        lender_id,
        borrower_id,
        amount: parsedAmount,
        description: description.trim() || null,
        status: "Pending",
      })
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      const newDebtItem: DebtItem = {
        ...data,
        lender: debtType === "lender" ? currentUser : selectedPeer,
        borrower: debtType === "lender" ? selectedPeer : currentUser,
      };

      setDebts((prev) => [newDebtItem, ...prev]);
      setIsModalOpen(false);
      resetModalForm();
    }

    setSubmitting(false);
  }

  async function handleConfirmSettleUp() {
    if (!settleModalDebt || !currentUser) return;

    const debtId = settleModalDebt.id;
    const isLender = settleModalDebt.lender_id === currentUser.id;
    const debtAmount = Number(settleModalDebt.amount);

    // Enforce security authorization: only the creditor/lender can confirm receipt of repayment
    if (!isLender) {
      setErrorMsg("Only the creditor/lender can confirm receipt of repayment.");
      setSettleModalDebt(null);
      return;
    }

    setSettlingId(debtId);

    // 1. Update status in Debts table
    const { error: debtErr } = await supabase
      .from("debts")
      .update({ status: "Settled" })
      .eq("id", debtId);

    if (debtErr) {
      console.error("Error settling debt:", debtErr);
      setErrorMsg(debtErr.message || "Failed to settle debt.");
      setSettlingId(null);
      setSettleModalDebt(null);
      return;
    }

    // 2. Adjust User_Accounts balance (creditor deposits repayment)
    try {
      const { data: accData } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      const currentCash = accData ? Number(accData.cash_balance) : 1500;
      const currentBank = accData ? Number(accData.bank_balance) : 12000;

      let newCash = currentCash;
      let newBank = currentBank;

      // Lender received repayment -> increment account balance
      if (settleAccountType === "Cash") newCash += debtAmount;
      else newBank += debtAmount;

      await supabase.from("user_accounts").upsert({
        user_id: currentUser.id,
        cash_balance: newCash,
        bank_balance: newBank,
        updated_at: new Date().toISOString(),
      });
    } catch (accErr) {
      console.error("Error updating user balance on settlement:", accErr);
    }

    // 3. Update UI state
    setDebts((prev) =>
      prev.map((item) =>
        item.id === debtId ? { ...item, status: "Settled" } : item
      )
    );

    setSettlingId(null);
    setSettleModalDebt(null);
  }

  function resetModalForm() {
    setUserQuery("");
    setSearchResults([]);
    setSelectedPeer(null);
    setAmount("");
    setDescription("");
    setDebtType("lender");
    setErrorMsg(null);
  }

  const owedToMeDebts = debts.filter(
    (d) => d.lender_id === currentUser?.id
  );
  const iOweDebts = debts.filter(
    (d) => d.borrower_id === currentUser?.id
  );

  const activeDebtsList = activeTab === "owed_to_me" ? owedToMeDebts : iOweDebts;
  const filteredDebts = activeDebtsList.filter(
    (d) => showSettled || d.status === "Pending"
  );

  const totalOwedToMe = owedToMeDebts
    .filter((d) => d.status === "Pending")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalIOwe = iOweDebts
    .filter((d) => d.status === "Pending")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Stats summary */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
            Peer Ledger & Shared Debts
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] text-white dark:text-[#121212] text-sm font-semibold transition-all shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Debt Record</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#2E6F40]/30 dark:border-[#4ADE80]/30 bg-[#2E6F40]/5 dark:bg-[#4ADE80]/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E6F40] dark:text-[#4ADE80] flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Owed to Me
            </span>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight tabular-nums mt-1 text-[#2E6F40] dark:text-[#4ADE80]">
              +₹{totalOwedToMe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#9E2A2B]/30 dark:border-[#F87171]/30 bg-[#9E2A2B]/5 dark:bg-[#F87171]/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E2A2B] dark:text-[#F87171] flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              I Owe
            </span>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight tabular-nums mt-1 text-[#9E2A2B] dark:text-[#F87171]">
              -₹{totalIOwe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Debts View Tabs */}
      <div className="p-6 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] space-y-4">
        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80">
          <button
            onClick={() => setActiveTab("owed_to_me")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "owed_to_me"
                ? "bg-white dark:bg-[#1E1E1E] text-[#2E6F40] dark:text-[#4ADE80] shadow-xs font-bold"
                : "text-[#706E6B] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-[#F4F4F5]"
            }`}
          >
            <span>Owed to Me</span>
            <span className="tabular-nums opacity-80">
              (₹{totalOwedToMe.toFixed(0)})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("i_owe")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "i_owe"
                ? "bg-white dark:bg-[#1E1E1E] text-[#9E2A2B] dark:text-[#F87171] shadow-xs font-bold"
                : "text-[#706E6B] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-[#F4F4F5]"
            }`}
          >
            <span>I Owe</span>
            <span className="tabular-nums opacity-80">
              (₹{totalIOwe.toFixed(0)})
            </span>
          </button>
        </div>

        {/* Show Settled Checkbox Filter */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 text-xs font-medium text-[#706E6B] dark:text-[#A1A1AA] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSettled}
              onChange={(e) => setShowSettled(e.target.checked)}
              className="rounded border-[#EAE8E3] dark:border-[#2D2D2D] text-[#18181B] focus:ring-[#18181B] h-3.5 w-3.5"
            />
            <span>Show Settled Records</span>
          </label>
        </div>

        {/* Debt Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#18181B] dark:text-[#F4F4F5]" />
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[#EAE8E3] dark:border-[#2D2D2D]">
            <Clock className="w-8 h-8 mx-auto text-[#706E6B] dark:text-[#A1A1AA] mb-2 opacity-60" />
            <p className="text-base font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
              No {activeTab === "owed_to_me" ? "debts owed to you" : "debts you owe"}
            </p>
            <p className="text-sm font-medium text-[#706E6B] dark:text-[#A1A1AA] mt-1">
              Tap "+ Add Debt Record" to log a new peer transaction.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAE8E3]/60 dark:divide-[#2D2D2D]/60">
            {filteredDebts.map((debt) => {
              const isLender = debt.lender_id === currentUser?.id;
              const peer = isLender ? debt.borrower : debt.lender;
              const isSettled = debt.status === "Settled";

              return (
                <div
                  key={debt.id}
                  className={`py-4 flex items-center justify-between gap-3 ${
                    isSettled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isSettled
                          ? "bg-[#FAF9F6] dark:bg-[#121212] text-[#706E6B] border-[#EAE8E3] dark:border-[#2D2D2D]"
                          : isLender
                          ? "bg-[#2E6F40]/10 text-[#2E6F40] dark:text-[#4ADE80] border-[#2E6F40]/20"
                          : "bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#F87171] border-[#9E2A2B]/20"
                      }`}
                    >
                      {peer?.name ? peer.name.charAt(0).toUpperCase() : "?"}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                        {peer?.name || peer?.email || "Unknown Peer"}
                      </p>
                      <p className="text-xs font-normal text-[#706E6B] dark:text-[#A1A1AA] truncate mt-0.5">
                        {debt.description || (isLender ? "Borrowed from you" : "You borrowed")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-base font-semibold tabular-nums ${
                          isSettled
                            ? "text-[#706E6B] dark:text-[#A1A1AA] line-through"
                            : isLender
                            ? "text-[#2E6F40] dark:text-[#4ADE80]"
                            : "text-[#9E2A2B] dark:text-[#F87171]"
                        }`}
                      >
                        {isLender ? "+" : "-"}₹{Number(debt.amount).toFixed(2)}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSettled
                            ? "bg-[#FAF9F6] dark:bg-[#121212] text-[#706E6B] dark:text-[#A1A1AA]"
                            : "bg-[#706E6B]/15 text-[#706E6B] dark:text-[#A1A1AA]"
                        }`}
                      >
                        {isSettled ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#2E6F40] dark:text-[#4ADE80]" />
                            Settled
                          </>
                        ) : (
                          "Pending"
                        )}
                      </span>
                    </div>

                    {/* Settle Up Action: Restricted to Creditor/Lender */}
                    {!isSettled && (
                      isLender ? (
                        <button
                          onClick={() => setSettleModalDebt(debt)}
                          disabled={settlingId === debt.id}
                          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#2E6F40] hover:bg-[#235832] dark:bg-[#4ADE80] dark:hover:bg-[#38BDF8] text-white dark:text-[#121212] transition-colors flex items-center gap-1.5 disabled:opacity-50 min-h-[44px] shrink-0"
                          title="Confirm repayment received from borrower"
                        >
                          {settlingId === debt.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Received</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-[#706E6B] dark:text-[#A1A1AA] bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] px-2.5 py-1.5 rounded-lg shrink-0">
                          Awaiting Lender Confirmation
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Up Account Selection Modal */}
      {settleModalDebt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#EAE8E3] dark:border-[#2D2D2D] rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] dark:border-[#2D2D2D] pb-3">
              <h3 className="text-xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
                Confirm Repayment Received
              </h3>
              <button
                onClick={() => setSettleModalDebt(null)}
                className="p-2 rounded-lg text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[#706E6B] dark:text-[#A1A1AA]">
                Receiving repayment of <span className="font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">₹{Number(settleModalDebt.amount).toFixed(2)}</span> from{" "}
                <span className="font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                  {settleModalDebt.borrower?.name || settleModalDebt.borrower?.email || "peer"}
                </span>
                . Select which account to deposit the funds into:
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-2">
                  Select Settlement Account
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D]">
                  <button
                    type="button"
                    onClick={() => setSettleAccountType("Bank")}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      settleAccountType === "Bank"
                        ? "bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F4F4F5] shadow-xs font-bold"
                        : "text-[#706E6B] dark:text-[#A1A1AA]"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Bank Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleAccountType("Cash")}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      settleAccountType === "Cash"
                        ? "bg-white dark:bg-[#1E1E1E] text-[#2E6F40] dark:text-[#4ADE80] shadow-xs font-bold"
                        : "text-[#706E6B] dark:text-[#A1A1AA]"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Liquid Cash</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSettleModalDebt(null)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettleUp}
                disabled={settlingId === settleModalDebt.id}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#2E6F40] hover:bg-[#235832] dark:bg-[#4ADE80] dark:hover:bg-[#38BDF8] text-white dark:text-[#121212] transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
              >
                {settlingId === settleModalDebt.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Settling...</span>
                  </>
                ) : (
                  <span>Confirm Settlement</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#EAE8E3] dark:border-[#2D2D2D] rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] dark:border-[#2D2D2D] pb-3">
              <h3 className="text-xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
                Log Peer Debt
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetModalForm();
                }}
                className="p-2 rounded-lg text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[#9E2A2B] dark:text-[#F87171] text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddDebt} className="space-y-5">
              {/* Debt Direction Choice */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1.5">
                  Debt Direction
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80">
                  <button
                    type="button"
                    onClick={() => setDebtType("lender")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all text-center ${
                      debtType === "lender"
                        ? "bg-white dark:bg-[#1E1E1E] text-[#2E6F40] dark:text-[#4ADE80] shadow-xs"
                        : "text-[#706E6B] dark:text-[#A1A1AA]"
                    }`}
                  >
                    Someone owes me
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType("borrower")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all text-center ${
                      debtType === "borrower"
                        ? "bg-white dark:bg-[#1E1E1E] text-[#9E2A2B] dark:text-[#F87171] shadow-xs"
                        : "text-[#706E6B] dark:text-[#A1A1AA]"
                    }`}
                  >
                    I owe someone
                  </button>
                </div>
              </div>

              {/* Peer Search Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Find Peer by Email
                </label>
                {selectedPeer ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserIcon className="w-4 h-4 text-[#18181B] dark:text-[#F4F4F5] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                          {selectedPeer.name}
                        </p>
                        <p className="text-[11px] text-[#706E6B] dark:text-[#A1A1AA] truncate">
                          {selectedPeer.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPeer(null)}
                      className="text-xs font-semibold text-[#9E2A2B] dark:text-[#F87171] hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
                    <input
                      type="email"
                      placeholder="Type peer's email address..."
                      value={userQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      className="w-full pl-7 pr-2 py-3 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] min-h-[44px]"
                    />

                    {searching && (
                      <Loader2 className="w-4 h-4 absolute right-2 top-3.5 animate-spin text-[#706E6B]" />
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-[#1E1E1E] border border-[#EAE8E3] dark:border-[#2D2D2D] rounded-xl shadow-lg divide-y divide-[#EAE8E3] dark:divide-[#2D2D2D] overflow-hidden">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedPeer(u);
                              setSearchResults([]);
                            }}
                            className="w-full p-3 text-left hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-[#1A1A1A] dark:text-[#F4F4F5]">
                                {u.name}
                              </p>
                              <p className="text-[#706E6B] dark:text-[#A1A1AA]">
                                {u.email}
                              </p>
                            </div>
                            <span className="text-[#18181B] dark:text-[#F4F4F5] font-semibold">
                              Select
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Amount (₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 top-3 font-bold text-[#706E6B] dark:text-[#A1A1AA] text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-6 pr-2 py-3 text-xl font-semibold bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums min-h-[44px]"
                  />
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Description / Note
                </label>
                <div className="relative">
                  <FileText className="w-5 h-5 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
                  <input
                    type="text"
                    placeholder="e.g. Dinner split, Course material..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-7 pr-2 py-3 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetModalForm();
                  }}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] text-white dark:text-[#121212] transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Record Debt</span>
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
