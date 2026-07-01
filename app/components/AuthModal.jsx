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
const SECURITY_QUOTES = [
  "I am the master of my fate",
  "Stay hungry, stay foolish",
  "To infinity and beyond",
  "May the force be with you",
  "Just do it",
  "Hakuna Matata"
];

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'signup' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'signup' or 'login'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMsg("");
    }
  }, [isOpen, initialTab]);

  // Sign Up States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupCountryCode, setSignupCountryCode] = useState("+91");
  const [signupNature, setSignupNature] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [signupSecurityPhrase, setSignupSecurityPhrase] = useState("");
  
  // Reset Password States
  const [resetEmail, setResetEmail] = useState("");
  const [resetSecurityPhrase, setResetSecurityPhrase] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");


  // Log In States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  if (!isOpen) return null;

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!signupName || !signupEmail || !signupPhone || !signupNature || !signupPassword) return;

    // Validation Logic
    const trimmedName = signupName.trim();
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(trimmedName)) {
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

    if (signupPassword.length > 20 || !/^[a-zA-Z0-9]+$/.test(signupPassword)) {
       setErrorMsg("Password must be up to 20 alphanumeric characters only.");
       return;
    }

    setIsSubmitting(true);
    
    try {
      const fullPhone = `${signupCountryCode}${rawPhone}`;

      // Check for uniqueness of email or phone
      const { data: existingEmailPhone } = await supabase
         .from('users')
         .select('email, phone')
         .or(`email.eq.${signupEmail},phone.eq.${fullPhone}`);

      if (existingEmailPhone && existingEmailPhone.length > 0) {
         setErrorMsg("An account with this email or phone number already exists.");
         setIsSubmitting(false);
         return;
      }

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
      
      const { data, error } = await supabase.from('users').insert([
        { name: signupName, email: signupEmail, phone: fullPhone, nature: signupNature, password: signupPassword, security_phrase: signupSecurityPhrase }
      ]).select('*');

      if (error) {
         console.error("Supabase error:", error);
         setErrorMsg(`Supabase Error: ${error.message}.`);
      } else {
         if (typeof window !== 'undefined') {
            const userData = data && data.length > 0 ? data[0] : { name: signupName, email: signupEmail, nature: signupNature };
            localStorage.setItem('dripp_user', JSON.stringify(userData));
            if (userData.highscore !== undefined) {
                localStorage.setItem('dripp_highScore', userData.highscore.toString());
            } else {
                localStorage.setItem('dripp_highScore', '0');
            }
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

  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!resetEmail || !resetSecurityPhrase || !resetNewPassword) return;

    if (resetNewPassword.length > 20 || !/^[a-zA-Z0-9]+$/.test(resetNewPassword)) {
       setErrorMsg("New password must be up to 20 alphanumeric characters only.");
       return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', resetEmail)
        .eq('security_phrase', resetSecurityPhrase);

      if (error || !data || data.length === 0) {
         setErrorMsg("Invalid email or secret recovery phrase.");
      } else {
         const user = data[0];
         const { error: updateError } = await supabase
            .from('users')
            .update({ password: resetNewPassword })
            .eq('id', user.id);

         if (updateError) {
             setErrorMsg(`Error updating password: ${updateError.message}`);
         } else {
             setIsSuccess(true);
             setTimeout(() => {
                 setIsSuccess(false);
                 setActiveTab('login');
             }, 1500);
         }
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
    if (!loginEmail || !loginPassword) return;

    setIsSubmitting(true);
    
    try {
      let query = supabase.from('users').select('*');
      if (loginEmail.includes('@')) {
        query = query.eq('email', loginEmail);
      } else {
        query = query.ilike('name', loginEmail);
      }
      const { data, error } = await query;

      if (error) {
         console.error("Supabase error:", error);
         setErrorMsg(`Error fetching user: ${error.message}`);
      } else if (!data || data.length === 0) {
         setErrorMsg("Email or Player Tag not found, or not registered.");
      } else {
         const userData = data[0];
         if (userData.password !== loginPassword) {
            setErrorMsg("Incorrect password. Please try again.");
         } else {
            if (typeof window !== 'undefined') {
               localStorage.setItem('dripp_user', JSON.stringify(userData));
               if (userData.highscore !== undefined) {
                   localStorage.setItem('dripp_highScore', userData.highscore.toString());
               }
            }
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                if (onLoginSuccess) onLoginSuccess();
                onClose();
            }, 1500);
         }
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
      <style>{`
        @media (max-width: 768px) {
          .auth-modal-content {
             transform: scale(0.9) translateY(0) !important;
             transform-origin: center center;
             padding: 24px 20px !important;
          }
        }
      `}</style>
      <div className="auth-modal-content" style={{
        background: 'linear-gradient(160deg, rgba(30,30,30,0.7) 0%, rgba(15,15,15,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', padding: '16px 20px', width: '100%', maxWidth: '320px',
        animation: 'modalScaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Top decorative glow */}
        <div style={{
           position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
           width: '150px', height: '150px', background: 'var(--brand-yellow)',
           filter: 'blur(70px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Close Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem',
            cursor: 'pointer', zIndex: 10, transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          title="Skip & Continue Playing"
        >
          ✕
        </button>
        
        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0', animation: 'modalScaleUp 0.5s ease' }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-yellow)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px rgba(235, 215, 63, 0.4)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--deep-black)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
             </div>
             <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: 'var(--brand-yellow)', letterSpacing: '1px' }}>PROFILE SECURED</h2>
             <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Personalizing your experience...</p>
          </div>
        ) : (
          <>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
                <button 
                    onClick={() => { setErrorMsg(""); setActiveTab('signup'); }}
                    style={{
                        background: 'none', border: 'none', color: activeTab === 'signup' ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.3)',
                        fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '1px',
                        paddingBottom: '6px', borderBottom: activeTab === 'signup' ? '2px solid var(--brand-yellow)' : '2px solid transparent',
                        transition: 'all 0.3s ease'
                    }}
                >
                    SIGN UP
                </button>
                <button 
                    onClick={() => { setErrorMsg(""); setActiveTab('login'); }}
                    style={{
                        background: 'none', border: 'none', color: (activeTab === 'login' || activeTab === 'forgot_password') ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.3)',
                        fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '1px',
                        paddingBottom: '6px', borderBottom: (activeTab === 'login' || activeTab === 'forgot_password') ? '2px solid var(--brand-yellow)' : '2px solid transparent',
                        transition: 'all 0.3s ease'
                    }}
                >
                    LOG IN
                </button>
            </div>


            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ 
                width: '34px', height: '34px', borderRadius: '10px', 
                background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.15), rgba(235, 215, 63, 0.05))', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(235, 215, 63, 0.3)', boxShadow: '0 4px 15px rgba(235, 215, 63, 0.15)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 style={{ 
                fontFamily: "'Panchang', sans-serif", fontSize: '1.6rem', margin: 0,
                background: 'linear-gradient(135deg, #fff 0%, var(--brand-yellow) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' 
              }}>
                DRIPP ID
              </h2>
            </div>
            <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: 1.3, padding: '0 10px', display: activeTab === 'signup' ? 'none' : 'block' }}>
              Establish your digital identity to secure your high scores.
            </p>
            
            <form onSubmit={activeTab === 'signup' ? handleSignup : activeTab === 'forgot_password' ? handleResetPassword : handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
              {errorMsg && (
                 <div style={{ marginBottom: '12px', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', color: '#ff6b6b', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }}>
                    {errorMsg}
                 </div>
              )}
              
              <div style={{
                  display: 'grid', gridTemplateRows: activeTab === 'signup' ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
                  opacity: activeTab === 'signup' ? 1 : 0
              }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ position: 'relative', paddingBottom: activeTab === 'signup' ? '12px' : '0', transition: 'padding 0.4s ease' }}>
                      <input 
                        type="text" 
                        className="modern-input"
                        placeholder="Player Name" 
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        required={activeTab === 'signup'}
                        autoComplete="off"
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                          color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                          outline: 'none', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
              </div>

              <div style={{ position: 'relative', paddingBottom: '8px' }}>
                <input 
                  type={activeTab === 'login' ? "text" : "email"} 
                  className="modern-input"
                  placeholder={activeTab === 'login' ? "Email or Player Tag" : "Email Address"} 
                  value={activeTab === 'signup' ? signupEmail : activeTab === 'forgot_password' ? resetEmail : loginEmail}
                  onChange={e => activeTab === 'signup' ? setSignupEmail(e.target.value) : activeTab === 'forgot_password' ? setResetEmail(e.target.value) : setLoginEmail(e.target.value)}
                  required
                  autoComplete="off"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ position: 'relative', paddingBottom: '8px' }}>
                <input 
                  type={activeTab === 'signup' && showPassword ? 'text' : 'password'} 
                  className="modern-input"
                  placeholder={activeTab === 'forgot_password' ? "New Password" : "Password"} 
                  value={activeTab === 'signup' ? signupPassword : activeTab === 'forgot_password' ? resetNewPassword : loginPassword}
                  onChange={e => activeTab === 'signup' ? setSignupPassword(e.target.value) : activeTab === 'forgot_password' ? setResetNewPassword(e.target.value) : setLoginPassword(e.target.value)}
                  required
                  maxLength={20}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
                {activeTab === 'signup' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '15px', top: '15px',
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                )}

                {activeTab === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: '8px' }}>
                     <button type="button" onClick={() => { setErrorMsg(""); setActiveTab('forgot_password'); }} style={{ background: 'none', border: 'none', color: 'var(--brand-yellow)', fontSize: '0.8rem', fontFamily: "'Clash Display', sans-serif", cursor: 'pointer', opacity: 0.8 }}>Forgot Password?</button>
                  </div>
                )}
                {activeTab === 'forgot_password' && (
                  <div style={{ marginTop: '12px' }}>
                    <select 
                      className="modern-input"
                      value={resetSecurityPhrase}
                      onChange={e => setResetSecurityPhrase(e.target.value)}
                      required={activeTab === 'forgot_password'}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        color: resetSecurityPhrase ? 'white' : 'rgba(255,255,255,0.4)', 
                        fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                        outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
                      }}
                    >
                      <option value="" disabled>Select Security Quote...</option>
                      {SECURITY_QUOTES.map(quote => (
                        <option key={quote} value={quote} style={{color: 'black'}}>{quote}</option>
                      ))}
                    </select>
                    <svg style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                )}
              </div>
              
              <div style={{

                  display: 'grid', gridTemplateRows: activeTab === 'signup' ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
                  opacity: activeTab === 'signup' ? 1 : 0
              }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: activeTab === 'signup' ? '12px' : '0', transition: 'padding 0.4s ease' }}>
                      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                         <div style={{ position: 'relative', flexShrink: 0 }}>
                           <select 
                             className="modern-input"
                             value={signupCountryCode}
                             onChange={e => setSignupCountryCode(e.target.value)}
                             style={{
                               padding: '10px 24px 10px 8px', borderRadius: '12px',
                               background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                               color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                               outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', 
                               minWidth: '85px', textAlign: 'center', position: 'relative', zIndex: 2
                             }}
                           >
                             {COUNTRY_CODES.map((c) => (
                                <option key={c.code+c.label} value={c.code} style={{color: 'black'}}>{c.code} ({c.label})</option>
                             ))}
                           </select>
                           <svg style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, color: 'rgba(255,255,255,0.5)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <polyline points="6 9 12 15 18 9"></polyline>
                           </svg>
                         </div>
                         <input 
                           type="tel" 
                           className="modern-input"
                           placeholder="Mobile Number" 
                           value={signupPhone}
                           onChange={e => setSignupPhone(e.target.value)}
                           required={activeTab === 'signup'}
                           autoComplete="off"
                           style={{
                             flex: '1 1 auto', minWidth: 0, width: '100%', padding: '10px 14px', borderRadius: '12px',
                             background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                             color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                             outline: 'none', boxSizing: 'border-box'
                           }}
                         />
                      </div>
                      <div style={{ position: 'relative' }}>
                         <select 
                           className="modern-input"
                           value={signupNature}
                           onChange={e => setSignupNature(e.target.value)}
                           required={activeTab === 'signup'}
                           style={{
                             width: '100%', padding: '10px 14px', borderRadius: '12px',
                             background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                             color: signupNature ? 'white' : 'rgba(255,255,255,0.4)', 
                             fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                             outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
                           }}
                         >
                           <option value="" disabled>Select Persona...</option>
                           <option value="business" style={{color: 'black'}}>Business Persona</option>
                           <option value="creative" style={{color: 'black'}}>Creative Explorer</option>
                           <option value="general" style={{color: 'black'}}>General User</option>
                         </select>
                         <svg style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <polyline points="6 9 12 15 18 9"></polyline>
                         </svg>
                      </div>
                      <div style={{ position: 'relative' }}>
                         <select 
                           className="modern-input"
                           value={signupSecurityPhrase}
                           onChange={e => setSignupSecurityPhrase(e.target.value)}
                           required={activeTab === 'signup'}
                           style={{
                             width: '100%', padding: '10px 14px', borderRadius: '12px',
                             background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                             color: signupSecurityPhrase ? 'white' : 'rgba(255,255,255,0.4)', 
                             fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem',
                             outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
                           }}
                         >
                           <option value="" disabled>Select Security Quote...</option>
                           {SECURITY_QUOTES.map(quote => (
                             <option key={quote} value={quote} style={{color: 'black'}}>{quote}</option>
                           ))}
                         </select>
                         <svg style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <polyline points="6 9 12 15 18 9"></polyline>
                         </svg>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '4px', padding: '0 4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                          Your data is fully secure. We only collect this to personalize your journey, unlock exclusive features, and verify real players.
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="modern-btn" style={{
                marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px',
                background: isSubmitting ? 'rgba(255,255,255,0.05)' : 'var(--brand-yellow)', 
                border: 'none',
                color: isSubmitting ? 'rgba(255,255,255,0.5)' : 'var(--deep-black)', 
                fontFamily: "'Panchang', sans-serif", fontSize: '0.85rem', cursor: isSubmitting ? 'wait' : 'pointer',
                letterSpacing: '1px', transition: 'all 0.3s ease',
                boxShadow: isSubmitting ? 'none' : '0 10px 25px rgba(235, 215, 63, 0.25)'
              }}
              onMouseEnter={e => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {isSubmitting ? 'INITIALIZING...' : activeTab === 'forgot_password' ? 'RESET PASSWORD' : (activeTab === 'signup' ? 'SAVE PROFILE' : 'ACCESS PROFILE')}
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
