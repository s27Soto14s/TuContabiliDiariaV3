/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, ReactNode } from 'react';
import { 
  Plus, 
  Minus, 
  Calculator, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowUp, 
  ArrowDown,
  Info,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, FinancialSummary, TransactionType, ExpenseCategory } from './types';
import { getFinancialAdvice } from './services/gemini';

// --- Components ---

type ThemeType = 'midnight' | 'charcoal' | 'obsidian' | 'ebony';

const themes = {
  midnight: {
    bg: 'bg-slate-950',
    card: 'bg-slate-900 border-slate-800',
    accent: 'text-indigo-400',
    button: 'bg-indigo-600 hover:bg-indigo-500',
    gradient: 'radial-gradient(at 0% 0%, #1e1b4b 0px, transparent 50%), radial-gradient(at 100% 100%, #312e81 0px, transparent 50%)'
  },
  charcoal: {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900 border-zinc-800',
    accent: 'text-emerald-400',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    gradient: 'radial-gradient(at 0% 0%, #18181b 0px, transparent 50%), radial-gradient(at 100% 100%, #27272a 0px, transparent 50%)'
  },
  obsidian: {
    bg: 'bg-neutral-950',
    card: 'bg-neutral-900 border-neutral-800',
    accent: 'text-rose-400',
    button: 'bg-rose-600 hover:bg-rose-500',
    gradient: 'radial-gradient(at 0% 0%, #171717 0px, transparent 50%), radial-gradient(at 100% 100%, #262626 0px, transparent 50%)'
  },
  ebony: {
    bg: 'bg-black',
    card: 'bg-stone-900 border-stone-800',
    accent: 'text-amber-400',
    button: 'bg-amber-600 hover:bg-amber-500',
    gradient: 'radial-gradient(at 0% 0%, #000000 0px, transparent 50%), radial-gradient(at 100% 100%, #1c1917 0px, transparent 50%)'
  }
};

const DynamicBackground = ({ theme }: { theme: ThemeType }) => (
  <div className={`fixed inset-0 -z-10 ${themes[theme].bg}`} style={{
    background: themes[theme].gradient
  }}>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
  </div>
);

