import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type FinanceProfile, type Transaction, type SavingsGoal, type Debt, type Investment, type NetWorthSnapshot } from "../db"
import { incrementStat } from "../xpEngine"

const EXPENSE_CATEGORIES = [
  { id: "housing",       icon: "🏠", label: "Housing"       },
  { id: "food",          icon: "🍔", label: "Food"          },
  { id: "transport",     icon: "🚗", label: "Transport"     },
  { id: "health",        icon: "❤️", label: "Health"        },
  { id: "entertainment", icon: "🎮", label: "Entertainment" },
  { id: "shopping",      icon: "🛍️", label: "Shopping"      },
  { id: "education",     icon: "🎓", label: "Education"     },
  { id: "savings",       icon: "💰", label: "Savings"       },
  { id: "debt",          icon: "💳", label: "Debt Payment"  },
  { id: "other",         icon: "📦", label: "Other"         },
]

const INCOME_CATEGORIES = [
  { id: "salary",     icon: "💼", label: "Salary"     },
  { id: "freelance",  icon: "💻", label: "Freelance"  },
  { id: "investment", icon: "📈", label: "Investment" },
  { id: "side_hustle",icon: "⚡", label: "Side Hustle"},
  { id: "other",      icon: "📦", label: "Other"      },
]

const GOAL_COLORS = ["#f0c040", "#40d4e8", "#9b6ff0", "#40e890", "#e84040", "#f08040"]
const GOAL_ICONS  = ["🏠", "🚗", "✈️", "💍", "📱", "🎓", "💰", "🌍", "🏋️", "🎮"]

const DEBT_TYPES = [
  { id: "credit_card",   icon: "💳", label: "Credit Card"   },
  { id: "student_loan",  icon: "🎓", label: "Student Loan"  },
  { id: "car_loan",      icon: "🚗", label: "Car Loan"      },
  { id: "mortgage",      icon: "🏠", label: "Mortgage"      },
  { id: "personal_loan", icon: "🤝", label: "Personal Loan" },
  { id: "other",         icon: "📦", label: "Other"         },
]

const INVESTMENT_TYPES = [
  { id: "stocks",      icon: "📈", label: "Stocks"      },
  { id: "crypto",      icon: "₿",  label: "Crypto"      },
  { id: "real_estate", icon: "🏠", label: "Real Estate" },
  { id: "etf",         icon: "📊", label: "ETF"         },
  { id: "bonds",       icon: "📜", label: "Bonds"       },
  { id: "other",       icon: "💼", label: "Other"       },
]

