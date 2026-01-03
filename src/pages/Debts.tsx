import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Expense, Profile } from '../types'
import { format } from 'date-fns'
import { Receipt, CheckCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function Debts() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([])
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
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .eq('room_id', room.id)

            if (expensesData) setPendingExpenses(expensesData)

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
        const { error } = await supabase
            .from('expenses')
            .update({ status: 'paid' })
            .eq('id', expenseId)

        if (error) {
            alert('Failed to mark as paid')
        } else {
            setPendingExpenses(prev => prev.filter(e => e.id !== expenseId))
        }
    }

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
        if (expense.type === 'direct') return expense.amount
        const roommatesCount = Object.keys(profiles).length || 1
        return expense.amount / roommatesCount
    }

    const calculateOthersShareOwedToMe = (expense: Expense) => {
        if (expense.type === 'direct') return expense.amount
        const roommatesCount = Object.keys(profiles).length || 1
        return expense.amount - (expense.amount / roommatesCount)
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-800">Debt Management</h2>
                <p className="text-slate-500 text-sm font-medium">Settle up with your roommates</p>
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
                                            <button
                                                onClick={() => markAsPaid(e.id)}
                                                className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Confirm Paid
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
