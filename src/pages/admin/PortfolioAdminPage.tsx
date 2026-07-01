import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeCollection, addDocument, updateDocument, deleteDocument, logActivity } from "../../lib/db"
import { uploadFile } from "../../lib/storage"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, FolderOpen, Upload, Star, Eye, EyeOff } from "lucide-react"

interface Project {
  id: string
  title: string
  cat: string
  desc: string
  tech: string
  clientName: string
  completionDate: string
  demoUrl: string
  repoUrl: string
  coverImage: string
  featured: boolean
  published: boolean
}

const CATS = ["web", "mobile", "design", "other"]
const EMPTY: Omit<Project, "id"> = {
  title: "", cat: "web", desc: "", tech: "", clientName: "", completionDate: "",
  demoUrl: "", repoUrl: "", coverImage: "", featured: false, published: true,
}

function Modal({ item, onClose, onSave }: {
  item: Partial<Project> | null; onClose: () => void; onSave: (d: Omit<Project, "id">) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<Project, "id">>(item ? { ...EMPTY, ...item } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const h = (k: keyof Omit<Project, "id">, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const handleCover = async (file: File) => {
    setUploading(true)
    try { const r = await uploadFile("portfolio/covers", file); h("coverImage", r.url); toast.success("Image uploaded") }
    catch { toast.error("Upload failed") } finally { setUploading(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
  const lbl = "block text-xs text-slate-400 mb-1.5 font-medium"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0B1628] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <h3 className="text-white font-semibold">{item?.id ? "Edit Project" : "New Project"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {/* Cover image */}
          <div>
            <label className={lbl}>Cover Image</label>
            <div className="flex gap-3">
              <div className="w-24 h-16 rounded-lg bg-white/5 border border-white/[0.08] overflow-hidden shrink-0">
                {form.coverImage ? <img src={form.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><Upload size={16} /></div>}
              </div>
              <div className="flex-1 space-y-2">
                <input type="file" accept="image/*" id="cover-upload" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} />
                <label htmlFor="cover-upload" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white text-xs cursor-pointer transition-all">
                  {uploading ? "Uploading…" : <><Upload size={12} /> Upload Image</>}
                </label>
                <input className={inputCls} placeholder="Or paste image URL" value={form.coverImage} onChange={(e) => h("coverImage", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Project Title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => h("title", e.target.value)} placeholder="My Awesome App" required />
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select className={inputCls} value={form.cat} onChange={(e) => h("cat", e.target.value)}>
                {CATS.map((c) => <option key={c} value={c} className="bg-slate-900">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Description *</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.desc} onChange={(e) => h("desc", e.target.value)} placeholder="What this project does and why it matters..." required />
          </div>

          <div>
            <label className={lbl}>Technologies Used <span className="text-slate-600 font-normal">(comma-separated)</span></label>
            <input className={inputCls} value={form.tech} onChange={(e) => h("tech", e.target.value)} placeholder="React, TypeScript, Firebase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Client Name</label>
              <input className={inputCls} value={form.clientName} onChange={(e) => h("clientName", e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className={lbl}>Completion Date</label>
              <input type="date" className={inputCls} value={form.completionDate} onChange={(e) => h("completionDate", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Live Demo URL</label>
              <input className={inputCls} value={form.demoUrl} onChange={(e) => h("demoUrl", e.target.value)} placeholder="https://myapp.com" />
            </div>
            <div>
              <label className={lbl}>GitHub URL</label>
              <input className={inputCls} value={form.repoUrl} onChange={(e) => h("repoUrl", e.target.value)} placeholder="https://github.com/..." />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => h("featured", !form.featured)} className={`w-10 h-6 rounded-full transition-colors relative ${form.featured ? "bg-yellow-500" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.featured ? "left-5" : "left-1"}`} />
              </div>
              <span className="text-slate-400 text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => h("published", !form.published)} className={`w-10 h-6 rounded-full transition-colors relative ${form.published ? "bg-blue-600" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.published ? "left-5" : "left-1"}`} />
              </div>
              <span className="text-slate-400 text-sm">Published</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PortfolioAdminPage() {
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Project> | null | "new">(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const unsub = subscribeCollection("portfolio", (data) => { setItems(data as Project[]); setLoading(false) })
    return unsub
  }, [])

  const handleSave = async (data: Omit<Project, "id">) => {
    try {
      if (modal && typeof modal === "object" && modal.id) {
        await updateDocument(`portfolio/${modal.id}`, data)
        toast.success("Project updated")
        await logActivity("Updated project", data.title)
      } else {
        await addDocument("portfolio", data)
        toast.success("Project added")
        await logActivity("Added project", data.title)
      }
      setModal(null)
    } catch { toast.error("Failed to save project") }
  }

  const handleDelete = async (item: Project) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      await deleteDocument(`portfolio/${item.id}`)
      toast.success("Project deleted")
      await logActivity("Deleted project", item.title)
    } catch { toast.error("Failed to delete") }
  }

  const filtered = filter === "all" ? items : items.filter((p) => p.cat === filter)

  return (
    <AdminLayout
      title="Portfolio"
      action={
        <button onClick={() => setModal("new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20">
          <Plus size={14} /> Add Project
        </button>
      }
    >
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {["all", ...CATS].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? "bg-blue-600 text-white" : "border border-white/[0.08] text-slate-400 hover:text-white"}`}
            >{f}</button>
          ))}
          <span className="ml-auto text-slate-600 text-xs">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-xl bg-white/[0.03] border border-white/[0.07] animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl">
            <FolderOpen size={32} className="mx-auto mb-4 text-slate-700" />
            <h3 className="text-white font-medium mb-2">No projects yet</h3>
            <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Add First Project</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="group bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
                <div className="h-36 bg-slate-900 relative overflow-hidden">
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700"><FolderOpen size={24} /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setModal(item)} className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-lg bg-red-500/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/50 transition-all"><Trash2 size={13} /></button>
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/50 text-slate-300 capitalize backdrop-blur-sm">{item.cat}</span>
                    {item.featured && <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/30 text-yellow-300 backdrop-blur-sm flex items-center gap-0.5"><Star size={8} className="fill-current" /> Featured</span>}
                  </div>
                  <div className="absolute top-2 right-2">
                    {item.published ? <Eye size={13} className="text-green-400" /> : <EyeOff size={13} className="text-slate-500" />}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.desc}</p>
                  {item.tech && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tech.split(",").slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/15">{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal !== null && <Modal item={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
    </AdminLayout>
  )
}
