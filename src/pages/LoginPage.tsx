import { useState, FormEvent } from "react"
import { useNavigate, Navigate } from "react-router"
import { useAuth, getAuthErrorMessage } from "../lib/auth"
import { AuthError } from "firebase/auth"
import { Lock, Mail, Eye, EyeOff, Shield } from "lucide-react"

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/admin" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      navigate("/admin", { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err as AuthError))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    "w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "#04080F",
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(59,130,246,0.1) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-600/30">
              <Shield size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Login</h1>
            <p className="text-slate-500 text-sm mt-1 text-center">
              Authorized access only. This portal is hidden from public.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-10`}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/25"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-slate-700 text-xs mt-6">
            Access restricted to authorized administrators
          </p>
        </div>

        <p className="text-center text-slate-700 text-xs mt-4">
          <a href="/" className="hover:text-slate-400 transition-colors">← Back to website</a>
        </p>
      </div>
    </div>
  )
}
