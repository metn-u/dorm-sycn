import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Users, Plus, ArrowRight } from 'lucide-react'

export default function RoomSetup() {
    const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
    const [roomName, setRoomName] = useState('')
    const [roomCode, setRoomCode] = useState('')
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    const createRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            console.log("Oda oluşturuluyor, kullanıcı:", user.id);

            // 0. Profilin var olduğundan emin ol (Upsert kullanıyoruz)
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: user.user_metadata?.full_name || user.email?.split('@')[0],
                })

            if (upsertError) {
                console.error("Profil oluşturma hatası:", upsertError);
                throw new Error("Profiliniz hazırlanırken bir hata oluştu: " + upsertError.message);
            }

            // 1. Oda Oluştur
            const code = Math.random().toString(36).substring(2, 8).toUpperCase()
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .insert({ name: roomName, code, created_by: user.id })
                .select()
                .single()

            if (roomError) {
                console.error("Oda oluşturma hatası:", roomError);
                alert("Oda oluşturulamadı: " + roomError.message);
                return;
            }

            // 2. Profili odaya bağla
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ room_id: room.id })
                .eq('id', user.id)

            if (profileError) {
                console.error("Profil güncelleme hatası:", profileError);
                alert('Oda kuruldu ama giriş yapılamadı: ' + profileError.message)
            } else {
                window.location.href = '/'
            }
        } catch (err: any) {
            console.error("Genel hata:", err);
            alert(err.message || 'Beklenmedik bir hata oluştu.');
        } finally {
            setLoading(false)
        }
    }

    const joinRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            // 0. Ensure Profile exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            if (!existingProfile) {
                await supabase.from('profiles').insert({
                    id: user.id,
                    username: user.user_metadata?.full_name || user.email?.split('@')[0],
                })
            }

            // 1. Find Room by Code
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .select('id')
                .eq('code', roomCode.toUpperCase())
                .maybeSingle()

            if (roomError || !room) {
                alert('Invalid Room Code or room not found')
                setLoading(false)
                return
            }

            // 2. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ room_id: room.id })
                .eq('id', user.id)

            if (profileError) {
                alert(profileError.message)
            } else {
                window.location.href = '/'
            }
        } catch (err: any) {
            alert(err.message || 'An error occurred while joining the room')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-800">Setup Your Dorm</h1>
                    <p className="text-slate-500 mt-2">Join an existing room or create a new one</p>
                </div>

                {mode === 'select' && (
                    <div className="grid gap-4">
                        <button
                            onClick={() => setMode('create')}
                            className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-slate-800">Create New Room</h3>
                                    <p className="text-sm text-slate-500">Start a fresh house</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-slate-800">Join Room</h3>
                                    <p className="text-sm text-slate-500">Enter a code</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
                        </button>
                    </div>
                )}

                {mode === 'create' && (
                    <form onSubmit={createRoom} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Room Name</label>
                            <input
                                type="text"
                                required
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="e.g. The Penthouse"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Back
                            </button>
                            <button
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'join' && (
                    <form onSubmit={joinRoom} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Invite Code</label>
                            <input
                                type="text"
                                required
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                placeholder="e.g. A1B2C3"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest"
                                maxLength={6}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Back
                            </button>
                            <button
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Joining...' : 'Join Room'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
