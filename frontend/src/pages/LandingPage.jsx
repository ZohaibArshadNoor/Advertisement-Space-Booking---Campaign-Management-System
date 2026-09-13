import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/PublicNavbar';
import { spacesApi } from '../features/spaces/spacesApi';
import '../styles/landing.css';
import {
  MapPin, CalendarCheck, ShieldCheck, Zap, ArrowRight,
  Sparkles, Monitor, BarChart3, Sliders, ChevronRight,
  CheckCircle2, FileCheck, Users, Target, Layers
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 240;

const getFramePath = (index) => {
  const pad = String(index).padStart(3, '0');
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/frames/ezgif-frame-${pad}.jpg`;
};

/* =========================================================================
   SCROLL-DRIVEN BILLBOARD VIDEO CANVAS (OPTIMIZED FOR 240 FRAMES)
   ========================================================================= */

const ScrollBillboardHero = () => {
  const { user } = useAuth();
  const heroPinRef = useRef(null);
  const canvasRef = useRef(null);
  const stage1Ref = useRef(null);
  const stage2Ref = useRef(null);
  const stage3Ref = useRef(null);

  const imagesRef = useRef([]);
  const lastDrawnImgRef = useRef(null);
  const frameIndexRef = useRef(1);
  const animFrameIdRef = useRef(null);

  // Draw frame on canvas with aspect ratio cover
  const drawImageCover = useCallback((img) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const iw = img.naturalWidth || img.width || 1920;
    const ih = img.naturalHeight || img.height || 1080;

    const hRatio = width / iw;
    const vRatio = height / ih;
    const ratio = Math.max(hRatio, vRatio);

    const centerShiftX = (width - iw * ratio) / 2;
    const centerShiftY = (height - ih * ratio) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, iw, ih, centerShiftX, centerShiftY, iw * ratio, ih * ratio);
    lastDrawnImgRef.current = img;
  }, []);

  // Preload all 240 images in optimized batches
  useEffect(() => {
    const imgs = new Array(TOTAL_FRAMES);

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        if (i === 1 && !lastDrawnImgRef.current) {
          drawImageCover(img);
        }
      };
      imgs[i - 1] = img;
    }
    imagesRef.current = imgs;

    // Trigger initial render with frame 1 if cached
    if (imgs[0]?.complete) {
      drawImageCover(imgs[0]);
    }
  }, [drawImageCover]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      const curImg = lastDrawnImgRef.current || imagesRef.current[0];
      if (curImg) drawImageCover(curImg);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawImageCover]);

  // GSAP ScrollTrigger with smooth requestAnimationFrame rendering
  useEffect(() => {
    if (!heroPinRef.current || !canvasRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: heroPinRef.current,
        start: 'top top',
        end: '+=3400', // 3400px of smooth scroll for 240 frames
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const targetIndex = Math.min(
            TOTAL_FRAMES,
            Math.max(1, Math.round(progress * (TOTAL_FRAMES - 1)) + 1)
          );

          if (targetIndex !== frameIndexRef.current) {
            frameIndexRef.current = targetIndex;

            if (animFrameIdRef.current) {
              cancelAnimationFrame(animFrameIdRef.current);
            }

            animFrameIdRef.current = requestAnimationFrame(() => {
              let targetImg = imagesRef.current[targetIndex - 1];
              if (!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) {
                // Fallback to closest loaded frame
                for (let offset = 1; offset < 15; offset++) {
                  const prev = imagesRef.current[targetIndex - 1 - offset];
                  if (prev && prev.complete && prev.naturalWidth > 0) {
                    targetImg = prev;
                    break;
                  }
                  const next = imagesRef.current[targetIndex - 1 + offset];
                  if (next && next.complete && next.naturalWidth > 0) {
                    targetImg = next;
                    break;
                  }
                }
              }

              if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
                drawImageCover(targetImg);
              }
            });
          }

          // Stage 1 (Progress 0.0 -> 0.20)
          if (stage1Ref.current) {
            if (progress <= 0.20) {
              const op = Math.max(0, 1 - progress * 5.0);
              gsap.set(stage1Ref.current, {
                opacity: op,
                y: -progress * 70,
                pointerEvents: op > 0.3 ? 'auto' : 'none',
              });
            } else {
              gsap.set(stage1Ref.current, { opacity: 0, pointerEvents: 'none' });
            }
          }

          // Stage 2 (Progress 0.25 -> 0.65)
          if (stage2Ref.current) {
            if (progress >= 0.25 && progress <= 0.65) {
              const pIn = Math.min(1, (progress - 0.25) / 0.1);
              const pOut = Math.max(0, 1 - (progress - 0.55) / 0.1);
              const op = Math.min(pIn, pOut);
              gsap.set(stage2Ref.current, {
                opacity: op,
                y: (1 - op) * 20,
                pointerEvents: op > 0.4 ? 'auto' : 'none',
              });
            } else {
              gsap.set(stage2Ref.current, { opacity: 0, pointerEvents: 'none' });
            }
          }

          // Stage 3 (Progress 0.68 -> 1.0)
          if (stage3Ref.current) {
            if (progress >= 0.68) {
              const op = Math.min(1, (progress - 0.68) / 0.14);
              gsap.set(stage3Ref.current, {
                opacity: op,
                y: (1 - op) * 20,
                pointerEvents: op > 0.4 ? 'auto' : 'none',
              });
            } else {
              gsap.set(stage3Ref.current, { opacity: 0, pointerEvents: 'none' });
            }
          }
        },
      });
    }, heroPinRef);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      ctx.revert();
    };
  }, [drawImageCover]);

  return (
    <div className="landing-hero-pin-wrapper" ref={heroPinRef}>
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="landing-scroll-canvas" />

      {/* Dark Vignette Overlay for High-Contrast Text Readability */}
      <div className="landing-scroll-overlay" />

      {/* ── STAGE 1: Wide City View ── */}
      <div className="landing-stage landing-stage--1" ref={stage1Ref}>
        <div className="landing-stage__inner">
          <div className="landing-beacon">
            <span className="landing-beacon__dot" />
            <span>Smart Outdoor &amp; Digital Billboard Network</span>
          </div>

          <h1 className="landing-hero__title">
            Command Prime Billboards &amp; LED Screens{' '}
            <span className="landing-gradient-text">With Zero Conflicts.</span>
          </h1>

          <p className="landing-hero__subtitle">
            Discover roadside unipoles, digital LED walls, and prime urban spaces across Lahore,
            Karachi, and Islamabad with verified footfall and real-time availability.
          </p>

          <div className="landing-hero__actions">
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

          {/* Stat Counters */}
          <div className="landing-stats">
            <div className="landing-stat-box">
              <p className="landing-stat-box__value">1.2M+</p>
              <p className="landing-stat-box__label">Daily City Reach</p>
            </div>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: 'var(--brand-primary)' }}>100%</p>
              <p className="landing-stat-box__label">Booking Accuracy</p>
            </div>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: '#4ade80' }}>0 Conflicts</p>
              <p className="landing-stat-box__label">Double-Booking Rate</p>
            </div>
            <div className="landing-stat-box">
              <p className="landing-stat-box__value" style={{ color: '#fbbf24' }}>50+</p>
              <p className="landing-stat-box__label">Prime Spaces</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAGE 2: Mid-Flight (Conflict-Free Booking) ── */}
      <div className="landing-stage landing-stage--2" ref={stage2Ref} style={{ opacity: 0 }}>
        <div className="landing-stage-card">
          <span className="landing-tag">Smart Availability Engine</span>
          <h2 className="landing-stage-card__title">
            100% Conflict-Free Date Reservations
          </h2>
          <p className="landing-stage-card__text">
            Our real-time booking calendar locks exact campaign dates so advertisers never face double-bookings or scheduling clashes.
          </p>
          <div className="landing-stage-card__features">
            <div className="landing-stage-card__feat-item">
              <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <span>Pessimistic Date-Range Locking</span>
            </div>
            <div className="landing-stage-card__feat-item">
              <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <span>Artwork Format &amp; Quality Review</span>
            </div>
            <div className="landing-stage-card__feat-item">
              <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <span>Transparent City-Wide Rate Cards</span>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <Link to="/availability" className="landing-btn-primary" style={{ padding: '10px 22px', fontSize: '0.88rem' }}>
              <span>Check Space Availability</span>
              <CalendarCheck size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── STAGE 3: Close-Up (Integrated Multi-Channel Flights) ── */}
      <div className="landing-stage landing-stage--3" ref={stage3Ref} style={{ opacity: 0 }}>
        <div className="landing-stage-card landing-stage-card--center">
          <span className="landing-tag">Dual-Channel Advertising</span>
          <h2 className="landing-stage-card__title">
            Combine Billboards With Digital Ad Flights
          </h2>
          <p className="landing-stage-card__text">
            Pair your high-visibility roadside billboards with synchronized YouTube, Meta, and Google search ad packages for maximum brand recall.
          </p>
          <div className="landing-stage-card__cta-row">
            <Link to="/spaces" className="landing-btn-primary">
              <span>Browse Billboard Catalog</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="landing-btn-secondary">
              <span>Create Advertiser Account</span>
              <Zap size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   PLATFORM FEATURES & WORKFLOW STEPS
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

const GRADIENTS = [
  'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
  'linear-gradient(135deg, #065f46 0%, #0f172a 100%)',
  'linear-gradient(135deg, #581c87 0%, #0f172a 100%)',
  'linear-gradient(135deg, #831843 0%, #0f172a 100%)',
  'linear-gradient(135deg, #0f766e 0%, #0f172a 100%)',
  'linear-gradient(135deg, #1e293b 0%, #0b0f19 100%)',
];

/* =========================================================================
   MAIN LANDING PAGE COMPONENT
   ========================================================================= */

const LandingPage = () => {
  const { user } = useAuth();

  // Dynamic spaces state from database
  const [dbSpaces, setDbSpaces] = useState([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Fetch spaces from database on mount
  useEffect(() => {
    let isMounted = true;
    spacesApi
      .getSpaces({ per_page: 6, is_active: true })
      .then((data) => {
        if (isMounted && data?.spaces) {
          setDbSpaces(data.spaces);
        }
      })
      .catch((err) => {
        console.error('Failed to load database spaces on landing:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSpaces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Simple Estimator State
  const [budget, setBudget] = useState(250000);
  const [city, setCity] = useState('Lahore');
  const [days, setDays] = useState(14);
  const impressions = Math.round((budget / 100) * 85 * (days / 10));
  const footfall = Math.round(impressions * 0.45);
  const cpm = ((budget / impressions) * 1000).toFixed(2);

  return (
    <div className="landing-page">
      {/* ─── TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <PublicNavbar />

      {/* Ambient background glows */}
      <div className="landing-glow landing-glow--top" />
      <div className="landing-glow landing-glow--right" />
      <div className="landing-glow landing-glow--left" />

      {/* ─── PINNED SCROLL-DRIVEN 3D BILLBOARD HERO ───────────────────── */}
      <ScrollBillboardHero />

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

      {/* ─── INVENTORY SHOWCASE (DYNAMIC FROM DATABASE) ────────────────── */}
      <section id="inventory" className="landing-section" style={{ background: 'var(--landing-grid-sec-bg)' }}>
        <div className="landing-section__inner" style={{ textAlign: 'center' }}>
          <span className="landing-tag">Live Database Inventory</span>
          <h2 className="landing-headline">Prime Advertising Spaces in Top Cities</h2>
          <p className="landing-section__desc">
            Explore active roadside unipoles, digital LED screens, and mall displays available in our network.
          </p>

          {loadingSpaces ? (
            <div className="landing-inventory-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="landing-inv-card" style={{ opacity: 0.6 }}>
                  <div className="landing-inv-card__inner">
                    <div className="landing-inv-card__visual" style={{ background: '#1e293b', animation: 'pulse 1.5s infinite' }} />
                    <div className="landing-inv-card__body">
                      <div style={{ height: 18, background: '#334155', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ height: 14, background: '#1e293b', borderRadius: 4, width: '60%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : dbSpaces.length > 0 ? (
            <div className="landing-inventory-grid">
              {dbSpaces.map((s, i) => {
                const categoryName = s.category?.name || 'Billboard Space';
                const locationName = s.location?.name
                  ? `${s.location.name}, ${s.location.city || ''}`
                  : (s.location?.city || 'Pakistan');
                const rateNum = Number(s.base_rate || s.daily_rate || s.base_price || 0);
                const rateText = rateNum > 0 ? `Rs. ${rateNum.toLocaleString()} / day` : 'Custom Quote';
                const gradient = GRADIENTS[i % GRADIENTS.length];

                return (
                  <div key={s.id || i} className="landing-inv-card">
                    <div className="landing-inv-card__inner">
                      <div className="landing-inv-card__visual" style={{ background: gradient }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="landing-inv-card__badge">{categoryName}</span>
                          <Monitor size={20} style={{ color: 'rgba(255,255,255,0.75)' }} />
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
                            {s.dimensions || 'High-Impact Format'}
                          </span>
                          <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', margin: '2px 0 0' }}>
                            {s.code || `SPACE-#${s.id}`}
                          </p>
                        </div>
                      </div>
                      <div className="landing-inv-card__body">
                        <div>
                          <h4 className="landing-inv-card__title">{s.name}</h4>
                          <p className="landing-inv-card__location">
                            <MapPin size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                            <span>{locationName}</span>
                          </p>
                        </div>
                        <div className="landing-inv-card__footer">
                          <span className="landing-inv-card__price">{rateText}</span>
                          <Link to="/spaces" className="landing-inv-card__link">
                            View Space <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '30px 20px', borderRadius: 16, background: 'var(--landing-card-bg)', border: '1px solid var(--landing-card-border)', maxWidth: 500, margin: '0 auto' }}>
              <p style={{ margin: 0, color: 'var(--landing-text-sub)' }}>
                No spaces currently listed in database. Browse the full inventory below.
              </p>
            </div>
          )}

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
