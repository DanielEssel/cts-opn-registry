"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const G = {
  green:      "#15803d",
  greenLight: "#16a34a",
  greenGlow:  "#4ade80",
  greenDim:   "#dcfce7",
  greenDark:  "#14532d",
  dark:       "#0f172a",
  dark2:      "#1e293b",
  dark3:      "#334155",
  slate:      "#64748b",
  slateLight: "#94a3b8",
  border:     "#e2e8f0",
  bg:         "#f8fafc",
};

// ─── Data ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Services",     href: "#services"    },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Earnings",     href: "#earnings"    },
  { label: "FAQ",          href: "#faq"         },
];

const HERO_STATS = [
  { val: "2,400+", label: "Active Drivers"    },
  { val: "₵4.2M+", label: "Paid Out Monthly" },
  { val: "4.91",   label: "Avg Driver Rating" },
];

const SERVICES = [
  {
    icon: "🛵", title: "Ride Hailing", tagline: "Move people, earn consistently",
    desc: "Accept passenger trips across the city. Set your own hours, build a loyal rider base, and earn competitive per-kilometre rates.",
    stat: "Up to ₵2,400/week", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0",
  },
  {
    icon: "📦", title: "Parcel Delivery", tagline: "Deliver fast, earn more",
    desc: "Partner with local businesses and e-commerce platforms to move parcels, documents, and goods with speed and accountability.",
    stat: "Up to ₵1,800/week", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd",
  },
  {
    icon: "🔥", title: "Gas Delivery", tagline: "High demand, premium pay",
    desc: "Collect, refill, and deliver cooking gas cylinders to homes and businesses. One of the highest-earning services on the platform.",
    stat: "Up to ₵2,100/week", color: "#b45309", bg: "#fffbeb", border: "#fde68a",
  },
];

const STEPS = [
  { num: "01", icon: "🔔", label: "Receive Job",   desc: "An instant notification arrives with job details, pick-up location, and estimated earnings." },
  { num: "02", icon: "✅", label: "Accept",         desc: "Review the request and accept within 15 seconds. Your acceptance rate builds your Driver Score." },
  { num: "03", icon: "🧭", label: "Navigate",       desc: "Built-in GPS guides you to pick-up and drop-off with real-time traffic updates." },
  { num: "04", icon: "📋", label: "Complete",       desc: "Mark the job complete and collect a digital proof of delivery or passenger confirmation." },
  { num: "05", icon: "💳", label: "Get Paid",       desc: "Earnings hit your CTS Wallet instantly. Withdraw anytime to Mobile Money or bank." },
];

const FEATURES = [
  { icon: "🧭", title: "Smart Navigation",       desc: "Real-time GPS with offline map caching for low-signal areas." },
  { icon: "🔔", title: "Instant Alerts",         desc: "Push notifications ensure you never miss a job opportunity." },
  { icon: "💳", title: "CTS Wallet",             desc: "Instant payouts. Withdraw to MoMo or bank in seconds." },
  { icon: "📊", title: "Performance Analytics", desc: "Track your earnings, trips, and Driver Score week over week." },
  { icon: "🔐", title: "QR Identity",            desc: "Your certified PCRAA identity is embedded in your driver QR badge." },
  { icon: "⭐", title: "Ratings",                desc: "Build a strong reputation that unlocks premium job categories." },
  { icon: "📋", title: "Trip History",           desc: "Full audit log of every job — income proof for loans, banking." },
  { icon: "📡", title: "Offline Mode",           desc: "Core functions work without internet. Sync when reconnected." },
  { icon: "🆘", title: "Emergency SOS",          desc: "One-tap emergency alert with live location to CTS dispatch." },
  { icon: "🪪", title: "Driver Profile",         desc: "Your professional identity: photo, plate, rating, certifications." },
];

const BENEFITS = [
  "Work whenever you want — complete flexibility",
  "Earn from three services simultaneously",
  "One professional account, verified identity",
  "Transparent earnings with zero hidden fees",
  "Instant payouts to MoMo or bank",
  "Government-backed, PCRAA-certified ecosystem",
  "24/7 driver support and emergency SOS",
];

const MOCK_STATS = [
  { label: "Weekly Earnings",   value: "₵1,840", change: "+12%", up: true },
  { label: "Trips Completed",   value: "47",      change: "+8",   up: true },
  { label: "Deliveries",        value: "23",      change: "+5",   up: true },
  { label: "Driver Score",      value: "4.92",    change: "+0.04",up: true },
];

const EARNINGS_BARS = [
  { day: "Mon", val: 60 }, { day: "Tue", val: 80 },
  { day: "Wed", val: 55 }, { day: "Thu", val: 90 },
  { day: "Fri", val: 75 }, { day: "Sat", val: 100 },
  { day: "Sun", val: 65 },
];

