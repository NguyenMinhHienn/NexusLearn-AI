import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatBot from './components/ChatBot'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const DocumentPage = lazy(() => import('./pages/DocumentPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const KnowledgeMapPage = lazy(() => import('./pages/KnowledgeMapPage'))
const FlashcardPage = lazy(() => import('./pages/FlashcardPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ReviewRoomPage = lazy(() => import('./pages/ReviewRoomPage'))
const BillingPage = lazy(() => import('./pages/BillingPage'))

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="loading-screen" />
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
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const } },
}

function AnimatedRoutes() {
  const location = useLocation()
  const isDocumentPage = location.pathname.includes('/documents/')
  // Keep MainLayout mounted across /app/* pages; page-level transitions happen inside the layout
  const sectionKey = location.pathname.startsWith('/app/admin')
    ? '/app/admin'
    : location.pathname.startsWith('/app')
      ? '/app'
      : location.pathname === '/login' || location.pathname === '/register'
        ? '/auth'
        : location.pathname

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={sectionKey} {...pageTransition} className="min-h-screen">
          <Suspense fallback={<div className="loading-screen min-h-screen bg-[var(--bg-main)]" />}>
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route path="/app" element={<ProtectedRoute requireAdmin={false}><MainLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="documents/:id" element={<DocumentPage />} />
                <Route path="documents/:id/map" element={<KnowledgeMapPage />} />
                <Route path="documents/:id/quiz" element={<QuizPage />} />
                <Route path="documents/:id/flashcards" element={<FlashcardPage />} />
                <Route path="review" element={<ReviewRoomPage />} />
                <Route path="billing" element={<BillingPage />} />
              </Route>

              <Route path="/app/admin" element={<ProtectedRoute requireAdmin={true}><MainLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminDashboard />} />
                <Route path="ai-models" element={<AdminDashboard />} />
                <Route path="settings" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </Suspense>
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
