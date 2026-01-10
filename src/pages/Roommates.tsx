import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRoom } from '../contexts/RoomContext'
import { Profile } from '../types'
import { User, Copy, Check } from 'lucide-react'

export default function Roommates() {
    const { room } = useRoom()
    const [roommates, setRoommates] = useState<Profile[]>([])
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (room?.id) {
            supabase
                .from('profiles')
                .select('*')
                .eq('room_id', room.id)
                .then(({ data }) => setRoommates(data || []))
        }
    }, [room?.id])

    const copyCode = () => {
        if (room?.code) {
            navigator.clipboard.writeText(room.code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="space-y-10">
            <header className="flex items-end justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Roommates</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Your living squad</p>
                </div>
                {room && (
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Code: {room.code}
                    </button>
                )}
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {roommates.map((person) => (
                    <div key={person.id} className="bento-card flex items-center gap-4 group hover:-translate-y-1 transition-all duration-300">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-300 dark:group-hover:text-indigo-400 transition-colors">
                            {person.avatar_url ? (
                                <img src={person.avatar_url} alt={person.username} className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                <User className="w-8 h-8" strokeWidth={2} />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight leading-none">{person.username || 'Unnamed'}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Member
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
