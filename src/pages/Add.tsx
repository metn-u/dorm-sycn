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
            <header className="flex items-end justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">New Entry</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Sync up with your roommates</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg leading-none mb-1">
                    {room?.name}
                </span>
            </header>

            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner">
                <button
                    onClick={() => setActiveTab('chore')}
                    className={cn(
                        "flex-1 py-3 rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] transition-all duration-300",
                        activeTab === 'chore'
                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                >
                    New Task
                </button>
                <button
                    onClick={() => setActiveTab('expense')}
                    className={cn(
                        "flex-1 py-3 rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] transition-all duration-300",
                        activeTab === 'expense'
                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                >
                    New Expense
                </button>
            </div>

            <div className="bento-card">
                {activeTab === 'chore' ? (
                    <form onSubmit={createChore} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Task Description</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Take out the trash"
                                className="w-full bento-input"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Assign To</label>
                                <select
                                    required
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full bento-input appearance-none bg-white dark:bg-slate-800"
                                >
                                    <option value="" className="dark:bg-slate-900">Select teammate...</option>
                                    {roommates.map(p => (
                                        <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bento-input"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bento-button-primary mt-4"
                        >
                            {loading ? 'Adding Task...' : 'Create Task'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={createExpense} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Expense Name</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Electricity Bill"
                                className="w-full bento-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Amount (TL)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500">₺</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bento-input pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Distribution</label>
                            <div className="flex gap-3 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSplitType('group')}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all duration-200",
                                        splitType === 'group'
                                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700"
                                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                >
                                    Divide Equally
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitType('direct')}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all duration-200",
                                        splitType === 'direct'
                                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700"
                                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                >
                                    Specific Person
                                </button>
                            </div>
                        </div>

                        {splitType === 'direct' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Who is responsible?</label>
                                <select
                                    required
                                    value={splitWith}
                                    onChange={(e) => setSplitWith(e.target.value)}
                                    className="w-full bento-input bg-white dark:bg-slate-800 appearance-none"
                                >
                                    <option value="" className="dark:bg-slate-900">Select roommate...</option>
                                    {roommates.filter(r => r.id !== user?.id).map(p => (
                                        <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.username}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                            <p className="text-sm font-semibold tracking-tight text-center italic">
                                {splitType === 'group'
                                    ? `Total: ₺${amount || '0'} • Each pays: ₺${(parseFloat(amount || '0') / (roommates.length || 1)).toFixed(0)}`
                                    : `Direct: One roommate will owe ₺${amount || '0'} to you.`
                                }
                            </p>
                        </div>


                        <button
                            disabled={loading}
                            className="w-full bento-button-primary mt-4"
                        >
                            {loading ? 'Processing...' : 'Register Expense'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
