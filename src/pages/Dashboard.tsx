import { useEffect, useState } from 'react'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Chore, Profile } from '../types'
import TaskItem from '../components/TaskItem'
import { Clock, LayoutGrid } from 'lucide-react'
import { cn } from '../lib/utils'

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

            // Fetch Expenses to calculate balance (Only pending ones represent current debt)
            const { data: expenses } = await supabase
                .from('expenses')
                .select('*')
                .eq('room_id', room.id)
                .eq('status', 'pending')

            // Fetch number of roommates to split expenses
            const { count: roommatesCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', room.id)

            if (expenses && roommatesCount) {
                let myBalance = 0
                expenses.forEach(e => {
                    if (e.split_with) {
                        if (e.paid_by === user.id) myBalance += e.amount
                        if (e.split_with === user.id) myBalance -= e.amount
                    } else {
                        // Legacy group split logic
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
        <div className="space-y-10">
            <div className="flex justify-between items-end pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 text-sm mt-1">Welcome back to your dorm hub.</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg leading-none mb-1">
                    {room?.name}
                </span>
            </div>

            {loading ? (
                <>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-32 bg-white border border-slate-200 rounded-[2rem] animate-pulse"></div>
                        <div className="h-32 bg-white border border-slate-200 rounded-[2rem] animate-pulse"></div>
                    </div>
                    <div className="space-y-6 pt-6">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="h-48 bg-white border border-slate-200 rounded-[2rem] animate-pulse"></div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bento-card bg-indigo-50/50 border-indigo-100 flex flex-col justify-between">
                            <div>
                                <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-1">My Tasks</p>
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">
                                    {pendingTasks.length}
                                </h3>
                            </div>
                            <p className="text-indigo-400 text-sm font-medium mt-4 italic">Pending items</p>
                        </div>
                        <div className={cn(
                            "bento-card flex flex-col justify-between transition-colors",
                            balance >= 0 ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
                        )}>
                            <div>
                                <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest mb-1",
                                    balance >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}>Current Balance</p>
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">
                                    {balance >= 0 ? '+' : ''}₺{balance.toFixed(0)}
                                </h3>
                            </div>
                            <p className={cn(
                                "text-sm font-medium mt-4 italic",
                                balance >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {balance >= 0 ? "You're all set!" : "Time to settle up"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">My Pending Tasks</h3>
                            <div className="h-px flex-1 bg-slate-200 ml-6"></div>
                        </div>

                        {balance < -4000 && (
                            <div className="bg-rose-600 text-white rounded-[2rem] p-6 flex items-start gap-4 shadow-lg shadow-rose-100">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold tracking-tight">High Debt Warning!</p>
                                    <p className="text-rose-100 text-sm mt-1 font-medium opacity-90">Your debt is approaching the ₺5000 limit. Settle up now or be shamed!</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {pendingTasks.length === 0 ? (
                                <div className="text-center py-16 bento-card bg-slate-50/50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center">
                                    <div className="p-4 bg-slate-100 rounded-full mb-4">
                                        <LayoutGrid className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-lg font-bold tracking-tight italic">No pending tasks! 🎉</p>
                                    <p className="text-slate-400 text-sm mt-1">Enjoy your free time.</p>
                                </div>
                            ) : (
                                <div className="bento-card !p-2 divide-y divide-slate-100">
                                    {pendingTasks.map(task => (
                                        <div key={task.id} className="first:pt-0 last:pb-0 p-4">
                                            <TaskItem
                                                task={task}
                                                assignee={userProfile || undefined}
                                                onToggle={toggleTask}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}


