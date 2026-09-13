import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/PublicNavbar';
import '../styles/landing.css';
import {
  MapPin, CalendarCheck, ShieldCheck, Zap, ArrowRight,
  Sparkles, Monitor, BarChart3, Sliders, ChevronRight,
  CheckCircle2, FileCheck, Users, Target, Move3d
} from 'lucide-react';

/* =========================================================================
   AUTHENTIC 3D BILLBOARD & DIGITAL SCREEN SCENE (THREE.JS)
   ========================================================================= */

/** Generates a canvas texture with live advertising graphics */
function useBillboardTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base background gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Glowing subtle grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Top Badge Pill
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(60, 50, 260, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LIVE DIGITAL LED WALL', 80, 82);

    // Main Ad Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('COMMAND PRIME SPACES', 60, 175);

    // Location tag
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Lahore • Karachi • Islamabad', 60, 225);

    // Stats Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(60, 280, 904, 160, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('850,000+ Daily Reach', 95, 350);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('High-Footfall Urban Corridors', 95, 395);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('100% Conflict-Free', 560, 350);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Smart Real-Time Date Booking', 560, 395);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

/** 3D Realistic Billboard Model with Pylon, Screen & Spotlights */
function BillboardModel({ isDark }) {
  const groupRef = useRef();
  const screenTex = useBillboardTexture();
  const { mouse } = useThree();

  // Subtle interactive parallax tilt on mouse move
  useFrame(() => {
    if (!groupRef.current) return;
    const targetRotY = mouse.x * 0.45;
    const targetRotX = -mouse.y * 0.25;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.06;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.06;
  });

  const steelColor = isDark ? '#334155' : '#475569';
  const frameColor = isDark ? '#0f172a' : '#1e293b';
  const lightBeams = isDark ? '#60a5fa' : '#38bdf8';

  return (
    <group ref={groupRef} position={[0, -0.35, 0]} scale={[0.9, 0.9, 0.9]}>
      {/* ── Concrete Foundation Base ── */}
      <mesh position={[0, -2.4, 0]}>
        <cylinderGeometry args={[1.1, 1.3, 0.35, 32]} />
        <meshStandardMaterial color={isDark ? '#1e293b' : '#94a3b8'} roughness={0.9} />
      </mesh>

      {/* ── Steel Pylon Support Pole ── */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 2.5, 32]} />
        <meshStandardMaterial color={steelColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Back Truss Support Structure ── */}
      <mesh position={[0, 0.7, -0.22]}>
        <boxGeometry args={[4.2, 1.8, 0.15]} />
        <meshStandardMaterial color={steelColor} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── Outer Billboard Bezel Frame ── */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[4.8, 2.6, 0.2]} />
        <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── Digital LED Screen Face ── */}
      <mesh position={[0, 0.7, 0.11]}>
        <planeGeometry args={[4.5, 2.3]} />
        <meshBasicMaterial map={screenTex} />
      </mesh>

      {/* ── Screen Ambient Glow Plane ── */}
      <mesh position={[0, 0.7, 0.12]}>
        <planeGeometry args={[4.6, 2.4]} />
        <meshBasicMaterial
          color={isDark ? '#38bdf8' : '#2563eb'}
          transparent
          opacity={isDark ? 0.1 : 0.05}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Lower Walkway / Maintenance Platform ── */}
      <mesh position={[0, -0.65, 0.25]}>
        <boxGeometry args={[4.6, 0.08, 0.55]} />
        <meshStandardMaterial color={steelColor} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ── Safety Railing ── */}
      <mesh position={[0, -0.45, 0.5]}>
        <boxGeometry args={[4.6, 0.35, 0.04]} />
        <meshStandardMaterial color={steelColor} wireframe transparent opacity={0.6} />
      </mesh>

      {/* ── Top Spotlight Fixtures (3 lights) ── */}
      {[-1.6, 0, 1.6].map((xPos, idx) => (
        <group key={idx} position={[xPos, 2.1, 0.45]}>
          <mesh position={[0, -0.15, -0.25]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 12]} />
            <meshStandardMaterial color={steelColor} metalness={0.8} />
          </mesh>
          <mesh rotation={[0.6, 0, 0]}>
            <coneGeometry args={[0.16, 0.25, 16]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} />
          </mesh>
          <pointLight color={lightBeams} intensity={isDark ? 2.5 : 1.5} distance={4} />
        </group>
      ))}
    </group>
  );
}

