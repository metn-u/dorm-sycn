import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Profile } from '../types'
import { Calendar } from 'lucide-react'

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

        const { error } = await supabase
            .from('expenses')
            .insert({
                description: title,
                amount: parseFloat(amount),
                paid_by: user.id,
                room_id: room.id,
                split_with: splitType === 'direct' ? splitWith : null,
                type: splitType
            })

        if (error) {
            alert(error.message)
        } else {
            navigate('/expenses')
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">New Item</h2>

            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('chore')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'chore' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    New Chore
                    {activeTab === 'chore' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('expense')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'expense' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    New Expense
                    {activeTab === 'expense' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                </button>
            </div>

            {activeTab === 'chore' ? (
                <form onSubmit={createChore} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Task Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Take out trash"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Assign To</label>
                            <select
                                required
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">Select...</option>
                                {roommates.map(p => (
                                    <option key={p.id} value={p.id}>{p.username}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Due Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </form>
            ) : (
                <form onSubmit={createExpense} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Groceries, Internet Bill..."
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Amount (TL)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-700">Split Method</label>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setSplitType('group')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${splitType === 'group' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Everyone
                            </button>
                            <button
                                type="button"
                                onClick={() => setSplitType('direct')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${splitType === 'direct' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Individual
                            </button>
                        </div>
                    </div>

                    {splitType === 'direct' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Who owes you?</label>
                                <select
                                    required
                                    value={splitWith}
                                    onChange={(e) => setSplitWith(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">Select teammate...</option>
                                    {roommates.filter(r => r.id !== user?.id).map(p => (
                                        <option key={p.id} value={p.id}>{p.username}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-sm text-indigo-700 text-center font-medium">
                            {splitType === 'group'
                                ? `Total: ₺${amount || '0'} • Each pays: ₺${(parseFloat(amount || '0') / (roommates.length || 1)).toFixed(2)}`
                                : `Direct debt: The selected person will owe you the FULL amount (₺${amount || '0'})`
                            }
                        </p>
                    </div>


                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </form>
            )}
        </div>
    )
}
