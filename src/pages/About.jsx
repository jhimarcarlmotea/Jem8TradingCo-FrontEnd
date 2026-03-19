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
        className="relative overflow-hidden text-center"
        style={{
          background: 'linear-gradient(135deg, var(--green-light) 0%, #fff 60%, #f9fdf9 100%)',
          padding: 'clamp(70px, 10vw, 130px) 0 clamp(60px, 8vw, 100px)',
        }}
      >
        {/* Decorative blob */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: '-120px', right: '-120px',
            width: '480px', height: '480px',
            background: 'radial-gradient(circle, rgba(77,123,101,0.1) 0%, transparent 70%)',
          }}
        />

        <div className="container relative z-[1]">
          {/* Label pill */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border bg-white px-[18px] py-[7px] text-[12px] font-semibold uppercase tracking-[2px]"
            style={{
              borderColor: 'var(--green-border)',
              fontFamily: 'var(--font-sub)',
              color: 'var(--green)',
            }}
          >
            <span
              className="h-[6px] w-[6px] animate-pulse rounded-full"
              style={{ background: 'var(--green)' }}
            />
            About Jem 8 Circle Trading Co.
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <h1
              className="mb-5 font-bold leading-snug"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(32px, 5vw, 60px)',
                color: 'var(--dark)',
                maxWidth: 700,
                textAlign: 'center',
                width: '100%',
              }}
            >
              "Your trusted source for<br />
              <em className="italic" style={{ color: 'var(--green)' }}>equipment and supplies.</em>"
            </h1>
          </div>

          <p
            className="text-center text-base leading-relaxed md:text-lg"
            style={{
              fontFamily: 'var(--font-sub)',
              color: 'var(--gray)',
              maxWidth: 600,
              margin: '0 auto 48px',
              textAlign: 'center',
            }}
          >
            We connect trading companies with the industrial equipment and supplies
            they need to operate at peak efficiency — reliably, seamlessly, at scale.
          </p>

          {/* Stats bar */}
          <div className="flex justify-center" style={{ paddingBottom: 'clamp(20px, 4vw, 48px)' }}>
            <div
              className="inline-flex overflow-hidden"
              style={{
                borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)',
                background: '#fff',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {[
                { num: stats.since,         label: 'Est. Year'  },
                { num: stats.employees,     label: 'Employees'  },
                { num: `${stats.clients}+`, label: 'Clients'    },
              ].map(({ num, label }, i, arr) => (
                <div
                  key={label}
                  className="text-center"
                  style={{
                    padding: '22px 40px',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span
                    className="block font-bold leading-none"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 30,
                      color: 'var(--green)',
                      marginBottom: 5,
                    }}
                  >
                    {num}
                  </span>
                  <span
                    className="block font-medium uppercase"
                    style={{
                      fontFamily: 'var(--font-sub)',
                      fontSize: 12,
                      color: 'var(--gray)',
                      letterSpacing: '1px',
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section
        className="bg-white"
        style={{ padding: 'clamp(60px, 8vw, 110px) 0' }}
      >
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

            {/* Mission */}
            <div
              className="relative overflow-hidden transition-all duration-300"
              style={{
                borderRadius: 'var(--r-xl)',
                padding: 'clamp(36px, 5vw, 56px)',
                border: '1px solid var(--border)',
                background: 'var(--dark)',
                boxShadow: 'var(--shadow-md)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              {/* decorative circle */}
              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  top: '-40px', right: '-40px',
                  width: 200, height: 200,
                  background: 'rgba(77,123,101,0.15)',
                }}
              />
              {/* badge */}
              <div
                className="mb-4 inline-block rounded-full font-bold uppercase"
                style={{
                  fontFamily: 'var(--font-sub)',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '5px 14px',
                  fontSize: 11,
                  letterSpacing: '3px',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                Our Mission
              </div>
              <h2
                className="font-bold leading-[1.25]"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(22px, 2.5vw, 30px)',
                  color: '#fff',
                  marginBottom: 18,
                }}
              >
                Advancing with heart, integrity, and smart systems.
              </h2>
              <p
                className="leading-[1.8]"
                style={{
                  fontFamily: 'var(--font-sub)',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.75)',
                  marginBottom: 28,
                }}
              >
                We advance JEM 8 Circle with heart, integrity, and smart systems. Through ethical distribution,
                structured processes, and strong teamwork, we develop confident, knowledgeable, and responsible
                leaders, expand our global reach, and create sustainable growth for both our people and the organization.
              </p>
              <div className="inline-flex items-center gap-[10px]">
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: 8, height: 8,
                    background: 'var(--green)',
                    boxShadow: '0 0 0 3px rgba(77,123,101,0.3)',
                  }}
                />
                <span
                  className="font-semibold"
                  style={{
                    fontFamily: 'var(--font-sub)',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Since {stats.since}
                </span>
              </div>
            </div>

            {/* Vision */}
            <div
              className="relative overflow-hidden transition-all duration-300"
              style={{
                borderRadius: 'var(--r-xl)',
                padding: 'clamp(36px, 5vw, 56px)',
                border: '1px solid var(--border)',
                background: 'var(--green-light)',
                boxShadow: 'var(--shadow-md)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  top: '-40px', right: '-40px',
                  width: 200, height: 200,
                  background: 'rgba(77,123,101,0.12)',
                }}
              />
              <div
                className="mb-4 inline-block rounded-full font-bold uppercase"
                style={{
                  fontFamily: 'var(--font-sub)',
                  background: 'rgba(77,123,101,0.15)',
                  padding: '5px 14px',
                  fontSize: 11,
                  letterSpacing: '3px',
                  color: 'var(--green)',
                }}
              >
                Our Vision
              </div>
              <h2
                className="font-bold leading-[1.25]"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(22px, 2.5vw, 30px)',
                  color: 'var(--dark)',
                  marginBottom: 18,
                }}
              >
                Where wellness fuels opportunity and purpose drives action.
              </h2>
              <p
                className="leading-[1.8]"
                style={{
                  fontFamily: 'var(--font-sub)',
                  fontSize: 15,
                  color: 'var(--gray)',
                }}
              >
                To create a world where wellness fuels opportunity, leaders inspire growth, and a united team
                transforms lives through passion, integrity, and purpose-driven action.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== LEADERSHIP ===== */}
      <section
        style={{
          background: 'var(--light-gray)',
          padding: 'clamp(60px, 8vw, 110px) 0',
        }}
      >
        <div className="container">
          {/* heading */}
          <div className="mb-[clamp(40px,6vw,64px)] text-center">
            <div
              className="mb-2 inline-flex items-center gap-2 rounded-full border bg-white px-[18px] py-[7px] text-[12px] font-semibold uppercase tracking-[2px]"
              style={{
                borderColor: 'var(--green-border)',
                fontFamily: 'var(--font-sub)',
                color: 'var(--green)',
              }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: 'var(--green)' }}
              />
              Our Team
            </div>
            <h2
              className="mt-2 block font-bold"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(26px, 3vw, 38px)',
                color: 'var(--dark)',
              }}
            >
              Leadership
            </h2>
            <p
              className="mt-2 leading-[1.8]"
              style={{
                fontFamily: 'var(--font-sub)',
                fontSize: 'clamp(15px, 1.8vw, 18px)',
                color: 'var(--gray)',
              }}
            >
              The people behind JEM 8 Circle Trading Co.
            </p>
          </div>

          {/* grid */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 max-[1100px]:grid-cols-3 max-[480px]:gap-[14px]">
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="overflow-hidden bg-white text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {/* image */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: '1/1', background: 'var(--green-light)' }}
                >
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="h-full w-full object-cover object-top"
                    onError={handleImageError}
                  />
                  {/* fallback initials */}
                  <div
                    className="absolute inset-0 hidden items-center justify-center font-bold"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 36,
                      color: 'var(--green)',
                      background: 'var(--green-light)',
                    }}
                  >
                    {getInitials(leader.name)}
                  </div>
                </div>
                {/* info */}
                <div style={{ padding: '16px 14px 18px' }}>
                  <div
                    className="font-bold leading-[1.4]"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--dark)',
                      marginBottom: 5,
                    }}
                  >
                    {leader.name}
                  </div>
                  <div
                    className="font-medium leading-[1.4]"
                    style={{
                      fontFamily: 'var(--font-sub)',
                      fontSize: 12,
                      color: 'var(--green)',
                    }}
                  >
                    {leader.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUSTED BANNER ===== */}
      <section
        className="relative overflow-hidden text-center"
        style={{
          background: 'var(--dark)',
          padding: 'clamp(60px, 8vw, 100px) 0',
        }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: '-80px', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(77,123,101,0.2) 0%, transparent 65%)',
          }}
        />
        <div className="container relative z-[1]">
          <h2
            className="font-bold leading-[1.2]"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(30px, 5vw, 58px)',
              color: '#fff',
              marginBottom: 20,
            }}
          >
            Your Trusted{' '}
            <span style={{ color: 'var(--green)' }}>Supply Partner</span>
          </h2>
          <p
            className="mx-auto text-center leading-[1.8]"
            style={{
              fontFamily: 'var(--font-sub)',
              fontSize: 'clamp(14px, 1.5vw, 17px)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 620,
              textAlign: 'center',
              margin: '0 auto',
            }}
          >
            From small businesses to established companies, we empower organizations of all sizes with office supplies,
            pantry and janitorial essentials, and health and wellness products — delivered with quality at the best price.
          </p>
        </div>
      </section>

      {/* ===== ABOUT DETAIL ===== */}
      <section
        className="bg-white"
        style={{ padding: 'clamp(60px, 8vw, 110px) 0' }}
      >
        <div className="container">
          <h2
            className="font-bold"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(26px, 3vw, 38px)',
              color: 'var(--dark)',
              marginBottom: 'clamp(36px, 5vw, 60px)',
              paddingBottom: 20,
              borderBottom: '2px solid var(--green-light)',
            }}
          >
            About JEM 8 Circle
          </h2>

          {detailRows.map((row, i) => (
            <div
              key={i}
              className="grid items-start gap-8"
              style={{
                gridTemplateColumns: '160px 1fr',
                padding: '36px 0',
                borderBottom: i < detailRows.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                className="font-bold leading-[1.5]"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  color: 'var(--green)',
                  paddingTop: 4,
                }}
              >
                {row.label.split('\n').map((l, j) => (
                  <span key={j}>{l}<br /></span>
                ))}
              </div>
              <div>
                <p
                  className="font-bold leading-[1.4]"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 17,
                    color: 'var(--dark)',
                    marginBottom: 10,
                  }}
                >
                  {row.title}
                </p>
                <p
                  className="leading-[1.8]"
                  style={{
                    fontFamily: 'var(--font-sub)',
                    fontSize: 15,
                    color: 'var(--gray)',
                  }}
                >
                  {row.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ENTERPRISE ===== */}
      <section
        style={{
          background: 'var(--light-gray)',
          padding: 'clamp(60px, 8vw, 110px) 0',
        }}
      >
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">

            {/* Left text */}
            <div>
              <div
                className="mb-4 inline-block rounded-full font-bold uppercase"
                style={{
                  fontFamily: 'var(--font-sub)',
                  background: 'var(--green-light)',
                  color: 'var(--green)',
                  fontSize: 11,
                  letterSpacing: '3px',
                  padding: '6px 14px',
                }}
              >
                Enterprise
              </div>
              <h2
                className="font-bold leading-[1.25]"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(26px, 3vw, 38px)',
                  color: 'var(--dark)',
                  marginBottom: 16,
                }}
              >
                Complete supply solutions for your business
              </h2>
              <p
                className="leading-[1.8]"
                style={{
                  fontFamily: 'var(--font-sub)',
                  fontSize: 15,
                  color: 'var(--gray)',
                  marginBottom: 28,
                }}
              >
                We provide a complete range of office supplies, pantry and janitorial supplies, and health and
                wellness products tailored to your business needs. Delivering quality at the best price —
                directly to your office.
              </p>
              <div className="mb-9 flex flex-col gap-3">
                {['Reliable Supply', 'Consistent Quality', 'Timely Delivery'].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 font-semibold"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 15,
                      color: 'var(--dark)',
                    }}
                  >
                    <span
                      className="flex shrink-0 items-center justify-content-center rounded-full font-bold text-white"
                      style={{
                        width: 24, height: 24,
                        background: 'var(--green)',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✓
                    </span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right image grid */}
            <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
              {['/img/download-2-3.png', '/img/download-1.png', '/img/download-1-2.png'].map((src, i) => (
                <div
                  key={i}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-md)',
                    aspectRatio: '3/4',
                    marginTop: i === 1 ? 24 : 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                >
                  <img
                    src={src}
                    alt={`Product ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section
        className="relative overflow-hidden text-center"
        style={{
          background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
          padding: 'clamp(60px, 8vw, 100px) 0',
        }}
      >
        {/* decorative circle */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: '-60px', right: '-60px',
            width: 300, height: 300,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div className="container relative z-[1]">
          <p
            className="font-bold leading-[1.25] text-white"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(26px, 3.5vw, 44px)',
              marginBottom: 12,
            }}
          >
            From our hands to your office.
          </p>
          <p
            className="mb-10"
            style={{
              fontFamily: 'var(--font-sub)',
              fontSize: 16,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            Ready to work with a trusted supply partner?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-[10px] bg-white font-bold transition-all duration-300"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--green)',
              borderRadius: 'var(--r-md)',
              padding: '16px 40px',
              fontSize: 16,
              boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.background = '#f0faf5';
              e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)';
            }}
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