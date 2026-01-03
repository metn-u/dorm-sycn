import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Expense, Profile } from '../types'
import { format } from 'date-fns'
import { Receipt, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'

type Debt = {
    from: string
    to: string
    amount: number
}

export default function Expenses() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [profiles, setProfiles] = useState<Record<string, Profile>>({})
    const [debts, setDebts] = useState<Debt[]>([])
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

            if (expensesData) setExpenses(expensesData)

            const profileMap: Record<string, Profile> = {}
            if (profilesData) {
                profilesData.forEach(p => profileMap[p.id] = p)
                setProfiles(profileMap)
                calculateDebts(expensesData || [], profilesData)
            }

            setLoading(false)
        }

        fetchData()
    }, [room?.id])

    const calculateDebts = (expenses: Expense[], roommates: Profile[]) => {
        if (roommates.length === 0) return

        // 1. Calculate Balances
        const balances: Record<string, number> = {}
        roommates.forEach(p => balances[p.id] = 0)

        expenses.forEach(expense => {
            const amount = expense.amount
            const payer = expense.paid_by

            if (expense.type === 'direct' && expense.split_with) {
                // Direct debt logic
                if (balances[payer] !== undefined) balances[payer] += amount
                if (balances[expense.split_with] !== undefined) balances[expense.split_with] -= amount
            } else {
                // Group split logic
                const splitAmount = amount / roommates.length
                if (balances[payer] !== undefined) balances[payer] += amount
                roommates.forEach(p => {
                    balances[p.id] -= splitAmount
                })
            }
        })

        // 2. Simplify Debts (Greedy algorithm)
        const debtors = []
        const creditors = []

        for (const [id, balance] of Object.entries(balances)) {
            if (balance < -0.01) debtors.push({ id, amount: -balance }) // Owes money
            else if (balance > 0.01) creditors.push({ id, amount: balance }) // Owed money
        }

        const newDebts: Debt[] = []
        let i = 0 // debtor index
        let j = 0 // creditor index

        while (i < debtors.length && j < creditors.length) {
            const amount = Math.min(debtors[i].amount, creditors[j].amount)
            newDebts.push({
                from: debtors[i].id,
                to: creditors[j].id,
                amount
            })

            debtors[i].amount -= amount
            creditors[j].amount -= amount

            if (debtors[i].amount < 0.01) i++
            if (creditors[j].amount < 0.01) j++
        }

        setDebts(newDebts)
    }

    const myBalance = () => {
        if (!user) return 0
        let balance = 0
        const roommatesCount = Object.keys(profiles).length || 1

        expenses.forEach(e => {
            if (e.type === 'direct' && e.split_with) {
                if (e.paid_by === user.id) balance += e.amount
                if (e.split_with === user.id) balance -= e.amount
            } else {
                if (e.paid_by === user.id) balance += e.amount
                balance -= (e.amount / roommatesCount)
            }
        })
        return balance
    }


    const balance = myBalance()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Finance</h2>
                <div className={cn(
                    "px-4 py-2 rounded-xl font-bold text-lg",
                    balance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                    {balance >= 0 ? '+' : ''}{balance.toFixed(2)} TL
                </div>
            </div>

            {debts.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Settlements</h3>
                    <div className="space-y-2">
                        {debts.map((debt, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800">{profiles[debt.from]?.username}</span>
                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-800">{profiles[debt.to]?.username}</span>
                                </div>
                                <span className="font-bold text-indigo-600">₺{debt.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="font-bold text-slate-700">Recent Transactions</h3>
                {loading ? (
                    <p className="text-center text-slate-400">Loading...</p>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                        No expenses yet
                    </div>
                ) : (
                    expenses.map(expense => (
                        <div key={expense.id} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-800">{expense.description}</h4>
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

                            <span className="font-bold text-slate-900">₺{expense.amount.toFixed(2)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
