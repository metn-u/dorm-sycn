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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Tasks</h2>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('my')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                            filter === 'my' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        My Tasks
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                            filter === 'all' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        All Tasks
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <p className="text-center text-slate-400 py-8">Loading tasks...</p>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500">No tasks found</p>
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
