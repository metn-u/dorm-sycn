import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Expense, Profile } from '../types'
import { format } from 'date-fns'
import { Receipt, CheckCircle, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react'
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
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-800">Debts</h2>
                    <p className="text-slate-500 text-sm font-medium">Manage your shared finances</p>
                </div>
                <div className={cn(
                    "px-4 py-2 rounded-xl font-bold text-lg",
                    balance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                    {balance >= 0 ? '+' : ''}{balance.toFixed(2)} TL
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* Debts I Owe */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                                <ArrowDownLeft className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Money You Owe</h3>
                        </div>

                        {debtsIOwe.length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 text-sm">You're all settled up! 🎉</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {debtsIOwe.map(e => (
                                    <div key={e.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{e.description}</h4>
                                                <p className="text-xs text-slate-500">
                                                    To {profiles[e.paid_by]?.username || 'Unknown'} • {format(new Date(e.created_at), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="font-bold text-rose-600">₺{calculateMyShareIOwe(e).toFixed(2)}</span>
                                            <button
                                                onClick={() => markAsPaid(e.id)}
                                                className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Settle
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Money Owed to Me */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Money Owed To You</h3>
                        </div>

                        {debtsOwedToMe.length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 text-sm">Nobody owes you anything yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {debtsOwedToMe.map(e => (
                                    <div key={e.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{e.description}</h4>
                                                <p className="text-xs text-slate-500">
                                                    {e.type === 'direct' ? `From ${profiles[e.split_with || '']?.username || 'Somebody'}` : 'Room split'} • {format(new Date(e.created_at), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="font-bold text-emerald-600">₺{calculateOthersShareOwedToMe(e).toFixed(2)}</span>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center gap-1.5 opacity-50 cursor-not-allowed">
                                                <History className="w-3.5 h-3.5" />
                                                Waiting for Debtor
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                <History className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Recent Transactions</h3>
                        </div>

                        <div className="space-y-3">
                            {allExpenses.map(expense => (
                                <div key={expense.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
                                    {expense.status === 'paid' && (
                                        <div className="absolute top-0 right-0 py-1 px-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm">
                                            Paid
                                        </div>
                                    )}
                                    <div className={cn(
                                        "p-3 rounded-xl",
                                        expense.status === 'paid' ? "bg-slate-50 text-slate-400" : "bg-indigo-50 text-indigo-600"
                                    )}>
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={cn(
                                                "font-bold",
                                                expense.status === 'paid' ? "text-slate-400" : "text-slate-800"
                                            )}>{expense.description}</h4>
                                            {expense.type === 'direct' && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    Individual
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {profiles[expense.paid_by]?.username} {expense.type === 'direct' ? `to ${profiles[expense.split_with || '']?.username}` : ''} • {format(new Date(expense.created_at), 'MMM d')}
                                        </p>
                                    </div>

                                    <span className={cn(
                                        "font-bold",
                                        expense.status === 'paid' ? "text-slate-400" : "text-slate-900"
                                    )}>₺{expense.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
