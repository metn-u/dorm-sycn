import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useRoom } from '../contexts/RoomContext'
import { Profile } from '../types'
import { User, LogOut, Settings, Copy, Check, Users, UserMinus } from 'lucide-react'

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth()
    const { room } = useRoom()

    const [username, setUsername] = useState(profile?.username || '')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [roommates, setRoommates] = useState<Profile[]>([])

    // Update local state when profile loads
    useEffect(() => {
        if (profile) setUsername(profile.username || '')
        if (room?.id) {
            fetchRoommates()
        }
    }, [profile, room?.id])

    const fetchRoommates = async () => {
        if (!room?.id) return
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('room_id', room.id)
        setRoommates(data || [])
    }


    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        const { error } = await supabase
            .from('profiles')
            .update({ username })
            .eq('id', user.id)

        if (error) {
            alert(error.message)
        } else {
            alert('Profile updated!')
        }
        setLoading(false)
    }

    const copyCode = () => {
        if (room?.code) {
            navigator.clipboard.writeText(room.code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const regenerateCode = async () => {
        if (!room) return
        if (!confirm('Are you sure? Old code will stop working.')) return

        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const { error } = await supabase
            .from('rooms')
            .update({ code: newCode })
            .eq('id', room.id)

        if (error) alert(error.message)
        else alert('Code updated: ' + newCode)
    }

    const removeRoommate = async (roommateId: string, roommateName: string) => {
        if (!confirm(`Are you sure you want to remove ${roommateName} from the room?`)) return

        const { error } = await supabase
            .from('profiles')
            .update({ room_id: null })
            .eq('id', roommateId)

        if (error) {
            alert(error.message)
        } else {
            setRoommates(prev => prev.filter(r => r.id !== roommateId))
        }
    }

    return (
        <div className="space-y-12 pb-10">
            <header className="flex items-end justify-between border-b-4 border-black pb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black text-black uppercase tracking-tighter italic">Settings</h2>
                    <p className="text-black/60 text-xs font-black uppercase tracking-widest">Manage your profile & room</p>
                </div>
                <div className="bg-blue-400 neo-border p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Settings className="w-6 h-6 text-black" strokeWidth={3} />
                </div>
            </header>

            <div className="neo-card bg-white p-6 flex items-center gap-6 relative overflow-visible">
                <div className="absolute -top-3 -left-3 py-1 px-4 bg-yellow-400 border-4 border-black text-black text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
                    BETA USER
                </div>
                <div className="w-20 h-20 neo-border bg-blue-100 flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <User className="w-10 h-10" strokeWidth={3} />
                </div>
                <div>
                    <h3 className="font-black text-2xl text-black uppercase tracking-tighter italic leading-none">{profile?.username || 'Student'}</h3>
                    <p className="text-black/40 text-xs font-black uppercase tracking-widest mt-2">{user?.email}</p>
                </div>
            </div>

            <form onSubmit={updateProfile} className="neo-card p-8 bg-white space-y-6">
                <h3 className="text-xl font-black text-black uppercase tracking-tight border-b-2 border-black/10 pb-2">Modify Identity</h3>
                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-black/60">Stage Name</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full neo-input"
                    />
                </div>
                <button disabled={loading} className="w-full neo-button bg-black text-white hover:bg-yellow-400 hover:text-black transition-colors">
                    {loading ? 'Processing...' : 'Sync Profile'}
                </button>
            </form>

            {room && (
                <div className="neo-card p-8 bg-white space-y-8">
                    <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                        <h3 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                            <Settings className="w-6 h-6" strokeWidth={3} />
                            Room Authority
                        </h3>
                        <span className="text-[10px] bg-black text-white px-3 py-1 font-black uppercase tracking-widest leading-none">ID: {room.id.slice(0, 8)}</span>
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 neo-border bg-slate-50 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Room Title</p>
                                <p className="font-black text-lg text-black uppercase tracking-tight">{room.name}</p>
                            </div>
                        </div>

                        <div className="p-5 neo-border bg-[#FFFDF5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Access Passcode</p>
                                <p className="text-4xl font-black tracking-tighter text-black uppercase italic">{room.code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={copyCode}
                                className="neo-button bg-yellow-400 p-3 hover:bg-black hover:text-white transition-all"
                            >
                                {copied ? <Check className="w-6 h-6" strokeWidth={4} /> : <Copy className="w-6 h-6" strokeWidth={4} />}
                            </button>
                        </div>

                        {room.created_by === user?.id && (
                            <button
                                onClick={regenerateCode}
                                className="text-xs font-black uppercase tracking-widest text-black/40 hover:text-black underline decoration-2 transition-colors inline-block"
                            >
                                Cycle Room Code
                            </button>
                        )}
                    </div>
                </div>
            )}

            {room && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-400 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Users className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-black text-black uppercase tracking-tight italic">Household</h3>
                        <div className="h-1 flex-1 bg-black ml-4"></div>
                    </div>

                    <div className="grid gap-4">
                        {roommates.length === 0 ? (
                            <div className="text-center py-10 neo-card bg-white border-dashed border-4 border-black/10 italic">
                                <p className="text-black/30 font-black uppercase tracking-widest">Solo mission active</p>
                            </div>
                        ) : (
                            roommates.map(r => (
                                <div key={r.id} className="neo-card bg-white p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 neo-border bg-blue-50 flex items-center justify-center text-black/20 group-hover:bg-blue-100 group-hover:text-black transition-colors">
                                            <User className="w-6 h-6" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="font-black text-lg text-black uppercase tracking-tight leading-none">
                                                {r.username || 'Roommate'}
                                                {r.id === user?.id && <span className="ml-2 text-[9px] bg-black text-white px-1.5 py-0.5 font-black uppercase tracking-widest">You</span>}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                {r.id === room.created_by && (
                                                    <span className="text-[9px] bg-yellow-400 border border-black px-2 py-0.5 font-black uppercase tracking-widest">Founder</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {room.created_by === user?.id && r.id !== user?.id && (
                                        <button
                                            onClick={() => removeRoommate(r.id, r.username || 'Roommate')}
                                            className="p-3 bg-white text-rose-500 neo-border hover:bg-rose-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 opacity-0 group-hover:opacity-100"
                                            title="Expel from room"
                                        >
                                            <UserMinus className="w-5 h-5" strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={signOut}
                className="w-full neo-button bg-rose-500 text-white hover:bg-black flex items-center justify-center gap-3 active:shadow-none"
            >
                <LogOut className="w-6 h-6" strokeWidth={4} />
                Terminate Session
            </button>
        </div>
    )
}
