import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Users, Plus, ArrowRight, LayoutGrid } from 'lucide-react'
import { cn } from '../lib/utils'

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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md space-y-12">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 bg-indigo-50 rounded-[1.5rem] text-indigo-600 mb-2">
                        <LayoutGrid className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                        Room Setup
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Initialize your living parameters</p>
                </div>

                {mode === 'select' && (
                    <div className="grid gap-6">
                        <button
                            onClick={() => setMode('create')}
                            className="flex items-center justify-between p-8 bg-white transition-all bento-card group hover:-translate-y-2"
                        >
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                    <Plus className="w-8 h-8" strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-2xl text-slate-900 tracking-tight">Found Room</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Start a fresh squad</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 transition-colors" strokeWidth={2.5} />
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="flex items-center justify-between p-8 bg-white transition-all bento-card group hover:-translate-y-2"
                        >
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                    <Users className="w-8 h-8" strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-2xl text-slate-900 tracking-tight">Infiltrate</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Join existing room</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-slate-200 group-hover:text-emerald-600 transition-colors" strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                {(mode === 'create' || mode === 'join') && (
                    <div className="bento-card !p-10 relative overflow-visible">
                        <div className="absolute -top-4 right-6 py-2 px-6 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100">
                            {mode === 'create' ? 'Construction' : 'Authentication'}
                        </div>

                        <form onSubmit={mode === 'create' ? createRoom : joinRoom} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    {mode === 'create' ? 'Household Name' : 'Infiltration Code'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={mode === 'create' ? roomName : roomCode}
                                    onChange={(e) => mode === 'create' ? setRoomName(e.target.value) : setRoomCode(e.target.value)}
                                    placeholder={mode === 'create' ? "e.g. THE VAULT" : "e.g. XJ99K0"}
                                    className={cn(
                                        "w-full bento-input",
                                        mode === 'join' && "uppercase tracking-widest text-center text-2xl font-mono"
                                    )}
                                    maxLength={mode === 'join' ? 6 : 50}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setMode('select')}
                                    className="flex-1 bento-button-secondary py-3 text-xs"
                                >
                                    Abort
                                </button>
                                <button
                                    disabled={loading}
                                    className="flex-[2] bento-button-primary py-3 text-xs"
                                >
                                    {loading ? 'Processing...' : mode === 'create' ? 'Finalize Build' : 'Request Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
