/**
 * Public portfolio page — reads all content from Firestore in real-time.
 * Falls back to embedded static data when Firestore collections are empty.
 */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  Menu, X, ArrowRight, Download, ExternalLink, Github,
  Star, Mail, Phone, MapPin, MessageCircle,
  Linkedin, Twitter, Instagram,
  Search, Code2, Palette, Smartphone, BarChart3,
  Database, Shield, Calendar, Award, CheckCircle,
  Send, Clock,
} from "lucide-react"
import { subscribeDocument, subscribeCollection, orderBy } from "../lib/db"
import emailjs from "@emailjs/browser"

// ─── Static fallback data ────────────────────────────────────────────────────

const FALLBACK_PROFILE = {
  name: "",
  initials: "",
  title: "",
  location: "",
  email: "hello@jameskovacs.dev",
  phone: "+1 (415) 555-0192",
  whatsapp: "14155550192",
  bio: "I craft exceptional digital experiences at the intersection of clean code and thoughtful design.",
  photo: "",
  roles: ["Web Developer", "UI/UX Designer", "Full Stack Engineer", "IT Consultant"],
  cvUrl: "#",
  skills: [
    { name: "React / Next.js", level: 95 },
    { name: "TypeScript", level: 92 },
    { name: "Node.js / Express", level: 88 },
    { name: "UI/UX Design (Figma)", level: 82 },
  ],
  timeline: [
    { period: "2023–Now", role: "Senior Developer", company: "Vercel Partners", desc: "Lead architect for enterprise Next.js applications." },
    { period: "2021–2023", role: "Full Stack Engineer", company: "Stripe", desc: "Built payment infrastructure serving 10M+ transactions monthly." },
    { period: "2019–2021", role: "Frontend Developer", company: "Linear", desc: "Core contributor to the project management platform." },
  ],
  certs: [
    { name: "AWS Solutions Architect", issuer: "Amazon", year: "2023" },
    { name: "Google Cloud Professional", issuer: "Google", year: "2022" },
  ],
  social: [
    { platform: "LinkedIn", url: "#" },
    { platform: "GitHub", url: "#" },
    { platform: "Twitter", url: "#" },
  ],
}

const FALLBACK_STATS = [
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
]

const FALLBACK_CONTACT = {
  email: "hello@jameskovacs.dev",
  phone: "+1 (415) 555-0192",
  whatsapp: "14155550192",
  address: "San Francisco, CA",
  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100939.98555098464!2d-122.50764017948551!3d37.75781499657639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1719500000000!5m2!1sen!2sus",
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTyping(words: string[]) {
  const [display, setDisplay] = useState("")
  const [idx, setIdx] = useState(0)
  const [removing, setRemoving] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!words.length) return
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setRemoving(true) }, 2000)
      return () => clearTimeout(t)
    }
    const word = words[idx % words.length]
    const delay = removing ? 45 : 90
    const t = setTimeout(() => {
      if (!removing) {
        if (display.length < word.length) setDisplay(word.slice(0, display.length + 1))
        else setPaused(true)
      } else {
        if (display.length > 0) setDisplay(display.slice(0, -1))
        else { setRemoving(false); setIdx((i) => (i + 1) % words.length) }
      }
    }, delay)
    return () => clearTimeout(t)
  }, [display, removing, idx, words, paused])

  return display
}

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
})

function ChipLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 mb-5">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-blue-400">{children}</span>
    </div>
  )
}

function SectionHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <motion.div {...fade()} className="text-center mb-16">
      <ChipLabel>{label}</ChipLabel>
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{title}</h2>
      {sub && <p className="text-slate-400 text-lg max-w-lg mx-auto">{sub}</p>}
    </motion.div>
  )
}

const glassCard = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl"

// ─── Components ───────────────────────────────────────────────────────────────

