import { useNavigate } from 'react-router-dom'
import { LayoutGrid, CheckCircle2, CreditCard, Users2, ArrowRight, Sparkles } from 'lucide-react'

export default function Landing() {
    const navigate = useNavigate()

    const features = [
        {
            title: "Smart Tasks",
            description: "Coordinate chores and daily tasks effortlessly with your roommates.",
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
            className: "md:col-span-2 md:row-span-1 bg-emerald-50/50 border-emerald-100",
        },
        {
            title: "Expense Splitting",
            description: "No more awkward money talks. Track and split bills instantly.",
            icon: <CreditCard className="w-6 h-6 text-blue-500" />,
            className: "md:col-span-1 md:row-span-2 bg-blue-50/50 border-blue-100 flex-col justify-between",
        },
        {
            title: "Room Coordination",
            description: "Manage your shared space with a unified dashboard.",
            icon: <Users2 className="w-6 h-6 text-indigo-500" />,
            className: "md:col-span-1 md:row-span-1 bg-indigo-50/50 border-indigo-100",
        },
        {
            title: "Stay Synced",
            description: "Real-time updates keep everyone on the same page, always.",
            icon: <Sparkles className="w-6 h-6 text-amber-500" />,
            className: "md:col-span-1 md:row-span-1 bg-amber-50/50 border-amber-100",
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-700 dark:selection:bg-indigo-900 dark:selection:text-indigo-300 transition-colors duration-300">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">DormSync</span>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mr-12"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                        <Sparkles className="w-3 h-3" />
                        Next-Gen Roommate Management
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                        Your Shared Space, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Synchronized.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
                        DormSync brings harmony to your dorm life. Track tasks, split expenses, and manage your room with a beautiful Bento-style interface.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto bento-button-primary group"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </button>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Free for students, always.</p>
                    </div>
                </div>

                {/* Feature Grid (Bento Style) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[180px]">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className={`bento-card border flex p-8 group transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${feature.className} dark:bg-slate-900/50 dark:border-slate-800`}
                        >
                            <div className="space-y-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 inline-block">
                                    {feature.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">{feature.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Unique Testimonial Card */}
                    <div className="md:col-span-2 md:row-span-1 bento-card border bg-slate-900 text-white p-8 flex flex-col justify-center relative overflow-hidden group border-slate-800">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutGrid className="w-32 h-32 rotate-12" />
                        </div>
                        <p className="text-lg font-medium italic mb-4 relative z-10">
                            "DormSync saved our roommate friendship. Everything is crystal clear and looks amazing."
                        </p>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">M</div>
                            <span className="text-slate-400 text-sm font-bold">— Metin, Computer Science</span>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-32 text-center py-20 rounded-[2.5rem] bg-indigo-600 dark:bg-indigo-700 text-white space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight relative z-10">Ready to sync your room?</h2>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-2xl hover:bg-slate-50 transition-all hover:scale-105 relative z-10"
                    >
                        Join DormSync Today
                    </button>
                </div>
            </main>
        </div>
    )
}
