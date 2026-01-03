import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Chore, Profile } from '../types'
import TaskItem from '../components/TaskItem'
import { LayoutGrid } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Tasks() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [tasks, setTasks] = useState<Chore[]>([])
    const [profiles, setProfiles] = useState<Record<string, Profile>>({})
    const [filter, setFilter] = useState<'my' | 'all'>('my')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!room?.id) return

        const fetchData = async () => {
            setLoading(true)
            // Fetch Tasks
            const { data: chores } = await supabase
                .from('chores')
                .select('*')
                .eq('room_id', room.id)
                .order('due_date', { ascending: true })

            // Fetch Profiles for assignee names
            const { data: roomProfiles } = await supabase
                .from('profiles')
                .select('*')
                .eq('room_id', room.id)

            if (chores) setTasks(chores)
            if (roomProfiles) {
                const profileMap = roomProfiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
                setProfiles(profileMap)
            }
            setLoading(false)
        }

        fetchData()
    }, [room?.id])

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))

        const { error } = await supabase
            .from('chores')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            alert('Failed to update task')
            // Revert
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: currentStatus as any } : t))
        }
    }

    const filteredTasks = tasks.filter(task => {
        if (filter === 'my') return task.assigned_to === user?.id
        return true
    })

    return (
        <div className="space-y-10">
            <header className="flex items-end justify-between pb-2 border-b border-slate-200">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Task Board</h2>
                    <p className="text-slate-500 text-sm">Coordinating roommate life</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 font-bold uppercase text-[10px] tracking-widest rounded-lg border border-indigo-100">
                    {tasks.length} Total
                </div>
            </header>

            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                <button
                    onClick={() => setFilter('my')}
                    className={cn(
                        "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-200",
                        filter === 'my'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    Assigned To Me
                </button>
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-200",
                        filter === 'all'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    Whole Room
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white border border-slate-200 rounded-[2rem] animate-pulse"></div>
                    ))
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bento-card bg-slate-50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center">
                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                            <LayoutGrid className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-lg font-bold tracking-tight italic">Empty board! 😴</p>
                        <p className="text-slate-400 text-sm mt-1">Enjoy your free time.</p>
                    </div>
                ) : (
                    <div className="bento-card !p-2 divide-y divide-slate-100">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="first:pt-0 last:pb-0 p-4">
                                <TaskItem
                                    task={task}
                                    assignee={profiles[task.assigned_to]}
                                    onToggle={toggleTask}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
