import { useEffect, useState } from 'react'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Chore, Profile } from '../types'
import TaskItem from '../components/TaskItem'

export default function Dashboard() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [pendingTasks, setPendingTasks] = useState<Chore[]>([])
    const [userProfile, setUserProfile] = useState<Profile | null>(null)
    const [balance, setBalance] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!room?.id || !user?.id) return

        const fetchDashboardData = async () => {
            setLoading(true)

            // Fetch Pending Tasks for the current user
            const { data: tasks } = await supabase
                .from('chores')
                .select('*')
                .eq('room_id', room.id)
                .eq('assigned_to', user.id)
                .eq('status', 'pending')
                .order('due_date', { ascending: true })

            setPendingTasks(tasks || [])

            // Fetch User Profile for TaskItem
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setUserProfile(profile)

            // Fetch Expenses to calculate balance
            const { data: expenses } = await supabase
                .from('expenses')
                .select('*')
                .eq('room_id', room.id)

            // Fetch number of roommates to split expenses
            const { count: roommatesCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', room.id)

            if (expenses && roommatesCount) {
                let myBalance = 0
                expenses.forEach(e => {
                    if (e.type === 'direct' && e.split_with) {
                        if (e.paid_by === user.id) myBalance += e.amount
                        if (e.split_with === user.id) myBalance -= e.amount
                    } else {
                        if (e.paid_by === user.id) myBalance += e.amount
                        myBalance -= (e.amount / roommatesCount)
                    }
                })
                setBalance(myBalance)
            }


            setLoading(false)
        }

        fetchDashboardData()
    }, [room?.id, user?.id])

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

        // Optimistic update
        setPendingTasks(prev => prev.filter(t => t.id !== id))

        const { error } = await supabase
            .from('chores')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            alert('Failed to update task')
            // Refresh data to be safe on error
            window.location.reload()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <span className="text-sm text-slate-500 font-medium">{room?.name}</span>
            </div>

            {loading ? (
                <>
                    <div className="grid grid-cols-2 gap-4 animate-pulse">
                        <div className="h-24 bg-slate-100 rounded-xl"></div>
                        <div className="h-24 bg-slate-100 rounded-xl"></div>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
                        <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <p className="text-slate-500 text-sm">My Tasks</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {pendingTasks.length} Pending
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <p className="text-slate-500 text-sm">Balance</p>
                            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {balance >= 0 ? '+' : ''}₺{balance.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-700">My Pending Tasks</h3>
                        </div>

                        <div className="space-y-3">
                            {pendingTasks.length === 0 ? (
                                <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-500 text-sm">No pending tasks! 🎉</p>
                                </div>
                            ) : (
                                pendingTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        assignee={userProfile || undefined}
                                        onToggle={toggleTask}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}


