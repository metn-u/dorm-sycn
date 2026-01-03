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
            "flex items-center gap-5 p-5 neo-card transition-all",
            isCompleted ? "bg-[#F3F4F6] opacity-70 grayscale" : "bg-white hover:-translate-x-0.5 hover:-translate-y-0.5"
        )}>
            <button
                onClick={() => onToggle(task.id, task.status)}
                className={cn(
                    "w-8 h-8 rounded-lg border-4 flex items-center justify-center transition-all flex-shrink-0 active:scale-95",
                    isCompleted
                        ? "bg-black border-black"
                        : "bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400"
                )}
            >
                {isCompleted && (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <h3 className={cn(
                    "font-black text-lg tracking-tight truncate uppercase leading-none",
                    isCompleted ? "text-black/40 line-through" : "text-black"
                )}>
                    {task.title}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 border-2 border-black font-black uppercase text-[10px]",
                        isOverdue && !isCompleted ? "bg-rose-400" : "bg-white"
                    )}>
                        <Calendar className="w-3 h-3" strokeWidth={3} />
                        {format(new Date(task.due_date), 'MMM d')}
                    </div>
                    {assignee && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black text-white font-black uppercase text-[10px]">
                            <User className="w-3 h-3" strokeWidth={3} />
                            {assignee.username}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
