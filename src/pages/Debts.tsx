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
            <header className="flex items-end justify-between border-b-4 border-black pb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black text-black uppercase tracking-tighter italic">Debts</h2>
                    <p className="text-black/60 text-xs font-black uppercase tracking-widest">Manage shared finances</p>
                </div>
                <div className={cn(
                    "px-6 py-2 neo-border neo-shadow font-black text-2xl rotate-1",
                    balance >= 0 ? "bg-[#D1FAE5] text-black" : "bg-[#FEE2E2] text-black"
                )}>
                    {balance >= 0 ? '+' : ''}{balance.toFixed(0)} TL
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin border-8 border-black border-t-yellow-400 rounded-full h-16 w-16"></div>
                </div>
            ) : (
                <>
                    {/* Debts I Owe */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-400 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <ArrowDownLeft className="w-6 h-6 text-black" strokeWidth={3} />
                            </div>
                            <h3 className="text-2xl font-black text-black uppercase tracking-tight italic">Money You Owe</h3>
                            <div className="h-1 flex-1 bg-black ml-4"></div>
                        </div>

                        {debtsIOwe.length === 0 ? (
                            <div className="neo-card bg-white p-10 border-dashed border-4 border-black/10 text-center">
                                <p className="text-black/30 font-black uppercase tracking-widest italic text-xl">You're all settled! 🎉</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {debtsIOwe.map(e => (
                                    <div key={e.id} className="neo-card bg-white p-5 flex items-center justify-between hover:bg-rose-50 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-rose-400 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <Receipt className="w-6 h-6 text-black" strokeWidth={3} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-black uppercase tracking-tight text-lg leading-none">{e.description}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1.5">
                                                    To {profiles[e.paid_by]?.username || 'Unknown'} • {format(new Date(e.created_at), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-3">
                                            <span className="text-2xl font-black text-black tracking-tighter">₺{calculateMyShareIOwe(e).toFixed(0)}</span>
                                            <button
                                                onClick={() => markAsPaid(e.id)}
                                                className="bg-black text-white px-4 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-colors shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
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
                            <div className="p-2 bg-emerald-400 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <ArrowUpRight className="w-6 h-6 text-black" strokeWidth={3} />
                            </div>
                            <h3 className="text-2xl font-black text-black uppercase tracking-tight italic">Owed To You</h3>
                            <div className="h-1 flex-1 bg-black ml-4"></div>
                        </div>

                        {debtsOwedToMe.length === 0 ? (
                            <div className="neo-card bg-white p-10 border-dashed border-4 border-black/10 text-center">
                                <p className="text-black/30 font-black uppercase tracking-widest italic text-xl">Nothing here yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {debtsOwedToMe.map(e => (
                                    <div key={e.id} className="neo-card bg-white p-5 flex items-center justify-between hover:bg-emerald-50 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-emerald-400 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <Receipt className="w-6 h-6 text-black" strokeWidth={3} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-black uppercase tracking-tight text-lg leading-none">{e.description}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1.5">
                                                    {e.type === 'direct' ? `From ${profiles[e.split_with || '']?.username || 'Somebody'}` : 'Room split'} • {format(new Date(e.created_at), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-3">
                                            <span className="text-2xl font-black text-black tracking-tighter">₺{calculateOthersShareOwedToMe(e).toFixed(0)}</span>
                                            <div className="bg-black/5 border-2 border-black/20 text-black/40 px-3 py-1 font-black uppercase text-[9px] tracking-widest italic rounded">
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
                            <div className="p-2 bg-yellow-400 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <History className="w-6 h-6 text-black" strokeWidth={3} />
                            </div>
                            <h3 className="text-2xl font-black text-black uppercase tracking-tight italic">Transaction Log</h3>
                            <div className="h-1 flex-1 bg-black ml-4"></div>
                        </div>

                        <div className="space-y-4">
                            {allExpenses.map(expense => (
                                <div key={expense.id} className="flex items-center gap-5 p-5 neo-card bg-white relative group overflow-visible">
                                    {expense.status === 'paid' && (
                                        <div className="absolute -top-3 -right-3 py-1 px-4 bg-emerald-400 border-4 border-black text-black text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3 z-10">
                                            Settled
                                        </div>
                                    )}
                                    <div className={cn(
                                        "p-3 neo-border",
                                        expense.status === 'paid' ? "bg-slate-100 grayscale" : "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    )}>
                                        <Receipt className="w-6 h-6 text-black" strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className={cn(
                                                "font-black text-lg tracking-tight uppercase truncate leading-none",
                                                expense.status === 'paid' ? "text-black/40" : "text-black"
                                            )}>{expense.description}</h4>
                                            {expense.type === 'direct' && (
                                                <span className="text-[9px] bg-black text-white px-2 py-0.5 font-black uppercase tracking-widest">
                                                    Direct
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1.5">
                                            {profiles[expense.paid_by]?.username} {expense.split_with ? `to ${profiles[expense.split_with]?.username}` : ''} • {format(new Date(expense.created_at), 'MMM d')}
                                        </p>
                                    </div>

                                    <span className={cn(
                                        "text-2xl font-black tracking-tighter",
                                        expense.status === 'paid' ? "text-black/30" : "text-black"
                                    )}>₺{expense.amount.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
