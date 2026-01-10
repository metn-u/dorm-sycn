import { useState, useEffect } from 'react'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CalendarEvent, Chore } from '../types'
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    startOfDay,
    parseISO,
    differenceInDays
} from 'date-fns'
import { cn } from '../lib/utils'

export default function Calendar() {
    const { room } = useRoom()
    const { user } = useAuth()
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [chores, setChores] = useState<Chore[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'exam' as CalendarEvent['type'],
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
    })

    useEffect(() => {
        if (!room?.id) return
        fetchAllData()
    }, [room?.id])

    const fetchAllData = async () => {
        setLoading(true)

        // Fetch Events
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('room_id', room?.id)

        // Fetch Chores
        const { data: choreData, error: choreError } = await supabase
            .from('chores')
            .select('*')
            .eq('room_id', room?.id)

        if (eventData) setEvents(eventData)
        if (choreData) setChores(choreData)

        if (eventError) console.error('Error fetching events:', eventError)
        if (choreError) console.error('Error fetching chores:', choreError)

        setLoading(false)
    }

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!room?.id || !user?.id) return

        const { error } = await supabase
            .from('events')
            .insert([{
                ...newEvent,
                room_id: room.id,
                created_by: user.id,
                // Ensure we store as a valid timestamp even if user only picked date
                start_date: new Date(newEvent.start_date).toISOString(),
                end_date: new Date(newEvent.end_date).toISOString()
            }])

        if (error) {
            alert('Error adding event: ' + error.message)
        } else {
            setShowAddModal(false)
            setNewEvent({
                title: '',
                type: 'exam',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(new Date(), 'yyyy-MM-dd'),
                description: ''
            })
            fetchAllData()
        }
    }

    const handleDeleteEvent = async (e: React.MouseEvent, eventId: string, createdBy: string) => {
        e.stopPropagation()

        const isOwner = room?.created_by === user?.id
        const isCreator = createdBy === user?.id

        if (!isOwner && !isCreator) {
            alert('Only the room owner or the person who created this event can delete it.')
            return
        }

        if (!confirm('Are you sure you want to delete this event?')) return

        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)

        if (error) {
            console.error('Delete error:', error)
            alert('Error deleting event: ' + error.message)
        } else {
            fetchAllData()
        }
    }

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Room schedule and tasks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-indigo-950/40 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>
        )
    }

    const renderDaysHeader = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return (
            <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderWeeks = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
        const weeks: Date[][] = []
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7))
        }

        return (
            <div className="space-y-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                {weeks.map((week, weekIdx) => {
                    const weekStart = startOfDay(week[0])
                    const weekEnd = startOfDay(week[6])

                    // Get events that overlap with this week
                    const weekEvents = events.filter(e => {
                        const eventStart = startOfDay(parseISO(e.start_date))
                        const eventEnd = startOfDay(parseISO(e.end_date))
                        return eventStart <= weekEnd && eventEnd >= weekStart
                    })

                    // Logic to assign vertical slots to events within the week
                    const slots: (CalendarEvent | null)[][] = []

                    weekEvents.sort((a, b) => {
                        const startDiff = differenceInDays(parseISO(a.start_date), parseISO(b.start_date))
                        if (startDiff !== 0) return startDiff
                        return differenceInDays(parseISO(b.end_date), parseISO(a.end_date))
                    }).forEach(event => {
                        let slotIdx = 0
                        while (true) {
                            if (!slots[slotIdx]) slots[slotIdx] = Array(7).fill(null)

                            const eventStart = startOfDay(parseISO(event.start_date))
                            const eventEnd = startOfDay(parseISO(event.end_date))

                            const startCol = Math.max(0, differenceInDays(eventStart, weekStart))
                            const endCol = Math.min(6, differenceInDays(eventEnd, weekStart))

                            let fits = true
                            for (let col = startCol; col <= endCol; col++) {
                                if (slots[slotIdx][col]) {
                                    fits = false
                                    break
                                }
                            }

                            if (fits) {
                                for (let col = startCol; col <= endCol; col++) {
                                    slots[slotIdx][col] = event
                                }
                                break
                            }
                            slotIdx++
                        }
                    })

                    return (
                        <div key={weekIdx} className="relative group/week min-h-[120px] bg-white dark:bg-slate-900 border-b last:border-0 border-slate-100 dark:border-slate-800/50">
                            {/* Background Grid */}
                            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                {week.map(day => (
                                    <div key={day.toString()} className={cn(
                                        "border-r last:border-r-0 border-slate-100 dark:border-slate-800/50 h-full",
                                        !isSameMonth(day, monthStart) && "bg-slate-50/30 dark:bg-slate-950/20"
                                    )} />
                                ))}
                            </div>

                            {/* Row for Day Numbers */}
                            <div className="grid grid-cols-7 relative pt-2 px-1">
                                {week.map(day => {
                                    const isTodayDate = isSameDay(day, new Date())
                                    const isCurrentMonth = isSameMonth(day, monthStart)
                                    return (
                                        <div key={day.toString()} className="flex flex-col items-center">
                                            <span className={cn(
                                                "text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all",
                                                isTodayDate ? "bg-indigo-600 text-white shadow-sm" : isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-700"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            {/* Chores markers below date */}
                                            <div className="flex gap-0.5 mt-0.5 h-1">
                                                {chores.filter(c => isSameDay(parseISO(c.due_date), day)).map(chore => (
                                                    <div key={chore.id} className="w-1 h-1 rounded-full bg-emerald-400" />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Rows for Events */}
                            <div className="relative mt-2 space-y-1 pb-2">
                                {slots.map((slot, slotIdx) => (
                                    <div key={slotIdx} className="grid grid-cols-7 px-1 gap-px h-6">
                                        {Array.from({ length: 7 }).map((_, col) => {
                                            const event = slot[col]
                                            if (!event) return <div key={col} />

                                            // Check if this is the start of the strip in THIS week
                                            const isStartOfWeek = col === 0
                                            const isEventStart = isSameDay(parseISO(event.start_date), week[col])
                                            const isStart = isStartOfWeek || isEventStart

                                            if (!isStart) return null

                                            // Calculate span for this specific event in this week
                                            let endColIdx = col
                                            while (endColIdx < 6 && slot[endColIdx + 1]?.id === event.id) {
                                                endColIdx++
                                            }
                                            const span = endColIdx - col + 1

                                            return (
                                                <div
                                                    key={event.id}
                                                    style={{ gridColumn: `span ${span}` }}
                                                    className={cn(
                                                        "relative h-full px-2 flex items-center justify-center overflow-hidden transition-all group/event text-center",
                                                        event.type === 'exam' ? "bg-amber-100/80 text-amber-800 border-l-4 border-amber-400 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-600" :
                                                            event.type === 'event' ? "bg-indigo-100/80 text-indigo-800 border-l-4 border-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-600" :
                                                                event.type === 'away' ? "bg-rose-100/80 text-rose-800 border-l-4 border-rose-400 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-600" :
                                                                    "bg-slate-100/80 text-slate-800 border-l-4 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-500",
                                                        isEventStart ? "rounded-r-md ml-0.5" : "-ml-px",
                                                        isSameDay(parseISO(event.end_date), week[endColIdx]) ? "rounded-r-md mr-0.5" : ""
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold truncate">
                                                        {event.title}
                                                    </span>

                                                    <button
                                                        onClick={(e) => handleDeleteEvent(e, event.id, event.created_by)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover/event:opacity-100 md:opacity-0 group-hover/event:md:opacity-100 opacity-100 sm:opacity-100"
                                                        title="Delete event"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {renderHeader()}

            <div className="bento-card !p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                {loading ? (
                    <div className="h-[600px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                    </div>
                ) : (
                    <>
                        {renderDaysHeader()}
                        {renderWeeks()}
                    </>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Exams</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Events</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Away from Dorm</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Chores</span>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Add Event</h2>
                        <form onSubmit={handleAddEvent} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Title</label>
                                <input
                                    required
                                    type="text"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder-slate-400"
                                    placeholder="Final Exam, Visitor, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Type</label>
                                <select
                                    value={newEvent.type}
                                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                                >
                                    <option value="exam">🎓 Exam</option>
                                    <option value="event">📅 Event</option>
                                    <option value="away">🏠 Away from Dorm</option>
                                    <option value="other">✨ Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={newEvent.start_date}
                                        onChange={e => {
                                            const newDate = e.target.value;
                                            setNewEvent(prev => ({
                                                ...prev,
                                                start_date: newDate,
                                                end_date: prev.end_date < newDate || prev.end_date === prev.start_date ? newDate : prev.end_date
                                            }))
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newEvent.end_date}
                                        onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                        min={newEvent.start_date}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-950/40 hover:shadow-indigo-200 active:scale-95 transition-all outline-none"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
