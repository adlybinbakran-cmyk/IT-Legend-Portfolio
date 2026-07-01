import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeCollection, addDocument, updateDocument, deleteDocument, subscribeDocument, setDocument, logActivity } from "../../lib/db"
import { uploadFile } from "../../lib/storage"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, FileText, Upload, ToggleLeft, ToggleRight, Eye, EyeOff, Calendar } from "lucide-react"

interface Post {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  tags: string
  cat: string
  coverImage: string
  publishDate: string
  featured: boolean
  published: boolean
}

const CATS = ["Development", "Design", "Career", "Tutorial", "Opinion"]
const EMPTY: Omit<Post, "id"> = {
  title: "", slug: "", summary: "", content: "", tags: "", cat: "Development",
  coverImage: "", publishDate: new Date().toISOString().split("T")[0], featured: false, published: false,
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function Modal({ item, onClose, onSave }: {
  item: Partial<Post> | null; onClose: () => void; onSave: (d: Omit<Post, "id">) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<Post, "id">>(item ? { ...EMPTY, ...item } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const h = (k: keyof Omit<Post, "id">, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const handleTitle = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: f.slug || slugify(v) }))
  }

  const handleCover = async (file: File) => {
    setUploading(true)
    try { const r = await uploadFile("blog/covers", file); h("coverImage", r.url); toast.success("Image uploaded") }
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
          <h3 className="text-white font-semibold">{item?.id ? "Edit Post" : "New Blog Post"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {/* Cover */}
          <div>
            <label className={lbl}>Cover Image</label>
            <div className="flex gap-3">
              <div className="w-24 h-16 rounded-lg bg-white/5 border border-white/[0.08] overflow-hidden shrink-0">
                {form.coverImage ? <img src={form.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><Upload size={16} /></div>}
              </div>
              <div className="flex-1 space-y-2">
                <input type="file" accept="image/*" id="blog-cover" className="hidden" onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} />
                <label htmlFor="blog-cover" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white text-xs cursor-pointer transition-all">
                  {uploading ? "Uploading…" : <><Upload size={12} /> Upload</>}
                </label>
                <input className={inputCls} placeholder="Or paste URL" value={form.coverImage} onChange={(e) => h("coverImage", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className={lbl}>Title *</label>
            <input className={inputCls} value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="Your blog post title" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Slug *</label>
              <input className={inputCls} value={form.slug} onChange={(e) => h("slug", slugify(e.target.value))} placeholder="my-post-slug" required />
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select className={inputCls} value={form.cat} onChange={(e) => h("cat", e.target.value)}>
                {CATS.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Summary</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.summary} onChange={(e) => h("summary", e.target.value)} placeholder="A brief description (used in cards and SEO)..." />
          </div>

          <div>
            <label className={lbl}>Content <span className="text-slate-600 font-normal">(supports Markdown)</span></label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={10} value={form.content} onChange={(e) => h("content", e.target.value)} placeholder="# Your post content here..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tags <span className="text-slate-600 font-normal">(comma-separated)</span></label>
              <input className={inputCls} value={form.tags} onChange={(e) => h("tags", e.target.value)} placeholder="react, typescript, tutorial" />
            </div>
            <div>
              <label className={lbl}>Publish Date</label>
              <input type="date" className={inputCls} value={form.publishDate} onChange={(e) => h("publishDate", e.target.value)} />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => h("featured", !form.featured)} className={`w-10 h-6 rounded-full relative transition-colors ${form.featured ? "bg-yellow-500" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.featured ? "left-5" : "left-1"}`} />
              </div>
              <span className="text-slate-400 text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => h("published", !form.published)} className={`w-10 h-6 rounded-full relative transition-colors ${form.published ? "bg-blue-600" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.published ? "left-5" : "left-1"}`} />
              </div>
              <span className="text-slate-400 text-sm">Published</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BlogPage() {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Post> | null | "new">(null)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const unsub1 = subscribeCollection("blog", (data) => { setItems(data as Post[]); setLoading(false) })
    const unsub2 = subscribeDocument("config/sections", (data) => {
      if (data) setEnabled(data.blogEnabled !== false)
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const toggleEnabled = async () => {
    try {
      await setDocument("config/sections", { blogEnabled: !enabled })
      toast.success(enabled ? "Blog section hidden" : "Blog section shown")
    } catch { toast.error("Failed to update") }
  }

  const handleSave = async (data: Omit<Post, "id">) => {
    try {
      if (modal && typeof modal === "object" && modal.id) {
        await updateDocument(`blog/${modal.id}`, data)
        toast.success("Post updated")
        await logActivity("Updated post", data.title)
      } else {
        await addDocument("blog", data)
        toast.success("Post published")
        await logActivity("Published post", data.title)
      }
      setModal(null)
    } catch { toast.error("Failed to save post") }
  }

  const handleDelete = async (item: Post) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      await deleteDocument(`blog/${item.id}`)
      toast.success("Post deleted")
      await logActivity("Deleted post", item.title)
    } catch { toast.error("Failed to delete") }
  }

  return (
    <AdminLayout
      title="Blog"
      action={
        <div className="flex items-center gap-2">
          <button onClick={toggleEnabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${enabled ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/[0.08] text-slate-400 hover:text-white"}`}
          >
            {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {enabled ? "Visible" : "Hidden"}
          </button>
          <button onClick={() => setModal("new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">
            <Plus size={14} /> Write Post
          </button>
        </div>
      }
    >
      <div className="p-6 max-w-5xl mx-auto">
        {!enabled && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
            <ToggleLeft size={15} /> Blog section is currently hidden from the public website.
          </div>
        )}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.07] animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl">
            <FileText size={32} className="mx-auto mb-4 text-slate-700" />
            <h3 className="text-white font-medium mb-2">No posts yet</h3>
            <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Write First Post</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm mb-4">{items.length} post{items.length !== 1 ? "s" : ""}</p>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3.5 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-white/[0.12] transition-colors group">
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-slate-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate">{item.title}</span>
                    {item.featured && <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/15 text-yellow-400 shrink-0">Featured</span>}
                    {!item.published && <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-500 shrink-0">Draft</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-600">
                    <span className="font-mono text-blue-500/70">{item.cat}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {item.publishDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.published ? <Eye size={12} className="text-green-500 opacity-60" /> : <EyeOff size={12} className="text-slate-600" />}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setModal(item)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(item)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
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