const FINANCE_TABS = [
  { id: "overview",     icon: "📊", label: "Overview"     },
  { id: "budget",       icon: "💵", label: "Budget"       },
  { id: "goals",        icon: "🎯", label: "Goals"        },
  { id: "debt",         icon: "💳", label: "Debt"         },
  { id: "investments",  icon: "📈", label: "Investments"  },
]

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FinancePage({ onUserUpdate }: { onUserUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [profile, setProfile] = useState<FinanceProfile | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [monthlyIncome, setMonthlyIncome] = useState("")
  const [currency, setCurrency] = useState("USD")

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const p = await db.financeProfile.toCollection().first()
    setProfile(p ?? null)
    if (!p) setShowSetup(true)
  }

  async function saveProfile() {
    if (!monthlyIncome) return
    await db.financeProfile.add({
      currency,
      monthlyIncome: Number(monthlyIncome),
      createdAt: new Date(),
    })
    loadProfile()
    setShowSetup(false)
  }

  if (showSetup && !profile) {
    return (
      <div className="space-y-6 px-1">
        <div className="text-center py-4">
          <div className="text-5xl mb-3">💰</div>
          <div className="font-rajdhani font-bold text-2xl text-white tracking-wide">FINANCE SETUP</div>
          <div className="font-mono text-[10px] text-muted mt-2 tracking-wide">Let's set up your financial dashboard</div>
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Currency</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors"
          >
            {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN", "BRL"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Monthly Income</label>
          <input
            type="number"
            value={monthlyIncome}
            onChange={e => setMonthlyIncome(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
            autoFocus
          />
          <div className="font-mono text-[9px] text-muted mt-1.5">You can update this anytime</div>
        </div>

        <button
          onClick={saveProfile}
          disabled={!monthlyIncome}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widest uppercase disabled:opacity-30"
        >
          Get Started
        </button>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
        {FINANCE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-widest border transition-all ${
              activeTab === tab.id
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {activeTab === "overview"    && <OverviewTab    profile={profile} onUserUpdate={onUserUpdate} />}
      {activeTab === "budget"      && <BudgetTab      profile={profile} />}
      {activeTab === "goals"       && <GoalsTab       profile={profile} onUserUpdate={onUserUpdate} />}
      {activeTab === "debt"        && <DebtTab        profile={profile} />}
      {activeTab === "investments" && <InvestmentsTab profile={profile} onUserUpdate={onUserUpdate} />}
    </div>
  )
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────

function OverviewTab({ profile, onUserUpdate }: { profile: FinanceProfile; onUserUpdate: () => void }) {
  const [netWorth, setNetWorth] = useState(0)
  const [assets, setAssets] = useState(0)
  const [liabilities, setLiabilities] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([])

  useEffect(() => { loadOverview() }, [])

  async function loadOverview() {
    const investments = await db.investments.toArray()
    const goals = await db.savingsGoals.toArray()
    const debts = await db.debts.toArray()
    const snaps = await db.netWorthSnapshots.orderBy("date").reverse().limit(6).toArray()

    const totalInvestments = investments.reduce((a, i) => a + i.currentValue, 0)
    const totalSavings = goals.reduce((a, g) => a + g.currentAmount, 0)
    const totalAssets = totalInvestments + totalSavings
    const totalLiabilities = debts.reduce((a, d) => a + d.remainingAmount, 0)

    const thisMonth = new Date().toISOString().slice(0, 7)
    const expenses = await db.transactions
      .filter(t => t.type === "expense" && t.date.startsWith(thisMonth))
      .toArray()
    const totalExpenses = expenses.reduce((a, t) => a + t.amount, 0)

    setAssets(totalAssets)
    setLiabilities(totalLiabilities)
    setNetWorth(totalAssets - totalLiabilities)
    setMonthlyExpenses(totalExpenses)
    setSnapshots(snaps.reverse())
  }

  async function saveSnapshot() {
    await db.netWorthSnapshots.add({
      date: new Date().toISOString().split("T")[0],
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth,
      createdAt: new Date(),
    })
    await incrementStat("WEALTH", 0.5)
    onUserUpdate()
    loadOverview()
  }

  const remaining = profile.monthlyIncome - monthlyExpenses
  const spentPct = Math.min((monthlyExpenses / profile.monthlyIncome) * 100, 100)

  return (
    <div className="space-y-4">

      {/* Net worth hero */}
      <div className={`border rounded-xl p-5 text-center ${
        netWorth >= 0 ? "border-gold/30 bg-gold/5" : "border-red/30 bg-red/5"
      }`}>
        <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-1">Net Worth</div>
        <div className={`font-rajdhani font-bold leading-none mb-1 ${
          netWorth >= 0 ? "text-gold" : "text-red"
        }`} style={{ fontSize: "42px" }}>
          {formatCurrency(netWorth, profile.currency)}
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <div className="text-center">
            <div className="font-rajdhani font-bold text-lg text-green leading-none">
              {formatCurrency(assets, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-0.5">ASSETS</div>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="font-rajdhani font-bold text-lg text-red leading-none">
              {formatCurrency(liabilities, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-0.5">LIABILITIES</div>
          </div>
        </div>
        <button
          onClick={saveSnapshot}
          className="mt-4 font-mono text-[9px] text-muted border border-border rounded-lg px-3 py-1.5 hover:border-gold hover:text-gold transition-all tracking-widest"
        >
          📸 SAVE SNAPSHOT
        </button>
      </div>

      {/* Monthly budget summary */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-px bg-gold"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">This Month</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="font-rajdhani font-bold text-lg text-green leading-none">
              {formatCurrency(profile.monthlyIncome, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-0.5">INCOME</div>
          </div>
          <div className="text-center">
            <div className="font-rajdhani font-bold text-lg text-red leading-none">
              {formatCurrency(monthlyExpenses, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-0.5">SPENT</div>
          </div>
          <div className="text-center">
            <div className={`font-rajdhani font-bold text-lg leading-none ${remaining >= 0 ? "text-cyan" : "text-red"}`}>
              {formatCurrency(remaining, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-0.5">LEFT</div>
          </div>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${spentPct >= 100 ? "bg-red" : spentPct >= 80 ? "bg-orange" : "bg-green"}`}
            initial={{ width: 0 }}
            animate={{ width: `${spentPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="font-mono text-[9px] text-muted text-right">{Math.round(spentPct)}% of budget used</div>
      </div>

      {/* Net worth history */}
      {snapshots.length > 1 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Net Worth History</span>
          </div>
          <div className="space-y-2">
            {snapshots.slice(-5).reverse().map(snap => (
              <div key={snap.id} className="flex items-center justify-between px-3 py-2 bg-surface2 border border-border rounded-lg">
                <span className="font-mono text-[10px] text-muted">{snap.date}</span>
                <span className={`font-rajdhani font-bold text-sm ${snap.netWorth >= 0 ? "text-gold" : "text-red"}`}>
                  {formatCurrency(snap.netWorth, profile.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── BUDGET ────────────────────────────────────────────────────────────────────

function BudgetTab({ profile }: { profile: FinanceProfile }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [type, setType] = useState<"income" | "expense">("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("food")
  const [description, setDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => { loadTransactions() }, [filterMonth])

  async function loadTransactions() {
    const all = await db.transactions
      .filter(t => t.date.startsWith(filterMonth))
      .toArray()
    setTransactions(all.sort((a, b) => b.date.localeCompare(a.date)))
  }

  async function saveTransaction() {
    if (!amount || !description.trim()) return
    await db.transactions.add({
      amount: Number(amount),
      type,
      category,
      description: description.trim(),
      date: new Date().toISOString().split("T")[0],
      isRecurring,
      createdAt: new Date(),
    })
    setAmount(""); setDescription(""); setIsRecurring(false)
    setShowAdd(false)
    loadTransactions()
  }

  async function deleteTransaction(id: number) {
    await db.transactions.delete(id)
    loadTransactions()
  }

  const income = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0)
  const expenses = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0)

  // Category breakdown
  const categoryTotals = transactions
    .filter(t => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <div className="space-y-4">

      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const d = new Date(filterMonth + "-01")
            d.setMonth(d.getMonth() - 1)
            setFilterMonth(d.toISOString().slice(0, 7))
          }}
          className="font-mono text-[10px] text-muted hover:text-gold transition-colors px-2"
        >←</button>
        <span className="font-mono text-[10px] text-muted tracking-widest">
          {new Date(filterMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => {
            const d = new Date(filterMonth + "-01")
            d.setMonth(d.getMonth() + 1)
            setFilterMonth(d.toISOString().slice(0, 7))
          }}
          className="font-mono text-[10px] text-muted hover:text-gold transition-colors px-2"
        >→</button>
      </div>

      {/* Income vs Expenses */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface border border-green/20 rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-xl text-green leading-none">
            {formatCurrency(income, profile.currency)}
          </div>
          <div className="font-mono text-[9px] text-muted mt-1">INCOME</div>
        </div>
        <div className="bg-surface border border-red/20 rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-xl text-red leading-none">
            {formatCurrency(expenses, profile.currency)}
          </div>
          <div className="font-mono text-[9px] text-muted mt-1">EXPENSES</div>
        </div>
      </div>

      {/* Category breakdown */}
      {topCategories.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Top Expenses</span>
          </div>
          {topCategories.map(([cat, total]) => {
            const catCfg = EXPENSE_CATEGORIES.find(c => c.id === cat)
            const pct = expenses > 0 ? (total / expenses) * 100 : 0
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-muted flex items-center gap-1.5">
                    {catCfg?.icon} {catCfg?.label ?? cat}
                  </span>
                  <span className="font-mono text-[10px] text-white">{formatCurrency(total, profile.currency)}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-red/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add transaction */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted hover:border-gold hover:text-gold transition-all tracking-widest"
      >
        + LOG TRANSACTION
      </button>

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map(t => {
            const catList = t.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
            const catCfg = catList.find(c => c.id === t.category)
            return (
              <div key={t.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{catCfg?.icon ?? "💸"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-rajdhani font-bold text-sm text-white truncate">{t.description}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[9px] text-muted">{t.date}</span>
                    {t.isRecurring && <span className="font-mono text-[8px] text-purple border border-purple/30 rounded px-1">RECURRING</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-rajdhani font-bold text-base ${t.type === "income" ? "text-green" : "text-red"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount, profile.currency)}
                  </span>
                  <button onClick={() => t.id && deleteTransaction(t.id)} className="text-muted hover:text-red transition-colors text-xs">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-8 opacity-30">
          <div className="text-4xl mb-2">💸</div>
          <div className="font-mono text-xs text-muted">No transactions this month</div>
        </div>
      )}

      {/* Add transaction sheet */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 max-h-[85vh] overflow-y-auto w-full"
            >
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">LOG TRANSACTION</span>
                <button onClick={() => setShowAdd(false)} className="text-muted text-xl">✕</button>
              </div>

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                {(["expense", "income"] as const).map(t => (
                  <button key={t} onClick={() => { setType(t); setCategory(t === "expense" ? "food" : "salary") }}
                    className={`py-2.5 rounded-xl border font-mono text-[10px] tracking-widests capitalize transition-all ${
                      type === t
                        ? t === "expense" ? "border-red/40 bg-red/10 text-red" : "border-green/40 bg-green/10 text-green"
                        : "border-border text-muted"
                    }`}>
                    {t === "expense" ? "- Expense" : "+ Income"}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" autoFocus
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
              </div>

              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What was this for?"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
              </div>

              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                        category === cat.id ? "border-gold bg-gold/10 text-gold" : "border-border text-muted"
                      }`}>
                      <span className="text-base">{cat.icon}</span>
                      <span className="font-mono text-[8px] tracking-wide">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted tracking-widests uppercase">Recurring</span>
                <button onClick={() => setIsRecurring(!isRecurring)}
                  className={`font-mono text-[9px] px-3 py-1.5 rounded-lg border transition-all ${
                    isRecurring ? "border-purple/40 bg-purple/10 text-purple" : "border-border text-muted"
                  }`}>
                  {isRecurring ? "ON" : "OFF"}
                </button>
              </div>

              <button onClick={saveTransaction} disabled={!amount || !description.trim()}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Save
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── GOALS ─────────────────────────────────────────────────────────────────────

function GoalsTab({ profile, onUserUpdate }: { profile: FinanceProfile; onUserUpdate: () => void }) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [icon, setIcon] = useState(GOAL_ICONS[0])
  const [color, setColor] = useState(GOAL_COLORS[0])
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [addAmount, setAddAmount] = useState("")

  useEffect(() => { db.savingsGoals.toArray().then(setGoals) }, [])

  async function saveGoal() {
    if (!title.trim() || !target) return
    await db.savingsGoals.add({
      title: title.trim(),
      targetAmount: Number(target),
      currentAmount: 0,
      deadline: deadline || undefined,
      icon,
      color,
      createdAt: new Date(),
    })
    setTitle(""); setTarget(""); setDeadline("")
    setShowAdd(false)
    db.savingsGoals.toArray().then(setGoals)
  }

  async function addToGoal() {
    if (!selectedGoal?.id || !addAmount) return
    const newAmount = Math.min(selectedGoal.currentAmount + Number(addAmount), selectedGoal.targetAmount)
    await db.savingsGoals.update(selectedGoal.id, { currentAmount: newAmount })
    if (newAmount >= selectedGoal.targetAmount) {
      await incrementStat("WEALTH", 1)
      onUserUpdate()
    }
    setAddAmount("")
    setSelectedGoal(null)
    db.savingsGoals.toArray().then(setGoals)
  }

  async function deleteGoal(id: number) {
    await db.savingsGoals.delete(id)
    db.savingsGoals.toArray().then(setGoals)
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(true)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted hover:border-gold hover:text-gold transition-all tracking-widests">
        + NEW SAVINGS GOAL
      </button>

      {goals.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <div className="text-4xl mb-2">🎯</div>
          <div className="font-mono text-xs text-muted">No savings goals yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const isComplete = goal.currentAmount >= goal.targetAmount
            return (
              <motion.div key={goal.id} layout
                className={`bg-surface border rounded-xl p-4 space-y-3 ${isComplete ? "border-green/30" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{goal.icon}</span>
                  <div className="flex-1">
                    <div className="font-rajdhani font-bold text-base text-white">{goal.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px]" style={{ color: goal.color }}>
                        {formatCurrency(goal.currentAmount, profile.currency)}
                      </span>
                      <span className="font-mono text-[9px] text-muted">/ {formatCurrency(goal.targetAmount, profile.currency)}</span>
                      {goal.deadline && <span className="font-mono text-[9px] text-muted">· Due {goal.deadline}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-rajdhani font-bold text-lg" style={{ color: goal.color }}>{Math.round(pct)}%</span>
                    <button onClick={() => deleteGoal(goal.id!)} className="text-muted hover:text-red text-xs transition-colors">✕</button>
                  </div>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: isComplete ? "#40e890" : goal.color }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
                </div>
                {!isComplete && (
                  <button onClick={() => setSelectedGoal(goal)}
                    className="w-full py-2 border border-dashed border-border rounded-lg font-mono text-[9px] text-muted hover:border-gold hover:text-gold transition-all tracking-widests">
                    + ADD FUNDS
                  </button>
                )}
                {isComplete && (
                  <div className="text-center font-mono text-[10px] text-green tracking-widests">🎉 GOAL REACHED!</div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add funds sheet */}
      <AnimatePresence>
        {selectedGoal && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setSelectedGoal(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-gold">ADD TO {selectedGoal.title.toUpperCase()}</span>
                <button onClick={() => setSelectedGoal(null)} className="text-muted text-xl">✕</button>
              </div>
              <div className="font-mono text-[10px] text-muted">
                {formatCurrency(selectedGoal.currentAmount, profile.currency)} / {formatCurrency(selectedGoal.targetAmount, profile.currency)}
              </div>
              <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                placeholder="Amount to add" autoFocus
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
              <button onClick={addToGoal} disabled={!addAmount}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Add Funds
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add goal sheet */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 max-h-[85vh] overflow-y-auto w-full">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-gold">NEW GOAL</span>
                <button onClick={() => setShowAdd(false)} className="text-muted text-xl">✕</button>
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Goal Name</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Emergency Fund, New Car..."
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" autoFocus />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Target Amount</label>
                <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Deadline (optional)</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_ICONS.map(i => (
                    <button key={i} onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all ${
                        icon === i ? "border-gold bg-gold/10" : "border-border"
                      }`}>{i}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Color</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <button onClick={saveGoal} disabled={!title.trim() || !target}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Create Goal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── DEBT ──────────────────────────────────────────────────────────────────────

function DebtTab({ profile }: { profile: FinanceProfile }) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [debtType, setDebtType] = useState<Debt["type"]>("credit_card")
  const [total, setTotal] = useState("")
  const [remaining, setRemaining] = useState("")
  const [rate, setRate] = useState("")
  const [minPayment, setMinPayment] = useState("")
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [payAmount, setPayAmount] = useState("")

  useEffect(() => { db.debts.toArray().then(setDebts) }, [])

  async function saveDebt() {
    if (!title.trim() || !total || !remaining) return
    await db.debts.add({
      title: title.trim(),
      type: debtType,
      totalAmount: Number(total),
      remainingAmount: Number(remaining),
      interestRate: Number(rate) || 0,
      minimumPayment: Number(minPayment) || 0,
      createdAt: new Date(),
    })
    setTitle(""); setTotal(""); setRemaining(""); setRate(""); setMinPayment("")
    setShowAdd(false)
    db.debts.toArray().then(setDebts)
  }

  async function makePayment() {
    if (!selectedDebt?.id || !payAmount) return
    const newRemaining = Math.max(selectedDebt.remainingAmount - Number(payAmount), 0)
    await db.debts.update(selectedDebt.id, { remainingAmount: newRemaining })
    setPayAmount("")
    setSelectedDebt(null)
    db.debts.toArray().then(setDebts)
  }

  async function deleteDebt(id: number) {
    await db.debts.delete(id)
    db.debts.toArray().then(setDebts)
  }

  const totalDebt = debts.reduce((a, d) => a + d.remainingAmount, 0)
  const totalMinPayments = debts.reduce((a, d) => a + d.minimumPayment, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface border border-red/20 rounded-xl p-3 text-center">
            <div className="font-rajdhani font-bold text-xl text-red leading-none">
              {formatCurrency(totalDebt, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-1">TOTAL DEBT</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="font-rajdhani font-bold text-xl text-orange leading-none">
              {formatCurrency(totalMinPayments, profile.currency)}
            </div>
            <div className="font-mono text-[9px] text-muted mt-1">MIN PAYMENTS/MO</div>
          </div>
        </div>
      )}

      <button onClick={() => setShowAdd(true)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted hover:border-red/40 hover:text-red transition-all tracking-widests">
        + ADD DEBT
      </button>

      {debts.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <div className="text-4xl mb-2">💳</div>
          <div className="font-mono text-xs text-muted">No debts tracked. Debt free? 🎉</div>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map(debt => {
            const pct = Math.min(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100, 100)
            const typeCfg = DEBT_TYPES.find(t => t.id === debt.type)
            const isPaidOff = debt.remainingAmount === 0
            return (
              <div key={debt.id} className={`bg-surface border rounded-xl p-4 space-y-3 ${isPaidOff ? "border-green/30 opacity-60" : "border-red/20"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{typeCfg?.icon ?? "💳"}</span>
                  <div className="flex-1">
                    <div className="font-rajdhani font-bold text-base text-white">{debt.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-[9px] text-red">{formatCurrency(debt.remainingAmount, profile.currency)} left</span>
                      {debt.interestRate > 0 && <span className="font-mono text-[9px] text-orange">{debt.interestRate}% APR</span>}
                      {debt.minimumPayment > 0 && <span className="font-mono text-[9px] text-muted">Min: {formatCurrency(debt.minimumPayment, profile.currency)}/mo</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteDebt(debt.id!)} className="text-muted hover:text-red text-xs transition-colors">✕</button>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[9px] text-muted">{Math.round(pct)}% paid off</span>
                    <span className="font-mono text-[9px] text-muted">{formatCurrency(debt.totalAmount, profile.currency)} total</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-green"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                  </div>
                </div>
                {!isPaidOff && (
                  <button onClick={() => setSelectedDebt(debt)}
                    className="w-full py-2 border border-dashed border-border rounded-lg font-mono text-[9px] text-muted hover:border-green/40 hover:text-green transition-all tracking-widests">
                    + MAKE PAYMENT
                  </button>
                )}
                {isPaidOff && <div className="text-center font-mono text-[10px] text-green">PAID OFF! 🎉</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Payment sheet */}
      <AnimatePresence>
        {selectedDebt && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setSelectedDebt(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-green">MAKE PAYMENT</span>
                <button onClick={() => setSelectedDebt(null)} className="text-muted text-xl">✕</button>
              </div>
              <div className="font-mono text-[10px] text-muted">
                {selectedDebt.title} · {formatCurrency(selectedDebt.remainingAmount, profile.currency)} remaining
              </div>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                placeholder={`Min: ${formatCurrency(selectedDebt.minimumPayment, profile.currency)}`} autoFocus
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green transition-colors placeholder:text-muted" />
              <button onClick={makePayment} disabled={!payAmount}
                className="w-full bg-green text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Record Payment
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add debt sheet */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 max-h-[85vh] overflow-y-auto w-full">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-gold">ADD DEBT</span>
                <button onClick={() => setShowAdd(false)} className="text-muted text-xl">✕</button>
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Debt Name</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chase Credit Card"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" autoFocus />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEBT_TYPES.map(t => (
                    <button key={t.id} onClick={() => setDebtType(t.id as any)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                        debtType === t.id ? "border-gold bg-gold/10 text-gold" : "border-border text-muted"
                      }`}>
                      <span className="text-base">{t.icon}</span>
                      <span className="font-mono text-[8px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Total Amount</label>
                  <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="0"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Remaining</label>
                  <input type="number" value={remaining} onChange={e => setRemaining(e.target.value)} placeholder="0"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Interest Rate %</label>
                  <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 19.9"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Min Payment/mo</label>
                  <input type="number" value={minPayment} onChange={e => setMinPayment(e.target.value)} placeholder="0"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
              </div>
              <button onClick={saveDebt} disabled={!title.trim() || !total || !remaining}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Add Debt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── INVESTMENTS ───────────────────────────────────────────────────────────────

function InvestmentsTab({ profile, onUserUpdate }: { profile: FinanceProfile; onUserUpdate: () => void }) {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [invType, setInvType] = useState<Investment["type"]>("stocks")
  const [invested, setInvested] = useState("")
  const [currentVal, setCurrentVal] = useState("")
  const [ticker, setTicker] = useState("")
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null)
  const [newValue, setNewValue] = useState("")

  useEffect(() => { db.investments.toArray().then(setInvestments) }, [])

  async function saveInvestment() {
    if (!title.trim() || !invested || !currentVal) return
    await db.investments.add({
      title: title.trim(),
      type: invType,
      amountInvested: Number(invested),
      currentValue: Number(currentVal),
      ticker: ticker.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await incrementStat("WEALTH", 0.5)
    onUserUpdate()
    setTitle(""); setInvested(""); setCurrentVal(""); setTicker("")
    setShowAdd(false)
    db.investments.toArray().then(setInvestments)
  }

  async function updateValue() {
    if (!selectedInv?.id || !newValue) return
    await db.investments.update(selectedInv.id, {
      currentValue: Number(newValue),
      updatedAt: new Date(),
    })
    setNewValue("")
    setSelectedInv(null)
    db.investments.toArray().then(setInvestments)
  }

  async function deleteInvestment(id: number) {
    await db.investments.delete(id)
    db.investments.toArray().then(setInvestments)
  }

  const totalInvested = investments.reduce((a, i) => a + i.amountInvested, 0)
  const totalValue = investments.reduce((a, i) => a + i.currentValue, 0)
  const totalGain = totalValue - totalInvested
  const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  return (
    <div className="space-y-4">
      {investments.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-rajdhani font-bold text-lg text-muted leading-none">
                {formatCurrency(totalInvested, profile.currency)}
              </div>
              <div className="font-mono text-[9px] text-muted mt-0.5">INVESTED</div>
            </div>
            <div>
              <div className="font-rajdhani font-bold text-lg text-gold leading-none">
                {formatCurrency(totalValue, profile.currency)}
              </div>
              <div className="font-mono text-[9px] text-muted mt-0.5">VALUE</div>
            </div>
            <div>
              <div className={`font-rajdhani font-bold text-lg leading-none ${totalGain >= 0 ? "text-green" : "text-red"}`}>
                {totalGain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
              </div>
              <div className="font-mono text-[9px] text-muted mt-0.5">RETURN</div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setShowAdd(true)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted hover:border-gold hover:text-gold transition-all tracking-widests">
        + ADD INVESTMENT
      </button>

      {investments.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <div className="text-4xl mb-2">📈</div>
          <div className="font-mono text-xs text-muted">No investments tracked yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {investments.map(inv => {
            const gain = inv.currentValue - inv.amountInvested
            const gainPct = inv.amountInvested > 0 ? (gain / inv.amountInvested) * 100 : 0
            const typeCfg = INVESTMENT_TYPES.find(t => t.id === inv.type)
            return (
              <div key={inv.id} className="bg-surface border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{typeCfg?.icon ?? "📈"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-rajdhani font-bold text-base text-white">{inv.title}</div>
                      {inv.ticker && <span className="font-mono text-[9px] text-muted">{inv.ticker}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-[9px] text-gold">{formatCurrency(inv.currentValue, profile.currency)}</span>
                      <span className={`font-mono text-[9px] ${gain >= 0 ? "text-green" : "text-red"}`}>
                        {gain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setSelectedInv(inv)}
                      className="font-mono text-[9px] text-muted border border-border rounded px-2 py-1 hover:border-gold hover:text-gold transition-all">
                      UPDATE
                    </button>
                    <button onClick={() => deleteInvestment(inv.id!)} className="text-muted hover:text-red text-xs transition-colors">✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Update value sheet */}
      <AnimatePresence>
        {selectedInv && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setSelectedInv(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-gold">UPDATE VALUE</span>
                <button onClick={() => setSelectedInv(null)} className="text-muted text-xl">✕</button>
              </div>
              <div className="font-mono text-[10px] text-muted">
                {selectedInv.title} · Current: {formatCurrency(selectedInv.currentValue, profile.currency)}
              </div>
              <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)}
                placeholder="New current value" autoFocus
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
              <button onClick={updateValue} disabled={!newValue}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Update
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add investment sheet */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 max-h-[85vh] overflow-y-auto w-full">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-bold text-lg text-gold">ADD INVESTMENT</span>
                <button onClick={() => setShowAdd(false)} className="text-muted text-xl">✕</button>
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Name</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Apple Stock, Bitcoin..."
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" autoFocus />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {INVESTMENT_TYPES.map(t => (
                    <button key={t.id} onClick={() => setInvType(t.id as any)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                        invType === t.id ? "border-gold bg-gold/10 text-gold" : "border-border text-muted"
                      }`}>
                      <span className="text-base">{t.icon}</span>
                      <span className="font-mono text-[8px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Ticker (optional)</label>
                <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="e.g. AAPL, BTC"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Amount Invested</label>
                  <input type="number" value={invested} onChange={e => setInvested(e.target.value)} placeholder="0"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Current Value</label>
                  <input type="number" value={currentVal} onChange={e => setCurrentVal(e.target.value)} placeholder="0"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
              </div>
              <button onClick={saveInvestment} disabled={!title.trim() || !invested || !currentVal}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
                Add Investment
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}