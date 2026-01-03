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
        <div className="flex h-screen bg-[#FFFDF5] overflow-hidden">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex w-72 flex-col bg-white border-r-4 border-black">
                <div className="p-8">
                    <h1 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tighter italic">
                        <div className="p-2 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <LayoutGrid className="w-8 h-8" />
                        </div>
                        DormSync
                    </h1>
                    {room && <p className="text-xs bg-black text-white px-2 py-0.5 mt-4 font-black uppercase tracking-widest inline-block">{room.name}</p>}
                </div>
                <nav className="flex-1 p-6 space-y-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 border-2 border-black transition-all font-black uppercase tracking-tight",
                                location.pathname === item.path
                                    ? "bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
                                    : "bg-white hover:bg-slate-50"
                            )}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="md:hidden bg-white border-b-4 border-black px-6 py-5 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <span className="font-black text-black tracking-tighter text-xl uppercase italic">DormSync</span>
                    </div>
                    {room && <span className="text-xs bg-black text-white px-3 py-1 font-black uppercase tracking-widest">{room.name}</span>}
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto pb-28 md:pb-8">
                    <div className="max-w-4xl mx-auto p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white border-4 border-black flex justify-around items-center px-2 z-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center relative transition-all",
                            item.primary ? "pt-0" : "flex-1"
                        )}
                    >
                        {item.primary ? (
                            <div className="-mt-16">
                                <div className="bg-yellow-400 text-black p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all rounded-2xl hover:bg-yellow-300">
                                    <item.icon className="w-8 h-8" strokeWidth={4} />
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                "flex flex-col items-center p-2 rounded-xl transition-all",
                                location.pathname === item.path ? "bg-black text-white" : "text-black"
                            )}>
                                <item.icon
                                    className="w-6 h-6 flex-shrink-0"
                                    strokeWidth={location.pathname === item.path ? 3 : 2}
                                />
                                <span className="text-[9px] mt-0.5 font-black uppercase tracking-tighter">
                                    {item.label}
                                </span>
                            </div>
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    )
}