const TESTIMONIALS = [
  {
    name: "Kwame Asante", role: "Certified PCRAA Rider · Accra", rating: 5, avatar: "KA", color: "#15803d",
    quote: "Before CTS Driver App I was doing single-route deliveries for one shop. Now I'm doing rides in the morning, parcels in the afternoon, and gas deliveries on weekends. My income tripled in four months.",
  },
  {
    name: "Abena Mensah", role: "Certified PCRAA Rider · Kumasi", rating: 5, avatar: "AM", color: "#0369a1",
    quote: "The wallet is what convinced me. Every job, the money is there immediately. No waiting, no chasing. I withdrew ₵800 on a Saturday afternoon straight to my MoMo. That's what financial freedom feels like.",
  },
  {
    name: "Emmanuel Tetteh", role: "Certified PCRAA Rider · Tema", rating: 5, avatar: "ET", color: "#b45309",
    quote: "Gas delivery is underrated. People think it's simple work but the earnings are serious. I complete 12–15 orders on a busy day and the tips from regulars add up. CTS Driver App made me a professional.",
  },
];

const FAQS = [
  { q: "Who can use the CTS Driver App?",           a: "The app is exclusively available to riders who have completed PCRAA training and received their professional certification. Certification ensures every driver meets the safety, conduct, and service standards customers expect." },
  { q: "Is PCRAA certification required?",           a: "Yes. PCRAA certification is mandatory. It is not just a formality — it is your professional credential, covering road safety training, customer service standards, and service-specific protocols for rides, deliveries, and gas handling." },
  { q: "How do I receive payments?",                  a: "All earnings are credited to your CTS Wallet in real time after each completed job. Withdraw to any Mobile Money account (MTN, Telecel, AirtelTigo) or a registered bank account at any time, with no minimum withdrawal threshold." },
  { q: "Can I switch between all three services?",    a: "Absolutely. Your account gives you access to all three income streams from day one. Accept a ride job, complete a parcel delivery, and take a gas order — all in the same day, from a single app." },
  { q: "How does gas cylinder delivery work?",        a: "Gas delivery partners collect empty cylinders from customers, transport them to certified refill stations, and deliver the refilled cylinders back. The app handles job assignment, navigation, and handover confirmation automatically." },
  { q: "What if I have a problem during a job?",     a: "The in-app Emergency SOS button connects you to CTS dispatch immediately with your live location. For non-emergency issues, in-app chat support is available 24/7. Critical incidents are escalated within 90 seconds." },
];

const ONBOARDING_STEPS = [
  { num: "01", title: "Complete PCRAA Training",       desc: "Attend certified rider training covering road safety, service standards, and platform protocols." },
  { num: "02", title: "Receive Certification",         desc: "Pass the assessment. Receive your PCRAA certification and driver QR identity badge." },
  { num: "03", title: "Download the App",              desc: "Install the app, verify your PCRAA credentials, and activate your professional account." },
  { num: "04", title: "Start Earning",                 desc: "Accept your first job within minutes. Rides, deliveries, gas — your choice, your schedule." },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Stars({ n = 5 }) {
  return <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: 2 }}>{"★".repeat(n)}</span>;
}

function Badge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      background: dark ? "rgba(74,222,128,0.15)" : G.greenDim,
      color: dark ? G.greenGlow : G.greenDark,
      fontWeight: 700, fontSize: 11, padding: "5px 16px",
      borderRadius: 999, letterSpacing: 1.5, textTransform: "uppercase",
      border: `1px solid ${dark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}`,
    }}>{children}</span>
  );
}

