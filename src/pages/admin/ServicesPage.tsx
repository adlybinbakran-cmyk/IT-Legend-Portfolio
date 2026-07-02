import { useEffect, useState, useRef } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeCollection, addDocument, updateDocument, deleteDocument, logActivity, orderBy, batchUpdate } from "../../lib/db"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, GripVertical, X, Briefcase } from "lucide-react"

interface Service {
  id: string
  title: string
  desc: string
  icon: string
  price: string
  btnLabel: string
  color: string
  order: number
  published: boolean
}

const ICON_OPTIONS = ["Code2", "Palette", "Smartphone", "BarChart3", "Database", "Shield", "Globe", "Cpu", "Layers", "Zap"]
const COLOR_OPTIONS = ["#3B82F6", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#F97316", "#EC4899"]

const EMPTY: Omit<Service, "id"> = {
  title: "", desc: "", icon: "Code2", price: "", btnLabel: "Learn More",
  color: "#3B82F6", order: 0, published: true,
}

// Dark-styled select — native <select> dropdown menus inherit background from
// the element itself via inline style so text is always visible in the popup.
const SELECT_STYLE: React.CSSProperties = {
  background: "#0B1628",
  color: "#E2E8F8",
}

function Modal({ service, onClose, onSave }: {
  service: Partial<Service> | null
  onClose: () => void
  onSave: (data: Omit<Service, "id">) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<Service, "id">>(
    service ? { ...EMPTY, ...service } : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)

  const handle = (k: keyof Omit<Service, "id">, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-[#0B1628] border border-white/[0.10] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
  const labelCls = "block text-xs text-slate-400 mb-1.5 font-medium"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0B1628] border border-white/[0.08] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold">{service?.id ? "Edit Service" : "New Service"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => handle("title", e.target.value)} placeholder="Web Development" required />
            </div>
            <div>
              <label className={labelCls}>Starting Price *</label>
              <input className={inputCls} value={form.price} onChange={(e) => handle("price", e.target.value)} placeholder="$1,200" required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.desc} onChange={(e) => handle("desc", e.target.value)} placeholder="Service description..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Icon</label>
              {/* Explicit inline style ensures the native dropdown popup is dark */}
              <select
                className={inputCls}
                style={SELECT_STYLE}
                value={form.icon}
                onChange={(e) => handle("icon", e.target.value)}
              >
                {ICON_OPTIONS.map((o) => (
                  <option key={o} value={o} style={SELECT_STYLE}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Button Label</label>
              <input className={inputCls} value={form.btnLabel} onChange={(e) => handle("btnLabel", e.target.value)} placeholder="Learn More" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Accent Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handle("color", c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Display Order</label>
              <input type="number" className={inputCls} value={form.order} onChange={(e) => handle("order", Number(e.target.value))} min={0} />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => handle("published", !form.published)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.published ? "bg-blue-600" : "bg-white/10"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.published ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-slate-400 text-sm">Published</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white text-sm transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-60">
              {saving ? "Saving…" : "Save Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Service> | null | "new">(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  // Drag state
  const draggingIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    const unsub = subscribeCollection(
      "services",
      (data) => { setItems(data as Service[]); setLoading(false) },
      orderBy("order", "asc")
    )
    return unsub
  }, [])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    draggingIdx.current = idx
  }

  const handleDragEnter = (idx: number) => {
    if (draggingIdx.current === null || draggingIdx.current === idx) return
    setDragOverIdx(idx)
  }

  const handleDragEnd = () => {
    setDragOverIdx(null)
  }

  const handleDrop = async (dropIdx: number) => {
    const from = draggingIdx.current
    draggingIdx.current = null
    setDragOverIdx(null)

    if (from === null || from === dropIdx) return

    // Reorder locally first for instant feedback
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(dropIdx, 0, moved)
    setItems(next)

    // Persist new order values to Firestore
    setSavingOrder(true)
    try {
      await batchUpdate(
        next.map((item, i) => ({ path: `services/${item.id}`, data: { order: i } }))
      )
      toast.success("Order saved")
    } catch {
      toast.error("Failed to save order")
    } finally {
      setSavingOrder(false)
    }
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleSave = async (data: Omit<Service, "id">) => {
    try {
      if (modal && typeof modal === "object" && modal.id) {
        await updateDocument(`services/${modal.id}`, data)
        toast.success("Service updated")
        await logActivity("Updated service", data.title)
      } else {
        // New service goes at the end
        await addDocument("services", { ...data, order: items.length })
        toast.success("Service added")
        await logActivity("Added service", data.title)
      }
      setModal(null)
    } catch {
      toast.error("Failed to save service")
    }
  }

  const handleDelete = async (item: Service) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    setDeleting(item.id)
    try {
      await deleteDocument(`services/${item.id}`)
      toast.success("Service deleted")
      await logActivity("Deleted service", item.title)
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AdminLayout
      title="Services"
      action={
        <div className="flex items-center gap-2">
          {savingOrder && (
            <span className="text-slate-500 text-xs font-mono animate-pulse">Saving order…</span>
          )}
          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={14} /> Add Service
          </button>
        </div>
      }
    >
      <div className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.07] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl">
            <Briefcase size={32} className="mx-auto mb-4 text-slate-700" />
            <h3 className="text-white font-medium mb-2">No services yet</h3>
            <p className="text-slate-500 text-sm mb-5">Add your first service to display it on the website.</p>
            <button onClick={() => setModal("new")} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-sm">{items.length} service{items.length !== 1 ? "s" : ""}</p>
              <p className="text-slate-600 text-xs flex items-center gap-1.5">
                <GripVertical size={12} /> Drag rows to reorder
              </p>
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all group select-none ${
                  dragOverIdx === idx && draggingIdx.current !== idx
                    ? "border-blue-500/50 bg-blue-500/8 scale-[1.01]"
                    : draggingIdx.current === idx
                    ? "border-white/20 bg-white/5 opacity-50"
                    : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]"
                }`}
              >
                {/* Drag handle */}
                <GripVertical
                  size={16}
                  className="text-slate-600 hover:text-slate-300 shrink-0 cursor-grab active:cursor-grabbing transition-colors"
                />

                {/* Color dot */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}20` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{item.title}</span>
                    <span className="text-slate-600 text-xs font-mono">{item.icon}</span>
                    {!item.published && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-500 border border-white/[0.06]">Draft</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs truncate mt-0.5">{item.desc}</p>
                </div>

                <span className="text-slate-400 text-sm font-mono shrink-0">{item.price}</span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setModal(item)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deleting === item.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <Modal
          service={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  )
}
