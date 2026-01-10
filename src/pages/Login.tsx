import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/utils'
import { LayoutGrid } from 'lucide-react'

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-500">
            <div className="w-full max-w-md space-y-12">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.5rem] text-indigo-600 dark:text-indigo-400 mb-2">
                        <LayoutGrid className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Room Setup
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Initialize your living parameters</p>
                </div>

                <div className="bento-card space-y-10 !p-10">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <button
                            onClick={() => setMode('signin')}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all duration-300",
                                mode === 'signin'
                                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all duration-300",
                                mode === 'signup'
                                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            Join Up
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Screen Name</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bento-input"
                                    placeholder="e.g. NeoRoomie"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bento-input"
                                placeholder="student@campus.edu"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bento-input"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bento-button-primary mt-4"
                        >
                            {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
