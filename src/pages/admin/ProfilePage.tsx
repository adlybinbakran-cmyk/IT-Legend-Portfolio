import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeDocument, setDocument, logActivity } from "../../lib/db"
import { uploadFile } from "../../lib/storage"
import { toast } from "sonner"
import { Plus, Trash2, Upload, Save, Loader2, GripVertical, User } from "lucide-react"

interface Skill { name: string; level: number }
interface TimelineItem { period: string; role: string; company: string; desc: string }
interface Cert { name: string; issuer: string; year: string }
interface Social { platform: string; url: string }

interface ProfileData {
  name: string
  title: string
  bio: string
  bioLong: string
  photo: string
  cvUrl: string
  roles: string
  skills: Skill[]
  timeline: TimelineItem[]
  certs: Cert[]
  social: Social[]
}

const DEFAULT: ProfileData = {
  name: "James Kovacs", title: "IT Professional & Web Developer",
  bio: "", bioLong: "", photo: "", cvUrl: "", roles: "Web Developer, UI/UX Designer",
  skills: [{ name: "React / Next.js", level: 95 }, { name: "TypeScript", level: 92 }],
  timeline: [{ period: "2023–Now", role: "", company: "", desc: "" }],
  certs: [{ name: "", issuer: "", year: "" }],
  social: [{ platform: "LinkedIn", url: "" }, { platform: "GitHub", url: "" }],
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<"basic" | "skills" | "timeline" | "certs" | "social">("basic")

  useEffect(() => {
    const unsub = subscribeDocument("config/profile", (data) => {
      if (data) setProfile((p) => ({ ...p, ...data }))
    })
    return unsub
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDocument("config/profile", profile)
      toast.success("Profile saved")
      await logActivity("Updated", "profile")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    try {
      const r = await uploadFile("profile", file)
      setProfile((p) => ({ ...p, photo: r.url }))
      toast.success("Photo uploaded")
    } catch { toast.error("Upload failed") }
    finally { setUploading(false) }
  }

  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setProfile((p) => ({ ...p, [k]: v }))

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
  const lbl = "block text-xs text-slate-400 mb-1.5 font-medium"

  const TABS = [
    { key: "basic", label: "Basic Info" },
    { key: "skills", label: "Skills" },
    { key: "timeline", label: "Experience" },
    { key: "certs", label: "Certifications" },
    { key: "social", label: "Social Links" },
  ] as const

  return (
    <AdminLayout
      title="Profile"
      action={
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      }
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl w-fit">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${tab === key ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
            >{label}</button>
          ))}
        </div>

        {/* Basic Info */}
        {tab === "basic" && (
          <div className="space-y-6">
            {/* Photo */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <h3 className="text-white font-semibold text-sm mb-5">Profile Photo</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/[0.08] shrink-0">
                  {profile.photo ? (
                    <img src={profile.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600"><User size={24} /></div>
                  )}
                </div>
                <div className="space-y-3 flex-1">
                  <input type="file" accept="image/*" id="photo-upload" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
                  <label htmlFor="photo-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white text-sm cursor-pointer transition-all">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? "Uploading…" : "Upload Photo"}
                  </label>
                  <div>
                    <label className={lbl}>Or paste URL</label>
                    <input className={inputCls} value={profile.photo} onChange={(e) => set("photo", e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold text-sm mb-1">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Full Name</label>
                  <input className={inputCls} value={profile.name} onChange={(e) => set("name", e.target.value)} placeholder="James Kovacs" />
                </div>
                <div>
                  <label className={lbl}>Professional Title</label>
                  <input className={inputCls} value={profile.title} onChange={(e) => set("title", e.target.value)} placeholder="IT Professional & Web Developer" />
                </div>
              </div>
              <div>
                <label className={lbl}>Typing Roles <span className="text-slate-600 font-normal">(comma-separated — shown in hero typing animation)</span></label>
                <input className={inputCls} value={profile.roles} onChange={(e) => set("roles", e.target.value)} placeholder="Web Developer, UI/UX Designer, IT Consultant" />
              </div>
              <div>
                <label className={lbl}>Short Bio <span className="text-slate-600 font-normal">(displayed in hero section)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={2} value={profile.bio} onChange={(e) => set("bio", e.target.value)} placeholder="One-sentence value proposition..." />
              </div>
              <div>
                <label className={lbl}>Full Biography <span className="text-slate-600 font-normal">(displayed in About section)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={5} value={profile.bioLong} onChange={(e) => set("bioLong", e.target.value)} placeholder="Your full story, background, and expertise..." />
              </div>
              <div>
                <label className={lbl}>CV / Resume URL</label>
                <input className={inputCls} value={profile.cvUrl} onChange={(e) => set("cvUrl", e.target.value)} placeholder="https://drive.google.com/..." />
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        {tab === "skills" && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Skills & Proficiency</h3>
              <button onClick={() => set("skills", [...profile.skills, { name: "", level: 80 }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/10 transition-all">
                <Plus size={12} /> Add Skill
              </button>
            </div>
            <div className="space-y-3">
              {profile.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-3">
                  <GripVertical size={14} className="text-slate-700 shrink-0 cursor-grab" />
                  <input className={`${inputCls} flex-1`} value={skill.name} onChange={(e) => {
                    const s = [...profile.skills]; s[i] = { ...s[i], name: e.target.value }; set("skills", s)
                  }} placeholder="Skill name" />
                  <div className="flex items-center gap-2 shrink-0 w-40">
                    <input type="range" min={0} max={100} value={skill.level} onChange={(e) => {
                      const s = [...profile.skills]; s[i] = { ...s[i], level: Number(e.target.value) }; set("skills", s)
                    }} className="flex-1 accent-blue-500" />
                    <span className="text-blue-400 font-mono text-xs w-8 text-right">{skill.level}%</span>
                  </div>
                  <button onClick={() => set("skills", profile.skills.filter((_, j) => j !== i))}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {tab === "timeline" && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Experience Timeline</h3>
              <button onClick={() => set("timeline", [...profile.timeline, { period: "", role: "", company: "", desc: "" }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/10 transition-all">
                <Plus size={12} /> Add Entry
              </button>
            </div>
            <div className="space-y-4">
              {profile.timeline.map((t, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-mono">Entry {i + 1}</span>
                    <button onClick={() => set("timeline", profile.timeline.filter((_, j) => j !== i))}
                      className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input className={inputCls} value={t.period} onChange={(e) => { const tl = [...profile.timeline]; tl[i] = { ...tl[i], period: e.target.value }; set("timeline", tl) }} placeholder="2023–Now" />
                    <input className={inputCls} value={t.role} onChange={(e) => { const tl = [...profile.timeline]; tl[i] = { ...tl[i], role: e.target.value }; set("timeline", tl) }} placeholder="Job Title" />
                    <input className={inputCls} value={t.company} onChange={(e) => { const tl = [...profile.timeline]; tl[i] = { ...tl[i], company: e.target.value }; set("timeline", tl) }} placeholder="Company" />
                  </div>
                  <textarea className={`${inputCls} resize-none`} rows={2} value={t.desc} onChange={(e) => { const tl = [...profile.timeline]; tl[i] = { ...tl[i], desc: e.target.value }; set("timeline", tl) }} placeholder="What you did there..." />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {tab === "certs" && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Certifications</h3>
              <button onClick={() => set("certs", [...profile.certs, { name: "", issuer: "", year: "" }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/10 transition-all">
                <Plus size={12} /> Add Cert
              </button>
            </div>
            <div className="space-y-3">
              {profile.certs.map((c, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-xs font-mono">Certificate {i + 1}</span>
                    <button onClick={() => set("certs", profile.certs.filter((_, j) => j !== i))}
                      className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div>
                    <label className={lbl}>Certification Name</label>
                    <input className={`${inputCls} w-full`} value={c.name} onChange={(e) => { const cs = [...profile.certs]; cs[i] = { ...cs[i], name: e.target.value }; set("certs", cs) }} placeholder="AWS Solutions Architect" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className={lbl}>Issuer / Organization</label>
                      <input className={`${inputCls} w-full`} value={c.issuer} onChange={(e) => { const cs = [...profile.certs]; cs[i] = { ...cs[i], issuer: e.target.value }; set("certs", cs) }} placeholder="Amazon Web Services" />
                    </div>
                    <div>
                      <label className={lbl}>Year</label>
                      <input className={`${inputCls} w-full`} value={c.year} onChange={(e) => { const cs = [...profile.certs]; cs[i] = { ...cs[i], year: e.target.value }; set("certs", cs) }} placeholder="2024" maxLength={4} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social */}
        {tab === "social" && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Social Media Links</h3>
              <button onClick={() => set("social", [...profile.social, { platform: "", url: "" }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/10 transition-all">
                <Plus size={12} /> Add Link
              </button>
            </div>
            <div className="space-y-3">
              {profile.social.map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-xs font-mono">Link {i + 1}</span>
                    <button onClick={() => set("social", profile.social.filter((_, j) => j !== i))}
                      className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Platform</label>
                      <input className={`${inputCls} w-full`} value={s.platform} onChange={(e) => { const sl = [...profile.social]; sl[i] = { ...sl[i], platform: e.target.value }; set("social", sl) }} placeholder="LinkedIn" />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Profile URL</label>
                      <input className={`${inputCls} w-full`} value={s.url} onChange={(e) => { const sl = [...profile.social]; sl[i] = { ...sl[i], url: e.target.value }; set("social", sl) }} placeholder="https://linkedin.com/in/yourname" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile save button */}
        <div className="flex justify-end pt-4 border-t border-white/[0.06]">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save All Changes
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
