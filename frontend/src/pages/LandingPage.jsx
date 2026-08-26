import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/PublicNavbar';
import '../styles/landing.css';
import {
  MapPin, CalendarCheck, ShieldCheck, Zap, ArrowRight,
  Sparkles, Monitor, BarChart3, Sliders, ChevronRight,
  Lock, FileCheck, Radio, Users, Target, Sun, Moon
} from 'lucide-react';

/* =========================================================================
   THREE.JS 3D SCENE (DYNAMIC LIGHT & DARK THEME)
   ========================================================================= */

/** Floating wireframe torus */
function FloatingTorus({ position, color, opacity = 0.35, speed = 1 }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.15 * speed;
    meshRef.current.rotation.y += delta * 0.25 * speed;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[1.1, 0.38, 16, 48]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

/** Floating wireframe icosahedron */
function FloatingIcosahedron({ position, color, opacity = 0.3, speed = 1 }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.2 * speed;
    meshRef.current.rotation.z += delta * 0.12 * speed;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[0.95, 1]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

/** Floating wireframe octahedron */
function FloatingOctahedron({ position, color, opacity = 0.28, speed = 1 }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.3 * speed;
    meshRef.current.rotation.z += delta * 0.1 * speed;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.75, 0]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

/** Animated particle ring — a circle of small spheres orbiting */
function ParticleRing({ radius = 3, count = 60, color = '#3b82f6', speed = 0.3, emissiveIntensity = 2 }) {
  const groupRef = useRef();
  const particles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pts.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 0.4,
        z: Math.sin(angle) * radius,
        scale: 0.025 + Math.random() * 0.035,
      });
    }
    return pts;
  }, [radius, count]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.scale, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
        </mesh>
      ))}
    </group>
  );
}

/** Main 3D Canvas Scene */
function HeroScene({ isDark }) {
  const color1 = isDark ? '#3b82f6' : '#2563eb';
  const color2 = isDark ? '#38bdf8' : '#0284c7';
  const color3 = isDark ? '#a855f7' : '#7c3aed';

  return (
    <>
      <ambientLight intensity={isDark ? 0.6 : 0.9} />
      <directionalLight position={[5, 8, 5]} intensity={isDark ? 1.2 : 1.6} />
      <pointLight position={[-4, -3, -2]} color={color1} intensity={2} />
      <pointLight position={[4, 3, 2]} color={color3} intensity={1.5} />

      {isDark && (
        <Stars radius={40} depth={30} count={350} factor={3} saturation={0.5} fade speed={1} />
      )}

      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
        <FloatingTorus position={[-2.8, 0.8, -1.2]} color={color1} opacity={isDark ? 0.4 : 0.25} speed={0.9} />
      </Float>

      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.5}>
        <FloatingIcosahedron position={[3.1, -0.6, -1]} color={color2} opacity={isDark ? 0.35 : 0.22} speed={1.2} />
      </Float>

      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1}>
        <FloatingOctahedron position={[2.2, 1.6, -2]} color={color3} opacity={isDark ? 0.3 : 0.18} speed={0.8} />
      </Float>

      <ParticleRing radius={3.2} count={50} color={color1} speed={0.2} emissiveIntensity={isDark ? 2 : 1} />
      <ParticleRing radius={4.2} count={40} color={color2} speed={-0.15} emissiveIntensity={isDark ? 1.5 : 0.8} />
    </>
  );
}

/* =========================================================================
   GSAP HOOKS
   ========================================================================= */

function useGsapReveal(selector, options = {}) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    gsap.set(elements, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: options.duration || 0.7,
              delay: options.stagger
                ? Array.from(elements).indexOf(entry.target) * (options.stagger || 0.1)
                : (options.delay || 0),
              ease: options.ease || 'power3.out',
            });
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector, options.duration, options.stagger, options.delay, options.ease]);
}

/* =========================================================================
   DATA
   ========================================================================= */

const FEATURES = [
  {
    icon: Target, title: 'Smart Inventory Discovery',
    text: 'Browse curated billboards, LED walls, and transit displays with live availability calendars and conflict-free date reservations.',
  },
  {
    icon: Lock, title: 'Collision-Free Booking',
    text: 'Pessimistic row-level database locking guarantees zero double-bookings across concurrent advertiser sessions.',
  },
  {
    icon: FileCheck, title: 'Creative Verification',
    text: 'Upload artwork, banners, and video reels. Automated format validation, resolution matching, and compliance review.',
  },
  {
    icon: BarChart3, title: 'Campaign Analytics',
    text: 'Real-time dashboards tracking impressions, verified reach, engagement velocity, and CPM across all booked spaces.',
  },
  {
    icon: Radio, title: 'Live Broadcast Monitoring',
    text: 'Stream operational status from every LED node in the network. Instant alerts for uptime anomalies or schedule drift.',
  },
  {
    icon: Users, title: 'Multi-Tenant Administration',
    text: 'Role-based access for advertisers, media owners, and platform administrators with full audit logging.',
  },
];

