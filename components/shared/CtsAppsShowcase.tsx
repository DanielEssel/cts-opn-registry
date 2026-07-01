"use client";


import { useState, useEffect, useRef } from "react";
import Image from "next/image";
const GREEN = "#15803d";
const GREEN_LIGHT = "#16a34a";
const GREEN_DIM = "#dcfce7";
const GREEN_DARK = "#14532d";

const NAV_LINKS = ["Services", "How It Works", "Earnings", "FAQ", "Download"];

const SERVICES = [
  {
    icon: "🛵",
    title: "Ride Hailing",
    tagline: "Move people, earn consistently",
    desc: "Accept passenger trips across the city. Set your own hours, build a loyal rider base, and earn competitive per-kilometre rates.",
    stat: "Up to ₵2,400/week",
    color: "#15803d",
    bg: "#f0fdf4",
  },
  {
    icon: "📦",
    title: "Parcel Delivery",
    tagline: "Deliver fast, earn more",
    desc: "Partner with local businesses and e-commerce platforms to move parcels, documents, and goods with speed and accountability.",
    stat: "Up to ₵1,800/week",
    color: "#0369a1",
    bg: "#f0f9ff",
  },
  {
    icon: "🔥",
    title: "Gas Delivery",
    tagline: "High demand, premium pay",
    desc: "Collect, refill, and deliver cooking gas cylinders to homes and businesses. One of the highest-earning services on the platform.",
    stat: "Up to ₵2,100/week",
    color: "#b45309",
    bg: "#fffbeb",
  },
];

const STEPS = [
  { num: "01", label: "Receive Job", desc: "An instant notification arrives with the job details, pick-up location, and estimated earnings." },
  { num: "02", label: "Accept", desc: "Review the request and accept within 15 seconds. Your acceptance rate builds your Driver Score." },
  { num: "03", label: "Navigate", desc: "Built-in GPS navigation guides you to the pick-up and drop-off with real-time traffic updates." },
  { num: "04", label: "Complete", desc: "Mark the job complete and collect a digital proof of delivery or passenger confirmation." },
  { num: "05", label: "Get Paid", desc: "Earnings hit your CTS Wallet instantly. Withdraw anytime to Mobile Money or bank." },
];

const FEATURES = [
  { icon: "🧭", title: "Smart Navigation", desc: "Real-time GPS with offline map caching for low-signal areas." },
  { icon: "🔔", title: "Instant Alerts", desc: "Push notifications ensure you never miss a job opportunity." },
  { icon: "💳", title: "CTS Wallet", desc: "Instant payouts. Withdraw to MoMo or bank in seconds." },
  { icon: "📊", title: "Performance Analytics", desc: "Track your earnings, trips, and Driver Score week over week." },
  { icon: "🔐", title: "QR Identity", desc: "Your certified PCRAA identity is embedded in your driver QR badge." },
  { icon: "⭐", title: "Ratings", desc: "Build a strong reputation that unlocks premium job categories." },
  { icon: "📋", title: "Trip History", desc: "Full audit log of every job — income proof for loans, banking." },
  { icon: "📡", title: "Offline Mode", desc: "Core functions work without internet. Sync when reconnected." },
  { icon: "🆘", title: "Emergency SOS", desc: "One-tap emergency alert with live location to CTS dispatch." },
  { icon: "🪪", title: "Driver Profile", desc: "Your professional identity: photo, plate, rating, certifications." },
];

const TESTIMONIALS = [
  {
    name: "Kwame Asante",
    role: "Certified PCRAA Rider · Accra",
    rating: 5,
    avatar: "KA",
    color: "#15803d",
    quote: "Before CTS Driver App I was doing single-route deliveries for one shop. Now I'm doing rides in the morning, parcels in the afternoon, and gas deliveries on weekends. My income tripled in four months.",
  },
  {
    name: "Abena Mensah",
    role: "Certified PCRAA Rider · Kumasi",
    rating: 5,
    avatar: "AM",
    color: "#0369a1",
    quote: "The wallet is what convinced me. Every job, the money is there immediately. No waiting, no chasing. I withdrew ₵800 on a Saturday afternoon straight to my MoMo. That's what financial freedom feels like.",
  },
  {
    name: "Emmanuel Tetteh",
    role: "Certified PCRAA Rider · Tema",
    rating: 5,
    avatar: "ET",
    color: "#b45309",
    quote: "Gas delivery is underrated. People think it's simple work but the earnings are serious. I complete 12–15 orders on a busy day and the tips from regulars add up. CTS Driver App made me a professional.",
  },
];

