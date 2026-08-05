"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  Calendar,
  Tag,
  X,
  Loader2,
  ShoppingBag,
  Utensils,
  BookOpen,
  Film,
  Bus,
  MoreHorizontal,
  Wallet,
  Building2,
  FileText,
} from "lucide-react";
import { ExpenseDashboardCharts } from "@/components/ExpenseDashboardCharts";
import { AccountSummaryCard } from "@/components/AccountSummaryCard";

interface PersonalExpense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  account_type?: "Cash" | "Bank";
  description?: string | null;
  date: string;
  created_at: string;
}

const CATEGORIES = [
  { name: "Food & Dining", icon: Utensils },
  { name: "Books & Supplies", icon: BookOpen },
  { name: "Shopping", icon: ShoppingBag },
  { name: "Transportation", icon: Bus },
  { name: "Entertainment", icon: Film },
  { name: "Other", icon: MoreHorizontal },
];

export default function HomePage() {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);

  // Net debts for Net Worth calculation
  const [netOwedToMe, setNetOwedToMe] = useState(0);
  const [netIOwe, setNetIOwe] = useState(0);

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [accountType, setAccountType] = useState<"Cash" | "Bank">("Bank");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchExpensesAndDebts();
  }, []);

  async function fetchExpensesAndDebts() {
    setLoading(true);
    const { data: userResponse } = await supabase.auth.getUser();
    if (!userResponse.user) {
      setLoading(false);
      return;
    }

    const userId = userResponse.user.id;

    // Fetch personal expenses
    const { data: expData, error: expErr } = await supabase
      .from("personal_expenses")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!expErr && expData) {
      setExpenses(expData as PersonalExpense[]);
    }

    // Fetch pending debts to compute net balances
    const { data: debtData } = await supabase
      .from("debts")
      .select("*")
      .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`)
      .eq("status", "Pending");

    if (debtData) {
      const owed = debtData
        .filter((d) => d.lender_id === userId)
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const owe = debtData
        .filter((d) => d.borrower_id === userId)
        .reduce((sum, d) => sum + Number(d.amount), 0);

      setNetOwedToMe(owed);
      setNetIOwe(owe);
    }

    setLoading(false);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than ₹0.");
      return;
    }

    setSubmitting(true);
    const { data: userResponse } = await supabase.auth.getUser();
    const user = userResponse.user;

    if (!user) {
      setErrorMsg("User not authenticated.");
      setSubmitting(false);
      return;
    }

    // STEP 1: Insert into personal_expenses
    const { data: insertedExpense, error: expError } = await supabase
      .from("personal_expenses")
      .insert({
        user_id: user.id,
        amount: parsedAmount,
        category,
        account_type: accountType,
        description: description.trim() || null,
        date,
      })
      .select()
      .single();

    if (expError) {
      setErrorMsg(`Failed to record expense: ${expError.message}`);
      setSubmitting(false);
      return;
    }

    // STEP 2: Deduct expense amount from user_accounts balance
    try {
      const { data: accData } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentCash = accData ? Number(accData.cash_balance) : 1500;
      const currentBank = accData ? Number(accData.bank_balance) : 12000;

      const newCash = accountType === "Cash" ? Math.max(0, currentCash - parsedAmount) : currentCash;
      const newBank = accountType === "Bank" ? Math.max(0, currentBank - parsedAmount) : currentBank;

      await supabase.from("user_accounts").upsert({
        user_id: user.id,
        cash_balance: newCash,
        bank_balance: newBank,
        updated_at: new Date().toISOString(),
      });
    } catch (accErr) {
      console.error("Failed to update account balance:", accErr);
    }

    // STEP 3: Update local UI states immediately
    setExpenses((prev) => [insertedExpense as PersonalExpense, ...prev]);
    setBalanceRefreshTrigger((prev) => prev + 1);

    // Reset Form
    setAmount("");
    setCategory("Food & Dining");
    setAccountType("Bank");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(false);
    setSubmitting(false);
  }

  async function handleDeleteExpense(id: string) {
    setDeletingId(id);
    const { error } = await supabase
      .from("personal_expenses")
      .delete()
      .eq("id", id);

    if (!error) {
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      setBalanceRefreshTrigger((prev) => prev + 1);
    }
    setDeletingId(null);
  }

  // Compute Total Spent This Month
  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const totalSpentThisMonth = expenses
    .filter((exp) => exp.date && exp.date.startsWith(currentMonthYear))
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const totalSpentOverall = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Feature Widget: Account Balances */}
      <AccountSummaryCard
        netOwedToMe={netOwedToMe}
        netIOwe={netIOwe}
        refreshTrigger={balanceRefreshTrigger}
      />

      {/* Hero Section: Total Spent This Month */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#706E6B] dark:text-[#A1A1AA]">
              Total Spent This Month
            </span>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums mt-1 text-[#1A1A1A] dark:text-[#F4F4F5]">
              ₹{totalSpentThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] text-white dark:text-[#121212] text-sm font-semibold transition-all shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80 flex items-center justify-between text-sm font-medium text-[#706E6B] dark:text-[#A1A1AA]">
          <span>All-time total spending:</span>
          <span className="font-semibold tabular-nums text-[#1A1A1A] dark:text-[#F4F4F5]">
            ₹{totalSpentOverall.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Data Visualization Section */}
      <ExpenseDashboardCharts expenses={expenses} />

      {/* Expense List Section */}
      <div className="p-6 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
            Recent Ledger Transactions
          </h3>
          <span className="text-xs text-[#706E6B] dark:text-[#A1A1AA] tabular-nums font-medium">
            {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#18181B] dark:text-[#F4F4F5]" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[#EAE8E3] dark:border-[#2D2D2D]">
            <ShoppingBag className="w-8 h-8 mx-auto text-[#706E6B] dark:text-[#A1A1AA] mb-2 opacity-60" />
            <p className="text-base font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
              No expenses recorded yet
            </p>
            <p className="text-sm font-medium text-[#706E6B] dark:text-[#A1A1AA] mt-1">
              Tap "+ Add Expense" to begin tracking your ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAE8E3]/60 dark:divide-[#2D2D2D]/60">
            {expenses.map((expense) => {
              const catObj =
                CATEGORIES.find((c) => c.name === expense.category) || CATEGORIES[5];
              const Icon = catObj.icon;

              return (
                <div
                  key={expense.id}
                  className="py-3.5 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] flex items-center justify-center text-[#1A1A1A] dark:text-[#F4F4F5] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                          {expense.category}
                        </p>
                        {expense.account_type && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] text-[#706E6B] dark:text-[#A1A1AA]">
                            {expense.account_type}
                          </span>
                        )}
                      </div>
                      
                      {/* Description display */}
                      {expense.description && (
                        <p className="text-xs font-normal text-[#706E6B] dark:text-[#A1A1AA] truncate mt-0.5">
                          {expense.description}
                        </p>
                      )}

                      <p className="text-xs font-medium text-[#706E6B] dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span className="tabular-nums">{expense.date}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-semibold text-[#9E2A2B] dark:text-[#F87171] tabular-nums">
                      -₹{Number(expense.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingId === expense.id}
                      aria-label="Delete Expense"
                      className="p-2 rounded-lg text-[#706E6B] hover:text-[#9E2A2B] dark:text-[#A1A1AA] dark:hover:text-[#F87171] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#EAE8E3] dark:border-[#2D2D2D] rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] dark:border-[#2D2D2D] pb-3">
              <h3 className="text-xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
                Record Expense
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleAddExpense} className="space-y-5">
              {/* Account Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1.5">
                  Paid From Account
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D]">
                  <button
                    type="button"
                    onClick={() => setAccountType("Bank")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      accountType === "Bank"
                        ? "bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F4F4F5] shadow-xs font-bold"
                        : "text-[#706E6B] dark:text-[#A1A1AA]"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Bank Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("Cash")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      accountType === "Cash"
                        ? "bg-white dark:bg-[#1E1E1E] text-[#2E6F40] dark:text-[#4ADE80] shadow-xs font-bold"
                        : "text-[#706E6B] dark:text-[#A1A1AA]"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Liquid Cash</span>
                  </button>
                </div>
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

              {/* Category Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Category
                </label>
                <div className="relative">
                  <Tag className="w-5 h-5 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-7 pr-2 py-3 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] min-h-[44px]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option
                        key={cat.name}
                        value={cat.name}
                        className="bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F4F4F5]"
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Description / Note (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-5 h-5 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
                  <input
                    type="text"
                    placeholder="e.g. Starbucks with study group..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-7 pr-2 py-3 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Date Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-3 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums min-h-[44px]"
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
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] text-white dark:text-[#121212] transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Expense</span>
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
