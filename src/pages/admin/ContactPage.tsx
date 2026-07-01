import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeDocument, setDocument, logActivity } from "../../lib/db"
import { toast } from "sonner"
import { Save, Loader2, Mail, Phone, MessageCircle, MapPin, Map, CheckCircle } from "lucide-react"

function parseMapSrc(input: string): string {
  const trimmed = input.trim()
  // If the user pasted a full <iframe ...> block, extract just the src attribute
  if (trimmed.toLowerCase().startsWith("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i)
    return match ? match[1] : trimmed
  }
  return trimmed
}

interface ContactData {
  email: string
  phone: string
  whatsapp: string
  address: string
  mapEmbed: string
  formRecipient: string
}

const DEFAULT: ContactData = {
  email: "", phone: "", whatsapp: "", address: "", mapEmbed: "", formRecipient: "",
}

export default function ContactPage() {
  const [data, setData] = useState<ContactData>(DEFAULT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = subscribeDocument("config/contact", (d) => {
      if (d) setData((prev) => ({ ...prev, ...d }))
    })
    return unsub
  }, [])

  const set = <K extends keyof ContactData>(k: K, v: string) =>
    setData((d) => ({ ...d, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDocument("config/contact", data)
      toast.success("Contact info saved")
      await logActivity("Updated", "contact information")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
  const lbl = "block text-xs text-slate-400 mb-1.5 font-medium"

  return (
    <AdminLayout
      title="Contact"
      action={
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      }
    >
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Mail size={15} className="text-blue-400" /> Contact Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input className={`${inputCls} pl-9`} value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@example.com" type="email" />
              </div>
            </div>
            <div>
              <label className={lbl}>Contact Form Recipient</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input className={`${inputCls} pl-9`} value={data.formRecipient} onChange={(e) => set("formRecipient", e.target.value)} placeholder="admin@example.com" type="email" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input className={`${inputCls} pl-9`} value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (415) 555-0192" />
              </div>
            </div>
            <div>
              <label className={lbl}>WhatsApp Number <span className="text-slate-600 font-normal">(digits only, with country code)</span></label>
              <div className="relative">
                <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input className={`${inputCls} pl-9`} value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="14155550192" />
              </div>
            </div>
          </div>
          <div>
            <label className={lbl}>Address / Location</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-slate-600" />
              <textarea className={`${inputCls} pl-9 resize-none`} rows={2} value={data.address} onChange={(e) => set("address", e.target.value)} placeholder="San Francisco, CA, USA" />
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Map size={15} className="text-blue-400" /> Google Maps Embed
          </h3>
          <div>
            <label className={lbl}>Google Maps Embed</label>
            <p className="text-slate-500 text-xs mb-2">
              Paste the <strong className="text-slate-400">full &lt;iframe&gt; code</strong> from Google Maps → Share → Embed a map, or paste just the src URL — both formats are accepted.
            </p>
            <textarea
              className={`${inputCls} resize-none font-mono text-xs`} rows={5}
              value={data.mapEmbed}
              onChange={(e) => set("mapEmbed", parseMapSrc(e.target.value))}
              placeholder={`Paste full <iframe src="..." ...></iframe> code here, or just the URL`}
            />
            {data.mapEmbed && (
              <p className="flex items-center gap-1.5 text-green-400 text-xs mt-1.5">
                <CheckCircle size={12} /> Map URL saved. Preview below.
              </p>
            )}
          </div>
          {data.mapEmbed && (
            <div className="rounded-xl overflow-hidden border border-white/[0.08] h-52">
              <iframe
                src={data.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(88%) hue-rotate(180deg) saturate(0.6)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map preview"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Contact Info
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