const FAQS = [
  {
    q: "Who can use the CTS Driver App App?",
    a: "The CTS Driver App App is exclusively available to riders who have completed PCRAA training and received their professional certification. Certification ensures that every driver on the platform meets the safety, conduct, and service standards that customers expect.",
  },
  {
    q: "Is PCRAA certification required?",
    a: "Yes. PCRAA certification is mandatory. It is not just a formality — it is your professional credential. Certification includes road safety training, customer service standards, and service-specific protocols for rides, deliveries, and gas handling.",
  },
  {
    q: "How do I receive payments?",
    a: "All earnings are credited to your CTS Wallet in real time after each completed job. You can withdraw to any Mobile Money account (MTN, Vodafone, AirtelTigo) or a registered bank account at any time, with no minimum withdrawal threshold.",
  },
  {
    q: "Can I switch between ride-hailing, delivery, and gas services?",
    a: "Absolutely. Your account gives you access to all three service categories simultaneously. You can accept a ride job, complete a parcel delivery, and take a gas order all in the same day — from a single app, a single wallet, a single professional identity.",
  },
  {
    q: "How does gas cylinder delivery work?",
    a: "Gas delivery partners collect empty cylinders from customers, transport them to certified refill stations, and deliver the refilled cylinders back. The CTS Driver App App handles the job assignment, navigation, and handover confirmation automatically.",
  },
  {
    q: "What happens if I have a problem during a job?",
    a: "The in-app Emergency SOS button connects you to CTS dispatch immediately with your live location. For non-emergency issues, in-app chat support is available 24/7. Critical incidents are escalated within 90 seconds.",
  },
];

const MOCK_STATS = [
  { label: "Weekly Earnings", value: "₵1,840", change: "+12%", up: true },
  { label: "Trips Completed", value: "47", change: "+8", up: true },
  { label: "Deliveries", value: "23", change: "+5", up: true },
  { label: "Driver Score", value: "4.92", change: "+0.04", up: true },
];

const EARNINGS_BARS = [
  { day: "Mon", val: 60 },
  { day: "Tue", val: 80 },
  { day: "Wed", val: 55 },
  { day: "Thu", val: 90 },
  { day: "Fri", val: 75 },
  { day: "Sat", val: 100 },
  { day: "Sun", val: 65 },
];