function RevealDiv({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
function PhoneMockup({ label, color, screen }: { label: string; color: string; screen?: "dashboard" | "job" | "wallet" | "nav" | "history" }) {
  const screens: Record<string, React.ReactNode> = {
    dashboard: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: `linear-gradient(135deg,${color},${color}dd)`, borderRadius: 12, padding: "14px 12px", color: "#fff" }}>
          <div style={{ fontSize: 9, opacity: 0.8, marginBottom: 2 }}>Good morning, Kwame 👋</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>₵1,840</div>
          <div style={{ fontSize: 9, opacity: 0.7 }}>This week's earnings</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[["47", "Trips"], ["23", "Deliveries"], ["4.92", "Score"], ["₵340", "Today"]].map(([v, l]) => (
            <div key={l} style={{ background: "#1e293b", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{v}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 40, background: "#1e293b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 9, color: color, fontWeight: 700 }}>● ONLINE · Ready for jobs</div>
        </div>
      </div>
    ),
    job: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: "#dc2626", borderRadius: 10, padding: "10px 12px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700 }}>NEW REQUEST</div>
          <div style={{ fontSize: 9, fontWeight: 700 }}>14s</div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>Pickup</div>
          <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Accra Mall, Spintex</div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>Dropoff</div>
          <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Airport Residential</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, background: "#1e293b", borderRadius: 8, padding: "6px", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>₵28</div>
            <div style={{ fontSize: 8, color: "#94a3b8" }}>Estimated</div>
          </div>
          <div style={{ flex: 1, background: "#1e293b", borderRadius: 8, padding: "6px", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>5.2km</div>
            <div style={{ fontSize: 8, color: "#94a3b8" }}>Distance</div>
          </div>
        </div>
        <div style={{ background: color, borderRadius: 10, padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>ACCEPT JOB</div>
        </div>
      </div>
    ),
    wallet: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: `linear-gradient(135deg,${color},${color}aa)`, borderRadius: 12, padding: "14px 12px", color: "#fff" }}>
          <div style={{ fontSize: 9, opacity: 0.8 }}>CTS Wallet Balance</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>₵3,240.50</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {["Withdraw", "Transfer"].map(a => (
              <div key={a} style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 9, fontWeight: 700 }}>{a}</div>
            ))}
          </div>
        </div>
        {[["Ride — Airport", "+₵28.00", "2h ago"], ["Gas — Delivery", "+₵45.00", "5h ago"], ["Parcel", "+₵15.50", "Yesterday"]].map(([l, v, t]) => (
          <div key={l} style={{ background: "#1e293b", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 1 }}>{t}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>{v}</div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div style={{
      width: 170,
      background: "#0a0f1e",
      borderRadius: 28,
      padding: "10px 7px",
      boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
      flexShrink: 0,
    }}>
      <div style={{ background: "#111827", borderRadius: 20, overflow: "hidden", minHeight: 320 }}>
        <div style={{ height: 22, background: "#0a0f1e", display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
          <div style={{ width: 50, height: 5, background: "#1f2937", borderRadius: 3 }} />
        </div>
        <div style={{ padding: "10px 10px 12px" }}>
          {screens[screen ?? "dashboard"] ?? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ background: color, borderRadius: 10, padding: "10px", color: "#fff" }}>
                <div style={{ fontSize: 9, opacity: 0.8 }}>CTS Driver</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{label}</div>
              </div>
              {[80, 60, 70, 45, 85].map((w, i) => (
                <div key={i} style={{ height: 9, background: "#1f2937", borderRadius: 5, width: `${w}%` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CTSDriverLanding() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePeriod, setActivePeriod] = useState("W");
  const scrollY = useScrollY();

  const [heroRef, heroVisible] = useInView(0.05);
  const [featRef, featVisible] = useInView(0.08);
  const [earnRef, earnVisible] = useInView(0.08);

  // Close mobile nav on route change or resize
  useEffect(() => {
    const close = () => setMobileNavOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  const navScrolled = scrollY > 20;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#fff", color: G.dark, overflowX: "hidden" }}>

      {/* ── NAVIGATION ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: navScrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: navScrolled ? `1px solid ${G.border}` : "1px solid transparent",
        transition: "all 0.3s ease",
        padding: "0 clamp(16px,5vw,80px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        {/* Logo */}
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/logo/app_icon.png" alt="CTS Driver App" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: G.dark, letterSpacing: "-0.02em" }}>CTS Driver</span>
        </a>

        {/* Desktop links */}
        <div className="cts-nav-links" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: 14, color: G.slate, textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = G.dark}
              onMouseLeave={e => e.currentTarget.style.color = G.slate}
            >{label}</a>
          ))}
          <a href="#download" style={{
            background: G.green, color: "#fff", fontSize: 14, fontWeight: 600,
            padding: "9px 22px", borderRadius: 10, textDecoration: "none",
            transition: "background 0.2s, transform 0.15s",
            boxShadow: `0 4px 16px ${G.green}44`,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = G.greenLight; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = G.green; e.currentTarget.style.transform = "translateY(0)"; }}
          >Download App</a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="cts-hamburger"
          onClick={() => setMobileNavOpen(o => !o)}
          aria-label="Toggle navigation"
          style={{
            display: "none", background: "none", border: "none",
            cursor: "pointer", padding: 8, borderRadius: 8,
            flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center",
          }}
        >
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: "block", width: 22, height: 2, background: G.dark,
              borderRadius: 2, transition: "all 0.3s",
              transform: mobileNavOpen
                ? i === 0 ? "translateY(7px) rotate(45deg)"
                : i === 2 ? "translateY(-7px) rotate(-45deg)"
                : "scaleX(0)"
                : "none",
              opacity: mobileNavOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile nav drawer */}
      <div style={{
        position: "fixed", top: 64, left: 0, right: 0, zIndex: 190,
        background: "#fff",
        borderBottom: `1px solid ${G.border}`,
        padding: mobileNavOpen ? "20px clamp(16px,5vw,40px) 24px" : "0 clamp(16px,5vw,40px)",
        maxHeight: mobileNavOpen ? 400 : 0,
        overflow: "hidden",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: mobileNavOpen ? "0 16px 40px rgba(0,0,0,0.08)" : "none",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href}
              onClick={() => setMobileNavOpen(false)}
              style={{
                fontSize: 16, color: G.slate, textDecoration: "none", fontWeight: 500,
                padding: "12px 0", borderBottom: `1px solid ${G.bg}`,
                display: "block", transition: "color 0.2s",
              }}
            >{label}</a>
          ))}
          <a href="#download" onClick={() => setMobileNavOpen(false)} style={{
            marginTop: 12, background: G.green, color: "#fff",
            padding: "14px 24px", borderRadius: 12, textDecoration: "none",
            fontWeight: 700, fontSize: 15, textAlign: "center", display: "block",
          }}>Download App</a>
        </div>
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        style={{
          minHeight: "100dvh",
          paddingTop: 64,
          background: "linear-gradient(160deg, #f8fafc 0%, #f0fdf4 50%, #f8fafc 100%)",
          display: "flex", alignItems: "center",
          padding: "100px clamp(16px,5vw,80px) 60px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${G.green}09 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${G.green}06 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div className="cts-hero-grid" style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left — text */}
          <div style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(32px)",
            transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <Badge>For PCRAA Certified Riders</Badge>
            <h1 style={{
              fontSize: "clamp(38px, 5.5vw, 72px)",
              fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.03em",
              margin: "20px 0 20px", color: G.dark,
            }}>
              One App.<br />
              <span style={{ color: G.green }}>Three Ways</span><br />
              to Earn.
            </h1>
            <p style={{
              fontSize: "clamp(15px,1.8vw,18px)", color: G.slate,
              lineHeight: 1.75, marginBottom: 36, maxWidth: 480,
            }}>
              Certified PCRAA riders can accept ride-hailing jobs, parcel deliveries, and gas cylinder orders — all from one professional platform. Start earning the day you complete training.
            </p>

            {/* Stats */}
            <div className="cts-stats-row" style={{ display: "flex", gap: 32, marginBottom: 40, flexWrap: "wrap" }}>
              {HERO_STATS.map(({ val, label }) => (
                <div key={label}>
                  <div style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 900, color: G.dark, letterSpacing: "-0.02em" }}>{val}</div>
                  <div style={{ fontSize: 12, color: G.slateLight, fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                background: G.dark, color: "#fff",
                padding: "14px 24px", borderRadius: 14, textDecoration: "none",
                fontWeight: 600, fontSize: 14,
                boxShadow: "0 8px 32px rgba(15,23,42,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(15,23,42,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(15,23,42,0.3)"; }}
              >
                <span style={{ fontSize: 22 }}>▶</span>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1, marginBottom: 1 }}>Get it on</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Google Play</div>
                </div>
              </a>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                background: "#f8fafc", color: G.slateLight,
                padding: "14px 24px", borderRadius: 14,
                fontWeight: 600, fontSize: 14, border: `1.5px solid ${G.border}`,
              }}>
                <span style={{ fontSize: 22 }}>🍎</span>
                <div>
                  <div style={{ fontSize: 10, lineHeight: 1, marginBottom: 1 }}>Coming soon</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>App Store</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — phone mockups */}
          <div className="cts-hero-phones" style={{
            display: "flex", justifyContent: "center", alignItems: "flex-end",
            gap: 16, position: "relative",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(40px)",
            transition: "all 1.1s cubic-bezier(0.16,1,0.3,1) 0.25s",
          }}>
            <div style={{ transform: "rotate(-7deg) translateY(40px)" }}>
              <PhoneMockup label="New Job" color="#0369a1" screen="job" />
            </div>
            <div style={{ zIndex: 2, transform: "scale(1.1)" }}>
              <PhoneMockup label="Dashboard" color={G.green} screen="dashboard" />
            </div>
            <div style={{ transform: "rotate(7deg) translateY(40px)" }}>
              <PhoneMockup label="Wallet" color="#b45309" screen="wallet" />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CTS ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px clamp(16px,5vw,80px)", background: G.dark }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <Badge dark>The Platform</Badge>
          <h2 style={{
            fontSize: "clamp(26px,4vw,52px)", fontWeight: 800, color: "#fff",
            letterSpacing: "-0.03em", margin: "20px 0 16px", lineHeight: 1.1,
          }}>
            Built for certified professionals.<br />
            <span style={{ color: G.greenGlow }}>Designed to pay you more.</span>
          </h2>
          <p style={{ fontSize: 17, color: G.slateLight, lineHeight: 1.75, maxWidth: 600, margin: "0 auto 56px" }}>
            CTS Driver is not a gig app. It is the official working platform for riders who have invested in their professional certification through PCRAA.
          </p>
          <div className="cts-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, textAlign: "left" }}>
            {ONBOARDING_STEPS.map(({ num, title, desc }, i) => (
              <RevealDiv key={num} delay={i * 0.08}>
                <div style={{
                  background: G.dark2, borderRadius: 20, padding: "28px 24px",
                  border: `1px solid ${G.dark3}`, height: "100%",
                  transition: "border-color 0.2s, transform 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${G.green}66`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = G.dark3; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: G.greenGlow, letterSpacing: 2, marginBottom: 14 }}>{num}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: G.slateLight, lineHeight: 1.65 }}>{desc}</div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────────────── */}
      <section id="services" style={{ padding: "100px clamp(16px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Three Ways to Earn</Badge>
            <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "20px 0 12px", lineHeight: 1.15 }}>
              Pick your service.<br />Or run all three.
            </h2>
            <p style={{ fontSize: 16, color: G.slate, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
              Every certified driver has access to all three income streams from day one.
            </p>
          </div>
          <div className="cts-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {SERVICES.map(({ icon, title, tagline, desc, stat, color, bg, border }, i) => (
              <RevealDiv key={title} delay={i * 0.1}>
                <div style={{
                  background: bg, borderRadius: 24, padding: 32,
                  border: `1.5px solid ${border}`,
                  transition: "transform 0.25s, box-shadow 0.25s",
                  cursor: "default", height: "100%",
                  display: "flex", flexDirection: "column",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${color}1a`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 44, marginBottom: 20 }}>{icon}</div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: G.dark, marginBottom: 6, letterSpacing: "-0.01em" }}>{title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>{tagline}</div>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.65, marginBottom: 24, flex: 1 }}>{desc}</p>
                  <div style={{
                    display: "inline-block", background: color, color: "#fff",
                    padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                    alignSelf: "flex-start",
                  }}>{stat}</div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "100px clamp(16px,5vw,80px)", background: G.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <Badge>How It Works</Badge>
            <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "20px 0 0", lineHeight: 1.15 }}>
              From notification to payment<br />in minutes.
            </h2>
          </div>

          {/* Desktop: horizontal steps */}
          <div className="cts-steps-desktop" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, position: "relative" }}>
            {STEPS.map(({ num, icon, label, desc }, i) => (
              <RevealDiv key={num} delay={i * 0.1} style={{ position: "relative", padding: "0 12px", textAlign: "center" }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: 27, left: "calc(50% + 28px)",
                    height: 2, width: "calc(100% - 56px)",
                    background: `linear-gradient(to right, ${G.green}, ${G.green}33)`,
                  }} />
                )}
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${G.green}, ${G.greenLight})`,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, margin: "0 auto 20px", position: "relative", zIndex: 1,
                  boxShadow: `0 8px 24px ${G.green}55`,
                }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 12, color: G.slate, lineHeight: 1.6 }}>{desc}</div>
              </RevealDiv>
            ))}
          </div>

          {/* Mobile: vertical steps */}
          <div className="cts-steps-mobile" style={{ display: "none", flexDirection: "column", gap: 0 }}>
            {STEPS.map(({ num, icon, label, desc }, i) => (
              <RevealDiv key={num} delay={i * 0.08}>
                <div style={{ display: "flex", gap: 16, paddingBottom: i < STEPS.length - 1 ? 0 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${G.green}, ${G.greenLight})`,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, boxShadow: `0 6px 20px ${G.green}44`, flexShrink: 0,
                    }}>{icon}</div>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: `linear-gradient(to bottom, ${G.green}, ${G.green}22)`, margin: "6px 0", minHeight: 40 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 24, paddingTop: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 13, color: G.slate, lineHeight: 1.65 }}>{desc}</div>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP SCREENS ─────────────────────────────────────────────────────── */}
      <section id="app-screens" style={{ padding: "100px 0", background: G.dark, overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", padding: "0 clamp(16px,5vw,80px)", marginBottom: 56 }}>
          <Badge dark>The App</Badge>
          <h2 style={{ fontSize: "clamp(26px,4vw,52px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "20px 0 14px", lineHeight: 1.1 }}>
            Designed for drivers<br /><span style={{ color: G.greenGlow }}>who mean business.</span>
          </h2>
          <p style={{ fontSize: 16, color: G.slateLight, maxWidth: 500, margin: "0 auto" }}>
            Every screen is built around one goal: helping you earn more with less friction.
          </p>
        </div>

        {/* Horizontal scroll on mobile, flex centered on desktop */}
        <div style={{ overflowX: "auto", paddingBottom: 24, WebkitOverflowScrolling: "touch" as any }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "flex-end", padding: "0 clamp(16px,5vw,80px)", minWidth: "max-content" }}>
            {[
              { label: "Dashboard",    color: G.green,     screen: "dashboard" as const, offset: 24 },
              { label: "New Job",      color: "#0369a1",   screen: "job" as const,       offset: 0  },
              { label: "Wallet",       color: "#b45309",   screen: "wallet" as const,    offset: 24 },
              { label: "Navigation",   color: "#7c3aed",   screen: undefined,            offset: 0  },
              { label: "Trip History", color: "#dc2626",   screen: undefined,            offset: 24 },
            ].map(({ label, color, screen, offset }) => (
              <div key={label} style={{ transform: `translateY(${offset}px)`, transition: "transform 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.transform = `translateY(${offset - 12}px)`}
                onMouseLeave={e => e.currentTarget.style.transform = `translateY(${offset}px)`}
              >
                <PhoneMockup label={label} color={color} screen={screen} />
                <p style={{ textAlign: "center", fontSize: 11, color: G.slateLight, marginTop: 12, fontWeight: 600 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section
        ref={featRef as React.RefObject<HTMLElement>}
        id="features"
        style={{ padding: "100px clamp(16px,5vw,80px)", background: "#fff" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Features</Badge>
            <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "20px 0 12px", lineHeight: 1.15 }}>
              Everything you need.<br />Nothing you don't.
            </h2>
          </div>
          <div className="cts-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title} style={{
                background: G.bg, borderRadius: 16, padding: "22px 18px",
                border: `1px solid ${G.border}`,
                opacity: featVisible ? 1 : 0,
                transform: featVisible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s`,
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = G.greenDim; e.currentTarget.style.borderColor = "#86efac"; }}
                onMouseLeave={e => { e.currentTarget.style.background = G.bg; e.currentTarget.style.borderColor = G.border; }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.dark, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: G.slate, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px clamp(16px,5vw,80px)", background: `linear-gradient(135deg, ${G.green} 0%, ${G.greenDark} 100%)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="cts-benefits-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
            <RevealDiv>
              <Badge dark>Driver Benefits</Badge>
              <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "20px 0 16px", lineHeight: 1.15 }}>
                This isn't just an app.<br />It's your career.
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", lineHeight: 1.75, marginBottom: 32 }}>
                Every certified PCRAA driver on CTS builds a real professional identity — with verifiable income, a tracked reputation, and access to an expanding service ecosystem.
              </p>
              <a href="#download" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fff", color: G.greenDark,
                padding: "12px 24px", borderRadius: 10, textDecoration: "none",
                fontSize: 14, fontWeight: 700, transition: "transform 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >Download the App →</a>
            </RevealDiv>
            <RevealDiv delay={0.15}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BENEFITS.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 11, color: "#fff", fontWeight: 800, marginTop: 1,
                    }}>✓</div>
                    <span style={{ fontSize: 15, color: "rgba(255,255,255,0.92)", fontWeight: 500, lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </RevealDiv>
          </div>
        </div>
      </section>

      {/* ── EARNINGS DASHBOARD ───────────────────────────────────────────────── */}
      <section
        ref={earnRef as React.RefObject<HTMLElement>}
        id="earnings"
        style={{ padding: "100px clamp(16px,5vw,80px)", background: G.bg }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Earnings Dashboard</Badge>
            <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "20px 0 12px", lineHeight: 1.15 }}>
              Know exactly what<br />you're earning.
            </h2>
            <p style={{ fontSize: 16, color: G.slate, maxWidth: 500, margin: "0 auto" }}>
              Your in-app analytics dashboard gives you a clear picture of your income, performance, and growth.
            </p>
          </div>

          <div style={{
            background: "#fff", borderRadius: 24, padding: "clamp(20px,4vw,36px)",
            border: `1px solid ${G.border}`,
            boxShadow: "0 8px 48px rgba(0,0,0,0.06)",
            opacity: earnVisible ? 1 : 0,
            transform: earnVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {/* Header */}
            <div className="cts-earn-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, color: G.slateLight, fontWeight: 500 }}>This Week</div>
                <div style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: G.dark, letterSpacing: "-0.03em", lineHeight: 1.1 }}>₵1,840.00</div>
                <div style={{ fontSize: 12, color: G.green, fontWeight: 700, marginTop: 4 }}>↑ +12% vs last week</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["W", "M", "Y"].map(p => (
                  <button key={p} onClick={() => setActivePeriod(p)} style={{
                    padding: "8px 16px", borderRadius: 8,
                    border: `1px solid ${activePeriod === p ? G.green : G.border}`,
                    background: activePeriod === p ? G.green : "#fff",
                    color: activePeriod === p ? "#fff" : G.slate,
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.2s",
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div className="cts-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              {MOCK_STATS.map(({ label, value, change, up }) => (
                <div key={label} style={{ background: G.bg, borderRadius: 14, padding: "clamp(12px,2vw,20px)" }}>
                  <div style={{ fontSize: 11, color: G.slateLight, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 900, color: G.dark, letterSpacing: "-0.02em" }}>{value}</div>
                  <div style={{ fontSize: 11, color: up ? G.green : "#ef4444", fontWeight: 700, marginTop: 4 }}>
                    {up ? "↑" : "↓"} {change}
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div>
              <div style={{ fontSize: 12, color: G.slateLight, fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Daily Earnings (₵)</div>
              <div style={{ display: "flex", gap: "clamp(6px,1.5vw,14px)", alignItems: "flex-end", height: 100 }}>
                {EARNINGS_BARS.map(({ day, val }) => (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: "100%", height: `${val}%`,
                      background: day === "Sat" ? `linear-gradient(to top, ${G.green}, ${G.greenLight})` : `${G.green}28`,
                      borderRadius: "5px 5px 0 0",
                      transition: "height 0.8s cubic-bezier(0.16,1,0.3,1)",
                      position: "relative",
                    }}>
                      {day === "Sat" && (
                        <div style={{
                          position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                          fontSize: 10, fontWeight: 700, color: G.green, whiteSpace: "nowrap",
                        }}>Best</div>
                      )}
                    </div>
                    <div style={{ fontSize: "clamp(9px,1.2vw,11px)", color: G.slateLight, fontWeight: 600 }}>{day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px clamp(16px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Testimonials</Badge>
            <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "20px 0 0", lineHeight: 1.15 }}>
              Drivers who chose<br />the professional path.
            </h2>
          </div>
          <div className="cts-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {TESTIMONIALS.map(({ name, role, rating, avatar, color, quote }, i) => (
              <RevealDiv key={name} delay={i * 0.1}>
                <div style={{
                  background: G.bg, borderRadius: 20, padding: 28,
                  border: `1px solid ${G.border}`, height: "100%",
                  display: "flex", flexDirection: "column",
                  transition: "box-shadow 0.25s, transform 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 48px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <Stars n={rating} />
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.75, margin: "16px 0 24px", fontStyle: "italic", flex: 1 }}>
                    "{quote}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, flexShrink: 0,
                    }}>{avatar}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: G.dark }}>{name}</div>
                      <div style={{ fontSize: 11, color: G.slateLight, marginTop: 2 }}>{role}</div>
                    </div>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "100px clamp(16px,5vw,80px)", background: G.bg }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>FAQ</Badge>
            <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "20px 0 0", lineHeight: 1.15 }}>
              Common questions,<br />honest answers.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map(({ q, a }, i) => (
              <RevealDiv key={i} delay={i * 0.05}>
                <div style={{
                  background: "#fff", borderRadius: 16,
                  border: `1px solid ${openFaq === i ? "#86efac" : G.border}`,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "20px 24px",
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                    }}
                    aria-expanded={openFaq === i}
                  >
                    <span style={{ fontSize: "clamp(14px,1.6vw,16px)", fontWeight: 600, color: G.dark, lineHeight: 1.4 }}>{q}</span>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: openFaq === i ? G.green : G.bg,
                      color: openFaq === i ? "#fff" : G.slate,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, flexShrink: 0,
                      transform: openFaq === i ? "rotate(45deg)" : "rotate(0)",
                      transition: "all 0.25s",
                    }}>+</span>
                  </button>
                  <div style={{
                    maxHeight: openFaq === i ? 300 : 0,
                    overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
                  }}>
                    <p style={{ padding: "0 24px 20px", fontSize: 14, color: G.slate, lineHeight: 1.75, margin: 0 }}>{a}</p>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD CTA ────────────────────────────────────────────────────── */}
      <section id="download" style={{
        padding: "clamp(80px,12vw,140px) clamp(16px,5vw,80px)",
        background: G.dark, textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, ${G.green}12 0%, transparent 65%)`, pointerEvents: "none" }} />
        <RevealDiv style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <Badge dark>Download Now</Badge>
          <h2 style={{
            fontSize: "clamp(32px,6vw,68px)", fontWeight: 900, color: "#fff",
            letterSpacing: "-0.03em", margin: "20px 0 16px", lineHeight: 1.06,
          }}>
            Your certification<br />is your{" "}
            <span style={{ color: G.greenGlow }}>starting line.</span>
          </h2>
          <p style={{ fontSize: "clamp(15px,1.8vw,18px)", color: G.slateLight, lineHeight: 1.75, maxWidth: 520, margin: "0 auto 48px" }}>
            Thousands of certified PCRAA riders are already earning with CTS Driver. Join the platform that takes your profession seriously.
          </p>

          <div className="cts-cta-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              background: G.green, color: "#fff",
              padding: "16px 32px", borderRadius: 14, textDecoration: "none",
              fontWeight: 700, fontSize: 15,
              boxShadow: `0 12px 40px ${G.green}66`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 20px 48px ${G.green}88`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 12px 40px ${G.green}66`; }}
            >
              <span style={{ fontSize: 24 }}>▶</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, opacity: 0.8, lineHeight: 1, marginBottom: 2 }}>Get it on</div>
                <div style={{ fontSize: 16 }}>Google Play</div>
              </div>
            </a>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              background: G.dark2, color: G.slateLight,
              padding: "16px 32px", borderRadius: 14,
              fontWeight: 700, fontSize: 15, border: `1px solid ${G.dark3}`,
            }}>
              <span style={{ fontSize: 24 }}>🍎</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, lineHeight: 1, marginBottom: 2 }}>Coming soon</div>
                <div style={{ fontSize: 16 }}>App Store</div>
              </div>
            </div>
          </div>

          {/* Fake QR */}
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 88, height: 88, background: "#fff", borderRadius: 12, padding: 7, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {Array.from({ length: 49 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 1.5, background: [0,1,2,3,4,5,6,7,13,14,20,21,22,23,24,25,26,27,35,36,42,43,44,45,46,47,48,10,17,31,38].includes(i) ? G.dark : "#e2e8f0" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: G.slateLight, fontWeight: 500 }}>Scan to download</span>
          </div>
        </RevealDiv>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#020617", padding: "60px clamp(16px,5vw,80px) 32px", borderTop: "1px solid #0f172a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="cts-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Image src="/logo/app_icon.png" alt="CTS Driver App" width={40} height={40} style={{ objectFit: "contain", background: "#fff", borderRadius: "50%", padding: 3 }} />
                <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>CTS Driver</span>
              </div>
              <p style={{ fontSize: 14, color: G.slate, lineHeight: 1.7, maxWidth: 240, marginBottom: 20 }}>
                The official working platform for certified PCRAA riders in Ghana.
              </p>
              <div style={{ fontSize: 12, color: G.dark3, fontWeight: 500 }}>
                In partnership with PCRAA Ghana
              </div>
            </div>
            {[
              { title: "Platform", links: ["Ride Hailing", "Parcel Delivery", "Gas Delivery", "Driver Wallet"] },
              { title: "Company",  links: ["About CTS Africa", "PCRAA Partnership", "Careers", "Press"] },
              { title: "Legal",    links: ["Privacy Policy", "Terms of Service", "Driver Agreement", "Support"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>{title}</div>
                {links.map(l => (
                  <div key={l} style={{ marginBottom: 10 }}>
                    <a href="#" style={{ fontSize: 14, color: G.slate, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = G.slateLight}
                      onMouseLeave={e => e.currentTarget.style.color = G.slate}
                    >{l}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${G.dark2}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#475569" }}>
              © 2025 CTS Africa. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["Privacy", "Terms", "Contact", "Support"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = G.slateLight}
                  onMouseLeave={e => e.currentTarget.style.color = "#475569"}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Styles ──────────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        html { scroll-behavior: smooth; }

        /* Scrollbar for app screens */
        section#app-screens > div > div::-webkit-scrollbar { height: 4px; }
        section#app-screens > div > div::-webkit-scrollbar-track { background: transparent; }
        section#app-screens > div > div::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

        /* ── Tablet ─────────────────────────────────────── */
        @media (max-width: 1024px) {
          .cts-grid-4    { grid-template-columns: repeat(2, 1fr) !important; }
          .cts-features-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .cts-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cts-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .cts-benefits-grid { gap: 48px !important; }
        }

        /* ── Mobile ─────────────────────────────────────── */
        @media (max-width: 768px) {
          /* Nav */
          .cts-nav-links  { display: none !important; }
          .cts-hamburger  { display: flex !important; }

          /* Hero */
          .cts-hero-grid  { grid-template-columns: 1fr !important; gap: 0 !important; }
          .cts-hero-phones { display: none !important; }
          .cts-stats-row  { gap: 20px !important; }

          /* Grids */
          .cts-grid-3     { grid-template-columns: 1fr !important; }
          .cts-grid-4     { grid-template-columns: 1fr !important; }
          .cts-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cts-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cts-benefits-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cts-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }

          /* Steps — show vertical, hide horizontal */
          .cts-steps-desktop { display: none !important; }
          .cts-steps-mobile  { display: flex !important; }

          /* Earnings */
          .cts-earn-header { flex-direction: column !important; align-items: flex-start !important; }

          /* CTA buttons */
          .cts-cta-buttons { flex-direction: column !important; align-items: center !important; }
          .cts-cta-buttons a,
          .cts-cta-buttons div { width: 100% !important; max-width: 320px; justify-content: center !important; }
        }

        /* ── Small mobile ───────────────────────────────── */
        @media (max-width: 480px) {
          .cts-features-grid { grid-template-columns: 1fr !important; }
          .cts-stats-grid    { grid-template-columns: 1fr 1fr !important; }
          .cts-footer-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}