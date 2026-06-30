'use client';

import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const COUNTRY_CODES = [
  { code: '+1', label: 'US/CA' }, { code: '+44', label: 'UK' }, { code: '+91', label: 'IN' },
  { code: '+61', label: 'AU' }, { code: '+971', label: 'UAE' }, { code: '+49', label: 'DE' },
  { code: '+33', label: 'FR' }, { code: '+81', label: 'JP' }, { code: '+86', label: 'CN' },
  { code: '+55', label: 'BR' }, { code: '+7', label: 'RU' }, { code: '+27', label: 'ZA' },
  { code: '+82', label: 'KR' }, { code: '+39', label: 'IT' }, { code: '+34', label: 'ES' },
  { code: '+62', label: 'ID' }, { code: '+90', label: 'TR' }, { code: '+31', label: 'NL' },
  { code: '+41', label: 'CH' }, { code: '+46', label: 'SE' }, { code: '+48', label: 'PL' },
  { code: '+32', label: 'BE' }, { code: '+43', label: 'AT' }, { code: '+45', label: 'DK' },
  { code: '+358', label: 'FI' }, { code: '+47', label: 'NO' }, { code: '+351', label: 'PT' },
  { code: '+30', label: 'GR' }, { code: '+420', label: 'CZ' }, { code: '+36', label: 'HU' },
  { code: '+60', label: 'MY' }, { code: '+63', label: 'PH' }, { code: '+65', label: 'SG' },
  { code: '+66', label: 'TH' }, { code: '+84', label: 'VN' }, { code: '+92', label: 'PK' },
  { code: '+880', label: 'BD' }, { code: '+94', label: 'LK' }, { code: '+977', label: 'NP' },
  { code: '+93', label: 'AF' }, { code: '+98', label: 'IR' }, { code: '+964', label: 'IQ' },
  { code: '+966', label: 'SA' }, { code: '+972', label: 'IL' }, { code: '+973', label: 'BH' },
  { code: '+974', label: 'QA' }, { code: '+965', label: 'KW' }, { code: '+968', label: 'OM' },
  { code: '+962', label: 'JO' }, { code: '+961', label: 'LB' }, { code: '+963', label: 'SY' },
  { code: '+20', label: 'EG' }, { code: '+212', label: 'MA' }, { code: '+213', label: 'DZ' },
  { code: '+216', label: 'TN' }, { code: '+218', label: 'LY' }, { code: '+249', label: 'SD' },
  { code: '+234', label: 'NG' }, { code: '+254', label: 'KE' }, { code: '+255', label: 'TZ' },
  { code: '+256', label: 'UG' }, { code: '+233', label: 'GH' }, { code: '+225', label: 'CI' },
  { code: '+237', label: 'CM' }, { code: '+221', label: 'SN' }, { code: '+244', label: 'AO' },
  { code: '+258', label: 'MZ' }, { code: '+260', label: 'ZM' }, { code: '+263', label: 'ZW' },
  { code: '+52', label: 'MX' }, { code: '+54', label: 'AR' }, { code: '+56', label: 'CL' },
  { code: '+57', label: 'CO' }, { code: '+51', label: 'PE' }, { code: '+58', label: 'VE' },
  { code: '+593', label: 'EC' }, { code: '+591', label: 'BO' }, { code: '+595', label: 'PY' },
  { code: '+598', label: 'UY' }, { code: '+502', label: 'GT' }, { code: '+503', label: 'SV' },
  { code: '+504', label: 'HN' }, { code: '+505', label: 'NI' }, { code: '+506', label: 'CR' },
  { code: '+507', label: 'PA' }, { code: '+53', label: 'CU' }, { code: '+1809', label: 'DO' },
  { code: '+1876', label: 'JM' }, { code: '+1868', label: 'TT' }, { code: '+1242', label: 'BS' },
  { code: '+353', label: 'IE' }, { code: '+354', label: 'IS' }, { code: '+352', label: 'LU' },
  { code: '+356', label: 'MT' }, { code: '+357', label: 'CY' }, { code: '+370', label: 'LT' },
  { code: '+371', label: 'LV' }, { code: '+372', label: 'EE' }, { code: '+380', label: 'UA' },
  { code: '+375', label: 'BY' }, { code: '+373', label: 'MD' }, { code: '+995', label: 'GE' },
  { code: '+374', label: 'AM' }, { code: '+994', label: 'AZ' }, { code: '+7', label: 'KZ' },
  { code: '+998', label: 'UZ' }, { code: '+993', label: 'TM' }, { code: '+992', label: 'TJ' },
  { code: '+996', label: 'KG' }
];

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('signup'); // 'signup' or 'login'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sign Up States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupCountryCode, setSignupCountryCode] = useState("+91");
  const [signupNature, setSignupNature] = useState("");

  // Log In States
  const [loginEmail, setLoginEmail] = useState("");

  if (!isOpen) return null;

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!signupName || !signupEmail || !signupPhone || !signupNature) return;

    // Validation Logic
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(signupName)) {
       setErrorMsg("Player Name can only contain letters and numbers (no spaces or symbols).");
       return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
       setErrorMsg("Please enter a valid email address.");
       return;
    }
    const fakeDomains = ["tempmail.com", "mailinator.com", "10minutemail.com", "guerrillamail.com", "temp-mail.org", "yopmail.com"];
    const domain = signupEmail.split('@')[1]?.toLowerCase();
    if (fakeDomains.includes(domain)) {
       setErrorMsg("Disposable email addresses are not allowed.");
       return;
    }
    const phoneRegex = /^[0-9]{7,15}$/;
    const rawPhone = signupPhone.replace(/\D/g, ''); // strip non-digits
    if (!phoneRegex.test(rawPhone)) {
       setErrorMsg("Please enter a valid mobile number.");
       return;
    }

    setIsSubmitting(true);
    
    try {
      // Check for uniqueness of username
      const { data: existingUser, error: existError } = await supabase
         .from('users')
         .select('name')
         .ilike('name', signupName)
         .maybeSingle();

      if (existingUser) {
         setErrorMsg(`Username "${signupName}" is already taken.`);
         setIsSubmitting(false);
         return;
      }
      const fullPhone = `${signupCountryCode}${rawPhone}`;
      const { data, error } = await supabase.from('users').insert([
        { name: signupName, email: signupEmail, phone: fullPhone, nature: signupNature }
      ]).select('*');

      if (error) {
         console.error("Supabase error:", error);
         setErrorMsg(`Supabase Error: ${error.message}.`);
      } else {
         if (typeof window !== 'undefined') {
            const userData = data && data.length > 0 ? data[0] : { name: signupName, email: signupEmail, nature: signupNature };
            localStorage.setItem('dripp_user', JSON.stringify(userData));
         }
         setIsSuccess(true);
         setTimeout(() => {
             setIsSuccess(false);
             if (onLoginSuccess) onLoginSuccess();
             onClose();
         }, 1500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred.");
    }
    setIsSubmitting(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!loginEmail) return;

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', loginEmail);

      if (error) {
         console.error("Supabase error:", error);
         setErrorMsg(`Error fetching user: ${error.message}`);
      } else if (!data || data.length === 0) {
         setErrorMsg("No account found with this email. Please sign up.");
      } else {
         const userData = data[0];
         if (typeof window !== 'undefined') {
            localStorage.setItem('dripp_user', JSON.stringify(userData));
         }
         setIsSuccess(true);
         setTimeout(() => {
             setIsSuccess(false);
             if (onLoginSuccess) onLoginSuccess();
             onClose();
         }, 1500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred.");
    }
    setIsSubmitting(false);
  };

  return (
    <div 
      onClick={(e) => {
         if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'rgba(5, 5, 5, 0.6)', backdropFilter: 'blur(12px)',
        animation: 'modalFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        padding: '20px'
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(30,30,30,0.7) 0%, rgba(15,15,15,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '440px',
        animation: 'modalScaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Top decorative glow */}
        <div style={{
           position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
           width: '200px', height: '200px', background: 'var(--brand-yellow)',
           filter: 'blur(90px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Close Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', borderRadius: '50%', width: '36px', height: '36px',
            display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem',
            cursor: 'pointer', zIndex: 10, transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          title="Skip & Continue Playing"
        >
          ✕
        </button>
        
        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '30px 0', animation: 'modalScaleUp 0.5s ease' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand-yellow)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px rgba(235, 215, 63, 0.4)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--deep-black)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
             </div>
             <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.4rem', color: 'var(--brand-yellow)', letterSpacing: '1px' }}>PROFILE SECURED</h2>
             <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Personalizing your experience...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px' }}>
                <button 
                    onClick={() => { setErrorMsg(""); setActiveTab('signup'); }}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'signup' ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.3)',
                        fontFamily: "'Panchang', sans-serif", fontSize: '1rem', cursor: 'pointer', letterSpacing: '1px',
                        paddingBottom: '8px', borderBottom: activeTab === 'signup' ? '2px solid var(--brand-yellow)' : '2px solid transparent',
                        transition: 'all 0.3s ease'
                    }}
                >
                    SIGN UP
                </button>
                <button 
                    onClick={() => { setErrorMsg(""); setActiveTab('login'); }}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'login' ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.3)',
                        fontFamily: "'Panchang', sans-serif", fontSize: '1rem', cursor: 'pointer', letterSpacing: '1px',
                        paddingBottom: '8px', borderBottom: activeTab === 'login' ? '2px solid var(--brand-yellow)' : '2px solid transparent',
                        transition: 'all 0.3s ease'
                    }}
                >
                    LOG IN
                </button>
            </div>

            <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.6rem', color: 'var(--pure-white)', marginBottom: '12px', letterSpacing: '1px' }}>
              PERSONALIZE
            </h2>
            <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '35px', lineHeight: 1.5, padding: '0 10px' }}>
              Create your custom gaming profile to save your high scores and unlock a tailored experience.
            </p>
            
            <form onSubmit={activeTab === 'signup' ? handleSignup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                 <div style={{ background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', color: '#ff6b6b', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', fontFamily: "'Clash Display', sans-serif" }}>
                    {errorMsg}
                 </div>
              )}
              
              {activeTab === 'signup' && (
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="modern-input"
                      placeholder="Player Name" 
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      required
                      autoComplete="off"
                      style={{
                        width: '100%', padding: '18px 24px', borderRadius: '16px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
              )}

              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="modern-input"
                  placeholder="Email Address" 
                  value={activeTab === 'signup' ? signupEmail : loginEmail}
                  onChange={e => activeTab === 'signup' ? setSignupEmail(e.target.value) : setLoginEmail(e.target.value)}
                  required
                  autoComplete="off"
                  style={{
                    width: '100%', padding: '18px 24px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
              
              {activeTab === 'signup' && (
                  <>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ position: 'relative' }}>
                       <select 
                         className="modern-input"
                         value={signupCountryCode}
                         onChange={e => setSignupCountryCode(e.target.value)}
                         style={{
                           padding: '18px 30px 18px 10px', borderRadius: '16px',
                           background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                           color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem',
                           outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', 
                           minWidth: '95px', textAlign: 'center', position: 'relative', zIndex: 2
                         }}
                       >
                         {COUNTRY_CODES.map((c) => (
                            <option key={c.code+c.label} value={c.code} style={{color: 'black'}}>{c.code} ({c.label})</option>
                         ))}
                       </select>
                       <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, color: 'rgba(255,255,255,0.5)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <polyline points="6 9 12 15 18 9"></polyline>
                       </svg>
                     </div>
                     <input 
                       type="tel" 
                       className="modern-input"
                       placeholder="Mobile Number" 
                       value={signupPhone}
                       onChange={e => setSignupPhone(e.target.value)}
                       required
                       autoComplete="off"
                       style={{
                         flex: 1, padding: '18px 24px', borderRadius: '16px',
                         background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                         color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem',
                         outline: 'none', boxSizing: 'border-box'
                       }}
                     />
                  </div>
                  <div style={{ position: 'relative' }}>
                     <select 
                       className="modern-input"
                       value={signupNature}
                       onChange={e => setSignupNature(e.target.value)}
                       required
                       style={{
                         width: '100%', padding: '18px 24px', borderRadius: '16px',
                         background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                         color: signupNature ? 'white' : 'rgba(255,255,255,0.4)', 
                         fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem',
                         outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
                         position: 'relative', zIndex: 2
                       }}
                     >
                       <option value="" disabled style={{ color: 'black' }}>Select Persona...</option>
                       <option value="Creative Personel" style={{ color: 'black' }}>Creative Personel</option>
                       <option value="Business Person" style={{ color: 'black' }}>Business Person</option>
                       <option value="General User" style={{ color: 'black' }}>General User</option>
                     </select>
                     <svg style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, color: 'rgba(255,255,255,0.5)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                     </svg>
                  </div>
                  </>
              )}
              
              <button type="submit" disabled={isSubmitting} className="modern-btn" style={{
                marginTop: '15px', width: '100%', padding: '20px', borderRadius: '16px',
                background: isSubmitting ? 'rgba(255,255,255,0.05)' : 'var(--brand-yellow)', 
                border: 'none',
                color: isSubmitting ? 'rgba(255,255,255,0.5)' : 'var(--deep-black)', 
                fontFamily: "'Panchang', sans-serif", fontSize: '0.95rem', cursor: isSubmitting ? 'wait' : 'pointer',
                letterSpacing: '1px', transition: 'all 0.3s ease',
                boxShadow: isSubmitting ? 'none' : '0 10px 25px rgba(235, 215, 63, 0.25)'
              }}
              onMouseEnter={e => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {isSubmitting ? 'INITIALIZING...' : (activeTab === 'signup' ? 'SAVE PROFILE' : 'ACCESS PROFILE')}
              </button>
            </form>
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(12px); } }
        @keyframes modalScaleUp { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .modern-input { transition: all 0.3s ease; }
        .modern-input:-webkit-autofill, .modern-input:-webkit-autofill:hover, .modern-input:-webkit-autofill:focus, .modern-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #151515 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        .modern-input:focus { border-color: var(--brand-yellow) !important; box-shadow: 0 0 20px rgba(235, 215, 63, 0.1) !important; background: rgba(255, 255, 255, 0.04) !important; }
      `}} />
    </div>
  );
}
