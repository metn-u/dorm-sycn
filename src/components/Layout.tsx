import { Outlet, useLocation, Link } from 'react-router-dom'
import { Home, LayoutGrid, CheckSquare, Plus, Receipt, User, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import { useRoom } from '../contexts/RoomContext'

export default function Layout() {
    const location = useLocation()
    const { room } = useRoom()

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/add', icon: Plus, label: 'Add', primary: true },
        { path: '/expenses', icon: Receipt, label: 'Money' },
        { path: '/debts', icon: Clock, label: 'Debts' },
        { path: '/profile', icon: User, label: 'Profile' }
    ]

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                        <LayoutGrid className="w-8 h-8" />
                        DormSync
                    </h1>
                    {room && <p className="text-xs text-slate-400 mt-1 font-medium px-1">{room.name}</p>}
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
                                location.pathname === item.path
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="md:hidden bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-indigo-600" />
                        <span className="font-bold text-slate-800 tracking-tight text-lg">DormSync</span>
                    </div>
                    {room && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold">{room.name}</span>}
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto pb-24 md:pb-8">
                    <div className="max-w-4xl mx-auto p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-end pt-2 pb-safe z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center relative flex-1 pb-3 pt-1",
                            item.primary ? "z-10" : ""
                        )}
                    >
                        {item.primary ? (
                            <div className="-mt-10 mb-1">
                                <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform ring-4 ring-white">
                                    <item.icon className="w-7 h-7" strokeWidth={3} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-colors",
                                        location.pathname === item.path ? "text-indigo-600" : "text-slate-400"
                                    )}
                                />
                                <span className={cn(
                                    "text-[10px] mt-1 font-bold uppercase tracking-wider",
                                    location.pathname === item.path ? "text-indigo-600" : "text-slate-400"
                                )}>
                                    {item.label}
                                </span>
                                {location.pathname === item.path && (
                                    <div className="absolute bottom-0 w-1 h-1 bg-indigo-600 rounded-full" />
                                )}
                            </>
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    )
}
