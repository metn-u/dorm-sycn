import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { Room } from '../types'

type RoomContextType = {
    room: Room | null
    loading: boolean
}

const RoomContext = createContext<RoomContextType>({
    room: null,
    loading: true,
})

export function RoomProvider({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth()
    const [room, setRoom] = useState<Room | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile?.room_id) {
            setLoading(false)
            return
        }

        const fetchRoom = async () => {
            const { data } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', profile.room_id)
                .single()

            setRoom(data)
            setLoading(false)
        }

        fetchRoom()
    }, [profile?.room_id])

    return (
        <RoomContext.Provider value={{ room, loading }}>
            {children}
        </RoomContext.Provider>
    )
}

export const useRoom = () => useContext(RoomContext)
