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
        <div className="space-y-10 pb-10">
            <header className="flex items-end justify-between pb-2 border-b border-slate-200">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-slate-500 text-sm">Manage your profile & room</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                    <Settings className="w-6 h-6 text-indigo-600" strokeWidth={2} />
                </div>
            </header>

            <div className="bento-card relative overflow-visible flex flex-col md:flex-row items-center gap-6">
                <div className="absolute -top-3 left-6 py-1 px-4 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100">
                    Member
                </div>
                <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 shadow-inner">
                    <User className="w-12 h-12" strokeWidth={2} />
                </div>
                <div className="text-center md:text-left">
                    <h3 className="font-bold text-2xl text-slate-900 tracking-tight leading-none">{profile?.username || 'Student'}</h3>
                    <p className="text-slate-400 text-sm font-medium mt-2">{user?.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <form onSubmit={updateProfile} className="bento-card space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-4">Personal Details</h3>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Screen Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bento-input"
                        />
                    </div>
                    <button disabled={loading} className="w-full bento-button-primary">
                        {loading ? 'Saving Changes...' : 'Update Profile'}
                    </button>
                </form>

                {room && (
                    <div className="bento-card space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                <LayoutGrid className="w-6 h-6 text-indigo-600" />
                                Room Admin
                            </h3>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 font-bold uppercase tracking-widest rounded-lg">ID: {room.id.slice(0, 8)}</span>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Room Name</p>
                                    <p className="font-bold text-lg text-slate-900 tracking-tight">{room.name}</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Invite Passcode</p>
                                    <p className="text-4xl font-bold tracking-tight text-slate-900 uppercase font-mono">{room.code}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={copyCode}
                                    className="bento-button-primary !p-4 rounded-2xl flex items-center justify-center"
                                >
                                    {copied ? <Check className="w-6 h-6" strokeWidth={2.5} /> : <Copy className="w-6 h-6" strokeWidth={2.5} />}
                                </button>
                            </div>

                            {room.created_by === user?.id && (
                                <button
                                    onClick={regenerateCode}
                                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors inline-block"
                                >
                                    Regenerate invite code
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {room && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                                <Users className="w-5 h-5 text-indigo-600" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Roommates</h3>
                            <div className="h-px flex-1 bg-slate-200 ml-3"></div>
                        </div>

                        <div className="bento-card !p-2 divide-y divide-slate-100">
                            {roommates.length === 0 ? (
                                <div className="text-center py-10 italic">
                                    <p className="text-slate-400 font-medium">No roommates yet</p>
                                </div>
                            ) : (
                                roommates.map(r => (
                                    <div key={r.id} className="p-4 flex items-center justify-between group transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-300 transition-colors">
                                                <User className="w-6 h-6" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 tracking-tight leading-none">
                                                    {r.username || 'Roommate'}
                                                    {r.id === user?.id && <span className="ml-2 text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest">You</span>}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    {r.id === room.created_by && (
                                                        <span className="text-[8px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-indigo-100">Founder</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {room.created_by === user?.id && r.id !== user?.id && (
                                            <button
                                                onClick={() => removeRoommate(r.id, r.username || 'Roommate')}
                                                className="p-3 bg-white text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                title="Remove from room"
                                            >
                                                <UserMinus className="w-5 h-5" strokeWidth={2} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={signOut}
                className="w-full bento-button-secondary !bg-rose-50 !text-rose-600 !border-rose-100 hover:!bg-rose-600 hover:!text-white flex items-center justify-center gap-3 mt-8"
            >
                <LogOut className="w-5 h-5" strokeWidth={2.5} />
                Sign Out
            </button>
        </div>
    )
}
