'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { Plus, Check, TrendingUp, TrendingDown, Activity, Brain, Target, DollarSign } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null) return 'N/A'
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function MissionBoard() {
  const { data: marketData } = useSWR('/api/market', fetcher, { refreshInterval: 300000 })
  const { data: tasksData, mutate: mutateTasks } = useSWR('/api/tasks', fetcher)

  const [newTask, setNewTask] = useState('')

  const addTask = async () => {
    if (!newTask) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ text: newTask, category: 'Work' }),
    })
    if (res.ok) { setNewTask(''); mutateTasks() }
  }

  const toggleTask = async (id: string, done: boolean) => {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done: !done }) })
    mutateTasks()
  }

  // 跑馬燈用的 ETF 陣列
  const tickerItems: { symbol: string; price: number | null; change: number | null }[] = []
  if (marketData?.etf) {
    for (const [sym, v] of Object.entries(marketData.etf as Record<string, any>)) {
      tickerItems.push({ symbol: sym, price: v?.price ?? null, change: v?.change ?? null })
    }
  }

  // 持股陣列
  const portfolioSymbols = ['TSM', 'NVDA', 'ASML', 'INTC', 'SMCI']
  const portfolio = marketData?.portfolio ?? {}

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">

      {/* ── 跑馬燈 ── */}
      <section className="glass rounded-xl overflow-hidden py-3 h-12 flex items-center">
        <div className="animate-marquee inline-flex gap-8 text-sm font-bold">
          {tickerItems.length > 0 ? tickerItems.map((s) => (
            <span key={s.symbol} className="flex gap-2 items-center whitespace-nowrap">
              <span className="text-white/60">{s.symbol}</span>
              <span className="text-white">${fmt(s.price)}</span>
              <span className={s.change != null && s.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                {s.change != null && s.change >= 0
                  ? <TrendingUp size={12} className="inline mr-0.5"/>
                  : <TrendingDown size={12} className="inline mr-0.5"/>}
                {s.change != null ? Math.abs(s.change).toFixed(2) : '—'}%
              </span>
            </span>
          )) : (
            <span className="text-white/30 italic px-4">載入市場數據中...</span>
          )}
          {/* VIX + F&G 也放跑馬燈 */}
          {marketData?.vix != null && (
            <span className="flex gap-2 items-center whitespace-nowrap">
              <span className="text-yellow-400 font-bold">VIX</span>
              <span className="text-white">{fmt(marketData.vix)}</span>
            </span>
          )}
          {marketData?.usdTwd != null && (
            <span className="flex gap-2 items-center whitespace-nowrap">
              <span className="text-cyan-400 font-bold">USD/TWD</span>
              <span className="text-white">{fmt(marketData.usdTwd, 3)}</span>
            </span>
          )}
          {marketData?.fearGreed?.score != null && (
            <span className="flex gap-2 items-center whitespace-nowrap">
              <span className="text-purple-400 font-bold">F&amp;G</span>
              <span className="text-white">{Math.round(marketData.fearGreed.score)} {marketData.fearGreed.rating}</span>
            </span>
          )}
        </div>
      </section>

      {/* ── 持股損益卡片 ── */}
      <section className="glass p-4 md:p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-400">
            <DollarSign size={20}/> 持股損益
          </h3>
          {marketData?.totalPL != null && (
            <span className={cn(
              'text-sm font-bold px-3 py-1 rounded-full',
              marketData.totalPL >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}>
              {marketData.totalPL >= 0 ? '+' : ''}${fmt(marketData.totalPL, 0)}
              &nbsp;({marketData.totalReturn >= 0 ? '+' : ''}{fmt(marketData.totalReturn)}%)
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {portfolioSymbols.map((sym) => {
            const p = portfolio[sym]
            const isSmci = sym === 'SMCI'
            const up = p?.pl != null && p.pl >= 0
            return (
              <div key={sym} className={cn(
                'rounded-2xl p-3 space-y-1 border',
                isSmci ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'
              )}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">{sym}</span>
                  {isSmci && <span className="text-[10px] text-red-400">⚠️</span>}
                </div>
                <div className="text-white text-sm font-bold">
                  ${p?.price != null ? fmt(p.price) : '—'}
                </div>
                <div className={cn('text-xs font-bold', up ? 'text-green-400' : 'text-red-400')}>
                  {p?.pl != null ? `${p.pl >= 0 ? '+' : ''}$${fmt(Math.abs(p.pl), 0)}` : '—'}
                </div>
                <div className={cn('text-[10px]', up ? 'text-green-300/70' : 'text-red-300/70')}>
                  {p?.plPct != null ? `${p.plPct >= 0 ? '+' : ''}${fmt(p.plPct)}%` : '—'}
                </div>
                {p?.change != null && (
                  <div className={cn('text-[10px]', p.change >= 0 ? 'text-green-300/60' : 'text-red-300/60')}>
                    今日 {p.change >= 0 ? '+' : ''}{fmt(p.change)}%
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 每日任務 ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 text-[#6366F1]">
              <Target size={28}/> MISSION BOARD
            </h2>
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="快速指派任務..."
                className="bg-transparent border-none focus:ring-0 text-sm px-4 w-40 lg:w-56"
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <button onClick={addTask} className="bg-[#6366F1] p-2 rounded-full hover:bg-[#4F46E5] transition-all">
                <Plus size={18}/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasksData?.tasks?.map((task: any) => (
              <div
                key={task.id}
                className={cn(
                  'glass p-4 rounded-2xl border transition-all cursor-pointer group',
                  task.done ? 'border-green-500/20 bg-green-500/5 opacity-60' : 'border-white/10 hover:border-[#6366F1]/50'
                )}
                onClick={() => toggleTask(task.id, task.done)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                      task.category === 'Work' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    )}>{task.category}</span>
                    <p className={cn('font-medium', task.done && 'line-through')}>{task.text}</p>
                  </div>
                  {task.done
                    ? <Check className="text-green-400" size={20}/>
                    : <div className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-[#6366F1]"/>}
                </div>
              </div>
            )) || <div className="col-span-2 py-12 text-center text-white/20 italic">目前尚無任務</div>}
          </div>
        </div>

        {/* ── 系統側欄 ── */}
        <div className="space-y-6">
          {/* 市場指標 */}
          <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2 text-cyan-400">
              <Activity size={18}/> 市場指標
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">VIX</span>
                <span className={cn('font-bold', (marketData?.vix ?? 20) > 25 ? 'text-red-400' : 'text-green-400')}>
                  {marketData?.vix != null ? fmt(marketData.vix) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">USD/TWD</span>
                <span className="font-bold text-cyan-300">
                  {marketData?.usdTwd != null ? fmt(marketData.usdTwd, 3) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Fear &amp; Greed</span>
                <span className="font-bold text-purple-300">
                  {marketData?.fearGreed?.score != null
                    ? `${Math.round(marketData.fearGreed.score)} (${marketData.fearGreed.rating})`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">GOLD</span>
                <span className="font-bold text-yellow-300">
                  {marketData?.commodities?.GOLD?.price != null ? `$${fmt(marketData.commodities.GOLD.price)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">OIL (WTI)</span>
                <span className="font-bold text-orange-300">
                  {marketData?.commodities?.OIL?.price != null ? `$${fmt(marketData.commodities.OIL.price)}` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2 text-yellow-400">
              <Brain size={18}/> AI INSIGHTS
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              根據最新的 <span className="text-white font-bold underline decoration-[#6366F1]">INTC Q1 爆表</span> 情報，
              老大 $22.85 成本 100 股目前已達 +264%，是全倉最大驚喜。
              TSM +147% 為最大獲利來源，持續 DCA 中。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
