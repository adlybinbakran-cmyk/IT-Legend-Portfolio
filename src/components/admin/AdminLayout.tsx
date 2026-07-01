import { useState, ReactNode } from "react"
import { NavLink, useNavigate } from "react-router"
import { useAuth } from "../../lib/auth"
import { toast } from "sonner"
import {
  LayoutDashboard, User, Briefcase, FolderOpen, FileText,
  MessageSquare, Mail, Settings, Navigation2, Image,
  Menu, X, LogOut, ChevronRight, Bell, ExternalLink,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { href: "/admin/profile", label: "Profile", Icon: User },
  { href: "/admin/services", label: "Services", Icon: Briefcase },
  { href: "/admin/portfolio", label: "Portfolio", Icon: FolderOpen },
  { href: "/admin/blog", label: "Blog", Icon: FileText },
  { href: "/admin/testimonials", label: "Testimonials", Icon: MessageSquare },
  { href: "/admin/contact", label: "Contact", Icon: Mail },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/navigation", label: "Navigation", Icon: Navigation2 },
  { href: "/admin/media", label: "Media", Icon: Image },
]

interface Props {
  children: ReactNode
  title: string
  breadcrumbs?: { label: string; href?: string }[]
  action?: ReactNode
}

export default function AdminLayout({ children, title, breadcrumbs, action }: Props) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success("Logged out successfully")
    navigate("/login")
  }

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 flex flex-col bg-[#060D1F] border-r border-white/[0.06] transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-[11px] shadow-lg shadow-blue-600/30">
              JK
            </div>
            <div>
              <div className="text-white text-[13px] font-semibold leading-tight">Admin CMS</div>
              <div className="text-slate-600 text-[10px] font-mono">Portfolio Manager</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="mb-2 px-3">
            <span className="text-[10px] font-mono text-slate-600 tracking-[0.15em] uppercase">Content</span>
          </div>
          <div className="space-y-0.5 mb-5">
            {navItems.slice(0, 7).map(({ href, label, Icon, end }) => (
              <NavLink
                key={href}
                to={href}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600/15 text-white border border-blue-500/20"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? "text-blue-400" : "text-slate-600"} />
                    <span className={isActive ? "font-medium" : ""}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="mb-2 px-3">
            <span className="text-[10px] font-mono text-slate-600 tracking-[0.15em] uppercase">System</span>
          </div>
          <div className="space-y-0.5">
            {navItems.slice(7).map(({ href, label, Icon }) => (
              <NavLink
                key={href}
                to={href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600/15 text-white border border-blue-500/20"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? "text-blue-400" : "text-slate-600"} />
                    <span className={isActive ? "font-medium" : ""}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user?.email ?? "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.email}</div>
              <div className="text-slate-600 text-[10px]">Administrator</div>
            </div>
            <button onClick={handleLogout} className="text-slate-600 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={13} />
            </button>
          </div>
          <a
            href="/"
            target="_blank"
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-300 text-xs transition-colors"
          >
            <ExternalLink size={12} /> View Public Site
          </a>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 flex items-center gap-3 px-6 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-sm shrink-0">
          <button onClick={() => setOpen(true)} className="lg:hidden text-slate-500 hover:text-white transition-colors">
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-slate-600 text-sm hidden sm:block">Admin</span>
            {(breadcrumbs ?? [{ label: title }]).map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-slate-700 hidden sm:block" />
                {b.href ? (
                  <NavLink to={b.href} className="text-slate-400 text-sm hover:text-white transition-colors truncate">
                    {b.label}
                  </NavLink>
                ) : (
                  <span className="text-white text-sm font-medium truncate">{b.label}</span>
                )}
              </span>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {action}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all">
              <Bell size={15} />
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-slate-500 hover:text-red-400 hover:border-red-500/20 text-xs transition-all"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
