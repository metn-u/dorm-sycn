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
            "flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border transition-all",
            isCompleted ? "border-slate-100 opacity-75" : "border-slate-100 hover:border-indigo-200"
        )}>
            <button
                onClick={() => onToggle(task.id, task.status)}
                className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                    isCompleted
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-slate-300 hover:border-indigo-400"
                )}
            >
                {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <h3 className={cn(
                    "font-medium truncate",
                    isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                )}>
                    {task.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <div className={cn("flex items-center gap-1", isOverdue && "text-red-500 font-medium")}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.due_date), 'MMM d')}
                    </div>
                    {assignee && (
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {assignee.username}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
