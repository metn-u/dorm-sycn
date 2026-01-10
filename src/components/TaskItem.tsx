import { format } from 'date-fns'
import { Calendar, User } from 'lucide-react'
import { Chore, Profile } from '../types'
import { cn } from '../lib/utils'

type TaskItemProps = {
    task: Chore
    assignee?: Profile
    onToggle: (id: string, currentStatus: string) => void
}

export default function TaskItem({ task, assignee, onToggle }: TaskItemProps) {
    const isCompleted = task.status === 'completed'
    const isOverdue = new Date(task.due_date) < new Date() && !isCompleted

    return (
        <div className={cn(
            "flex items-center gap-4 transition-all duration-300",
            isCompleted ? "opacity-50" : "bg-white dark:bg-transparent"
        )}>
            <button
                onClick={() => onToggle(task.id, task.status)}
                className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-90",
                    isCompleted
                        ? "bg-indigo-600 border-indigo-600 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
            >
                {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <h3 className={cn(
                    "font-semibold text-base tracking-tight truncate transition-all duration-300",
                    isCompleted ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-900 dark:text-white"
                )}>
                    {task.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-wider transition-colors",
                        isOverdue && !isCompleted
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
                    )}>
                        <Calendar className="w-3 h-3" strokeWidth={2.5} />
                        {format(new Date(task.due_date), 'MMM d')}
                    </div>
                    {assignee && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-md font-bold uppercase text-[9px] tracking-wider">
                            <User className="w-3 h-3" strokeWidth={2.5} />
                            {assignee.username}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
