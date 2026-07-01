import { useEffect, useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeDocument, setDocument, logActivity } from "../../lib/db"
import { uploadFile } from "../../lib/storage"
import { toast } from "sonner"
import { Save, Loader2, Upload, Globe, Search, Share2, BarChart2, Mail, ExternalLink } from "lucide-react"

interface SiteSettings {
  siteName: string
  seoTitle: string
  seoDesc: string
  ogImage: string
  logoUrl: string
  faviconUrl: string
  analyticsId: string
  copyright: string
  emailjsServiceId: string
  emailjsTemplateId: string
  emailjsPublicKey: string
}

const DEFAULT: SiteSettings = {
  siteName: "James Kovacs", seoTitle: "", seoDesc: "", ogImage: "",
  logoUrl: "", faviconUrl: "", analyticsId: "", copyright: "",
  emailjsServiceId: "", emailjsTemplateId: "", emailjsPublicKey: "",
}

export default function SettingsPage() {
  const [data, setData] = useState<SiteSettings>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeDocument("config/settings", (d) => {
      if (d) setData((prev) => ({ ...prev, ...d }))
    })
    return unsub
  }, [])

  const set = <K extends keyof SiteSettings>(k: K, v: string) =>
    setData((d) => ({ ...d, [k]: v }))

  const handleUpload = async (field: keyof SiteSettings, file: File, folder: string) => {
    setUploading(field)
    try {
      const r = await uploadFile(folder, file)
      set(field, r.url)
      toast.success("Uploaded successfully")
    } catch { toast.error("Upload failed") }
    finally { setUploading(null) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDocument("config/settings", data)
      toast.success("Settings saved")
      await logActivity("Updated", "site settings")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
  const lbl = "block text-xs text-slate-400 mb-1.5 font-medium"

  function UploadField({ field, folder, label, accept = "image/*" }: {
    field: keyof SiteSettings; folder: string; label: string; accept?: string
  }) {
    const val = data[field] as string
    return (
      <div>
        <label className={lbl}>{label}</label>
        <div className="flex gap-2">
          <input className={`${inputCls} flex-1`} value={val} onChange={(e) => set(field, e.target.value)} placeholder="https://..." />
          <input type="file" accept={accept} id={`upload-${field}`} className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(field, e.target.files[0], folder)} />
          <label htmlFor={`upload-${field}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white text-xs cursor-pointer transition-all shrink-0">
            {uploading === field ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          </label>
        </div>
        {val && field !== "analyticsId" && (
          <img src={val} alt="" className="mt-2 h-8 w-auto rounded object-contain opacity-80" onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
      </div>
    )
  }

  return (
    <AdminLayout
      title="Settings"
      action={
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60 transition-all">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      }
    >
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {/* Branding */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Globe size={15} className="text-blue-400" /> Branding
          </h3>
          <div>
            <label className={lbl}>Site Name</label>
            <input className={inputCls} value={data.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="James Kovacs Portfolio" />
          </div>
          <div>
            <label className={lbl}>Copyright Text</label>
            <input className={inputCls} value={data.copyright} onChange={(e) => set("copyright", e.target.value)} placeholder={`© ${new Date().getFullYear()} James Kovacs. All rights reserved.`} />
          </div>
          <UploadField field="logoUrl" folder="branding" label="Logo Image URL" />
          <UploadField field="faviconUrl" folder="branding" label="Favicon URL" />
        </div>

        {/* SEO */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Search size={15} className="text-blue-400" /> SEO
          </h3>
          <div>
            <label className={lbl}>SEO Title <span className="text-slate-600 font-normal">({data.seoTitle.length}/60)</span></label>
            <input className={inputCls} value={data.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="James Kovacs | Full Stack Developer & UI/UX Designer" maxLength={60} />
          </div>
          <div>
            <label className={lbl}>SEO Description <span className="text-slate-600 font-normal">({data.seoDesc.length}/160)</span></label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={data.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} placeholder="Experienced full-stack developer specializing in..." maxLength={160} />
          </div>
          <UploadField field="ogImage" folder="seo" label="Open Graph Image (1200×630px recommended)" />
        </div>

        {/* Analytics */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <BarChart2 size={15} className="text-blue-400" /> Analytics
          </h3>
          <div>
            <label className={lbl}>Google Analytics Measurement ID</label>
            <input className={inputCls} value={data.analyticsId} onChange={(e) => set("analyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
            <p className="text-slate-600 text-xs mt-1.5">Found in GA4 → Admin → Data Streams → Measurement ID</p>
          </div>
        </div>

        {/* EmailJS */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Mail size={15} className="text-blue-400" /> Contact Form — EmailJS
            </h3>
            <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors">
              emailjs.com <ExternalLink size={11} />
            </a>
          </div>
          <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-slate-400 text-xs leading-relaxed">
            <p className="font-medium text-blue-400 mb-1">Setup steps to receive emails from the contact form:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Sign up free at <strong>emailjs.com</strong> (200 emails/month free)</li>
              <li>Add an Email Service (Gmail, Outlook, etc.) → copy the <strong>Service ID</strong></li>
              <li>Create an Email Template → copy the <strong>Template ID</strong>. Use these variables in your template: <code className="text-blue-300">{"{{from_name}}"}</code>, <code className="text-blue-300">{"{{from_email}}"}</code>, <code className="text-blue-300">{"{{subject}}"}</code>, <code className="text-blue-300">{"{{message}}"}</code></li>
              <li>Go to Account → API Keys → copy your <strong>Public Key</strong></li>
              <li>Paste all three values below and click Save</li>
            </ol>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={lbl}>Service ID</label>
              <input className={inputCls} value={data.emailjsServiceId} onChange={(e) => set("emailjsServiceId", e.target.value)} placeholder="service_xxxxxxx" />
            </div>
            <div>
              <label className={lbl}>Template ID</label>
              <input className={inputCls} value={data.emailjsTemplateId} onChange={(e) => set("emailjsTemplateId", e.target.value)} placeholder="template_xxxxxxx" />
            </div>
            <div>
              <label className={lbl}>Public Key</label>
              <input className={inputCls} value={data.emailjsPublicKey} onChange={(e) => set("emailjsPublicKey", e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxxxx" />
            </div>
          </div>
          {data.emailjsServiceId && data.emailjsTemplateId && data.emailjsPublicKey && (
            <p className="flex items-center gap-1.5 text-green-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> EmailJS configured — contact form will send real emails.
            </p>
          )}
        </div>

        {/* Social Preview */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Share2 size={15} className="text-blue-400" /> Social Preview
          </h3>
          <div className="rounded-xl border border-white/[0.08] p-4 bg-[#1E293B]">
            {data.ogImage && <img src={data.ogImage} alt="" className="w-full h-32 object-cover rounded-lg mb-3" onError={(e) => (e.currentTarget.style.display = "none")} />}
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">yoursite.com</div>
            <div className="text-white text-sm font-medium">{data.seoTitle || data.siteName || "Site title"}</div>
            <div className="text-slate-400 text-xs mt-1 line-clamp-2">{data.seoDesc || "Site description will appear here."}</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
