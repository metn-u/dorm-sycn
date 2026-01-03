import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { Chore, Profile } from '../types'
import TaskItem from '../components/TaskItem'
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
            <header className="flex items-end justify-between border-b-4 border-black pb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black text-black uppercase tracking-tighter italic">Task Board</h2>
                    <p className="text-black/60 text-xs font-black uppercase tracking-widest">Coordinating roommate life</p>
                </div>
                <div className="bg-yellow-400 neo-border px-4 py-1.5 font-black uppercase text-xs tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {tasks.length} Total
                </div>
            </header>

            <div className="flex gap-4 p-1 bg-black/5 neo-border">
                <button
                    onClick={() => setFilter('my')}
                    className={cn(
                        "flex-1 py-3 font-black uppercase tracking-widest text-[10px] transition-all",
                        filter === 'my' ? "bg-black text-white" : "text-black hover:bg-black/10"
                    )}
                >
                    Assigned To Me
                </button>
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        "flex-1 py-3 font-black uppercase tracking-widest text-[10px] transition-all",
                        filter === 'all' ? "bg-black text-white" : "text-black hover:bg-black/10"
                    )}
                >
                    Whole Room
                </button>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-pulse"></div>
                    ))
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 neo-card bg-white border-dashed border-4 border-black/10">
                        <p className="text-black/30 text-2xl font-black uppercase tracking-tighter italic">Empty board! 😴</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            assignee={profiles[task.assigned_to]}
                            onToggle={toggleTask}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