function Nav({ profile, navItems }: { profile: typeof FALLBACK_PROFILE; navItems: { label: string; href: string; visible: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const visible = navItems.filter((n) => n.visible)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 48)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-3 bg-[#04080F]/85 backdrop-blur-2xl border-b border-white/[0.06]" : "py-5"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/30">
            {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold text-white hidden sm:block">{profile.name}</span>
        </a>
        <nav className="hidden lg:flex items-center gap-7">
          {visible.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="#contact" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20">
            Hire Me <ArrowRight size={14} />
          </a>
          <button onClick={() => setOpen(!open)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="lg:hidden mx-4 mt-3 rounded-2xl bg-[#0B1628]/95 backdrop-blur-2xl border border-white/[0.08] p-3">
          {visible.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">{l.label}</a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium">
            Hire Me <ArrowRight size={14} />
          </a>
        </motion.div>
      )}
    </header>
  )
}

function Hero({ profile }: { profile: typeof FALLBACK_PROFILE }) {
  const roles = typeof profile.roles === "string" ? profile.roles.split(",").map((r) => r.trim()) : (profile.roles as string[]) ?? FALLBACK_PROFILE.roles
  const typed = useTyping(roles)

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ChipLabel>Available for work</ChipLabel>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.04] tracking-tight mb-4">
            Hi, I'm{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
              {profile.name.split(" ")[0]}
            </span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="h-9 flex items-center gap-1 mb-6">
            <span className="text-xl md:text-2xl text-blue-400 font-mono">{typed}</span>
            <span className="text-xl text-blue-400 font-mono animate-pulse">|</span>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">{profile.bio || FALLBACK_PROFILE.bio}</motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-3 mb-14">
            <a href="#contact" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-px">
              Hire Me <ArrowRight size={16} />
            </a>
            <a href="#portfolio" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:border-blue-500/30 hover:text-white hover:bg-white/5 font-medium transition-all">
              View Portfolio
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-4 divide-x divide-white/[0.08]">
            {FALLBACK_STATS.map((s, i) => (
              <div key={i} className="px-4 first:pl-0">
                <div className="text-2xl font-bold text-white font-mono leading-tight">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full border border-blue-500/15" style={{ animation: "spin 14s linear infinite" }} />
            <div className="absolute -inset-10 rounded-full border border-blue-500/8" style={{ animation: "spin 22s linear infinite reverse" }} />
            <div className="absolute inset-0 rounded-full bg-blue-600/15 blur-2xl" />
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-blue-500/25 shadow-2xl shadow-blue-500/15">
              {profile.photo && (
  <img
    src={profile.photo}
    alt={profile.name}
    className="w-full h-full object-cover"
  />
)}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
            </div>
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -bottom-3 -right-3 bg-[#0B1628] border border-blue-500/30 text-white text-xs font-mono px-3 py-2 rounded-xl shadow-xl">
              <span className="text-blue-400">7+</span> yrs experience
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute -top-3 -left-3 bg-[#0B1628] border border-green-500/30 text-white text-xs font-mono px-3 py-2 rounded-xl shadow-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Open to work
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function About({ profile }: { profile: typeof FALLBACK_PROFILE }) {
  const skills = profile.skills ?? FALLBACK_PROFILE.skills
  const timeline = profile.timeline ?? FALLBACK_PROFILE.timeline
  const certs = profile.certs ?? FALLBACK_PROFILE.certs

  return (
    <section id="about" className="py-28 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHead label="About Me" title="The story so far" sub="Seven years of building things that matter — from zero to production and beyond." />
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <motion.div {...fade(0.05)} className="mb-8 space-y-4">
              <p className="text-slate-300 leading-relaxed">{profile.bioLong || "I'm a full-stack developer with a designer's eye, based in San Francisco. I specialize in building performant, accessible web applications that users actually enjoy using."}</p>
            </motion.div>
            <motion.div {...fade(0.1)} className="mb-12">
              <a href={profile.cvUrl || "#"} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm font-medium transition-all">
                <Download size={15} /> Download CV
              </a>
            </motion.div>
            <motion.div {...fade(0.15)}>
              <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-5">Technical Skills</p>
              <div className="space-y-4">
                {skills.map((s: { name: string; level: number }, i: number) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300">{s.name}</span>
                      <span className="text-blue-400 font-mono text-xs">{s.level}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.level}%` }} viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.08 * i }}
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <div>
            <motion.div {...fade(0.1)} className="mb-12">
              <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-6">Experience Timeline</p>
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/40 via-blue-500/20 to-transparent" />
                <div className="space-y-8">
                  {timeline.map((t: { period: string; role: string; company: string; desc: string }, i: number) => (
                    <motion.div key={i} {...fade(0.1 * i)} className="relative pl-10">
                      <div className="absolute left-0 top-0.5 w-8 h-8 rounded-full bg-[#0B1628] border border-blue-500/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <div className="text-[10px] text-blue-400 font-mono mb-1 tracking-wider">{t.period}</div>
                      <div className="text-white font-semibold">{t.role}</div>
                      <div className="text-slate-400 text-sm">{t.company}</div>
                      <div className="text-slate-500 text-sm mt-1 leading-relaxed">{t.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div {...fade(0.2)}>
              <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-5">Certifications</p>
              <div className="grid grid-cols-2 gap-3">
                {certs.map((c: { name: string; issuer: string; year: string }, i: number) => (
                  <motion.div key={i} {...fade(0.07 * i)} className={`${glassCard} p-4 hover:border-blue-500/20 transition-colors group`}>
                    <Award size={16} className="text-blue-400 mb-2.5" />
                    <div className="text-white text-sm font-medium leading-snug">{c.name}</div>
                    <div className="text-slate-500 text-xs mt-1">{c.issuer} · {c.year}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Services({ services }: { services: Record<string, unknown>[] }) {
  const iconMap: Record<string, React.ElementType> = {
    Code2, Palette, Smartphone, BarChart3, Database, Shield,
  }

  return (
    <section id="services" className="py-28 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHead label="Services" title="What I bring to the table" sub="End-to-end digital services — design, development, and strategy." />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => {
            const Icon = iconMap[s.icon as string] ?? Code2
            const color = (s.color as string) || "#3B82F6"
            return (
              <motion.div key={s.id != null ? String(s.id) : `svc-${i}`} {...fade(0.07 * i)}
                className={`${glassCard} p-6 hover:border-blue-500/20 hover:bg-white/[0.05] transition-all duration-300 group cursor-default`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title as string}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{s.desc as string}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <span className="text-xs text-slate-500 font-mono">Starting at <span className="text-white font-semibold">{s.price as string}</span></span>
                  <a href="#contact" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 transition-colors group">
                    {(s.btnLabel as string) || "Learn more"} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Portfolio({ projects }: { projects: Record<string, unknown>[] }) {
  const [activeFilter, setActiveFilter] = useState("all")
  const cats = ["all", ...Array.from(new Set(projects.map((p) => p.cat as string).filter(Boolean)))]
  const filtered = activeFilter === "all" ? projects : projects.filter((p) => p.cat === activeFilter)

  return (
    <section id="portfolio" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHead label="Portfolio" title="Selected Work" sub="A curated selection of projects across web, mobile, and design." />
        <motion.div {...fade(0.05)} className="flex justify-center flex-wrap gap-2 mb-12">
          {cats.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeFilter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"}`}>
              {f}
            </button>
          ))}
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.div key={p.id != null ? String(p.id) : `proj-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-blue-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="relative overflow-hidden h-48 bg-slate-900">
                {p.coverImage ? <img src={p.coverImage as string} alt={p.title as string} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-700 text-4xl">📁</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#04080F]/80 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-[10px] font-mono text-slate-300 capitalize border border-white/10 backdrop-blur-sm">{p.cat as string}</span>
              </div>
              <div className="p-5">
                <h3 className="text-white font-semibold text-lg mb-1.5">{p.title as string}</h3>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{p.desc as string}</p>
                {p.tech && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {String(p.tech).split(",").map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/8 text-blue-400 border border-blue-500/15">{t.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {p.demoUrl && <a href={p.demoUrl as string} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"><ExternalLink size={11} /> Live Demo</a>}
                  {p.repoUrl && <a href={p.repoUrl as string} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs hover:text-white hover:border-white/20 transition-all"><Github size={11} /> GitHub</a>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials({ items }: { items: Record<string, unknown>[] }) {
  return (
    <section id="testimonials" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHead label="Testimonials" title="Client Voices" sub="What the people I've worked with have to say." />
        <div className="grid md:grid-cols-2 gap-5">
          {items.map((t, i) => (
            <motion.div key={t.id != null ? String(t.id) : `tst-${i}`} {...fade(0.08 * i)} className={`${glassCard} p-7 hover:border-blue-500/20 transition-colors`}>
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: Number(t.rating) || 5 }).map((_, j) => (
                  <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed mb-7 text-sm">"{t.text as string}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                {t.avatar ? <img src={t.avatar as string} alt={t.name as string} className="w-10 h-10 rounded-full object-cover border border-white/10" /> : <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm">{String(t.name || "?")[0]}</div>}
                <div>
                  <div className="text-white font-semibold text-sm">{t.name as string}</div>
                  <div className="text-slate-500 text-xs">{t.role as string}{t.company ? `, ${t.company}` : ""}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact({ contact, profile, emailjsConfig }: {
  contact: typeof FALLBACK_CONTACT
  profile: typeof FALLBACK_PROFILE
  emailjsConfig?: { serviceId: string; templateId: string; publicKey: string }
}) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Use EmailJS if configured, otherwise show setup prompt
    if (emailjsConfig?.serviceId && emailjsConfig?.templateId && emailjsConfig?.publicKey) {
      try {
        await emailjs.send(
          emailjsConfig.serviceId,
          emailjsConfig.templateId,
          {
            from_name: form.name,
            from_email: form.email,
            subject: form.subject,
            message: form.message,
            to_email: contact.formRecipient || contact.email,
          },
          emailjsConfig.publicKey
        )
        setSent(true)
        setForm({ name: "", email: "", subject: "", message: "" })
      } catch {
        setError("Failed to send message. Please try again or email directly.")
      } finally {
        setLoading(false)
      }
    } else {
      // EmailJS not configured — open mailto as fallback
      const mailto = `mailto:${contact.email || contact.formRecipient}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`
      window.location.href = mailto
      setLoading(false)
      setSent(true)
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
  const email = contact.email || FALLBACK_CONTACT.email
  const phone = contact.phone || FALLBACK_CONTACT.phone
  const whatsapp = contact.whatsapp || FALLBACK_CONTACT.whatsapp
  const address = contact.address || FALLBACK_CONTACT.address
  const mapEmbed = contact.mapEmbed || FALLBACK_CONTACT.mapEmbed

  const social = profile.social ?? []
  const socialIconMap: Record<string, React.ElementType> = { LinkedIn: Linkedin, Twitter, GitHub: Github, Instagram }

  return (
    <section id="contact" className="py-28 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHead label="Contact" title="Let's work together" sub="Have a project in mind? I'd love to hear about it." />
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
          <motion.div {...fade(0.05)} className="lg:col-span-3">
            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5"><CheckCircle size={28} className="text-green-400" /></div>
                <h3 className="text-white font-bold text-2xl mb-2">Message sent!</h3>
                <p className="text-slate-400">I'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">Send another</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input className={inputCls} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <input className={inputCls} placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <input className={inputCls} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                <textarea className={`${inputCls} resize-none`} rows={7} placeholder="Tell me about your project..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium transition-all shadow-lg shadow-blue-600/20">
                  {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send size={16} />}
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>
          <motion.div {...fade(0.15)} className="lg:col-span-2 space-y-5">
            {[{ Icon: Mail, label: "Email", value: email, href: `mailto:${email}` }, { Icon: Phone, label: "Phone", value: phone, href: `tel:${phone}` }, { Icon: MapPin, label: "Location", value: address, href: "#" }].map((item) => (
              <a key={item.label} href={item.href} className={`${glassCard} flex items-center gap-4 p-4 hover:border-blue-500/20 transition-colors`}>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><item.Icon size={16} className="text-blue-400" /></div>
                <div><div className="text-slate-500 text-xs">{item.label}</div><div className="text-white text-sm mt-0.5">{item.value}</div></div>
              </a>
            ))}
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0"><MessageCircle size={16} className="text-green-400" /></div>
              <div><div className="text-slate-500 text-xs">WhatsApp</div><div className="text-green-400 text-sm font-medium mt-0.5">Chat with me now</div></div>
            </a>
            {social.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] mb-3">Social</p>
                <div className="flex gap-2">
                  {social.map((s: { platform: string; url: string }) => {
                    const Icon = socialIconMap[s.platform] ?? Linkedin
                    return (
                      <a key={s.platform} href={s.url} aria-label={s.platform}
                        className="w-10 h-10 rounded-xl border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:border-blue-500/30 hover:bg-blue-500/8 transition-all">
                        <Icon size={15} />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
            {mapEmbed && (
              <div className="rounded-2xl overflow-hidden border border-white/[0.08] h-44">
                <iframe src={mapEmbed} width="100%" height="100%"
                  style={{ border: 0, filter: "invert(88%) hue-rotate(180deg) saturate(0.6)" }}
                  allowFullScreen loading="lazy" title="Location" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Footer({ profile, navItems }: { profile: typeof FALLBACK_PROFILE; navItems: { label: string; href: string; visible: boolean }[] }) {
  const social = profile.social ?? []
  const socialIconMap: Record<string, React.ElementType> = { LinkedIn: Linkedin, Twitter, GitHub: Github, Instagram }
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <span className="font-semibold text-white">{profile.name}</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">Building premium digital experiences for forward-thinking companies.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {navItems.filter((n) => n.visible).map((l) => (
                <li key={l.href}><a href={l.href} className="text-slate-500 text-sm hover:text-white transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Social</h4>
            <div className="flex gap-2">
              {social.map((s: { platform: string; url: string }) => {
                const Icon = socialIconMap[s.platform] ?? Linkedin
                return <a key={s.platform} href={s.url} className="w-8 h-8 rounded-lg border border-white/[0.07] flex items-center justify-center text-slate-600 hover:text-white hover:border-white/20 transition-all"><Icon size={13} /></a>
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <p className="text-slate-600 text-xs font-mono">© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
          <a href="/login" className="text-slate-800 hover:text-slate-600 text-xs transition-colors">Admin</a>
        </div>
      </div>
    </footer>
  )
}

// ─── Main page component ─────────────────────────────────────────────────────

export default function PortfolioPage() {
  // Scroll to hash on initial load so /#services, /#contact, etc. work
  useEffect(() => {
  const scrollToHash = (behavior: ScrollBehavior = "auto") => {
    const hash = window.location.hash
    if (!hash) return

    const target = document.querySelector(hash) as HTMLElement | null
    if (!target) return

    const headerOffset = 90
    const elementPosition = target.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.scrollY - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior,
    })
  }

  const timers = [
    setTimeout(() => scrollToHash("auto"), 100),
    setTimeout(() => scrollToHash("auto"), 500),
    setTimeout(() => scrollToHash("auto"), 1000),
    setTimeout(() => scrollToHash("smooth"), 1800),
  ]

  const handleHashChange = () => scrollToHash("smooth")

  window.addEventListener("hashchange", handleHashChange)

  return () => {
    timers.forEach(clearTimeout)
    window.removeEventListener("hashchange", handleHashChange)
  }
}, [])

  const [profile, setProfile] = useState<typeof FALLBACK_PROFILE>(FALLBACK_PROFILE)
  const [contact, setContact] = useState<typeof FALLBACK_CONTACT>(FALLBACK_CONTACT)
  const [emailjsConfig, setEmailjsConfig] = useState<{ serviceId: string; templateId: string; publicKey: string } | undefined>(undefined)
  const [sections, setSections] = useState<{ blogEnabled: boolean; testimonialsEnabled: boolean; navItems: { label: string; href: string; visible: boolean }[] }>({
    blogEnabled: true, testimonialsEnabled: true,
    navItems: [
      { label: "Home", href: "#home", visible: true },
      { label: "About", href: "#about", visible: true },
      { label: "Services", href: "#services", visible: true },
      { label: "Portfolio", href: "#portfolio", visible: true },
      { label: "Blog", href: "#blog", visible: true },
      { label: "Reviews", href: "#testimonials", visible: true },
      { label: "Contact", href: "#contact", visible: true },
    ],
  })
  const [services, setServices] = useState<Record<string, unknown>[]>([])
  const [projects, setProjects] = useState<Record<string, unknown>[]>([])
  const [testimonials, setTestimonials] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    const subs = [
      subscribeDocument("config/profile", (d) => { if (d) setProfile((p) => ({ ...p, ...(d as typeof FALLBACK_PROFILE) })) }),
      subscribeDocument("config/contact", (d) => { if (d) setContact((c) => ({ ...c, ...(d as typeof FALLBACK_CONTACT) })) }),
      subscribeDocument("config/sections", (d) => { if (d) setSections((s) => ({ ...s, ...d })) }),
      subscribeDocument("config/settings", (d) => {
        if (d?.emailjsServiceId && d?.emailjsTemplateId && d?.emailjsPublicKey) {
          setEmailjsConfig({ serviceId: d.emailjsServiceId as string, templateId: d.emailjsTemplateId as string, publicKey: d.emailjsPublicKey as string })
        }
      }),
      subscribeCollection("services", (d) => { if (d.length > 0) setServices(d) }, orderBy("order", "asc")),
      subscribeCollection("portfolio", (d) => { if (d.length > 0) setProjects(d.filter((p) => p.published !== false)) }),
      subscribeCollection("testimonials", (d) => { if (d.length > 0) setTestimonials(d.filter((t) => t.published !== false)) }, orderBy("order", "asc")),
    ]
    return () => subs.forEach((unsub) => unsub())
  }, [])

  const navItems = sections.navItems.map((n) => {
    if (n.href === "#blog" && !sections.blogEnabled) return { ...n, visible: false }
    if (n.href === "#testimonials" && !sections.testimonialsEnabled) return { ...n, visible: false }
    return n
  })

  const fallbackServices: Record<string, unknown>[] = [
    { id: "1", icon: "Code2", title: "Web Development", desc: "Custom websites built with React, Next.js, and modern tooling.", price: "$1,200", btnLabel: "Learn More", color: "#3B82F6" },
    { id: "2", icon: "Palette", title: "UI/UX Design", desc: "Pixel-perfect interfaces with Figma — from wireframe to handoff.", price: "$800", btnLabel: "Learn More", color: "#8B5CF6" },
    { id: "3", icon: "Shield", title: "IT Consulting", desc: "Architecture reviews, tech-stack selection, and quarterly advisory.", price: "$200/hr", btnLabel: "Learn More", color: "#EF4444" },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#04080F", fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, rgba(59,130,246,0.09) 0%, transparent 55%)" }} />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle, rgba(99,130,246,0.35) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="relative z-10">
        <Nav profile={profile} navItems={navItems} />
        <main>
          <Hero profile={profile} />
          <About profile={profile} />
          <Services services={services.length > 0 ? services : fallbackServices} />
          <Portfolio projects={projects} />
          {sections.blogEnabled && (
            <section id="blog" className="py-28">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <SectionHead label="Blog" title="Writing & Thoughts" sub="Add blog posts in the admin panel to display them here." />
                <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm transition-all">
                  <Clock size={15} /> Manage Blog →
                </a>
              </div>
            </section>
          )}
          {sections.testimonialsEnabled && testimonials.length > 0 && <Testimonials items={testimonials} />}
          <Contact contact={contact} profile={profile} emailjsConfig={emailjsConfig} />
        </main>
        <Footer profile={profile} navItems={navItems} />
      </div>
    </div>
  )
}
