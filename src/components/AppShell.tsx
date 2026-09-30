import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

const navigation = [
  { to: '/', label: '學習總覽', end: true },
  { to: '/?startExam=1', label: '開始模擬考' },
  { to: '/practice', label: '考點練習' },
  { to: '/wrong-book', label: '錯題本' },
]

const titleByPath: Record<string, string> = {
  '/': '學習總覽',
  '/practice': '考點練習',
  '/wrong-book': '錯題本',
  '/history': '作答紀錄',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [accountOpen, setAccountOpen] = useState(false)
  const title = titleByPath[location.pathname] ?? (location.pathname.startsWith('/exam/') ? '模擬考' : location.pathname.startsWith('/practice/') ? '考點練習' : '學習空間')

  async function signOut() {
    await supabase?.auth.signOut()
    navigate('/sign-in')
  }

  return <div className="app-frame">
    <header className="catalog-header">
      <a href="/" className="catalog-brand" aria-label="iPAS AI Planner 個人學習網站首頁">
        <span className="catalog-brand-mark">iPAS</span>
        <span className="catalog-brand-name"><strong>AI Planner</strong><small>個人學習網站</small></span>
      </a>
      <nav className="catalog-nav" aria-label="主要導覽">
        {navigation.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `catalog-nav-link${isActive ? ' active' : ''}`}>
          {label}
        </NavLink>)}
      </nav>
      <div className="catalog-account">
        <span className="catalog-account-email">{user?.email}</span>
        <button className="catalog-account-trigger" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-label="帳戶選項">
          {user?.email?.slice(0, 1).toLocaleUpperCase() ?? 'A'}
        </button>
        {accountOpen && <div className="catalog-account-menu"><span>{user?.email}</span><Link to="/account-data" onClick={() => setAccountOpen(false)}>個人資料管理</Link><button onClick={signOut}><LogOut size={14} />登出</button></div>}
      </div>
    </header>
    <div className="mobile-page-label">{title}</div>
    <main className="page-content">{children || <Outlet />}</main>
    <footer className="app-footer"><span>iPAS AI PLANNER</span><span>個人學習進度同步於 Supabase</span></footer>
  </div>
}
