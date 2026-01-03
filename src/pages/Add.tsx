import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Profile } from '../types'
import { cn } from '../lib/utils'

export default function Add() {
    const { room } = useRoom()
    const navigate = useNavigate()
    const { user } = useAuth() // Added user from useAuth
    const [activeTab, setActiveTab] = useState<'chore' | 'expense'>('chore')

    // Chore Form State
    const [title, setTitle] = useState('')
    const [assignee, setAssignee] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [amount, setAmount] = useState('') // Added amount state
    const [roommates, setRoommates] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (room?.id) {
            supabase
                .from('profiles')
                .select('*')
                .eq('room_id', room.id)
                .then(({ data }) => setRoommates(data || []))
        }
    }, [room?.id])

    const createChore = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!room?.id) return
        setLoading(true)

        const { error } = await supabase
            .from('chores')
            .insert({
                title,
                assigned_to: assignee,
                room_id: room.id,
                due_date: dueDate,
                status: 'pending'
            })

        if (error) {
            alert(error.message)
        } else {
            navigate('/tasks')
        }
        setLoading(false)
    }

    // Implemented Expense logic
    const [splitType, setSplitType] = useState<'group' | 'direct'>('group')
    const [splitWith, setSplitWith] = useState('')

    const createExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!room?.id || !user) return
        setLoading(true)

        const expenseAmount = parseFloat(amount)

        // 1. Fetch current balances of everyone in the room
        const { data: allExpenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('room_id', room.id)
            .eq('status', 'pending')

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('room_id', room.id)

        if (allExpenses && profiles) {
            const roommatesCount = profiles.length
            const balances: Record<string, number> = {}
            profiles.forEach(p => balances[p.id] = 0)

            allExpenses.forEach(exp => {
                if (exp.split_with) {
                    balances[exp.paid_by] += exp.amount
                    balances[exp.split_with] -= exp.amount
                } else {
                    // Legacy group split logic
                    balances[exp.paid_by] += exp.amount
                    profiles.forEach(p => {
                        balances[p.id] -= (exp.amount / roommatesCount)
                    })
                }
            })

            // 2. Check if the new expense would push anyone over the 5000 TL limit
            const limit = 5000
            let limitExceeded = false
            let exceededUser = ''

            if (splitType === 'direct') {
                const newBalance = balances[splitWith] - expenseAmount
                if (newBalance < -limit) {
                    limitExceeded = true
                    exceededUser = profiles.find(p => p.id === splitWith)?.username || 'Roommate'
                }
            } else {
                const share = expenseAmount / roommatesCount
                for (const p of profiles) {
                    if (p.id === user.id) continue
                    const newBalance = balances[p.id] - share
                    if (newBalance < -limit) {
                        limitExceeded = true
                        exceededUser = p.username || 'Roommate'
                        break
                    }
                }
            }

            if (limitExceeded) {
                alert(`Cannot add expense: ${exceededUser}'s debt would exceed ₺${limit}. Please settle existing debts first.`)
                setLoading(false)
                return
            }
        }

        // 3. Insert expenses
        let error;
        if (splitType === 'direct') {
            const { error: insertError } = await supabase
                .from('expenses')
                .insert({
                    description: title,
                    amount: expenseAmount,
                    paid_by: user.id,
                    room_id: room.id,
                    split_with: splitWith,
                    type: 'direct',
                    status: 'pending'
                })
            error = insertError
        } else {
            // "Everyone" split: Create individual direct debts for each roommate (except payer)
            // This makes the debt static and it won't be split with future roommates
            const share = expenseAmount / (roommates.length || 1)
            const debtors = roommates.filter(r => r.id !== user.id)

            if (debtors.length === 0) {
                // If I'm alone in the room, just create a record for myself
                const { error: insertError } = await supabase
                    .from('expenses')
                    .insert({
                        description: title,
                        amount: expenseAmount,
                        paid_by: user.id,
                        room_id: room.id,
                        split_with: user.id,
                        type: 'direct',
                        status: 'pending'
                    })
                error = insertError
            } else {
                const inserts = debtors.map(debtor => ({
                    description: title,
                    amount: share,
                    paid_by: user.id,
                    room_id: room.id,
                    split_with: debtor.id,
                    type: 'direct',
                    status: 'pending'
                }))
                const { error: insertError } = await supabase
                    .from('expenses')
                    .insert(inserts)
                error = insertError
            }
        }

        if (error) {
            alert(error.message)
        } else {
            navigate('/expenses')
        }
        setLoading(false)
    }

    return (
        <div className="space-y-10">
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter italic border-b-4 border-black pb-4">New Entry</h2>

            <div className="flex gap-4">
                <button
                    onClick={() => setActiveTab('chore')}
                    className={cn(
                        "flex-1 py-4 neo-border font-black uppercase tracking-tight transition-all",
                        activeTab === 'chore' ? "bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1" : "bg-white"
                    )}
                >
                    New Task
                </button>
                <button
                    onClick={() => setActiveTab('expense')}
                    className={cn(
                        "flex-1 py-4 neo-border font-black uppercase tracking-tight transition-all",
                        activeTab === 'expense' ? "bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1" : "bg-white"
                    )}
                >
                    New Bill
                </button>
            </div>

            <div className="neo-card p-8 bg-white">
                {activeTab === 'chore' ? (
                    <form onSubmit={createChore} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-black/60">Task Description</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Take out the trash"
                                className="w-full neo-input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-black/60">Assign To</label>
                                <select
                                    required
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full neo-input appearance-none bg-white"
                                >
                                    <option value="">Select...</option>
                                    {roommates.map(p => (
                                        <option key={p.id} value={p.id}>{p.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-black/60">Due Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        required
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full neo-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full neo-button bg-black text-white hover:bg-yellow-400 hover:text-black transition-colors"
                        >
                            {loading ? 'Processing...' : 'Deploy Task'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={createExpense} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-black/60">Expense Name</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Electricity Bill"
                                className="w-full neo-input"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-black/60">Amount (TL)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl">₺</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full neo-input pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-black/60">Distribution</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSplitType('group')}
                                    className={cn(
                                        "flex-1 py-3 neo-border font-black uppercase text-xs transition-all",
                                        splitType === 'group' ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-white"
                                    )}
                                >
                                    Divide Equally
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitType('direct')}
                                    className={cn(
                                        "flex-1 py-3 neo-border font-black uppercase text-xs transition-all",
                                        splitType === 'direct' ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-white"
                                    )}
                                >
                                    Target person
                                </button>
                            </div>
                        </div>

                        {splitType === 'direct' && (
                            <div className="space-y-3 animate-[slideIn_0.2s_ease-out]">
                                <label className="text-xs font-black uppercase tracking-widest text-black/60">Who's paying?</label>
                                <select
                                    required
                                    value={splitWith}
                                    onChange={(e) => setSplitWith(e.target.value)}
                                    className="w-full neo-input bg-white"
                                >
                                    <option value="">Choose your victim...</option>
                                    {roommates.filter(r => r.id !== user?.id).map(p => (
                                        <option key={p.id} value={p.id}>{p.username}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="p-5 bg-black text-yellow-400 neo-border italic">
                            <p className="font-black uppercase tracking-tight text-center">
                                {splitType === 'group'
                                    ? `Total: ₺${amount || '0'} • Per person: ₺${(parseFloat(amount || '0') / (roommates.length || 1)).toFixed(0)}`
                                    : `Debt: Targeted roommate will owe you the full ₺${amount || '0'}`
                                }
                            </p>
                        </div>


                        <button
                            disabled={loading}
                            className="w-full neo-button bg-black text-white hover:bg-yellow-400 hover:text-black transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Register Expense'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
