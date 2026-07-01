import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeCollection, addDocument, updateDocument, deleteDocument, subscribeDocument, setDocument, logActivity, orderBy } from "../../lib/db"
import { uploadFile } from "../../lib/storage"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, MessageSquare, Star, Upload, ToggleLeft, ToggleRight } from "lucide-react"

interface Testimonial {
  id: string
  name: string
  company: string
  role: string
  avatar: string
  rating: number
  text: string
  order: number
  published: boolean
}

const EMPTY: Omit<Testimonial, "id"> = {
  name: "", company: "", role: "", avatar: "", rating: 5, text: "", order: 0, published: true,
}

function Modal({ item, onClose, onSave }: {
  item: Partial<Testimonial> | null
  onClose: () => void
  onSave: (data: Omit<Testimonial, "id">) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<Testimonial, "id">>(item ? { ...EMPTY, ...item } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handle = (k: keyof Omit<Testimonial, "id">, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleAvatar = async (file: File) => {
    setUploading(true)
    try {
      const result = await uploadFile("testimonials/avatars", file)
      handle("avatar", result.url)
      toast.success("Photo uploaded")
    } catch { toast.error("Upload failed") }
    finally { setUploading(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
  const labelCls = "block text-xs text-slate-400 mb-1.5 font-medium"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0B1628] border border-white/[0.08] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold">{item?.id ? "Edit Testimonial" : "New Testimonial"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/[0.08] overflow-hidden shrink-0">
              {form.avatar ? (
                <img src={form.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Upload size={16} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className={labelCls}>Profile Photo</label>
              <input
                type="file" accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
                className="hidden" id="avatar-upload"
              />
              <label htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white text-xs cursor-pointer transition-all"
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </label>
              <input className={`${inputCls} mt-2`} placeholder="Or paste image URL" value={form.avatar} onChange={(e) => handle("avatar", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Client Name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => handle("name", e.target.value)} placeholder="Jane Smith" required />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input className={inputCls} value={form.company} onChange={(e) => handle("company", e.target.value)} placeholder="Acme Corp" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Position / Role</label>
            <input className={inputCls} value={form.role} onChange={(e) => handle("role", e.target.value)} placeholder="CTO, Acme Corp" />
          </div>
          <div>
            <label className={labelCls}>Rating</label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => handle("rating", n)}>
                  <Star size={20} className={n <= form.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Testimonial Text *</label>
            <textarea className={`${inputCls} resize-none`} rows={4} value={form.text} onChange={(e) => handle("text", e.target.value)} placeholder="What they said about working with you..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Order</label>
              <input type="number" className={inputCls} value={form.order} onChange={(e) => handle("order", Number(e.target.value))} min={0} />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => handle("published", !form.published)} className={`w-10 h-6 rounded-full transition-colors relative ${form.published ? "bg-blue-600" : "bg-white/10"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.published ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-slate-400 text-sm">Published</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Testimonial> | null | "new">(null)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const unsub1 = subscribeCollection("testimonials", (data) => { setItems(data as Testimonial[]); setLoading(false) }, orderBy("order", "asc"))
    const unsub2 = subscribeDocument("config/sections", (data) => {
      if (data) setEnabled(data.testimonialsEnabled !== false)
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const toggleEnabled = async () => {
    try {
      await setDocument("config/sections", { testimonialsEnabled: !enabled })
      toast.success(enabled ? "Testimonials section hidden" : "Testimonials section shown")
    } catch { toast.error("Failed to update") }
  }

  const handleSave = async (data: Omit<Testimonial, "id">) => {
    try {
      if (modal && typeof modal === "object" && modal.id) {
        await updateDocument(`testimonials/${modal.id}`, data)
        toast.success("Testimonial updated")
        await logActivity("Updated testimonial", data.name)
      } else {
        await addDocument("testimonials", data)
        toast.success("Testimonial added")
        await logActivity("Added testimonial", data.name)
      }
      setModal(null)
    } catch { toast.error("Failed to save") }
  }

  const handleDelete = async (item: Testimonial) => {
    if (!confirm(`Delete testimonial from "${item.name}"?`)) return
    try {
      await deleteDocument(`testimonials/${item.id}`)
      toast.success("Deleted")
      await logActivity("Deleted testimonial", item.name)
    } catch { toast.error("Failed to delete") }
  }

  return (
    <AdminLayout
      title="Testimonials"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEnabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${enabled ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/[0.08] text-slate-400 hover:text-white"}`}
          >
            {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {enabled ? "Visible" : "Hidden"}
          </button>
          <button onClick={() => setModal("new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">
            <Plus size={14} /> Add
          </button>
        </div>
      }
    >
      <div className="p-6 max-w-5xl mx-auto">
        {!enabled && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
            <ToggleLeft size={15} />
            Testimonials section is currently hidden from the public website.
          </div>
        )}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 rounded-xl bg-white/[0.03] border border-white/[0.07] animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl">
            <MessageSquare size={32} className="mx-auto mb-4 text-slate-700" />
            <h3 className="text-white font-medium mb-2">No testimonials yet</h3>
            <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Add First Testimonial</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 group hover:border-white/[0.12] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 text-sm font-bold">{item.name[0]}</div>
                    )}
                    <div>
                      <div className="text-white font-medium text-sm">{item.name}</div>
                      <div className="text-slate-500 text-xs">{item.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(item)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(item)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: item.rating }).map((_, j) => <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">"{item.text}"</p>
                {!item.published && <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-500">Draft</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {modal !== null && <Modal item={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
    </AdminLayout>
  )
}
