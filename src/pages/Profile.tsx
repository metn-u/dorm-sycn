import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useRoom } from '../contexts/RoomContext'
import { User, LogOut, Settings, Copy, Check } from 'lucide-react'

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth()
    const { room } = useRoom()

    const [username, setUsername] = useState(profile?.username || '')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Update local state when profile loads
    useEffect(() => {
        if (profile) setUsername(profile.username || '')
    }, [profile])


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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Profile</h2>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{profile?.username || 'Student'}</h3>
                    <p className="text-slate-500 text-sm">{user?.email}</p>
                </div>
            </div>

            <form onSubmit={updateProfile} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Edit Profile</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Display Name</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            {room && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-slate-400" />
                        Room Settings
                    </h3>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-700">Room Name</p>
                                <p className="text-sm text-slate-500">{room.name}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-700">Invite Code</p>
                                <p className="text-xl font-mono font-bold text-indigo-600">{room.code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={copyCode}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        {room.created_by === user?.id && (
                            <button
                                onClick={regenerateCode}
                                className="text-sm text-indigo-600 font-medium hover:underline"
                            >
                                Regenerate Invite Code
                            </button>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 p-4 text-rose-600 font-bold bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    )
}
