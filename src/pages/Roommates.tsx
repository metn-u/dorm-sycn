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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Roommates</h2>
                {room && (
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Code: {room.code}
                    </button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roommates.map((person) => (
                    <div key={person.id} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            {person.avatar_url ? (
                                <img src={person.avatar_url} alt={person.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{person.username || 'Unnamed'}</h3>
                            <p className="text-xs text-slate-500">Member</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
