import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE = 'http://127.0.0.1:8000';

const getInitials = (name) =>
  name.replace(/^(Ms\.|Mr\.)\s+/, '').split(' ').slice(0, 2).map((n) => n[0]).join('');

const resolveImg = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE}/storage/${path}`;
};

const About = () => {
  const [stats] = useState({ since: 2016, employees: '1–7', clients: 250 });

  // Leadership from API
  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(true);
  const [leadersError, setLeadersError] = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE}/api/leadership`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const visible = Array.isArray(data)
          ? data.filter((m) => m.status == 1 || m.status === true)
          : [];
        setLeaders(visible);
      })
      .catch((err) => {
        console.error('Failed to load leadership:', err);
        setLeadersError(true);
      })
      .finally(() => setLeadersLoading(false));
  }, []);

  return (
    <div className="pt-[76px] bg-white">
      {/* ===== HERO ===== */}
      <section className="bg-[linear-gradient(135deg,#edf4f0_0%,#fff_60%,#f9fdf9_100%)] py-[clamp(70px,10vw,130px)] px-0 text-center relative overflow-hidden">
        <div className="absolute top-[-120px] right-[-120px] w-[480px] h-[480px] bg-[radial-gradient(circle,rgba(77,123,101,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)] relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-[rgba(77,123,101,0.2)] rounded-[999px] py-[7px] px-[18px] font-['DM_Sans'] text-xs font-semibold text-[#4d7b65] uppercase tracking-[2px] mb-7">
            <span className="w-1.5 h-1.5 bg-[#4d7b65] rounded-full animate-[pulse_2s_infinite]"></span>
            About Jem 8 Circle Trading Co.
          </div>
          <h1 className="font-['Playfair_Display'] text-[clamp(32px,5vw,60px)] font-bold text-[#0d1b14] leading-[1.2] mb-5 max-w-[700px] mx-auto">
            "Your trusted source for<br /><em className="italic text-[#4d7b65] not-italic">equipment and supplies.</em>"
          </h1>
          <p className="font-['DM_Sans'] text-[clamp(15px,1.8vw,18px)] text-[#6b7280] leading-[1.8] max-w-[580px] mx-auto mb-12">
            We connect trading companies with the industrial equipment and supplies
            they need to operate at peak efficiency — reliably, seamlessly, at scale.
          </p>
          <div className="inline-flex bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="py-[22px] px-10 text-center border-r border-[rgba(0,0,0,0.08)]">
              <span className="block font-['Playfair_Display'] text-[30px] font-bold text-[#4d7b65] leading-none mb-1">{stats.since}</span>
              <span className="block font-['DM_Sans'] text-xs font-medium text-[#6b7280] uppercase tracking-[1px]">Est. Year</span>
            </div>
            <div className="py-[22px] px-10 text-center border-r border-[rgba(0,0,0,0.08)]">
              <span className="block font-['Playfair_Display'] text-[30px] font-bold text-[#4d7b65] leading-none mb-1">{stats.employees}</span>
              <span className="block font-['DM_Sans'] text-xs font-medium text-[#6b7280] uppercase tracking-[1px]">Employees</span>
            </div>
            <div className="py-[22px] px-10 text-center">
              <span className="block font-['Playfair_Display'] text-[30px] font-bold text-[#4d7b65] leading-none mb-1">{stats.clients}+</span>
              <span className="block font-['DM_Sans'] text-xs font-medium text-[#6b7280] uppercase tracking-[1px]">Clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section className="py-[clamp(60px,8vw,110px)] px-0 bg-white">
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-[#0d1b14] rounded-[28px] p-[clamp(36px,5vw,56px)] relative overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-250 hover:shadow-[0_16px_48px_rgba(0,0,0,0.14)] hover:-translate-y-1">
              <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-[rgba(77,123,101,0.15)] pointer-events-none"></div>
              <div className="inline-block font-['DM_Sans'] text-[11px] font-bold tracking-[3px] uppercase mb-4 py-1 px-3.5 rounded-[999px] bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.8)]">Our Mission</div>
              <h2 className="font-['Playfair_Display'] text-[clamp(22px,2.5vw,30px)] font-bold text-white leading-[1.25] mb-[18px]">Advancing with heart, integrity, and smart systems.</h2>
              <p className="font-['DM_Sans'] text-[15px] text-[rgba(255,255,255,0.75)] leading-[1.8] mb-7">
                We advance JEM 8 Circle with heart, integrity, and smart systems. Through ethical distribution,
                structured processes, and strong teamwork, we develop confident, knowledgeable, and responsible
                leaders, expand our global reach, and create sustainable growth for both our people and the organization.
              </p>
              <div className="inline-flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#4d7b65] shadow-[0_0_0_3px_rgba(77,123,101,0.3)]"></div>
                <span className="font-['DM_Sans'] text-[13px] font-semibold text-[rgba(255,255,255,0.6)]">Since {stats.since}</span>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-[#edf4f0] rounded-[28px] p-[clamp(36px,5vw,56px)] relative overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-250 hover:shadow-[0_16px_48px_rgba(0,0,0,0.14)] hover:-translate-y-1">
              <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-[rgba(77,123,101,0.12)] pointer-events-none"></div>
              <div className="inline-block font-['DM_Sans'] text-[11px] font-bold tracking-[3px] uppercase mb-4 py-1 px-3.5 rounded-[999px] bg-[rgba(77,123,101,0.15)] text-[#4d7b65]">Our Vision</div>
              <h2 className="font-['Playfair_Display'] text-[clamp(22px,2.5vw,30px)] font-bold text-[#0d1b14] leading-[1.25] mb-[18px]">Where wellness fuels opportunity and purpose drives action.</h2>
              <p className="font-['DM_Sans'] text-[15px] text-[#6b7280] leading-[1.8] mb-7">
                To create a world where wellness fuels opportunity, leaders inspire growth, and a united team
                transforms lives through passion, integrity, and purpose-driven action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LEADERSHIP ===== */}
      <section className="py-[clamp(60px,8vw,110px)] px-0 bg-[#f5f7f5]">
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)]">
          <div className="text-center mb-[clamp(40px,6vw,64px)]">
            <div className="inline-flex items-center gap-2 bg-white border border-[rgba(77,123,101,0.2)] rounded-[999px] py-[7px] px-[18px] font-['DM_Sans'] text-xs font-semibold text-[#4d7b65] uppercase tracking-[2px] mb-2 mx-auto">
              <span className="w-1.5 h-1.5 bg-[#4d7b65] rounded-full animate-[pulse_2s_infinite]"></span>
              Our Team
            </div>
            <h2 className="font-['Playfair_Display'] text-[clamp(26px,3.5vw,42px)] font-bold text-[#0d1b14] leading-[1.2] mt-2">Leadership</h2>
            <p className="font-['DM_Sans'] text-[clamp(15px,1.5vw,17px)] text-[#6b7280] leading-[1.75] max-w-[580px] mx-auto mb-0">
              The people behind JEM 8 Circle Trading Co.
            </p>
          </div>

          {/* Loading skeletons */}
          {leadersLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center opacity-60">
                  <div className="w-full aspect-square bg-[linear-gradient(90deg,#F1F5F9_25%,#E2E8F0_50%,#F1F5F9_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite] rounded-full"></div>
                  <div className="p-4 pb-[18px]">
                    <div className="h-3.5 w-[70%] bg-[#E2E8F0] rounded mb-2 animate-[shimmer_1.4s_infinite] bg-[linear-gradient(90deg,#F1F5F9_25%,#E2E8F0_50%,#F1F5F9_75%)] bg-[length:200%_100%]"></div>
                    <div className="h-2.5 w-[90%] bg-[#E2E8F0] rounded animate-[shimmer_1.4s_infinite] bg-[linear-gradient(90deg,#F1F5F9_25%,#E2E8F0_50%,#F1F5F9_75%)] bg-[length:200%_100%]"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!leadersLoading && leadersError && (
            <p className="text-center text-[#94A3B8] text-sm py-8 px-0">
              Unable to load team members at this time.
            </p>
          )}

          {/* Leaders grid */}
          {!leadersLoading && !leadersError && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {leaders.length === 0 ? (
                <p className="text-center text-[#94A3B8] text-sm col-span-full py-8 px-0">
                  No team members to display.
                </p>
              ) : (
                leaders.map((leader) => {
                  const imgSrc = resolveImg(leader.leadership_img);
                  return (
                    <div key={leader.leadership_id ?? leader.id} className="bg-white rounded-[20px] overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center transition-all duration-250 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-[5px] hover:border-[rgba(77,123,101,0.2)]">
                      <div className="w-full aspect-square bg-[#edf4f0] overflow-hidden relative">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={leader.name}
                            className="w-full h-full object-cover object-top transition-transform duration-400 hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fb = e.target.nextSibling;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="absolute inset-0 hidden items-center justify-center font-['Playfair_Display'] text-4xl font-bold text-[#4d7b65] bg-[#edf4f0]"
                          style={{ display: imgSrc ? 'none' : 'flex' }}
                        >
                          {getInitials(leader.name)}
                        </div>
                      </div>
                      <div className="p-4 pb-[18px]">
                        <div className="font-['Poppins'] text-[13px] font-bold text-[#0d1b14] mb-1 leading-[1.4]">{leader.name}</div>
                        <div className="font-['DM_Sans'] text-xs text-[#4d7b65] font-medium leading-[1.4]">{leader.position}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== TRUSTED BANNER ===== */}
      <section className="bg-[#0d1b14] py-[clamp(60px,8vw,100px)] px-0 text-center relative overflow-hidden">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(77,123,101,0.2)_0%,transparent_65%)] pointer-events-none"></div>
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)] relative z-10">
          <h2 className="font-['Playfair_Display'] text-[clamp(30px,5vw,58px)] font-bold text-white leading-[1.2] mb-5">
            Your Trusted <span className="text-[#4d7b65]">Supply Partner</span>
          </h2>
          <p className="font-['DM_Sans'] text-[clamp(14px,1.5vw,17px)] text-[rgba(255,255,255,0.65)] leading-[1.8] max-w-[620px] mx-auto">
            From small businesses to established companies, we empower organizations of all sizes with office supplies,
            pantry and janitorial essentials, and health and wellness products — delivered with quality at the best price.
          </p>
        </div>
      </section>

      {/* ===== ABOUT DETAIL ===== */}
      <section className="py-[clamp(60px,8vw,110px)] px-0 bg-white">
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)]">
          <h2 className="font-['Playfair_Display'] text-[clamp(26px,3vw,38px)] font-bold text-[#0d1b14] mb-[clamp(36px,5vw,60px)] pb-5 border-b-2 border-[#edf4f0]">About JEM 8 Circle</h2>

          {[
            {
              label: 'Who\nWe Are',
              title: 'Registered Business in Makati City',
              desc: `JEM 8 Circle Trading Co. is a registered business situated at Unit 202P, Cityland 10 Tower 1,
                HV Dela Costa St., Salcedo Village, Makati City. Established on July 22, 2016, the company
                operates primarily in the wholesale and retail trade sector and employs between ${stats.employees} staff members.`,
            },
            {
              label: 'Our\nReach',
              title: `${stats.clients} Clients Across Metro Manila & Laguna`,
              desc: `The company has accumulated ${stats.clients} clients as of August 2025 across different
                cities in both Metro Manila and Laguna, steadily growing its presence in the wholesale and retail trade sector.`,
            },
            {
              label: 'What\nWe Do',
              title: 'Office, Pantry, Janitorial & Wellness Products',
              desc: `JEM 8 Circle Trading Co. specializes in supplying office supplies, pantry and janitorial
                supplies, and health and wellness products — and believes in "Supply products with quality in the best price."`,
            },
            {
              label: 'Our\nTeam',
              title: 'Professional Service Rooted in Honesty & Integrity',
              desc: `With a professional team dedicated to understanding and fulfilling client needs promptly and
                at competitive prices, JEM 8 Circle Trading Co. delivers reliable service rooted in honesty and integrity.`,
            },
            {
              label: 'Why\nChoose Us',
              title: 'Direct Delivery. Lower Costs. Better Service.',
              desc: `The company offers stock supplies for quick delivery, helping businesses save on transportation
                and manpower costs by delivering office supplies and promotional items directly to their offices.`,
            },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8 py-9 border-b border-[rgba(0,0,0,0.08)] last:border-b-0 items-start transition-all duration-180">
              <div className="font-['Playfair_Display'] text-base font-bold text-[#4d7b65] leading-[1.5] pt-1 whitespace-pre-line">
                {row.label}
              </div>
              <div>
                <p className="font-['Poppins'] text-[17px] font-bold text-[#0d1b14] mb-2.5 leading-[1.4]">{row.title}</p>
                <p className="font-['DM_Sans'] text-[15px] text-[#6b7280] leading-[1.8]">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ENTERPRISE ===== */}
      <section className="py-[clamp(60px,8vw,110px)] px-0 bg-[#f5f7f5]">
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-[#edf4f0] text-[#4d7b65] font-['DM_Sans'] text-[11px] font-bold tracking-[3px] uppercase py-1.5 px-3.5 rounded-[999px] mb-4">Enterprise</div>
              <h2 className="font-['Playfair_Display'] text-[clamp(26px,3vw,38px)] font-bold text-[#0d1b14] mb-4 leading-[1.25]">Complete supply solutions for your business</h2>
              <p className="font-['DM_Sans'] text-[15px] text-[#6b7280] leading-[1.8] mb-7">
                We provide a complete range of office supplies, pantry and janitorial supplies, and health and
                wellness products tailored to your business needs. Delivering quality at the best price —
                directly to your office.
              </p>
              <div className="flex flex-col gap-3 mb-9">
                {['Reliable Supply', 'Consistent Quality', 'Timely Delivery'].map((f) => (
                  <div key={f} className="flex items-center gap-3 font-['Poppins'] text-[15px] font-semibold text-[#0d1b14]">
                    <span className="flex items-center justify-center w-6 h-6 bg-[#4d7b65] text-white rounded-full text-xs font-bold flex-shrink-0">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['/img/download-2-3.png', '/img/download-1.png', '/img/download-1-2.png'].map((src, i) => (
                <div key={i} className={`rounded-[12px] overflow-hidden aspect-[3/4] shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-250 hover:shadow-[0_16px_48px_rgba(0,0,0,0.14)] hover:-translate-y-1 ${i === 1 ? 'lg:mt-6' : ''}`}>
                  <img src={src} alt={`Product ${i + 1}`} className="w-full h-full object-cover transition-transform duration-400 hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[linear-gradient(135deg,#4d7b65_0%,#3a6350_100%)] py-[clamp(60px,8vw,100px)] px-0 text-center relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-[rgba(255,255,255,0.06)] pointer-events-none"></div>
        <div className="container max-w-[1280px] mx-auto px-[clamp(20px,5vw,80px)] relative z-10">
          <p className="font-['Playfair_Display'] text-[clamp(26px,3.5vw,44px)] font-bold text-white mb-3 leading-[1.25]">From our hands to your office.</p>
          <p className="font-['DM_Sans'] text-base text-[rgba(255,255,255,0.75)] mb-10">Ready to work with a trusted supply partner?</p>
          <a href="/contact" className="inline-flex items-center gap-2.5 px-10 py-4 bg-white text-[#4d7b65] rounded-[12px] font-['Poppins'] text-base font-bold shadow-[0_8px_28px_rgba(0,0,0,0.2)] transition-all duration-250 hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.25)] hover:bg-[#f0faf5]">
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