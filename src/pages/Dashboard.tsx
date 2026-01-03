import { useEffect, useState } from 'react'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Chore, Profile } from '../types'
import TaskItem from '../components/TaskItem'
import { Clock } from 'lucide-react'
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
            <div className="flex justify-between items-end border-b-4 border-black pb-4">
                <h2 className="text-4xl font-black text-black uppercase tracking-tighter italic">Dashboard</h2>
                <span className="text-sm bg-black text-white px-3 py-1 font-black uppercase tracking-widest leading-none mb-1">{room?.name}</span>
            </div>

            {loading ? (
                <>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-32 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-pulse"></div>
                        <div className="h-32 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-pulse"></div>
                    </div>
                    <div className="space-y-6 pt-6">
                        <div className="h-8 w-48 bg-black/10 rounded animate-pulse"></div>
                        <div className="h-24 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-pulse"></div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="neo-card p-6 bg-[#E0E7FF]">
                            <p className="text-black text-xs font-black uppercase tracking-widest mb-2">My Tasks</p>
                            <p className="text-4xl font-black text-black tracking-tighter">
                                {pendingTasks.length} <span className="text-xl uppercase italic">Items</span>
                            </p>
                        </div>
                        <div className={cn(
                            "neo-card p-6 transition-colors",
                            balance >= 0 ? "bg-[#D1FAE5]" : "bg-[#FEE2E2]"
                        )}>
                            <p className="text-black text-xs font-black uppercase tracking-widest mb-2">Balance</p>
                            <p className="text-4xl font-black text-black tracking-tighter leading-none">
                                {balance >= 0 ? '+' : ''}₺{balance.toFixed(0)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-black uppercase tracking-tight italic">My Pending Tasks</h3>
                            <div className="h-1 flex-1 bg-black ml-4"></div>
                        </div>

                        {balance < -4000 && (
                            <div className="bg-rose-400 neo-border p-5 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="p-2 bg-black text-white rounded-lg">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div className="text-black">
                                    <p className="text-lg font-black uppercase tracking-tight">High Debt Warning!</p>
                                    <p className="text-sm font-bold mt-1">Your debt is approaching the ₺5000 limit. Settle up now or be shamed!</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {pendingTasks.length === 0 ? (
                                <div className="text-center py-12 neo-card bg-white border-dashed border-4 border-black/20">
                                    <p className="text-black/40 text-xl font-black uppercase tracking-tighter italic">No pending tasks! 🎉</p>
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


