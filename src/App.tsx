import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RoomProvider } from './contexts/RoomContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Add from './pages/Add'
import Profile from './pages/Profile'
import Login from './pages/Login'
import RoomSetup from './pages/RoomSetup'
import Debts from './pages/Debts'
import Calendar from './pages/Calendar'
import TopNav from './components/TopNav'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading, profile } = useAuth()

    if (loading) return <div className="min-h-screen flex items-center justify-center text-indigo-600 dark:text-indigo-400">Loading...</div>
    if (!session) return <Navigate to="/welcome" />

    // If user is logged in but has no room_id, redirect to setup
    if (!profile?.room_id) return <Navigate to="/setup" />

    return <>{children}</>
}

// Route for authenticated users who might NOT have a room yet
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth()
    if (loading) return <div>Loading...</div>
    if (!session) return <Navigate to="/welcome" />
    return <>{children}</>
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <TopNav />
                    <RoomProvider>
                        <Routes>
                            <Route path="/welcome" element={<Landing />} />
                            <Route path="/login" element={<Login />} />

                            <Route path="/setup" element={
                                <AuthRoute>
                                    <RoomSetup />
                                </AuthRoute>
                            } />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<Dashboard />} />
                                <Route path="tasks" element={<Tasks />} />
                                <Route path="add" element={<Add />} />
                                <Route path="debts" element={<Debts />} />
                                <Route path="calendar" element={<Calendar />} />
                                <Route path="expenses" element={<Navigate to="/debts" replace />} />
                                <Route path="profile" element={<Profile />} />
                            </Route>
                        </Routes>
                    </RoomProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}

export default App
