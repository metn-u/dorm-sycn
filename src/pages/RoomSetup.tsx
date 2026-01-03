import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Users, Plus, ArrowRight } from 'lucide-react'
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
        <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center p-6 font-['Outfit']">
            <div className="w-full max-w-md space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-black text-black uppercase tracking-tighter italic leading-none">
                        Room<span className="text-blue-500">Service</span>
                    </h1>
                    <p className="text-black/60 font-black uppercase tracking-widest text-[10px]">Initialize your living parameters</p>
                    <div className="h-2 w-32 bg-black mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                </div>

                {mode === 'select' && (
                    <div className="grid gap-6">
                        <button
                            onClick={() => setMode('create')}
                            className="flex items-center justify-between p-8 bg-white transition-all neo-card group hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-yellow-400 neo-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black group-hover:bg-black group-hover:text-yellow-400 transition-colors">
                                    <Plus className="w-8 h-8" strokeWidth={4} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-2xl text-black uppercase tracking-tighter italic">Found Room</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-1">Start a fresh squad</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-black/20 group-hover:text-black transition-colors" strokeWidth={3} />
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="flex items-center justify-between p-8 bg-white transition-all neo-card group hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-emerald-400 neo-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black group-hover:bg-black group-hover:text-emerald-400 transition-colors">
                                    <Users className="w-8 h-8" strokeWidth={4} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-2xl text-black uppercase tracking-tighter italic">Infiltrate</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-1">Join existing room</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-black/20 group-hover:text-black transition-colors" strokeWidth={3} />
                        </button>
                    </div>
                )}

                {(mode === 'create' || mode === 'join') && (
                    <div className="neo-card p-10 bg-white relative overflow-visible">
                        <div className="absolute -top-4 -right-4 py-2 px-6 bg-black text-white text-xs font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] rotate-3">
                            {mode === 'create' ? 'CONSTRUCTION' : 'AUTHENTICATION'}
                        </div>

                        <form onSubmit={mode === 'create' ? createRoom : joinRoom} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-1">
                                    {mode === 'create' ? 'Household Name' : 'Infiltration Code'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={mode === 'create' ? roomName : roomCode}
                                    onChange={(e) => mode === 'create' ? setRoomName(e.target.value) : setRoomCode(e.target.value)}
                                    placeholder={mode === 'create' ? "e.g. THE VAULT" : "e.g. XJ99K0"}
                                    className={cn(
                                        "w-full neo-input",
                                        mode === 'join' && "uppercase tracking-widest text-center text-2xl"
                                    )}
                                    maxLength={mode === 'join' ? 6 : 50}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setMode('select')}
                                    className="flex-1 neo-button bg-white text-black hover:bg-slate-50 uppercase text-xs"
                                >
                                    Abort
                                </button>
                                <button
                                    disabled={loading}
                                    className="flex-2 neo-button bg-black text-white hover:bg-yellow-400 hover:text-black uppercase text-xs"
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
