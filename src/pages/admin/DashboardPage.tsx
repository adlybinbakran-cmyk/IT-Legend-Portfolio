import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { db } from "../../lib/firebase"
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore"
import {
  FolderOpen, Briefcase, FileText, MessageSquare,
  Eye, Clock, Activity, TrendingUp, RefreshCw,
} from "lucide-react"

interface Stats {
  projects: number
  services: number
  posts: number
  testimonials: number
}

interface ActivityItem {
  id: string
  action: string
  entity: string
  timestamp: Timestamp
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof FolderOpen
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <TrendingUp size={14} className="text-green-500 opacity-60" />
      </div>
      <div className="text-3xl font-bold text-white font-mono mb-1">{value}</div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-white/5 mb-4" />
      <div className="h-8 w-16 bg-white/5 rounded mb-2" />
      <div className="h-4 w-24 bg-white/5 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [projects, services, posts, testimonials, recentActivity] = await Promise.all([
        getDocs(collection(db, "portfolio")),
        getDocs(collection(db, "services")),
        getDocs(collection(db, "blog")),
        getDocs(collection(db, "testimonials")),
        getDocs(query(collection(db, "activity"), orderBy("timestamp", "desc"), limit(10))),
      ])
      setStats({
        projects: projects.size,
        services: services.size,
        posts: posts.size,
        testimonials: testimonials.size,
      })
      setActivity(recentActivity.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityItem)))
      setLastUpdated(new Date())
    } catch {
      // Firestore might not be set up yet — show zeros
      setStats({ projects: 0, services: 0, posts: 0, testimonials: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const statItems = [
    { icon: FolderOpen, label: "Total Projects", value: stats?.projects ?? 0, color: "#3B82F6" },
    { icon: Briefcase, label: "Services", value: stats?.services ?? 0, color: "#8B5CF6" },
    { icon: FileText, label: "Blog Posts", value: stats?.posts ?? 0, color: "#06B6D4" },
    { icon: MessageSquare, label: "Testimonials", value: stats?.testimonials ?? 0, color: "#10B981" },
    { icon: Eye, label: "Website Views", value: "—", color: "#F59E0B" },
    {
      icon: Clock,
      label: "Last Updated",
      value: lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      color: "#EF4444",
    },
  ]

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Good morning 👋</h1>
            <p className="text-slate-500 text-sm mt-1">Here's what's happening with your portfolio.</p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : statItems.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-blue-400" />
              <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
            </div>
            {activity.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <Activity size={24} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No activity yet. Start managing content.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm">
                        <span className="text-white font-medium">{a.action}</span>{" "}
                        <span className="text-blue-400">{a.entity}</span>
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {a.timestamp?.toDate
                          ? a.timestamp.toDate().toLocaleString()
                          : "Just now"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <h3 className="text-white font-semibold text-sm mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Project", href: "/admin/portfolio", color: "#3B82F6" },
                { label: "Add Service", href: "/admin/services", color: "#8B5CF6" },
                { label: "Write Post", href: "/admin/blog", color: "#06B6D4" },
                { label: "Add Review", href: "/admin/testimonials", color: "#10B981" },
                { label: "Upload Media", href: "/admin/media", color: "#F59E0B" },
                { label: "Edit Profile", href: "/admin/profile", color: "#EF4444" },
              ].map(({ label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] text-slate-400 hover:text-white text-sm transition-all group"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Setup guide (shown when no data) */}
        {stats && Object.values(stats).every((v) => v === 0) && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-2">🚀 Getting Started</h3>
            <p className="text-slate-400 text-sm mb-4">
              Your CMS is ready. Start by setting up your profile and adding content.
            </p>
            <ol className="space-y-2 text-sm text-slate-400">
              {[
                "Edit your Profile (name, bio, photo, skills)",
                "Add your Services",
                "Upload Portfolio Projects",
                "Configure Contact Information",
                "Adjust Website Settings (SEO, analytics)",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-mono flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
