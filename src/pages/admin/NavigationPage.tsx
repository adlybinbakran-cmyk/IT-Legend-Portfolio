import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeDocument, setDocument, logActivity } from "../../lib/db"
import { toast } from "sonner"
import { Save, Loader2, GripVertical, Eye, EyeOff, Plus, Trash2 } from "lucide-react"

interface NavItem {
  id: string
  label: string
  href: string
  visible: boolean
}

const DEFAULT_NAV: NavItem[] = [
  { id: "home", label: "Home", href: "#home", visible: true },
  { id: "about", label: "About", href: "#about", visible: true },
  { id: "services", label: "Services", href: "#services", visible: true },
  { id: "portfolio", label: "Portfolio", href: "#portfolio", visible: true },
  { id: "blog", label: "Blog", href: "#blog", visible: true },
  { id: "testimonials", label: "Reviews", href: "#testimonials", visible: true },
  { id: "contact", label: "Contact", href: "#contact", visible: true },
]

export default function NavigationPage() {
  const [items, setItems] = useState<NavItem[]>(DEFAULT_NAV)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  useEffect(() => {
    const unsub = subscribeDocument("config/sections", (data) => {
      if (data?.navItems) setItems(data.navItems)
    })
    return unsub
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDocument("config/sections", { navItems: items })
      toast.success("Navigation saved")
      await logActivity("Updated", "navigation")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, visible: !i.visible } : i))

  const update = (id: string, field: keyof NavItem, value: string | boolean) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i))

  const addItem = () => {
    const id = `custom_${Date.now()}`
    setItems((prev) => [...prev, { id, label: "New Link", href: "#", visible: true }])
  }

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  // Drag-and-drop reorder
  const handleDragStart = (idx: number) => setDragging(idx)
  const handleDragEnter = (idx: number) => setDragOver(idx)
  const handleDrop = () => {
    if (dragging === null || dragOver === null || dragging === dragOver) {
      setDragging(null); setDragOver(null); return
    }
    const next = [...items]
    const [moved] = next.splice(dragging, 1)
    next.splice(dragOver, 0, moved)
    setItems(next)
    setDragging(null); setDragOver(null)
  }

  const inputCls = "px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"

  return (
    <AdminLayout
      title="Navigation"
      action={
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      }
    >
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">Menu Items</h3>
              <p className="text-slate-500 text-xs mt-0.5">Drag to reorder. Toggle visibility. Edit labels.</p>
            </div>
            <button onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/10 transition-all">
              <Plus size={12} /> Add Link
            </button>
          </div>

          <div className="p-3 space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  dragOver === idx && dragging !== idx
                    ? "border-blue-500/40 bg-blue-500/5"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
                } ${!item.visible ? "opacity-50" : ""}`}
              >
                <GripVertical size={14} className="text-slate-700 shrink-0" />

                <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                  <input
                    className={`${inputCls} w-full`}
                    value={item.label}
                    onChange={(e) => update(item.id, "label", e.target.value)}
                    placeholder="Menu Label"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    className={`${inputCls} w-full font-mono text-xs`}
                    value={item.href}
                    onChange={(e) => update(item.id, "href", e.target.value)}
                    placeholder="#section or /page"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggle(item.id)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${item.visible ? "text-green-400 hover:bg-green-500/10" : "text-slate-600 hover:bg-white/5"}`}
                    title={item.visible ? "Hide from menu" : "Show in menu"}
                  >
                    {item.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-slate-500 text-xs mb-3">Preview</p>
          <div className="flex flex-wrap gap-2">
            {items.filter((i) => i.visible).map((item) => (
              <span key={item.id} className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-sm">{item.label}</span>
            ))}
          </div>
          {items.filter((i) => !i.visible).length > 0 && (
            <p className="text-slate-600 text-xs mt-3">
              Hidden: {items.filter((i) => !i.visible).map((i) => i.label).join(", ")}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Navigation
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