/** Complete 3D Canvas Scene */
function HeroBillboardScene({ isDark }) {
  return (
    <>
      <ambientLight intensity={isDark ? 0.8 : 1.1} />
      <directionalLight position={[6, 8, 5]} intensity={isDark ? 1.6 : 1.9} />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} />

      {isDark && (
        <Stars radius={50} depth={40} count={350} factor={3} saturation={0.5} fade speed={1} />
      )}

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
        <BillboardModel isDark={isDark} />
      </Float>
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
   DATA — SIMPLE & DEFENSIBLE
   ========================================================================= */

const FEATURES = [
  {
    icon: Target,
    title: 'Billboard & Screen Discovery',
    text: 'Explore physical unipoles, roadside billboards, and digital LED screens across prime city locations with verified daily footfall.',
  },
  {
    icon: ShieldCheck,
    title: 'Conflict-Free Date Booking',
    text: 'Our smart calendar prevents overlapping reservations so your campaign dates are 100% secured with zero double-booking.',
  },
  {
    icon: FileCheck,
    title: 'Creative Verification',
    text: 'Upload your image banners or video reels. Admins review format, dimensions, and brand compliance before your ad goes live.',
  },
  {
    icon: BarChart3,
    title: 'Clear Pricing & Rate Cards',
    text: 'Transparent daily and monthly pricing for every space with zero hidden charges and clear seasonal discount rates.',
  },
  {
    icon: Sparkles,
    title: 'Digital Marketing Add-Ons',
    text: 'Easily combine physical billboards with digital packages across YouTube, Meta, Google Search, and TikTok for full reach.',
  },
  {
    icon: Users,
    title: 'Multi-Role Dashboards',
    text: 'Dedicated, easy-to-use portals for advertisers to book spaces and admins to manage inventory, rates, and approvals.',
  },
];

const SPACES = [
  {
    title: 'Mall Road 3D Anamorphic LED',
    location: 'Lahore, Pakistan',
    type: 'Digital LED Screen',
    impressions: '450,000+ / day',
    rate: 'Rs. 120,000 / day',
    tag: 'High Footfall Corridor',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
  },
  {
    title: 'Shahrah-e-Faisal Highway Unipole',
    location: 'Karachi, Pakistan',
    type: 'Highway Unipole Billboard',
    impressions: '720,000+ / day',
    rate: 'Rs. 185,000 / day',
    tag: 'Major Traffic Artery',
    gradient: 'linear-gradient(135deg, #065f46 0%, #0f172a 100%)',
  },
  {
    title: 'Blue Area Commercial Totem',
    location: 'Islamabad, Pakistan',
    type: 'Smart Digital Kiosk',
    impressions: '280,000+ / day',
    rate: 'Rs. 85,000 / day',
    tag: 'Business District',
    gradient: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)',
  },
  {
    title: 'Gulberg Main Boulevard Display',
    location: 'Lahore, Pakistan',
    type: 'Curved LED Wall',
    impressions: '520,000+ / day',
    rate: 'Rs. 140,000 / day',
    tag: 'Luxury Retail Hub',
    gradient: 'linear-gradient(135deg, #831843 0%, #0f172a 100%)',
  },
];

const BRANDS = [
  'PRIME BILLBOARDS',
  'URBAN LED NETWORK',
  'HIGHWAY GANTRY',
  'DIGITAL SCREEN HUB',
  'TRANSIT ADS',
  'METRO DISPLAYS',
  'CITY MEDIA SPACES',
];

const STEPS = [
  {
    num: '01',
    title: 'Discover & Select Spaces',
    text: 'Browse billboards and digital screens by city, view size specs and daily rates, and select your preferred campaign dates.',
  },
  {
    num: '02',
    title: 'Upload Your Creative',
    text: 'Upload your high-resolution banner image or video reel. Our team verifies resolution and content compliance.',
  },
  {
    num: '03',
    title: 'Confirm & Go Live',
    text: 'Complete your booking with automated invoice generation and watch your campaign broadcast to thousands of daily commuters.',
  },
];

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */

const LandingPage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const heroRef = useRef(null);

  // GSAP entrance for hero content
  useEffect(() => {
    if (!heroRef.current) return;
    const els = heroRef.current.querySelectorAll('.gsap-hero-item');
    gsap.fromTo(
      els,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  // GSAP scroll reveals
  useGsapReveal('.landing-feature-card', { stagger: 0.08, duration: 0.6 });
  useGsapReveal('.landing-inv-card', { stagger: 0.1, duration: 0.65 });
  useGsapReveal('.landing-step', { stagger: 0.12, duration: 0.6 });

  // Simple Estimator State
  const [budget, setBudget] = useState(250000);
  const [city, setCity] = useState('Lahore');
  const [days, setDays] = useState(14);
  const impressions = Math.round((budget / 100) * 85 * (days / 10));
  const footfall = Math.round(impressions * 0.45);
  const cpm = ((budget / impressions) * 1000).toFixed(2);

  // Stat counter animation
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
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

      {/* ─── 2-COLUMN SPLIT HERO SECTION ─────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero__container">
          <div className="landing-hero__grid">
            {/* ── LEFT COLUMN: Text Content & Actions ── */}
            <div className="landing-hero__content" ref={heroRef}>
              <div className="landing-beacon gsap-hero-item">
                <span className="landing-beacon__dot" />
                <span>Smart Outdoor &amp; Digital Advertising Platform</span>
              </div>

              <h1 className="landing-hero__title gsap-hero-item">
                Book Premier Billboards &amp; Digital Screens{' '}
                <span className="landing-gradient-text">With Zero Conflicts.</span>
              </h1>

              <p className="landing-hero__subtitle gsap-hero-item">
                Discover roadside billboards, highway unipoles, and high-impact digital LED screens
                across top cities. Reserve dates instantly and manage full advertising campaigns in one place.
              </p>

              <div className="landing-hero__actions gsap-hero-item">
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
                  <span>Explore Spaces</span>
                </Link>
              </div>

              {/* Stat counters */}
              <div className="landing-stats gsap-hero-item" ref={statsRef}>
                <div className="landing-stat-box">
                  <p className="landing-stat-box__value" style={{ color: 'var(--landing-text)' }} data-count="1.2" data-suffix="M+" data-decimals="1">0</p>
                  <p className="landing-stat-box__label">Daily City Reach</p>
                </div>
                <div className="landing-stat-box">
                  <p className="landing-stat-box__value" style={{ color: 'var(--brand-primary)' }} data-count="100" data-suffix="%" data-decimals="0">0</p>
                  <p className="landing-stat-box__label">Booking Accuracy</p>
                </div>
                <div className="landing-stat-box">
                  <p className="landing-stat-box__value" style={{ color: '#16a34a' }} data-count="0" data-suffix=" Conflicts" data-decimals="0">0</p>
                  <p className="landing-stat-box__label">Double-Booking Rate</p>
                </div>
                <div className="landing-stat-box">
                  <p className="landing-stat-box__value" style={{ color: '#d97706' }} data-count="50" data-append="+">0</p>
                  <p className="landing-stat-box__label">Prime Spaces</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Dedicated 3D Billboard Canvas ── */}
            <div className="landing-hero__visual gsap-hero-item">
              <div className="landing-canvas-card">
                <Suspense fallback={<div className="landing-canvas-loading">Loading 3D Billboard...</div>}>
                  <Canvas
                    camera={{ position: [0, 0.3, 4.8], fov: 46 }}
                    dpr={[1, 1.5]}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                  >
                    <HeroBillboardScene isDark={isDark} />
                  </Canvas>
                </Suspense>
                <div className="landing-canvas-badge">
                  <Move3d size={14} style={{ color: '#38bdf8' }} />
                  <span>Interactive 3D Billboard • Drag to Rotate</span>
                </div>
              </div>
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
          <span className="landing-tag">Platform Features</span>
          <h2 className="landing-headline">Everything Needed to Run Outdoor &amp; Digital Campaigns</h2>
          <p className="landing-section__desc">
            From searching roadside billboards to uploading creative artwork and tracking campaign status.
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
          <span className="landing-tag">Featured Inventory</span>
          <h2 className="landing-headline">Prime Advertising Spaces in Top Cities</h2>
          <p className="landing-section__desc">
            Explore premium roadside unipoles, digital LED screens, and mall displays with verified footfall.
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
                      <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem', margin: '2px 0 0' }}>{s.impressions}</p>
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
                        View Space <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 35 }}>
            <Link to="/spaces" className="landing-btn-secondary">
              <span>View All Billboard &amp; LED Inventory</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SIMPLE CAMPAIGN ESTIMATOR ────────────────────────────────── */}
      <section id="calculator" className="landing-section">
        <div className="landing-section__inner">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <span className="landing-tag">Cost &amp; Reach Estimator</span>
              <h2 className="landing-headline">Plan Your Campaign Budget</h2>
              <p style={{ color: 'var(--landing-text-sub)', lineHeight: 1.6, marginBottom: 24 }}>
                Adjust your budget and duration to view estimated impressions, footfall, and effective daily rates.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { title: 'Verified Daily Footfall', desc: 'Locations selected along high-traffic roads and commercial arteries.' },
                  { title: 'Flexible Booking Duration', desc: 'Choose from 7-day test flights to full 30-day brand takeovers.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ padding: 8, borderRadius: 8, background: 'rgba(37,99,235,0.12)', color: 'var(--brand-primary)', flexShrink: 0 }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--landing-text)' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--landing-text-sub)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="landing-calc">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--landing-text)' }}>
                    <Sliders size={18} style={{ color: 'var(--brand-primary)' }} />
                    Quick Estimate Calculator
                  </h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(37,99,235,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(37,99,235,0.25)' }}>
                    Interactive Model
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--landing-text-sub)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                      Target Budget: <span style={{ color: 'var(--landing-text)', fontWeight: 700 }}>Rs. {budget.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min="50000"
                      max="2000000"
                      step="25000"
                      value={budget}
                      onChange={(e) => setBudget(+e.target.value)}
                      className="landing-calc__slider"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--landing-text-sub)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                      Flight Duration: <span style={{ color: 'var(--landing-text)', fontWeight: 700 }}>{days} Days</span>
                    </label>
                    <input
                      type="range"
                      min="7"
                      max="60"
                      step="7"
                      value={days}
                      onChange={(e) => setDays(+e.target.value)}
                      className="landing-calc__slider"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--landing-text-sub)', fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Select Target City
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className={`landing-city-pill ${city === c ? 'landing-city-pill--active' : ''}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="landing-calc__output">
                  <div className="landing-calc__metric">
                    <p className="landing-calc__metric-label">Est. Impressions</p>
                    <p className="landing-calc__metric-value" style={{ color: 'var(--landing-text)' }}>{impressions.toLocaleString()}</p>
                  </div>
                  <div className="landing-calc__metric">
                    <p className="landing-calc__metric-label">Est. Footfall</p>
                    <p className="landing-calc__metric-value" style={{ color: 'var(--brand-primary)' }}>{footfall.toLocaleString()}</p>
                  </div>
                  <div className="landing-calc__metric">
                    <p className="landing-calc__metric-label">Estimated CPM</p>
                    <p className="landing-calc__metric-value" style={{ color: '#16a34a' }}>Rs. {cpm}</p>
                  </div>
                </div>

                <div style={{ marginTop: 18, textAlign: 'right' }}>
                  <Link to={user ? '/campaigns' : '/register'} className="landing-btn-primary" style={{ padding: '9px 20px', fontSize: '0.88rem' }}>
                    <span>Create Campaign Plan</span>
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
          <span className="landing-tag">Simple 3-Step Process</span>
          <h2 className="landing-headline">How Space Booking Works</h2>
          <p className="landing-section__desc">
            A transparent workflow from picking a billboard to admin verification and going live.
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
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', fontWeight: 800, margin: '0 0 12px', color: 'var(--landing-banner-text)', position: 'relative' }}>
              Ready to Launch Your Billboard Campaign?
            </h2>
            <p style={{ color: 'var(--landing-text-sub)', maxWidth: 520, margin: '0 auto 24px', position: 'relative', fontSize: '0.95rem' }}>
              Browse prime advertising inventory, check live calendar availability, and book your campaign today.
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
            &copy; {new Date().getFullYear()} AdFlow Space Booking &amp; Campaign Management System. All rights reserved.
          </p>
          <div className="landing-footer__links">
            <Link to="/spaces" className="landing-footer__link">Spaces</Link>
            <Link to="/availability" className="landing-footer__link">Availability</Link>
            <Link to="/login" className="landing-footer__link">Sign In</Link>
            <Link to="/register" className="landing-footer__link">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
