import { Outlet, useLocation, Link } from 'react-router-dom'
import { Home, LayoutGrid, CheckSquare, Plus, Receipt, User } from 'lucide-react'
import { cn } from '../lib/utils'
import { useRoom } from '../contexts/RoomContext'

export default function Layout() {
    const location = useLocation()
    const { room } = useRoom()

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/add', icon: Plus, label: 'Add', primary: true },
        { path: '/debts', icon: Receipt, label: 'Debts' },
        { path: '/profile', icon: User, label: 'Profile' }
    ]

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200">
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        DormSync
                    </h1>
                    {room && (
                        <div className="mt-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                {room.name}
                            </span>
                        </div>
                    )}
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight text-lg">DormSync</span>
                    </div>
                    {room && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                            {room.name}
                        </span>
                    )}
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto pb-32 md:pb-8">
                    <div className="max-w-4xl mx-auto p-4 md:p-10">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/90 backdrop-blur-lg border border-slate-200 flex justify-around items-center px-4 z-50 shadow-xl rounded-[2.5rem]">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    if (item.primary) {
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative -mt-12"
                            >
                                <div className="bg-indigo-600 text-white p-4 rounded-[2rem] shadow-lg shadow-indigo-200 active:scale-90 transition-transform">
                                    <item.icon className="w-7 h-7" strokeWidth={2.5} />
                                </div>
                            </Link>
                        )
                    }
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 transition-all py-2 rounded-2xl",
                                isActive ? "text-indigo-600" : "text-slate-400"
                            )}
                        >
                            <item.icon
                                className="w-6 h-6"
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[10px] mt-1 font-semibold tracking-tight",
                                isActive ? "text-indigo-600" : "text-slate-500"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
