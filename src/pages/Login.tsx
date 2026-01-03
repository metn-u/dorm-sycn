import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/utils'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const navigate = useNavigate()
    const { session } = useAuth()

    useEffect(() => {
        if (session) {
            navigate('/')
        }
    }, [session, navigate])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: username,
                    }
                }
            })
            if (error) alert(error.message)
            else alert('Check your email to confirm your account!')
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                alert(error.message)
            } else {
                navigate('/')
            }
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#FFFDF5] flex flex-col justify-center p-6 font-['Outfit']">
            <div className="w-full max-w-sm mx-auto space-y-10">
                <div className="text-center">
                    <h1 className="text-6xl font-black text-black uppercase tracking-tighter italic leading-none">
                        Dorm<span className="text-yellow-400">Sync</span>
                    </h1>
                    <div className="h-2 w-24 bg-black mx-auto mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                    <p className="text-black/60 font-black uppercase tracking-widest text-[10px] mt-6">Roommate Coordination Hub</p>
                </div>

                <div className="neo-card p-10 bg-white space-y-10">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMode('signin')}
                            className={cn(
                                "flex-1 py-3 neo-border font-black uppercase text-xs tracking-widest transition-all",
                                mode === 'signin' ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-white"
                            )}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={cn(
                                "flex-1 py-3 neo-border font-black uppercase text-xs tracking-widest transition-all",
                                mode === 'signup' ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-white"
                            )}
                        >
                            Join Up
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-1">Pseudonym</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full neo-input"
                                    placeholder="e.g. NeoRoomie"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full neo-input"
                                placeholder="student@campus.edu"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-1">Secret Key</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full neo-input"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full neo-button bg-black text-white hover:bg-yellow-400 hover:text-black mt-4 uppercase tracking-tighter"
                        >
                            {loading ? 'Decrypting...' : mode === 'signin' ? 'Unlock Access' : 'Create Credentials'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
