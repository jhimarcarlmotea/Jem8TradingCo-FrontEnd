import React, { useState } from 'react';
import Shella from '../assets/Shella_Ricafrente-Acibar.png';
import Jinkie from '../assets/Jinkie_Ricafrente-Malinag.png';
import Akiko from '../assets/Akiko_Serrano.png';
import Ruby from '../assets/Ruby_Ann_Castillo.png';
import Charisse from '../assets/Charisse_Decano.png';
import Adrian from '../assets/Adrian_Mallanao.png';
import Vhernaldo from '../assets/Vhernaldo_Ricafrente.png';
import Mark from '../assets/Mark_Edward_C_Malinag.png';
import Daniel from '../assets/Daniel_Kian_Rodriguez_Cadena.png';
import Kayla from '../assets/Kayla_R_Bacsafra.png';
import Cristina from '../assets/Cristina_A_Saturnio.png';

const BASE = 'http://127.0.0.1:8000';

const getInitials = (name) =>
  name.replace(/^(Ms\.|Mr\.)\s+/, '').split(' ').slice(0, 2).map((n) => n[0]).join('');

const resolveImg = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE}/storage/${path}`;
};

const About = () => {
  const [stats] = useState({ since: 2016, employees: '1–7', clients: 250 });

  const [leaders] = useState([
    { id: 1,  name: 'Ms. Shella R. Acibar',            role: 'Co-Owner of Jem 8 Circle',                           image: Shella    },
    { id: 2,  name: 'Ms. Jinkie Malinag',               role: 'Co-Owner of Jem 8 Circle',                           image: Jinkie    },
    { id: 3,  name: 'Ms. Akiko Serrano',                role: 'Sales Executive of Jem 8 Circle',                    image: Akiko     },
    { id: 4,  name: 'Ms. Ruby Ann Castillo',            role: 'Sales Executive of Jem 8 Circle',                    image: Ruby      },
    { id: 5,  name: 'Ms. Charisse Mae Decano',          role: 'Admin/HR Representative of Jem 8 Circle',            image: Charisse  },
    { id: 6,  name: 'Mr. Adrian Mallanao',              role: 'Laison Head Officer of Jem 8 Circle',                image: Adrian    },
    { id: 7,  name: 'Mr. Vhernaldo Ricafrente',         role: 'Marketing/Admin Assistant of Jem 8 Circle',          image: Vhernaldo },
    { id: 8,  name: 'Mr. Mark Edward Malinag',          role: 'Marketing/Admin Assistant of Jem 8 Circle',          image: Mark      },
    { id: 9,  name: 'Mr. Daniel Kian Rodriguez Cadena', role: 'Business Associate of Jem 8 Circle',                 image: Daniel    },
    { id: 10, name: 'Ms. Kayla R. Bacsafra',            role: 'Sales Executive of Jem 8 Circle (South Luzon Area)', image: Kayla     },
    { id: 11, name: 'Ms. Cristina A. Saturnio',         role: 'Accounting and Finance of Jem 8 Circle',             image: Cristina  },
  ]);

  const getInitials = (name) =>
    name.replace(/^(Ms\.|Mr\.)\s+/, '').split(' ').slice(0, 2).map(n => n[0]).join('');

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling?.style && (e.target.nextSibling.style.display = 'flex');
  };

  const detailRows = [
    {
      label: 'Who\nWe Are',
      title: 'Registered Business in Makati City',
      desc: `JEM 8 Circle Trading Co. is a registered business situated at Unit 202P, Cityland 10 Tower 1, HV Dela Costa St., Salcedo Village, Makati City. Established on July 22, 2016, the company operates primarily in the wholesale and retail trade sector and employs between ${stats.employees} staff members.`,
    },
    {
      label: 'Our\nReach',
      title: `${stats.clients} Clients Across Metro Manila & Laguna`,
      desc: `The company has accumulated ${stats.clients} clients as of August 2025 across different cities in both Metro Manila and Laguna, steadily growing its presence in the wholesale and retail trade sector.`,
    },
    {
      label: 'What\nWe Do',
      title: 'Office, Pantry, Janitorial & Wellness Products',
      desc: `JEM 8 Circle Trading Co. specializes in supplying office supplies, pantry and janitorial supplies, and health and wellness products — and believes in "Supply products with quality in the best price."`,
    },
    {
      label: 'Our\nTeam',
      title: 'Professional Service Rooted in Honesty & Integrity',
      desc: `With a professional team dedicated to understanding and fulfilling client needs promptly and at competitive prices, JEM 8 Circle Trading Co. delivers reliable service rooted in honesty and integrity.`,
    },
    {
      label: 'Why\nChoose Us',
      title: 'Direct Delivery. Lower Costs. Better Service.',
      desc: `The company offers stock supplies for quick delivery, helping businesses save on transportation and manpower costs by delivering office supplies and promotional items directly to their offices.`,
    },
  ];

  return (
    <div className="bg-white" style={{ paddingTop: 'var(--header-h)' }}>

      {/* ===== HERO ===== */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--green-light) 0%, #fff 60%, #f9fdf9 100%)',
          padding: 'clamp(70px, 10vw, 130px) 0 clamp(60px, 8vw, 100px)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* Decorative blob */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,123,101,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Label pill */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-(--green-border) bg-white px-[18px] py-[7px] font-sub text-[12px] font-semibold uppercase tracking-[2px] text-[var(--green)]">
            <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--green)]" />
            About Jem 8 Circle Trading Co.
          </div>

          <h1 className="mx-auto mb-5 max-w-[700]  font-heading font-bold leading-snug text-[var(--dark)]"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
            "Your trusted source for<br />
            <em className="italic text-[var(--green)]">equipment and supplies.</em>"
          </h1>

         <p className="mb-12 max-w-x1 text-center font-sub text-base leading-relaxed bg-amber-100 text-brand-gray md:text-lg">
          We connect trading companies with the industrial equipment and supplies
          they need to operate at peak efficiency — reliably, seamlessly, at scale.
        </p>

          {/* Stats bar — centered via flex justify-center wrapper */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              overflow: 'hidden',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border)',
              background: '#fff',
              boxShadow: 'var(--shadow-md)',
            }}>
              {[
                { num: stats.since,         label: 'Est. Year'  },
                { num: stats.employees,     label: 'Employees'  },
                { num: `${stats.clients}+`, label: 'Clients'    },
              ].map(({ num, label }, i, arr) => (
                <div key={label} style={{
                  padding: '22px 40px',
                  textAlign: 'center',
                  borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span className="font-heading" style={{
                    display: 'block', fontSize: '30px', fontWeight: 700,
                    color: 'var(--green)', lineHeight: 1, marginBottom: '5px',
                  }}>{num}</span>
                  <span className="font-sub" style={{
                    display: 'block', fontSize: '12px', fontWeight: 500,
                    color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px',
                  }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section style={{ background: '#fff', padding: 'clamp(60px, 8vw, 110px) 0' }}>
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

            {/* Mission */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              borderRadius: 'var(--r-xl)', padding: 'clamp(36px, 5vw, 56px)',
              border: '1px solid var(--border)', background: 'var(--dark)',
              boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'rgba(77,123,101,0.15)', pointerEvents: 'none',
              }} />
              <div className="font-sub" style={{
                display: 'inline-block', borderRadius: '999px',
                background: 'rgba(255,255,255,0.1)', padding: '5px 14px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: '16px',
              }}>Our Mission</div>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 700,
                lineHeight: 1.25, color: '#fff', marginBottom: '18px',
              }}>Advancing with heart, integrity, and smart systems.</h2>
              <p className="font-sub" style={{
                fontSize: '15px', lineHeight: 1.8, marginBottom: '28px',
                color: 'rgba(255,255,255,0.75)',
              }}>
                We advance JEM 8 Circle with heart, integrity, and smart systems. Through ethical distribution,
                structured processes, and strong teamwork, we develop confident, knowledgeable, and responsible
                leaders, expand our global reach, and create sustainable growth for both our people and the organization.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--green)', boxShadow: '0 0 0 3px rgba(77,123,101,0.3)',
                  display: 'inline-block',
                }} />
                <span className="font-sub" style={{
                  fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                }}>Since {stats.since}</span>
              </div>
            </div>

            {/* Vision */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              borderRadius: 'var(--r-xl)', padding: 'clamp(36px, 5vw, 56px)',
              border: '1px solid var(--border)', background: 'var(--green-light)',
              boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'rgba(77,123,101,0.12)', pointerEvents: 'none',
              }} />
              <div className="font-sub" style={{
                display: 'inline-block', borderRadius: '999px',
                background: 'rgba(77,123,101,0.15)', padding: '5px 14px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: 'var(--green)', marginBottom: '16px',
              }}>Our Vision</div>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 700,
                lineHeight: 1.25, color: 'var(--dark)', marginBottom: '18px',
              }}>Where wellness fuels opportunity and purpose drives action.</h2>
              <p className="font-sub" style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--gray)' }}>
                To create a world where wellness fuels opportunity, leaders inspire growth, and a united team
                transforms lives through passion, integrity, and purpose-driven action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LEADERSHIP ===== */}
      <section style={{ background: 'var(--light-gray)', padding: 'clamp(60px, 8vw, 110px) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-(--green-border) bg-white px-[18px] py-[7px] font-sub text-[12px] font-semibold uppercase tracking-[2px] text-[var(--green)]"
              style={{ marginBottom: '8px' }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-(--green)" />
              Our Team
            </div>
            <h2 className="font-heading font-bold text-[var(--dark)]"
              style={{ display: 'block', fontSize: 'clamp(26px, 3vw, 38px)', marginTop: '8px' }}>
              Leadership
            </h2>
            <p className="font-sub text-[var(--gray)]"
              style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.8, marginTop: '8px' }}>
              The people behind JEM 8 Circle Trading Co.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 max-[1100px]:grid-cols-3 max-[480px]:gap-[14px]">
            {leaders.map((leader) => (
              <div key={leader.id}
                className="overflow-hidden bg-white text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--green-border)] hover:shadow-lg"
                style={{
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', overflow: 'hidden', background: 'var(--green-light)' }}>
                  <img
                    src={leader.image}
                    alt={leader.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    onError={handleImageError}
                  />
                  <div className="font-heading font-bold text-[var(--green)]"
                    style={{
                      position: 'absolute', inset: 0, display: 'none',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'var(--green-light)', fontSize: '36px',
                    }}>
                    {getInitials(leader.name)}
                  </div>
                </div>
                <div style={{ padding: '16px 14px 18px' }}>
                  <div className="font-body" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dark)', marginBottom: '5px', lineHeight: 1.4 }}>{leader.name}</div>
                  <div className="font-sub" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--green)', lineHeight: 1.4 }}>{leader.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUSTED BANNER ===== */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--dark)', textAlign: 'center',
        padding: 'clamp(60px, 8vw, 100px) 0',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,123,101,0.2) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="font-heading font-bold text-white"
            style={{ fontSize: 'clamp(30px, 5vw, 58px)', lineHeight: 1.2, marginBottom: '20px' }}>
            Your Trusted <span style={{ color: 'var(--green)' }}>Supply Partner</span>
          </h2>
          <p className="font-sub mx-auto"
            style={{ fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: '620px' }}>
            From small businesses to established companies, we empower organizations of all sizes with office supplies,
            pantry and janitorial essentials, and health and wellness products — delivered with quality at the best price.
          </p>
        </div>
      </section>

      {/* ===== ABOUT DETAIL ===== */}
      <section style={{ background: '#fff', padding: 'clamp(60px, 8vw, 110px) 0' }}>
        <div className="container">
          <h2 className="font-heading font-bold text-[var(--dark)]" style={{
            fontSize: 'clamp(26px, 3vw, 38px)',
            marginBottom: 'clamp(36px, 5vw, 60px)',
            paddingBottom: '20px',
            borderBottom: '2px solid var(--green-light)',
          }}>About JEM 8 Circle</h2>

          {detailRows.map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: '32px',
              padding: '36px 0',
              borderBottom: i < detailRows.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'start',
            }}>
              <div className="font-heading font-bold text-[var(--green)]"
                style={{ fontSize: '16px', lineHeight: 1.5, paddingTop: '4px' }}>
                {row.label.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}
              </div>
              <div>
                <p className="font-body font-bold text-[var(--dark)]"
                  style={{ fontSize: '17px', marginBottom: '10px', lineHeight: 1.4 }}>{row.title}</p>
                <p className="font-sub text-[var(--gray)]"
                  style={{ fontSize: '15px', lineHeight: 1.8 }}>{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ENTERPRISE ===== */}
      <section style={{ background: 'var(--light-gray)', padding: 'clamp(60px, 8vw, 110px) 0' }}>
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="font-sub" style={{
                display: 'inline-block', background: 'var(--green-light)', color: 'var(--green)',
                fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: '999px', marginBottom: '16px',
              }}>Enterprise</div>
              <h2 className="font-heading font-bold text-[var(--dark)]"
                style={{ fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: '16px', lineHeight: 1.25 }}>
                Complete supply solutions for your business
              </h2>
              <p className="font-sub text-[var(--gray)]"
                style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '28px' }}>
                We provide a complete range of office supplies, pantry and janitorial supplies, and health and
                wellness products tailored to your business needs. Delivering quality at the best price —
                directly to your office.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
                {['Reliable Supply', 'Consistent Quality', 'Timely Delivery'].map(f => (
                  <div key={f} className="font-body font-semibold text-[var(--dark)]"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--green)', color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
              {['/img/download-2-3.png', '/img/download-1.png', '/img/download-1-2.png'].map((src, i) => (
                <div key={i} style={{
                  overflow: 'hidden',
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-md)',
                  aspectRatio: '3/4',
                  marginTop: i === 1 ? '24px' : '0',
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                >
                  <img src={src} alt={`Product ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        position: 'relative', overflow: 'hidden', textAlign: 'center',
        background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
        padding: 'clamp(60px, 8vw, 100px) 0',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="font-heading font-bold text-white"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', lineHeight: 1.25, marginBottom: '12px' }}>
            From our hands to your office.
          </p>
          <p className="font-sub" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', marginBottom: '40px' }}>
            Ready to work with a trusted supply partner?
          </p>
          <a href="/contact" className="font-body font-bold text-(--green)" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            borderRadius: 'var(--r-md)', background: '#fff',
            padding: '16px 40px', fontSize: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = '#f0faf5'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)'; }}
          >
            Get Started →
          </a>
        </div>
      </section>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
};

export default About;