import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Chore, Profile, Announcement } from '../types'
import TaskItem from '../components/TaskItem'
import { Clock, LayoutGrid, Megaphone, Plus, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Dashboard() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [pendingTasks, setPendingTasks] = useState<Chore[]>([])
    const [userProfile, setUserProfile] = useState<Profile | null>(null)
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [newAnnouncement, setNewAnnouncement] = useState('')
    const [balance, setBalance] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [showAnnounceInput, setShowAnnounceInput] = useState(false)

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

            // Fetch Announcements
            const { data: ann } = await supabase
                .from('announcements')
                .select('*')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })

            setAnnouncements(ann || [])

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
            window.location.reload()
        }
    }

    const addAnnouncement = async () => {
        if (!newAnnouncement.trim() || !room?.id || !user?.id) return

        const { data, error } = await supabase
            .from('announcements')
            .insert([{
                room_id: room.id,
                created_by: user.id,
                content: newAnnouncement
            }])
            .select()

        if (error) {
            alert('Error adding announcement')
        } else {
            setAnnouncements(prev => [data[0], ...prev])
            setNewAnnouncement('')
            setShowAnnounceInput(false)
        }
    }

    const deleteAnnouncement = async (id: string) => {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting announcement')
        } else {
            setAnnouncements(prev => prev.filter(a => a.id !== id))
        }
    }

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back to your dorm hub.</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg leading-none mb-1">
                    {room?.name}
                </span>
            </div>

            {loading ? (
                <>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] animate-pulse"></div>
                        <div className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] animate-pulse"></div>
                    </div>
                    <div className="space-y-6 pt-6">
                        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                        <div className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] animate-pulse"></div>
                    </div>
                </>
            ) : (
                <>
                    {/* Notice Board Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Notice Board
                            </h3>
                            <button
                                onClick={() => setShowAnnounceInput(!showAnnounceInput)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <Plus className={cn("w-5 h-5 transition-transform", showAnnounceInput && "rotate-45")} />
                            </button>
                        </div>

                        {showAnnounceInput && (
                            <div className="bento-card animate-in slide-in-from-top-2 duration-300">
                                <textarea
                                    value={newAnnouncement}
                                    onChange={(e) => setNewAnnouncement(e.target.value)}
                                    placeholder="Write an announcement... (e.g., Don't forget to buy milk!)"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm mb-3 resize-none"
                                    rows={3}
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={addAnnouncement}
                                        className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-indigo-950/40 active:scale-95 transition-all"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        )}

                        {announcements.length === 0 ? (
                            <div className="p-8 bento-card bg-slate-50/50 dark:bg-slate-900/10 border-dashed border-2 flex flex-col items-center justify-center text-slate-400">
                                <p className="text-sm font-medium italic">No announcements yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="bento-card relative group">
                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed pr-8">
                                            {ann.content}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(ann.created_at).toLocaleDateString()}
                                            </span>
                                            {(ann.created_by === user?.id || room?.created_by === user?.id) && (
                                                <button
                                                    onClick={() => deleteAnnouncement(ann.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-all p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bento-card bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-between">
                            <div>
                                <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">My Tasks</p>
                                <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {pendingTasks.length}
                                </h3>
                            </div>
                            <p className="text-indigo-400 dark:text-indigo-500 text-sm font-medium mt-4 italic">Pending items</p>
                        </div>
                        <Link
                            to="/debts"
                            className={cn(
                                "bento-card flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98]",
                                balance >= 0
                                    ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                                    : "bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30"
                            )}
                        >
                            <div>
                                <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest mb-1",
                                    balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}>Current Balance</p>
                                <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                                    {balance >= 0 ? '+' : ''}₺{balance.toFixed(0)}
                                </h3>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <p className={cn(
                                    "text-sm font-medium italic",
                                    balance >= 0 ? "text-emerald-400 dark:text-emerald-500" : "text-rose-400 dark:text-rose-500"
                                )}>
                                    {balance >= 0 ? "You're all set!" : "Time to settle up"}
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600">Details →</span>
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">My Pending Tasks</h3>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 ml-6"></div>
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
                                <div className="text-center py-16 bento-card bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                                        <LayoutGrid className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-slate-400 dark:text-slate-500 text-lg font-bold tracking-tight italic">No pending tasks! 🎉</p>
                                    <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Enjoy your free time.</p>
                                </div>
                            ) : (
                                <div className="bento-card !p-2 divide-y divide-slate-100 dark:divide-slate-800">
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


