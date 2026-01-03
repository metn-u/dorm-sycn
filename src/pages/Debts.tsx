import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Expense, Profile } from '../types'
import { format } from 'date-fns'
import { Receipt, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Debts() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [allExpenses, setAllExpenses] = useState<Expense[]>([])
    const [profiles, setProfiles] = useState<Record<string, Profile>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!room?.id) return

        const fetchData = async () => {
            setLoading(true)
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })

            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .eq('room_id', room.id)

            if (expensesData) setAllExpenses(expensesData)

            const profileMap: Record<string, Profile> = {}
            if (profilesData) {
                profilesData.forEach(p => profileMap[p.id] = p)
                setProfiles(profileMap)
            }

            setLoading(false)
        }

        fetchData()
    }, [room?.id])

    const markAsPaid = async (expenseId: string) => {
        const expense = allExpenses.find(e => e.id === expenseId)
        if (!expense || !user || !room?.id) return

        if (expense.type === 'group' && !expense.split_with) {
            // Legacy group split: Need to split it now so others still owe
            const share = expense.amount / (Object.keys(profiles).length || 1)
            const otherRoommates = Object.keys(profiles).filter(pid => pid !== user.id && pid !== expense.paid_by)

            // 1. Create new direct pending expenses for others
            if (otherRoommates.length > 0) {
                const newExpenses = otherRoommates.map(pid => ({
                    description: expense.description,
                    amount: share,
                    paid_by: expense.paid_by,
                    room_id: room.id,
                    split_with: pid,
                    type: 'direct',
                    status: 'pending',
                    created_at: expense.created_at // Keep original date
                }))
                await supabase.from('expenses').insert(newExpenses)
            }

            // 2. Update current one to be a direct paid expense for ME
            const { error } = await supabase
                .from('expenses')
                .update({
                    status: 'paid',
                    type: 'direct',
                    amount: share,
                    split_with: user.id
                })
                .eq('id', expenseId)

            if (error) {
                alert('Failed to settle your share')
            } else {
                // Refresh data to show new state
                window.location.reload()
            }
        } else {
            // New direct split or already split: just mark as paid
            const { error } = await supabase
                .from('expenses')
                .update({ status: 'paid' })
                .eq('id', expenseId)

            if (error) {
                alert('Failed to mark as paid')
            } else {
                setAllExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'paid' } : e))
            }
        }
    }

    const pendingExpenses = allExpenses.filter(e => e.status === 'pending')

    // Filter expenses where I owe money
    const debtsIOwe = pendingExpenses.filter(e => {
        if (!user) return false
        if (e.paid_by === user.id) return false
        if (e.type === 'direct') return e.split_with === user.id
        return true // Group split, everyone (including me) owes
    })

    // Filter expenses where others owe me
    const debtsOwedToMe = pendingExpenses.filter(e => {
        if (!user) return false
        return e.paid_by === user.id
    })

    const calculateMyShareIOwe = (expense: Expense) => {
        if (expense.split_with) return expense.amount
        const roommatesCount = Object.keys(profiles).length || 1
        return expense.amount / roommatesCount
    }

    const calculateOthersShareOwedToMe = (expense: Expense) => {
        if (expense.split_with) return expense.amount
        const roommatesCount = Object.keys(profiles).length || 1
        return expense.amount - (expense.amount / roommatesCount)
    }

    const myBalance = () => {
        if (!user) return 0
        let balance = 0
        const roommatesCount = Object.keys(profiles).length || 1

        pendingExpenses.forEach(e => {
            if (e.split_with) {
                if (e.paid_by === user.id) balance += e.amount
                if (e.split_with === user.id) balance -= e.amount
            } else {
                // Legacy group split
                if (e.paid_by === user.id) balance += e.amount
                balance -= (e.amount / roommatesCount)
            }
        })
        return balance
    }

    const balance = myBalance()

    return (
        <div className="space-y-12">
            <header className="flex items-end justify-between pb-2 border-b border-slate-200">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Hub</h2>
                    <p className="text-slate-500 text-sm">Manage shared expenses</p>
                </div>
                <div className={cn(
                    "px-4 py-2 rounded-2xl font-bold text-xl border shadow-sm",
                    balance >= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                    {balance >= 0 ? '+' : ''}{balance.toFixed(0)} TL
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin border-4 border-slate-200 border-t-indigo-600 rounded-full h-12 w-12"></div>
                </div>
            ) : (
                <>
                    {/* Debts I Owe */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                <ArrowDownLeft className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Money You Owe</h3>
                            <div className="h-px flex-1 bg-slate-200 ml-3"></div>
                        </div>

                        {debtsIOwe.length === 0 ? (
                            <div className="bento-card bg-slate-50/50 border-dashed border-2 border-slate-200 text-center py-12">
                                <p className="text-slate-400 font-bold italic">You're all settled! 🎉</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {debtsIOwe.map(e => (
                                    <div key={e.id} className="bento-card flex items-center justify-between hover:bg-rose-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                                                <Receipt className="w-6 h-6" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 tracking-tight text-lg leading-none">{e.description}</h4>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                                                    To {profiles[e.paid_by]?.username || 'Unknown'} • {format(new Date(e.created_at), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-3">
                                            <span className="text-2xl font-bold text-slate-900 tracking-tight">₺{calculateMyShareIOwe(e).toFixed(0)}</span>
                                            <button
                                                onClick={() => markAsPaid(e.id)}
                                                className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-colors shadow-sm active:scale-95"
                                            >
                                                Settle Dept
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Money Owed to Me */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Owed To You</h3>
                            <div className="h-px flex-1 bg-slate-200 ml-3"></div>
                        </div>

                        {debtsOwedToMe.length === 0 ? (
                            <div className="bento-card bg-slate-50/50 border-dashed border-2 border-slate-200 text-center py-12">
                                <p className="text-slate-400 font-bold italic">Nothing here yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {debtsOwedToMe.map(e => (
                                    <div key={e.id} className="bento-card flex items-center justify-between hover:bg-emerald-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                                                <Receipt className="w-6 h-6" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 tracking-tight text-lg leading-none">{e.description}</h4>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                                                    {e.type === 'direct' ? `From ${profiles[e.split_with || '']?.username || 'Somebody'}` : 'Room split'} • {format(new Date(e.created_at), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-3">
                                            <span className="text-2xl font-bold text-slate-900 tracking-tight">₺{calculateOthersShareOwedToMe(e).toFixed(0)}</span>
                                            <div className="bg-slate-100 text-slate-500 px-3 py-1 font-bold uppercase text-[9px] tracking-widest rounded-lg border border-slate-200">
                                                Awaiting payment
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
                                <History className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Transaction Log</h3>
                            <div className="h-px flex-1 bg-slate-200 ml-3"></div>
                        </div>

                        <div className="bento-card !p-2 divide-y divide-slate-100">
                            {allExpenses.map(expense => (
                                <div key={expense.id} className="p-4 flex items-center gap-4 relative group">
                                    <div className={cn(
                                        "p-3 rounded-2xl border transition-colors",
                                        expense.status === 'paid'
                                            ? "bg-slate-50 text-slate-300 border-slate-100"
                                            : "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm"
                                    )}>
                                        <Receipt className="w-6 h-6" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className={cn(
                                                "font-bold text-base tracking-tight truncate leading-none",
                                                expense.status === 'paid' ? "text-slate-400" : "text-slate-900"
                                            )}>{expense.description}</h4>
                                            {expense.type === 'direct' && (
                                                <span className="text-[8px] bg-slate-900 text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">
                                                    Direct
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                                            {profiles[expense.paid_by]?.username} {expense.split_with ? `to ${profiles[expense.split_with]?.username}` : ''} • {format(new Date(expense.created_at), 'MMM d')}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <span className={cn(
                                            "text-xl font-bold tracking-tight",
                                            expense.status === 'paid' ? "text-slate-300" : "text-slate-900"
                                        )}>₺{expense.amount.toFixed(0)}</span>
                                        {expense.status === 'paid' && (
                                            <span className="text-[8px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                Settled
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
