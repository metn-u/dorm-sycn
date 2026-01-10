import { Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function TopNav() {
    const { theme, toggleTheme } = useTheme();
    const { profile, session } = useAuth();

    if (!session) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                aria-label="Toggle Theme"
            >
                {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                ) : (
                    <Sun className="w-5 h-5" />
                )}
            </button>

            {/* Profile Link */}
            <Link
                to="/profile"
                className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:shadow-md transition-all duration-300 shadow-sm active:scale-95 group"
            >
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50 transition-colors">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <User className="w-4 h-4" />
                        </div>
                    )}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
                    {profile?.username || 'Profile'}
                </span>
            </Link>
        </div>
    );
}
