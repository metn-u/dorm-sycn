export type Profile = {
    id: string
    username: string
    avatar_url: string | null
    room_id: string | null
}

export type Room = {
    id: string
    name: string
    code: string
    created_by: string
}

export type Chore = {
    id: string
    title: string
    assigned_to: string
    room_id: string
    due_date: string
    status: 'pending' | 'completed'
}

export type Expense = {
    id: string
    amount: number
    description: string
    paid_by: string
    room_id: string
    created_at: string
    split_with?: string | null // If null, split with everyone. If present, split with this user only.
    type?: 'group' | 'direct'
}