const SPACES = [
  { title: 'Mall Road 3D Anamorphic LED', location: 'Lahore, Pakistan', type: '3D Curved Display', impressions: '450K+', rate: 'Rs. 120,000/day', tag: 'Ultra High Footfall', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
  { title: 'Shahrah-e-Faisal Unipole Network', location: 'Karachi, Pakistan', type: 'Dynamic Gantry', impressions: '720K+', rate: 'Rs. 185,000/day', tag: 'Prime Commuter Artery', gradient: 'linear-gradient(135deg, #065f46 0%, #0f172a 100%)' },
  { title: 'Blue Area Transit Totems', location: 'Islamabad, Pakistan', type: '4K Smart Kiosks', impressions: '280K+', rate: 'Rs. 85,000/day', tag: 'Financial Hub', gradient: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)' },
  { title: 'Sheikh Zayed Blvd Display', location: 'Dubai, UAE', type: 'Interactive LED Canvas', impressions: '980K+', rate: 'Rs. 340,000/day', tag: 'Global Luxury Corridor', gradient: 'linear-gradient(135deg, #831843 0%, #0f172a 100%)' },
];

const BRANDS = ['NOVA MEDIA', 'CYBERSPHERE', 'APEX GLOBAL', 'PULSE DIGITAL', 'HORIZON OOH', 'VORTEX BRANDS', 'METRO REACH', 'QUANTUM ADS'];

const STEPS = [
  { num: '01', title: 'Discover & Reserve', text: 'Browse digital LEDs, billboards, and transit networks. The real-time collision checker guarantees date availability with pessimistic database locking.' },
  { num: '02', title: 'Upload & Verify', text: 'Upload high-res artwork, video reels, and banners. Creative reviewers perform format validation, resolution matching, and regulatory compliance.' },
  { num: '03', title: 'Broadcast & Reconcile', text: 'Your ad goes live across synchronized LED networks. Track real-time broadcast logs, receive automated invoices, and manage secure digital payments.' },
];

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */

const LandingPage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const heroRef = useRef(null);

  // GSAP entrance for hero content
  useEffect(() => {
    if (!heroRef.current) return;
    const els = heroRef.current.querySelectorAll('.gsap-hero-item');
    gsap.fromTo(
      els,
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  // GSAP scroll reveals
  useGsapReveal('.landing-feature-card', { stagger: 0.08, duration: 0.6 });
  useGsapReveal('.landing-inv-card', { stagger: 0.1, duration: 0.65 });
  useGsapReveal('.landing-step', { stagger: 0.12, duration: 0.6 });

  // ROI Calculator
  const [budget, setBudget] = useState(350000);
  const [city, setCity] = useState('Lahore');
  const [days, setDays] = useState(14);
  const impressions = Math.round((budget / 100) * 85 * (days / 10));
  const footfall = Math.round(impressions * 0.42);
  const cpm = ((budget / impressions) * 1000).toFixed(2);

  // Stat counter animation
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible || !statsRef.current) return;
    const counters = statsRef.current.querySelectorAll('[data-count]');
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = el.dataset.suffix
            ? obj.val.toFixed(el.dataset.decimals || 0) + el.dataset.suffix
            : obj.val.toLocaleString(undefined, { maximumFractionDigits: 0 }) + (el.dataset.append || '');
        },
      });
    });
  }, [statsVisible]);

  return (
    <div className="landing-page">
      {/* ─── TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <PublicNavbar />

      {/* Ambient background glows */}
      <div className="landing-glow landing-glow--top" />
      <div className="landing-glow landing-glow--right" />
      <div className="landing-glow landing-glow--left" />

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Three.js canvas background */}
        <div className="landing-canvas-wrap">
          <Suspense fallback={null}>
            <Canvas
              camera={{ position: [0, 0.5, 6], fov: 55 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }}
            >
              <HeroScene isDark={isDark} />
            </Canvas>
          </Suspense>
        </div>

        <div className="landing-hero__inner" ref={heroRef}>
          <div className="landing-beacon gsap-hero-item">
            <span className="landing-beacon__dot" />
            <span>Next-Gen Programmatic Ad Network</span>
          </div>

          <h1 className="landing-hero__title gsap-hero-item">
            Command Physical &amp; Digital Billboards{' '}
            <span className="landing-gradient-text">With Programmatic Precision.</span>
          </h1>

          <p className="landing-hero__subtitle gsap-hero-item">
            Reserve high-impact 3D displays, highway unipoles, and prime urban networks
            in real-time with automated conflict checks, creative verification, and instant billing.
          </p>

          <div className="gsap-hero-item" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {user ? (
              <Link to="/dashboard" className="landing-btn-primary">
                <span>Enter Dashboard</span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="landing-btn-primary">
                  <span>Start Campaign</span>
                  <Zap size={17} />
                </Link>
                <Link to="/login" className="landing-btn-secondary">
                  <span>Sign In</span>
                  <ChevronRight size={17} />
                </Link>
              </>
            )}
            <Link to="/spaces" className="landing-btn-secondary">
              <MapPin size={17} style={{ color: 'var(--brand-primary)' }} />
              <span>Explore Inventory</span>
            </Link>
          </div>

          {/* Stat counters */}
          <div className="landing-stats gsap-hero-item" ref={statsRef}>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: 'var(--landing-text)' }} data-count="14.8" data-suffix="M+" data-decimals="1">0</p>
              <p className="landing-stat-box__label">Daily Verified Reach</p>
            </div>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: 'var(--brand-primary)' }} data-count="99.98" data-suffix="%" data-decimals="2">0</p>
              <p className="landing-stat-box__label">Screen Uptime SLA</p>
            </div>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: '#16a34a' }} data-count="0" data-suffix="ms" data-decimals="0">0</p>
              <p className="landing-stat-box__label">Collision Conflict Rate</p>
            </div>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: '#d97706' }} data-count="480" data-append="+">0</p>
              <p className="landing-stat-box__label">Premium Spaces</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BRAND TICKER ─────────────────────────────────────────────── */}
      <div className="landing-marquee">
        <div className="landing-marquee__track">
          {BRANDS.concat(BRANDS).map((b, i) => (
            <span key={i} className="landing-marquee__item">
              <Sparkles size={13} style={{ color: 'var(--brand-primary)', opacity: 0.7 }} />
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="landing-section">
        <div className="landing-section__inner" style={{ textAlign: 'center' }}>
          <span className="landing-tag">Platform Capabilities</span>
          <h2 className="landing-headline">Everything You Need to Run World-Class Campaigns</h2>
          <p className="landing-section__desc">
            From real-time inventory discovery to automated billing reconciliation,
            every workflow is engineered for zero friction.
          </p>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-card__icon">
                  <f.icon size={22} />
                </div>
                <h3 className="landing-feature-card__title">{f.title}</h3>
                <p className="landing-feature-card__text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INVENTORY SHOWCASE ───────────────────────────────────────── */}
      <section id="inventory" className="landing-section" style={{ background: 'var(--landing-grid-sec-bg)' }}>
        <div className="landing-section__inner" style={{ textAlign: 'center' }}>
          <span className="landing-tag">High-Impact Media Real Estate</span>
          <h2 className="landing-headline">Prime Spaces Engineered for Maximum Recall</h2>
          <p className="landing-section__desc">
            From landmark 3D anamorphic LED screens to high-speed arterial highway gantries,
            gain unmatched reach across premier commercial districts.
          </p>
          <div className="landing-inventory-grid">
            {SPACES.map((s, i) => (
              <div key={i} className="landing-inv-card">
                <div className="landing-inv-card__inner">
                  <div className="landing-inv-card__visual" style={{ background: s.gradient }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="landing-inv-card__badge">{s.tag}</span>
                      <Monitor size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>{s.type}</span>
                      <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.3rem', margin: '2px 0 0' }}>{s.impressions}</p>
                    </div>
                  </div>
                  <div className="landing-inv-card__body">
                    <div>
                      <h4 className="landing-inv-card__title">{s.title}</h4>
                      <p className="landing-inv-card__location">
                        <MapPin size={13} style={{ color: 'var(--brand-primary)' }} />
                        {s.location}
                      </p>
                    </div>
                    <div className="landing-inv-card__footer">
                      <span className="landing-inv-card__price">{s.rate}</span>
                      <Link to="/spaces" className="landing-inv-card__link">
                        Inspect <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}>
            <Link to="/spaces" className="landing-btn-secondary">
              <span>View All 480+ Billboard &amp; Screen Spaces</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ───────────────────────────────────────────── */}
      <section id="calculator" className="landing-section">
        <div className="landing-section__inner">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <span className="landing-tag">Simulation Engine</span>
              <h2 className="landing-headline">Calculate Your Campaign Velocity</h2>
              <p style={{ color: 'var(--landing-text-sub)', lineHeight: 1.6, marginBottom: 28 }}>
                Adjust your media investment, target market, and schedule to see
                predictive impressions, footfall, and CPM in real-time.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Dynamic Yield Optimization', desc: 'Maximum viewability across peak traffic hours.' },
                  { title: 'Audience Verification', desc: 'Third-party sensory and vehicular counting data.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ padding: 8, borderRadius: 8, background: 'rgba(37,99,235,0.12)', color: 'var(--brand-primary)', flexShrink: 0 }}>
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--landing-text)' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.84rem', color: 'var(--landing-text-sub)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="landing-calc">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--landing-text)' }}>
                    <Sliders size={18} style={{ color: 'var(--brand-primary)' }} />
                    Campaign Simulator
                  </h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(37,99,235,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(37,99,235,0.25)' }}>
                    Live Model
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--landing-text-sub)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                      Budget: <span style={{ color: 'var(--landing-text)', fontWeight: 700 }}>Rs. {budget.toLocaleString()}</span>
                    </label>
                    <input type="range" min="50000" max="2500000" step="25000" value={budget}
                      onChange={(e) => setBudget(+e.target.value)} className="landing-calc__slider" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--landing-text-sub)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                      Duration: <span style={{ color: 'var(--landing-text)', fontWeight: 700 }}>{days} Days</span>
                    </label>
                    <input type="range" min="7" max="90" step="7" value={days}
                      onChange={(e) => setDays(+e.target.value)} className="landing-calc__slider" />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--landing-text-sub)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Target Market</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Lahore', 'Karachi', 'Islamabad', 'Dubai', 'New York'].map((c) => (
                      <button key={c} type="button" onClick={() => setCity(c)}
                        className={`landing-city-pill ${city === c ? 'landing-city-pill--active' : ''}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="landing-calc__output">
                  <div className="landing-calc__metric">
                    <p className="landing-calc__metric-label">Projected Impressions</p>
                    <p className="landing-calc__metric-value" style={{ color: 'var(--landing-text)' }}>{impressions.toLocaleString()}</p>
                  </div>
                  <div className="landing-calc__metric">
                    <p className="landing-calc__metric-label">Est. Footfall</p>
                    <p className="landing-calc__metric-value" style={{ color: 'var(--brand-primary)' }}>{footfall.toLocaleString()}</p>
                  </div>
                  <div className="landing-calc__metric">
                    <p className="landing-calc__metric-label">Effective CPM</p>
                    <p className="landing-calc__metric-value" style={{ color: '#16a34a' }}>Rs. {cpm}</p>
                  </div>
                </div>

                <div style={{ marginTop: 20, textAlign: 'right' }}>
                  <Link to={user ? '/campaigns' : '/register'} className="landing-btn-primary" style={{ padding: '10px 22px', fontSize: '0.88rem' }}>
                    <span>Deploy Campaign Plan</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="landing-section" style={{ background: 'var(--landing-grid-sec-bg)' }}>
        <div className="landing-section__inner" style={{ textAlign: 'center' }}>
          <span className="landing-tag">Zero-Friction Workflow</span>
          <h2 className="landing-headline">How Programmatic Ad Booking Works</h2>
          <p className="landing-section__desc">
            From inventory discovery to live broadcast and automated reconciliation in 3 steps.
          </p>
          <div className="landing-steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="landing-step">
                <div className="landing-step__number">{s.num}</div>
                <h3 className="landing-step__title">{s.title}</h3>
                <p className="landing-step__text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="landing-cta-banner">
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, margin: '0 0 14px', color: 'var(--landing-banner-text)', position: 'relative' }}>
              Ready to Broadcast Your Brand to Millions?
            </h2>
            <p style={{ color: 'var(--landing-text-sub)', maxWidth: 540, margin: '0 auto 28px', position: 'relative' }}>
              Join enterprise brands and advertising agencies booking premium physical and digital
              billboards in real-time.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, position: 'relative' }}>
              <Link to="/register" className="landing-btn-primary">
                <span>Create Advertiser Account</span>
                <ArrowRight size={17} />
              </Link>
              <Link to="/availability" className="landing-btn-secondary">
                <CalendarCheck size={17} />
                <span>Check Space Availability</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <p className="landing-footer__copy">
            &copy; {new Date().getFullYear()} AdFlow Systems. All rights reserved.
          </p>
          <div className="landing-footer__links">
            <Link to="/spaces" className="landing-footer__link">Inventory</Link>
            <Link to="/availability" className="landing-footer__link">Availability</Link>
            <Link to="/login" className="landing-footer__link">Sign In</Link>
            <Link to="/register" className="landing-footer__link">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
