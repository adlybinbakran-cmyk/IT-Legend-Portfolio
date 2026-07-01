import { useEffect, useState, useRef, useCallback } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { subscribeCollection, addDocument, deleteDocument } from "../../lib/db"
import { uploadFile, deleteFile } from "../../lib/storage"
import { toast } from "sonner"
import {
  Upload, Trash2, Search, Image, File, Copy, Check,
  Grid3x3, List, X, Loader2, FolderOpen,
} from "lucide-react"

interface MediaItem {
  id: string
  name: string
  url: string
  path: string
  size: number
  type: string
  folder: string
  uploadedAt: { toDate: () => Date } | null
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = subscribeCollection("media", (data) => {
      setItems(data as MediaItem[])
      setLoading(false)
    })
    return unsub
  }, [])

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) return

    setUploading(true)
    let succeeded = 0

    for (const file of fileArr) {
      try {
        setUploadProgress(0)
        const result = await uploadFile("media", file, setUploadProgress)
        await addDocument("media", {
          name: file.name,
          url: result.url,
          path: result.path,
          size: file.size,
          type: file.type,
          folder: "media",
        })
        succeeded++
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    if (succeeded > 0) toast.success(`Uploaded ${succeeded} file${succeeded > 1 ? "s" : ""}`)
    setUploading(false)
    setUploadProgress(0)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(item.id)
    try {
      await deleteFile(item.path)
      await deleteDocument(`media/${item.id}`)
      if (selected?.id === item.id) setSelected(null)
      toast.success("File deleted")
    } catch {
      // File may not exist in storage anymore — delete DB record anyway
      try { await deleteDocument(`media/${item.id}`) } catch {}
      toast.success("File removed")
    } finally {
      setDeleting(null)
    }
  }

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("URL copied to clipboard")
  }

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  const isImage = (type: string) => type.startsWith("image/")

  return (
    <AdminLayout
      title="Media Library"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? `${uploadProgress}%` : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.svg"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      }
    >
      <div className="flex h-full">
        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files…"
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 transition-all"
              />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setView("grid")} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${view === "grid" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white hover:bg-white/5"}`}>
                <Grid3x3 size={14} />
              </button>
              <button onClick={() => setView("list")} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${view === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white hover:bg-white/5"}`}>
                <List size={14} />
              </button>
            </div>
            <span className="text-slate-600 text-xs font-mono shrink-0">{filtered.length} files</span>
          </div>

          {/* Drop zone */}
          <div className="flex-1 overflow-y-auto p-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              className={`min-h-full rounded-2xl border-2 border-dashed transition-all ${isDragOver ? "border-blue-500/60 bg-blue-500/5" : "border-transparent"}`}
            >
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.07] animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <FolderOpen size={24} className="text-slate-700" />
                  </div>
                  <h3 className="text-white font-medium mb-2">No files yet</h3>
                  <p className="text-slate-500 text-sm mb-5">Drag & drop files here, or click Upload above.</p>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
                    Choose Files
                  </button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={`group relative aspect-square rounded-xl border overflow-hidden cursor-pointer transition-all ${selected?.id === item.id ? "border-blue-500/60 ring-1 ring-blue-500/40" : "border-white/[0.07] hover:border-white/[0.15]"}`}
                    >
                      {isImage(item.type) ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/[0.03] flex flex-col items-center justify-center">
                          <File size={24} className="text-slate-600 mb-2" />
                          <span className="text-slate-600 text-[10px] font-mono px-2 text-center truncate w-full">{item.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); copyUrl(item.url) }}
                          className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                          <Copy size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                          disabled={deleting === item.id}
                          className="w-7 h-7 rounded-lg bg-red-500/40 flex items-center justify-center text-white hover:bg-red-500/60 transition-all">
                          {deleting === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((item) => (
                    <div key={item.id} onClick={() => setSelected(item)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${selected?.id === item.id ? "border-blue-500/40 bg-blue-500/5" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"}`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                        {isImage(item.type) ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><File size={16} className="text-slate-600" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{item.name}</div>
                        <div className="text-slate-600 text-xs">{formatSize(item.size)} · {item.type}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); copyUrl(item.url) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                          <Copy size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                          disabled={deleting === item.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          {deleting === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 border-l border-white/[0.06] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-white text-sm font-medium">Details</span>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {isImage(selected.type) ? (
                <img src={selected.url} alt={selected.name} className="w-full rounded-xl object-cover bg-white/5" />
              ) : (
                <div className="w-full h-28 rounded-xl bg-white/5 flex items-center justify-center">
                  <File size={32} className="text-slate-600" />
                </div>
              )}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Name</span>
                  <p className="text-white mt-0.5 break-all">{selected.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Size</span>
                  <p className="text-white mt-0.5">{formatSize(selected.size)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Type</span>
                  <p className="text-white mt-0.5 font-mono">{selected.type}</p>
                </div>
                {selected.uploadedAt && (
                  <div>
                    <span className="text-slate-500">Uploaded</span>
                    <p className="text-white mt-0.5">{selected.uploadedAt.toDate().toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-slate-500 text-xs">URL</label>
                <div className="flex gap-1.5">
                  <input
                    value={selected.url}
                    readOnly
                    className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] text-slate-400 text-[10px] font-mono focus:outline-none truncate"
                  />
                  <button onClick={() => copyUrl(selected.url)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all shrink-0">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={deleting === selected.id}
                  className="w-full py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-all flex items-center justify-center gap-2"
                >
                  {deleting === selected.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
