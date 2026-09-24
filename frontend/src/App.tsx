import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import DocumentPage from './pages/DocumentPage'
import KnowledgeMapPage from './pages/KnowledgeMapPage'
import FlashcardPage from './pages/FlashcardPage'
import QuizPage from './pages/QuizPage'
import AdminDashboard from './pages/AdminDashboard'
import ChatBot from './components/ChatBot'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (user.role === 'admin' && !requireAdmin) {
    return <Navigate to="/app/admin" />
  }
  if (user.role === 'user' && requireAdmin) {
    return <Navigate to="/app" />
  }

  return <>{children}</>
}

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const } },
}

function AnimatedRoutes() {
  const location = useLocation()
  const isDocumentPage = location.pathname.includes('/documents/')

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} {...pageTransition} className="min-h-screen">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/app" element={<ProtectedRoute requireAdmin={false}><MainLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="documents/:id" element={<DocumentPage />} />
              <Route path="documents/:id/map" element={<KnowledgeMapPage />} />
              <Route path="documents/:id/quiz" element={<QuizPage />} />
              <Route path="documents/:id/flashcards" element={<FlashcardPage />} />
            </Route>

            <Route path="/app/admin" element={<ProtectedRoute requireAdmin={true}><MainLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminDashboard />} />
              <Route path="settings" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!isDocumentPage && <ChatBot />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AnimatedRoutes />
    </AuthProvider>
  )
}

export default App
