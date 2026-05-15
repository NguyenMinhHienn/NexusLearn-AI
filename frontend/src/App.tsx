import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import DocumentPage from './pages/DocumentPage'
import KnowledgeMapPage from './pages/KnowledgeMapPage'
import QuizPage from './pages/QuizPage'
import AdminDashboard from './pages/AdminDashboard'
import ChatBot from './components/ChatBot'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="loading-screen">Đang tải...</div>
  if (!user) return <Navigate to="/login" />
  if (user.role === 'admin' && !requireAdmin) {
    return <Navigate to="/app/admin" />
  }
  if (user.role === 'user' && requireAdmin) {
    return <Navigate to="/app" />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        
        <Route path="/app" element={<ProtectedRoute requireAdmin={false}><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="documents/:id" element={<DocumentPage />} />
          <Route path="documents/:id/map" element={<KnowledgeMapPage />} />
          <Route path="documents/:id/quiz" element={<QuizPage />} />
        </Route>

        
        <Route path="/app/admin" element={<ProtectedRoute requireAdmin={true}><MainLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminDashboard />} />
        </Route>
      </Routes>
      <ChatBot />
    </AuthProvider>
  )
}

export default App
