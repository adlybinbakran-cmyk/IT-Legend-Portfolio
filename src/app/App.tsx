import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { Toaster } from "sonner"
import { AuthProvider, useAuth } from "../lib/auth"

// Pages
import PortfolioPage from "../pages/PortfolioPage"
import LoginPage from "../pages/LoginPage"
import DashboardPage from "../pages/admin/DashboardPage"
import ProfilePage from "../pages/admin/ProfilePage"
import ServicesPage from "../pages/admin/ServicesPage"
import PortfolioAdminPage from "../pages/admin/PortfolioAdminPage"
import BlogPage from "../pages/admin/BlogPage"
import TestimonialsPage from "../pages/admin/TestimonialsPage"
import ContactPage from "../pages/admin/ContactPage"
import SettingsPage from "../pages/admin/SettingsPage"
import NavigationPage from "../pages/admin/NavigationPage"
import MediaPage from "../pages/admin/MediaPage"

// ─── Protected route wrapper ─────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
          <p className="text-slate-600 text-sm font-mono">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Redirect authenticated users away from /login ────────────────────────────

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/admin" replace />
  return <>{children}</>
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public portfolio */}
          <Route path="/" element={<PortfolioPage />} />

          {/* Hidden admin login */}
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />

          {/* Protected admin routes */}
          <Route path="/admin" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
          <Route path="/admin/portfolio" element={<ProtectedRoute><PortfolioAdminPage /></ProtectedRoute>} />
          <Route path="/admin/blog" element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
          <Route path="/admin/testimonials" element={<ProtectedRoute><TestimonialsPage /></ProtectedRoute>} />
          <Route path="/admin/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin/navigation" element={<ProtectedRoute><NavigationPage /></ProtectedRoute>} />
          <Route path="/admin/media" element={<ProtectedRoute><MediaPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0B1628",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            color: "#E2E8F8",
            fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
            fontSize: "13px",
          },
        }}
      />
    </AuthProvider>
  )
}