const Card = ({ children, className = "", theme }: { children: ReactNode, className?: string, theme: ThemeType }) => (
  <div className={`${themes[theme].card} border shadow-2xl rounded-3xl p-6 text-white ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<ThemeType>('midnight');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<TransactionType>("income");
  const [category, setCategory] = useState<ExpenseCategory>("otros");
  const [isCalculated, setIsCalculated] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Financial Statistics
  const summary = useMemo<FinancialSummary>(() => {
    const totalIncomes = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncomes - totalExpenses;
    
    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    let status: 'profit' | 'loss' | 'neutral' = 'neutral';
    let recommendation = "";

    if (balance > 0) {
      status = 'profit';
      recommendation = balance > 500 ? "¡Tu negocio es muy rentable! Sigue así." : "Tu negocio es rentable, pero podrías mejorar el margen.";
    } else if (balance < 0) {
      status = 'loss';
      recommendation = "Tu negocio está en pérdida. Revisa tus gastos urgentemente.";
    } else {
      recommendation = "Tu negocio está equilibrado. Busca nuevas fuentes de ingreso.";
    }

    return { totalIncomes, totalExpenses, balance, categoryBreakdown, status, recommendation };
  }, [transactions]);

  const addTransaction = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !description) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount: Number(amount),
      description,
      category: type === 'income' ? 'ingreso_general' : category,
      date: Date.now(),
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setAmount("");
    setDescription("");
    setIsCalculated(false);
    setAdvice(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setIsCalculated(false);
    setAdvice(null);
  };

  const handleGetAdvice = async () => {
    setIsAiLoading(true);
    const result = await getFinancialAdvice(summary, transactions);
    setAdvice(result);
    setIsAiLoading(false);
  };

  return (
    <div className={`min-h-screen font-sans text-white pb-12 selection:bg-white/20 ${themes[theme].bg}`}>
      <DynamicBackground theme={theme} />

      {/* Theme Selector */}
      <div className="pt-6 px-6 max-w-lg mx-auto flex justify-center gap-3">
        {(Object.keys(themes) as ThemeType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              theme === t ? 'border-white scale-125' : 'border-transparent scale-100 opacity-40 hover:opacity-100'
            }`}
            style={{ 
              backgroundColor: t === 'midnight' ? '#312e81' : t === 'charcoal' ? '#10b981' : t === 'obsidian' ? '#f43f5e' : '#f59e0b'
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="pt-6 pb-6 px-6 max-w-lg mx-auto flex flex-col items-center relative">
        {transactions.length > 0 && (
          <button 
            onClick={() => {
              setIsCalculated(true);
              handleGetAdvice();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter hover:bg-white/10 transition-all text-white/50 hover:text-white"
          >
            <Sparkles className={`w-3 h-3 ${themes[theme].accent}`} /> 
            Consejos IA
          </button>
        )}
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className={`${themes[theme].card} p-3 rounded-2xl shadow-lg border mb-4`}
        >
          <div className="flex flex-col gap-0.5">
            <ArrowUp className="w-5 h-5 text-white" />
            <ArrowDown className="w-5 h-5 text-white" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          TuContabili<span className={themes[theme].accent}>Diaria</span>
        </h1>
        <p className="text-white/40 font-medium text-sm">Gestiona tu pequeño negocio con claridad</p>
      </header>

      <main className="px-5 max-w-lg mx-auto space-y-6">
        
        {/* Form Card */}
        <Card theme={theme}>
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-6 border border-white/5">
            <button
              onClick={() => setType('income')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-bold text-sm ${
                type === 'income' ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Ingreso
            </button>
            <button
              onClick={() => setType('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-bold text-sm ${
                type === 'expense' ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Gasto
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-1.5 ml-1">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-xl font-black text-white placeholder-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-1.5 ml-1">Descripción</label>
              <input
                type="text"
                placeholder="Ej. Venta de productos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-white placeholder-white/10 font-bold"
              />
            </div>

            {type === 'expense' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  {['materiales', 'transporte', 'otros', 'servicios'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat as ExpenseCategory)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black capitalize border transition-all ${
                        category === cat 
                        ? 'border-white/40 bg-white/10 text-white' 
                        : 'border-white/5 bg-transparent text-white/20 hover:border-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <button
              onClick={addTransaction}
              className={`w-full ${themes[theme].button} text-white font-black py-4.5 rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2 mt-2 uppercase tracking-widest text-xs`}
            >
              <Plus className="w-5 h-5" /> Registrar Movimiento
            </button>
          </div>
        </Card>

        {/* Recent Transactions list */}
        {transactions.length > 0 && (
          <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">Historial</h2>
                {transactions.length > 0 && !isCalculated && (
                  <motion.button 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => setIsCalculated(true)}
                    className={`${themes[theme].button} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/20`}
                  >
                    <Calculator className="w-3 h-3" /> Calcular Resultados
                  </motion.button>
                )}
              </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {transactions.slice(0, 5).map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-xl group transition-all hover:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/5 ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-tight">{t.description}</p>
                        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">
                          {t.category === 'ingreso_general' ? 'Ingreso' : t.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount}
                      </span>
                      <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-white/10 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Results Area */}
        <AnimatePresence>
          {isCalculated && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2 mt-4 text-center">Resumen Financiero</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <Card theme={theme} className="flex flex-col items-center justify-center py-8 bg-emerald-500/10 border-emerald-500/20">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 border border-emerald-500/30">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Ingresos</p>
                  <p className="text-2xl font-black text-white">${summary.totalIncomes}</p>
                </Card>

                <Card theme={theme} className="flex flex-col items-center justify-center py-8 bg-rose-500/10 border-rose-500/20">
                  <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-3 border border-rose-500/30">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Gastos</p>
                  <p className="text-2xl font-black text-white">${summary.totalExpenses}</p>
                </Card>
              </div>

              <Card theme={theme} className={`relative overflow-hidden border-2 ${
                summary.status === 'profit' ? 'border-emerald-500/30 bg-emerald-500/5' : 
                summary.status === 'loss' ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/10 bg-white/5'
              }`}>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Resultado Final</p>
                    <p className="text-4xl font-black text-white">${summary.balance}</p>
                  </div>
                  <div className="text-right">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter mb-2 inline-block shadow-lg ${
                      summary.status === 'profit' ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-50'
                    }`}>
                      {summary.status === 'profit' ? 'Rentable' : 
                       summary.status === 'loss' ? 'En Pérdida' : 'Equilibrado'}
                    </div>
                    <p className="text-[10px] font-black leading-tight text-white/40 max-w-[120px] uppercase tracking-wider">
                      {summary.recommendation}
                    </p>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/2 rounded-full blur-3xl" />
              </Card>

              {/* AI Advice Section */}
              <div className="pt-4">
                {!advice ? (
                  <button
                    onClick={handleGetAdvice}
                    disabled={isAiLoading}
                    className="w-full bg-white/5 border border-white/10 text-white font-black py-5 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group uppercase tracking-widest text-xs"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isAiLoading && (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <RefreshCcw className="w-5 h-5 text-white/40" />
                      </motion.div>
                    )}
                    <Sparkles className={`w-5 h-5 ${isAiLoading ? 'animate-pulse text-white' : 'text-white/40'}`} />
                    {isAiLoading ? 'Analizando...' : 'Asesoramiento IA'}
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                     <Card theme={theme} className="bg-white/5 border-white/10 py-8 px-7 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 -z-10 rotate-12">
                          <Sparkles className="w-32 h-32 text-white" />
                        </div>
                        <div className="flex items-center gap-2 mb-4 text-white">
                          <Sparkles className={`w-5 h-5 ${themes[theme].accent}`} />
                          <h3 className="font-black text-lg uppercase tracking-tight">Consejos Inteligentes</h3>
                        </div>
                        <div className="prose prose-sm prose-invert text-white/70 leading-relaxed font-bold italic">
                          {advice.split('\n').map((line, i) => (
                            <p key={i} className="mb-3 last:mb-0">{line}</p>
                          ))}
                        </div>
                        <button 
                          onClick={() => setAdvice(null)}
                          className="mt-6 text-white/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                        >
                          Nuevo análisis <RefreshCcw className="w-3 h-3" />
                        </button>
                     </Card>
                  </motion.div>
                )}
              </div>

              {/* Improvement suggestions footer */}
              <div className="pt-10 border-t border-white/10">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">Para Emprendedores</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Sincronización Bancaria Automática",
                    "Gestión de Inventario",
                    "Reportes PDF Mensuales"
                  ].map((s, i) => (
                    <div key={i} className="bg-white/2 p-4 rounded-xl flex items-center gap-3 border border-white/5 group hover:bg-white/5 transition-all">
                      <div className="w-1 h-1 bg-white/20 rounded-full group-hover:scale-150 transition-all" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em]">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-10 px-10 text-center space-y-4">
          <div className="bg-white/5 p-6 rounded-full border border-white/5 shadow-inner">
            <Plus className="w-8 h-8 text-white/10" />
          </div>
          <p className="text-white/20 text-sm font-medium tracking-wide">No hay movimientos registrados hoy.<br/>Comienza agregando tu primera venta o gasto.</p>
        </div>
      )}
    </div>
  );
}
