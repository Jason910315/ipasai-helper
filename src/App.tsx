import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from './auth/AuthPage'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import { DashboardPage } from './pages/DashboardPage'
import { ExamPage, ResultsPage } from './pages/ExamPage'
import { HistoryPage, SetupHelpPage, WrongBookPage } from './pages/LibraryPages'
import { PracticeRunPage } from './pages/PracticePage'
import { TopicCatalogPage } from './pages/TopicCatalogPage'
import { ReviewPreviewPage } from './pages/ReviewPreviewPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SetupPage } from './pages/SetupPage'
import { AccountDataPage } from './pages/AccountDataPage'

function ProtectedApp() {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.documentElement.lang = 'zh-Hant'
  }, [])

  if (import.meta.env.DEV && window.location.pathname === '/__preview/practice') return <ReviewPreviewPage />

  if (!isSupabaseConfigured) return <SetupPage />
  if (loading) return <div className="app-loading"><span className="loading-mark">ip</span><span>正在準備你的備考室…</span></div>
  if (!user) return <Routes><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="*" element={<AuthPage />} /></Routes>

  return <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/practice" element={<TopicCatalogPage />} />
    <Route path="/practice/:attemptId" element={<PracticeRunPage />} />
    <Route path="/wrong-book" element={<WrongBookPage />} />
    <Route path="/history" element={<HistoryPage />} />
    <Route path="/exam/:attemptId" element={<ExamPage />} />
    <Route path="/results/:attemptId" element={<ResultsPage />} />
    <Route path="/setup-help" element={<SetupHelpPage />} />
    <Route path="/account-data" element={<AccountDataPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default function App() {
  return <BrowserRouter><AuthProvider><ProtectedApp /></AuthProvider></BrowserRouter>
}