function useInView(threshold = 0.15): [React.RefObject<HTMLElement | null>, boolean] {
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

function Stars({ n = 5 }) {
  return (
    <span style={{ color: "#eab308", fontSize: 14, letterSpacing: 1 }}>
      {"★".repeat(n)}
    </span>
  );
}

function GreenBadge({ children="" }) {
  return (
    <span style={{
      display: "inline-block",
      background: GREEN_DIM,
      color: GREEN_DARK,
      fontWeight: 600,
      fontSize: 12,
      padding: "4px 14px",
      borderRadius: 999,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    }}>{children}</span>
  );
}

function SectionLabel({ children="" }) {
  return (
    <div style={{ marginBottom: 16, textAlign: "center" }}>
      <GreenBadge>{children}</GreenBadge>
    </div>
  );
}

function Heading({ children=null as any, style = {} }) {
  return (
    <h2 style={{
      fontSize: "clamp(28px, 4vw, 48px)",
      fontWeight: 800,
      color: "#0f172a",
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      margin: 0,
      ...style,
    }}>{children}</h2>
  );
}

function Sub({ children="", style = {} }) {
  return (
    <p style={{
      fontSize: "clamp(15px, 2vw, 18px)",
      color: "#64748b",
      lineHeight: 1.7,
      margin: 0,
      ...style,
    }}>{children}</p>
  );
}

function PhoneMockup({ label="", color = GREEN, children=null }) {
  return (
    <div style={{
      width: 200,
      background: "#0f172a",
      borderRadius: 32,
      padding: "10px 8px",
      boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
      flexShrink: 0,
      border: "2px solid #1e293b",
    }}>
      <div style={{ background: "#1e293b", borderRadius: 24, overflow: "hidden", minHeight: 360 }}>
        <div style={{ height: 20, background: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 60, height: 6, background: "#334155", borderRadius: 3 }} />
        </div>
        <div style={{ padding: 12, minHeight: 340 }}>
          {children || (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: color, borderRadius: 12, padding: "12px 10px", color: "#fff" }}>
                <div style={{ fontSize: 10, opacity: 0.8 }}>CTS Driver App</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{label}</div>
              </div>
              {[40, 60, 50, 80, 35].map((w, i) => (
                <div key={i} style={{ height: 10, background: "#334155", borderRadius: 5, width: `${w}%` }} />
              ))}
              <div style={{ height: 80, background: "#334155", borderRadius: 10, marginTop: 8 }} />
              {[70, 45].map((w, i) => (
                <div key={i} style={{ height: 10, background: "#334155", borderRadius: 5, width: `${w}%` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CTSDriverLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroRef, heroVisible] = useInView(0.05);
  const [featRef, featVisible] = useInView(0.1);
  const [earnRef, earnVisible] = useInView(0.1);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#fff", color: "#0f172a", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #f1f5f9",
        padding: "0 clamp(20px,5vw,80px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="w-10 h-10 transition-transform group-hover:scale-105">
                        <Image
                          src="/logo/app_icon.png"
                          alt="PCRAA"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", letterSpacing: "-0.02em" }}>CTS Driver App</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV_LINKS.slice(0, 4).map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`}
              style={{ fontSize: 14, color: "#64748b", textDecoration: "none", fontWeight: 500, display: "none" }}
              className="nav-link"
            >{l}</a>
          ))}
          <a href="#download" style={{
            background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600,
            padding: "8px 20px", borderRadius: 8, textDecoration: "none",
            transition: "background 0.2s",
          }}>Download App</a>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} id="hero" style={{
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(160deg, #f8fafc 0%, #f0fdf4 40%, #f8fafc 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px clamp(20px,5vw,80px) 60px",
        position: "relative", overflow: "hidden",
      }}>
        {/* BG decoration */}
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,128,61,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,128,61,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          {/* Left */}
          <div style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 68px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: "20px 0",
              color: "#0f172a",
            }}>
              One App.<br />
              <span style={{ color: GREEN }}>Three Ways</span><br />
              to Earn.
            </h1>
            <p style={{
              fontSize: "clamp(15px, 1.8vw, 19px)",
              color: "#64748b",
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 480,
            }}>
              Certified PCRAA riders can accept ride-hailing jobs, parcel deliveries, and gas cylinder orders — all from a single professional platform. Start earning the day you complete training.
            </p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32, marginBottom: 44 }}>
              {[["2,400+", "Active Drivers"], ["₵4.2M+", "Paid Out Monthly"], ["4.91", "Avg Rating"]].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{val}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="https://play.google.com/store" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#0f172a", color: "#fff",
                padding: "14px 24px", borderRadius: 12, textDecoration: "none",
                fontWeight: 600, fontSize: 14,
                boxShadow: "0 4px 24px rgba(15,23,42,0.25)",
                transition: "transform 0.2s",
              }}>
                <span style={{ fontSize: 20 }}>▶</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>Download on</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Google Play</div>
                </div>
              </a>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#f8fafc", color: "#94a3b8",
                padding: "14px 24px", borderRadius: 12,
                fontWeight: 600, fontSize: 14, border: "1.5px solid #e2e8f0",
              }}>
                <span style={{ fontSize: 20 }}>🍎</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>Coming soon</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>App Store</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — phone mockups */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 20, position: "relative",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(40px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          }}>
            <div style={{ transform: "rotate(-6deg) translateY(30px)" }}>
              <PhoneMockup label="New Request" color="#0369a1" />
            </div>
            <div style={{ zIndex: 2, transform: "scale(1.08)" }}>
              <PhoneMockup label="Dashboard" color={GREEN} />
            </div>
            <div style={{ transform: "rotate(6deg) translateY(30px)" }}>
              <PhoneMockup label="My Wallet" color="#b45309" />
            </div>
          </div>
        </div>
      </section>

      {/* WHY CTS */}
      <section style={{ padding: "100px clamp(20px,5vw,80px)", background: "#0f172a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <GreenBadge>The Platform</GreenBadge>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800,
            color: "#fff", letterSpacing: "-0.03em", margin: "20px 0 16px", lineHeight: 1.1,
          }}>
            Built for certified professionals.<br />
            <span style={{ color: "#4ade80" }}>Designed to pay you more.</span>
          </h2>
          <p style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 64px" }}>
            CTS Driver App is not a gig app. It is the official working platform for riders who have invested in their professional certification through PCRAA. You earned the credential — now put it to work.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { step: "01", title: "Complete PCRAA Training", desc: "Attend certified rider training. Learn road safety, service standards, and platform protocols." },
              { step: "02", title: "Receive Certification", desc: "Pass the assessment. Receive your PCRAA certification and driver QR identity badge." },
              { step: "03", title: "Download CTS Driver App App", desc: "Install the app, verify your PCRAA credentials, and activate your professional account." },
              { step: "04", title: "Start Earning", desc: "Accept your first job within minutes. Rides, deliveries, gas — your choice, your schedule." },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{
                background: "#1e293b", borderRadius: 20, padding: 28, textAlign: "left",
                border: "1px solid #334155", transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: GREEN_LIGHT, letterSpacing: 1, marginBottom: 16 }}>{step}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "100px clamp(20px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>Three Ways to Earn</SectionLabel>
            <Heading>Pick your service.<br />Or run all three.</Heading>
            <Sub style={{ marginTop: 16, maxWidth: 560, margin: "16px auto 0" }}>
              Every certified CTS Driver App has access to all three income streams from day one. Switch between them freely throughout your day.
            </Sub>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {SERVICES.map(({ icon, title, tagline, desc, stat, color, bg }) => (
              <div key={title} style={{
                background: bg, borderRadius: 24, padding: 32,
                border: `1.5px solid ${color}22`,
                transition: "transform 0.25s, box-shadow 0.25s",
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 40, marginBottom: 20 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.01em" }}>{title}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>{tagline}</div>
                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.6, marginBottom: 24 }}>{desc}</p>
                <div style={{
                  display: "inline-block", background: color, color: "#fff",
                  padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                }}>{stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: "100px clamp(20px,5vw,80px)", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel>How It Works</SectionLabel>
            <Heading>From notification <br /> to payment in minutes.</Heading>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 0, position: "relative" }}>
            {STEPS.map(({ num, label, desc }, i) => (
              <div key={num} style={{ position: "relative", padding: "0 16px 0", textAlign: "center" }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: 28, left: "calc(50% + 24px)", right: "-calc(50% - 24px)",
                    height: 2, background: `linear-gradient(to right, ${GREEN}, ${GREEN}44)`,
                    width: "calc(100% - 48px)",
                  }} />
                )}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: GREEN, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, margin: "0 auto 20px",
                  boxShadow: `0 8px 24px ${GREEN}44`,
                  position: "relative", zIndex: 1,
                }}>{num}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{label}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APP SCREENS */}
      <section id="app-screens" style={{ padding: "100px clamp(20px,5vw,80px)", background: "#0f172a", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <GreenBadge>The App</GreenBadge>
            <h2 style={{
              fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: "#fff",
              letterSpacing: "-0.03em", margin: "20px 0 16px", lineHeight: 1.1,
            }}>Designed for drivers<br /><span style={{ color: "#4ade80" }}>who mean business.</span></h2>
            <p style={{ fontSize: 17, color: "#94a3b8", maxWidth: 540, margin: "0 auto" }}>
              Every screen is built around one goal: helping you earn more with less friction.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[
              { label: "Dashboard", color: GREEN, offset: 20 },
              { label: "New Job", color: "#0369a1", offset: 0 },
              { label: "Navigation", color: "#7c3aed", offset: 20 },
              { label: "Wallet", color: "#b45309", offset: 0 },
              { label: "Trip History", color: "#dc2626", offset: 20 },
            ].map(({ label, color, offset }) => (
              <div key={label} style={{ transform: `translateY(${offset}px)`, transition: "transform 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.transform = `translateY(${offset - 10}px)`}
                onMouseLeave={e => e.currentTarget.style.transform = `translateY(${offset}px)`}
              >
                <PhoneMockup label={label} color={color} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featRef} id="features" style={{ padding: "100px clamp(20px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel>Features</SectionLabel>
            <Heading>Everything you need.<br />Nothing you don't.</Heading>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title} style={{
                background: "#f8fafc", borderRadius: 16, padding: 24,
                border: "1px solid #f1f5f9",
                opacity: featVisible ? 1 : 0,
                transform: featVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ padding: "100px clamp(20px,5vw,80px)", background: `linear-gradient(135deg, ${GREEN} 0%, #14532d 100%)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <GreenBadge>Driver Benefits</GreenBadge>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "20px 0 16px", lineHeight: 1.15 }}>
              This isn't just an app.<br />It's your career.
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
              Every certified PCRAA driver on CTS Driver App is building a real professional identity — with verifiable income, a tracked reputation, and access to an expanding service ecosystem.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Work whenever you want — full flexibility",
              "Earn from three services simultaneously",
              "One professional account, verified identity",
              "Transparent earnings with zero hidden fees",
              "Instant payouts to MoMo or bank",
              "Government-backed, PCRAA-certified ecosystem",
              "24/7 driver support and emergency SOS",
            ].map(b => (
              <div key={b} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 12, color: "#fff", fontWeight: 700,
                }}>✓</div>
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EARNINGS DASHBOARD */}
      <section ref={earnRef} id="earnings" style={{ padding: "100px clamp(20px,5vw,80px)", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>Earnings Dashboard</SectionLabel>
            <Heading>Know exactly what<br />you're earning.</Heading>
            <Sub style={{ marginTop: 16, maxWidth: 500, margin: "16px auto 0" }}>
              Your in-app analytics dashboard gives you a clear picture of your income, performance, and growth week over week.
            </Sub>
          </div>

          <div style={{
            background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0",
            boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
            opacity: earnVisible ? 1 : 0,
            transform: earnVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>This Week</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>₵1,840.00</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["W", "M", "Y"].map(p => (
                  <button key={p} style={{
                    padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: p === "W" ? GREEN : "#fff", color: p === "W" ? "#fff" : "#64748b",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
              {MOCK_STATS.map(({ label, value, change, up }) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>{value}</div>
                  <div style={{ fontSize: 12, color: up ? GREEN : "#ef4444", fontWeight: 600, marginTop: 4 }}>
                    {up ? "↑" : "↓"} {change} vs last week
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, marginBottom: 16 }}>Daily Earnings (₵)</div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 120 }}>
                {EARNINGS_BARS.map(({ day, val }) => (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: "100%", height: `${val}%`,
                      background: day === "Sat" ? GREEN : `${GREEN}33`,
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.5s",
                    }} />
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "100px clamp(20px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>Testimonials</SectionLabel>
            <Heading>Drivers who chose<br />the professional path.</Heading>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map(({ name, role, rating, avatar, color, quote }) => (
              <div key={name} style={{
                background: "#f8fafc", borderRadius: 20, padding: 28, border: "1px solid #f1f5f9",
                transition: "box-shadow 0.25s",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <Stars n={rating} />
                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "16px 0 24px", fontStyle: "italic" }}>
                  "{quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>{avatar}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "100px clamp(20px,5vw,80px)", background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>FAQ</SectionLabel>
            <Heading>Common questions,<br />honest answers.</Heading>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                overflow: "hidden", transition: "box-shadow 0.2s",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", textAlign: "left", padding: "22px 24px",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{q}</span>
                  <span style={{
                    fontSize: 20, color: GREEN, fontWeight: 700, flexShrink: 0,
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                    display: "inline-block",
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 22px" }}>
                    <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: 0 }}>{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" style={{
        padding: "120px clamp(20px,5vw,80px)",
        background: "#0f172a",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,128,61,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <GreenBadge>Download Now</GreenBadge>
          <h2 style={{
            fontSize: "clamp(32px,5vw,64px)", fontWeight: 800, color: "#fff",
            letterSpacing: "-0.03em", margin: "20px 0 16px", lineHeight: 1.08,
          }}>
            Your certification<br />is your<br />
            <span style={{ color: "#4ade80" }}>starting line.</span>
          </h2>
          <p style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.7, marginBottom: 48, maxWidth: 520, margin: "0 auto 48px" }}>
            Thousands of certified PCRAA riders are already earning with CTS Driver App. Join the platform that takes your profession seriously.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            <a href="https://play.google.com/store" style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              background: GREEN, color: "#fff",
              padding: "16px 32px", borderRadius: 14, textDecoration: "none",
              fontWeight: 700, fontSize: 15,
              boxShadow: `0 8px 40px ${GREEN}66`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 16px 48px ${GREEN}88`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 40px ${GREEN}66`; }}
            >
              <span style={{ fontSize: 22 }}>▶</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1 }}>Get it on</div>
                <div>Google Play</div>
              </div>
            </a>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              background: "#1e293b", color: "#64748b",
              padding: "16px 32px", borderRadius: 14,
              fontWeight: 700, fontSize: 15, border: "1px solid #334155",
            }}>
              <span style={{ fontSize: 22 }}>🍎</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, lineHeight: 1 }}>Coming soon</div>
                <div>App Store</div>
              </div>
            </div>
          </div>
          {/* QR */}
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 100, height: 100, background: "#fff", borderRadius: 12, padding: 8,
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3,
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: 3,
                  background: [0, 2, 4, 6, 8, 3, 5].includes(i) ? "#0f172a" : "#f1f5f9",
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Scan to download</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: "#020617", padding: "48px clamp(20px,5vw,80px) 32px",
        borderTop: "1px solid #0f172a",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div className="w-10 h-10 transition-transform group-hover:scale-105">
                        <Image
                          src="/logo/app_icon.png"
                          alt="PCRAA"
                          width={60}
                          height={60}
                          className="object-contain bg-white rounded-full p-1"
                        />
                      </div>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>CTS Driver App</span>
              </div>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, maxWidth: 260 }}>
                The official working platform for certified PCRAA riders in Ghana. One app. Multiple opportunities.
              </p>
            </div>
            {[
              { title: "Platform", links: ["Ride Hailing", "Parcel Delivery", "Gas Delivery", "Driver Wallet"] },
              { title: "Company", links: ["About CTS Africa", "PCRAA Partnership", "Press", "Careers"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Driver Agreement", "Support"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: 0.5 }}>{title}</div>
                {links.map(l => (
                  <div key={l} style={{ marginBottom: 10 }}>
                    <a href="#" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
                      onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
                    >{l}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#475569" }}>
              © 2025 CTS Africa. All rights reserved. In partnership with PCRAA Ghana.
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy", "Terms", "Contact", "Support"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media (min-width: 768px) { .nav-link { display: inline !important; } }
        @media (max-width: 900px) {
          #hero > div > div { grid-template-columns: 1fr !important; }
          section[style*="grid-template-columns: 1fr 1fr"] > div { grid-template-columns: 1fr !important; }
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}