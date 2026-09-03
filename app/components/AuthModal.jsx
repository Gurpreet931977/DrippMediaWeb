'use client';

import React, { useState, useEffect } from 'react';

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

const PERSONAS = [
  { 
    id: 'creative', 
    label: 'Creative', 
    badge: 'Creator', 
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
      </svg>
    )
  },
  { 
    id: 'business', 
    label: 'Business', 
    badge: 'Founder', 
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    )
  },
  { 
    id: 'general', 
    label: 'Arcade', 
    badge: 'Player', 
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
      </svg>
    )
  }
];

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'signup' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'signup' | 'login' | 'forgot_password'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupCountryCode, setSignupCountryCode] = useState("+91");
  const [signupNature, setSignupNature] = useState("creative");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupSecurityPhrase, setSignupSecurityPhrase] = useState("");
  
  // Reset Password States
  const [resetEmail, setResetEmail] = useState("");
  const [resetSecurityPhrase, setResetSecurityPhrase] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  // Log In States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMsg("");
      setIsSuccess(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const pwStrength = getPasswordStrength(signupPassword);
  const strengthLabels = ['Too Short', 'Fair', 'Good', 'Strong', 'Encrypted'];

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!signupName || !signupEmail || !signupPhone || !signupNature || !signupPassword || !signupSecurityPhrase) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    const trimmedName = signupName.trim();
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(trimmedName)) {
      setErrorMsg("Player Name can only contain letters and numbers (no spaces).");
      return;
    }

    if (!signupSecurityPhrase.trim()) {
      setErrorMsg("Please select a recovery security quote.");
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
    const rawPhone = signupPhone.replace(/\D/g, '');
    if (!phoneRegex.test(rawPhone)) {
      setErrorMsg("Please enter a valid mobile number.");
      return;
    }

    if (signupPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const fullPhone = `${signupCountryCode}${rawPhone}`;

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: fullPhone,
          nature: signupNature,
          password: signupPassword,
          security_phrase: signupSecurityPhrase
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMsg(result.error || "Failed to create account.");
        setIsSubmitting(false);
      } else {
        if (typeof window !== 'undefined') {
          const { _authToken, ...userData } = result;
          localStorage.setItem('dripp_user', JSON.stringify(userData));
          if (_authToken) localStorage.setItem('dripp_auth_token', _authToken);
          if (userData.highscore !== undefined) {
            localStorage.setItem('dripp_highScore', userData.highscore.toString());
          } else {
            localStorage.setItem('dripp_highScore', '0');
          }
        }
        setIsSubmitting(false);
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
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!resetEmail || !resetSecurityPhrase || !resetNewPassword) {
      setErrorMsg("Please fill in all recovery fields.");
      return;
    }

    if (resetNewPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          security_phrase: resetSecurityPhrase,
          new_password: resetNewPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMsg(result.error || "Invalid email or secret recovery phrase.");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setActiveTab('login');
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
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please enter your credentials.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMsg(result.error || "Email or Usertag not found, or not registered.");
        setIsSubmitting(false);
      } else {
        if (typeof window !== 'undefined') {
          const { _authToken, ...userData } = result;
          localStorage.setItem('dripp_user', JSON.stringify(userData));
          if (_authToken) localStorage.setItem('dripp_auth_token', _authToken);
          if (userData.highscore !== undefined) {
            localStorage.setItem('dripp_highScore', userData.highscore.toString());
          }
        }
        setIsSubmitting(false);
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
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="dripp-auth-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dripp-auth-card">
        {/* Subtle Ambient Glow */}
        <div className="auth-ambient-glow" />

        {/* Close Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="auth-close-btn"
          title="Close Modal"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {isSuccess ? (
          <div className="auth-success-screen">
            <div className="auth-success-badge">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="auth-success-tag">VERIFIED</div>
            <h2 className="auth-success-title">DRIPP ID SECURED</h2>
            <p className="auth-success-sub">Player pass active. Accessing member vault...</p>
            <div className="auth-success-progress"><div className="auth-progress-fill" /></div>
          </div>
        ) : (
          <>
            {/* Top Row: Segmented Nav Tabs */}
            <div className="auth-top-row">
              <div className="auth-nav-track">
                <button 
                  type="button"
                  onClick={() => { setErrorMsg(""); setActiveTab('signup'); }}
                  className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                >
                  <span>SIGN UP</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setErrorMsg(""); setActiveTab('login'); }}
                  className={`auth-tab-btn ${activeTab === 'login' || activeTab === 'forgot_password' ? 'active' : ''}`}
                >
                  <span>LOG IN</span>
                </button>
              </div>
            </div>

            {/* Clean, Premium Header */}
            <div className="auth-header-clean">
              <div className="auth-header-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="auth-header-text">
                <div className="auth-header-title-row">
                  <h2 className="auth-id-brand">DRIPP ID</h2>
                  <span className="auth-badge-pill">
                    {activeTab === 'signup' 
                      ? 'PLAYER PASS' 
                      : activeTab === 'forgot_password' 
                        ? 'RECOVERY' 
                        : 'MEMBER ACCESS'}
                  </span>
                </div>
                <p className="auth-header-sub">
                  {activeTab === 'signup' 
                    ? 'Join the creative collective & unlock exclusive drops.' 
                    : activeTab === 'forgot_password' 
                      ? 'Verify your details to reset your password.' 
                      : 'Enter your credentials to access your pass.'}
                </p>
              </div>
            </div>

            {/* Error Message Toast */}
            {errorMsg && (
              <div className="auth-error-toast">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Interactive Form */}
            <form onSubmit={activeTab === 'signup' ? handleSignup : activeTab === 'forgot_password' ? handleResetPassword : handleLogin} className="auth-form-body">
              
              {/* SIGNUP: Usertag */}
              {activeTab === 'signup' && (
                <div className="auth-input-group">
                  <div className="auth-field-wrapper">
                    <span className="auth-field-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      className="cyber-input"
                      placeholder="Usertag" 
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      required={activeTab === 'signup'}
                      autoComplete="off"
                    />
                    <span className="input-focus-line" />
                  </div>
                </div>
              )}

              {/* Email Address (All modes) */}
              <div className="auth-input-group">
                <div className="auth-field-wrapper">
                  <span className="auth-field-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input 
                    type={activeTab === 'login' ? "text" : "email"} 
                    className="cyber-input"
                    placeholder={activeTab === 'login' ? "Email or Usertag" : "Email Address"} 
                    value={activeTab === 'signup' ? signupEmail : activeTab === 'forgot_password' ? resetEmail : loginEmail}
                    onChange={e => activeTab === 'signup' ? setSignupEmail(e.target.value) : activeTab === 'forgot_password' ? setResetEmail(e.target.value) : setLoginEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                  <span className="input-focus-line" />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-input-group">
                <div className="auth-field-wrapper">
                  <span className="auth-field-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="cyber-input"
                    placeholder={activeTab === 'forgot_password' ? "Create New Password" : "Password (8+ chars)"} 
                    value={activeTab === 'signup' ? signupPassword : activeTab === 'forgot_password' ? resetNewPassword : loginPassword}
                    onChange={e => activeTab === 'signup' ? setSignupPassword(e.target.value) : activeTab === 'forgot_password' ? setResetNewPassword(e.target.value) : setLoginPassword(e.target.value)}
                    required
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-eye-btn"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  <span className="input-focus-line" />
                </div>

                {/* Password Strength Indicator (Signup Mode) */}
                {activeTab === 'signup' && signupPassword.length > 0 && (
                  <div className="pw-strength-bar">
                    <div className="pw-strength-meter">
                      {[1, 2, 3, 4].map(idx => (
                        <span 
                          key={idx} 
                          className={`pw-segment ${pwStrength >= idx ? 'active active-' + pwStrength : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="pw-strength-label">{strengthLabels[pwStrength]}</span>
                  </div>
                )}

                {/* Forgot Password Link (Login Mode) */}
                {activeTab === 'login' && (
                  <div className="auth-forgot-row">
                    <button 
                      type="button" 
                      onClick={() => { setErrorMsg(""); setActiveTab('forgot_password'); }} 
                      className="auth-forgot-link"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {/* SIGNUP: Country Code + Phone Row */}
              {activeTab === 'signup' && (
                <div className="auth-phone-row">
                  <div className="auth-country-select-wrap">
                    <select 
                      className="cyber-select cyber-country-select"
                      value={signupCountryCode}
                      onChange={e => setSignupCountryCode(e.target.value)}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code+c.label} value={c.code}>
                          {c.code} ({c.label})
                        </option>
                      ))}
                    </select>
                    <span className="select-chevron">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                  <div className="auth-field-wrapper" style={{ flex: 1 }}>
                    <span className="auth-field-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input 
                      type="tel" 
                      className="cyber-input"
                      placeholder="Mobile Number" 
                      value={signupPhone}
                      onChange={e => setSignupPhone(e.target.value)}
                      required={activeTab === 'signup'}
                      autoComplete="off"
                    />
                    <span className="input-focus-line" />
                  </div>
                </div>
              )}

              {/* SIGNUP: Persona Interactive Chips */}
              {activeTab === 'signup' && (
                <div className="auth-persona-section">
                  <span className="persona-section-title">SELECT IDENTITY PERSONA</span>
                  <div className="persona-chips-grid">
                    {PERSONAS.map((p) => {
                      const isSelected = signupNature === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSignupNature(p.id)}
                          className={`persona-card-chip ${isSelected ? 'selected' : ''}`}
                        >
                          <span className="persona-icon">{p.icon}</span>
                          <span className="persona-name">{p.label}</span>
                          <span className="persona-badge">{p.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SIGNUP or FORGOT PASSWORD: Security Quote Selector */}
              {(activeTab === 'signup' || activeTab === 'forgot_password') && (
                <div className="auth-input-group">
                  <div className="auth-field-wrapper">
                    <span className="auth-field-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <select 
                      className="cyber-select"
                      value={activeTab === 'signup' ? signupSecurityPhrase : resetSecurityPhrase}
                      onChange={e => activeTab === 'signup' ? setSignupSecurityPhrase(e.target.value) : setResetSecurityPhrase(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Security Quote...</option>
                      {SECURITY_QUOTES.map(quote => (
                        <option key={quote} value={quote}>{quote}</option>
                      ))}
                    </select>
                    <span className="select-chevron">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                    <span className="input-focus-line" />
                  </div>
                </div>
              )}

              {/* Security Assurance Capsule */}
              <div className="auth-security-capsule">
                <div className="security-capsule-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <p className="security-capsule-text">
                  Your password and data is secured.
                </p>
              </div>

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="auth-submit-btn"
              >
                <span className="btn-label-stack">
                  {isSubmitting ? (
                    <span className="btn-loading-state">
                      <span className="btn-cyber-spinner" />
                      <span>PROCESSING...</span>
                    </span>
                  ) : activeTab === 'forgot_password' ? (
                    <>
                      <span>RESET PASSWORD</span>
                      <span className="btn-symbol">↗</span>
                    </>
                  ) : activeTab === 'signup' ? (
                    <>
                      <span>SAVE PROFILE</span>
                      <span className="btn-symbol">↗</span>
                    </>
                  ) : (
                    <>
                      <span>ACCESS PROFILE</span>
                      <span className="btn-symbol">↗</span>
                    </>
                  )}
                </span>
              </button>

              {/* Return to login option in Forgot Password mode */}
              {activeTab === 'forgot_password' && (
                <button
                  type="button"
                  onClick={() => { setErrorMsg(""); setActiveTab('login'); }}
                  className="auth-return-btn"
                >
                  ← Return to Login
                </button>
              )}
            </form>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Modal Backdrop */
        .dripp-auth-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(3, 3, 5, 0.78);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 16px;
          animation: authFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          overflow-y: auto;
        }

        /* Modal Main Card - Luxury Minimal Aesthetic */
        .dripp-auth-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          background: #0d0d10;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px 22px 26px;
          box-shadow: 
            0 30px 70px -15px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          box-sizing: border-box;
          animation: authScaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Custom Sleek Scrollbar */
        .dripp-auth-card::-webkit-scrollbar {
          width: 4px;
        }
        .dripp-auth-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .dripp-auth-card::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }

        /* Ambient Glow - Subtle, Not Loud */
        .auth-ambient-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 100px;
          background: rgba(235, 215, 63, 0.08);
          filter: blur(60px);
          border-radius: 50%;
          pointer-events: none;
        }

        /* Close Button */
        .auth-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 15;
        }
        .auth-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        /* Top Nav Row */
        .auth-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        /* Segmented Nav Tabs */
        .auth-nav-track {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .auth-tab-btn {
          background: none;
          border: none;
          padding: 6px 14px;
          border-radius: 7px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-tab-btn:hover {
          color: rgba(255, 255, 255, 0.85);
        }
        .auth-tab-btn.active {
          background: rgba(235, 215, 63, 0.12);
          color: var(--brand-yellow);
          border: 1px solid rgba(235, 215, 63, 0.3);
        }

        /* Clean Header */
        .auth-header-clean {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .auth-header-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(235, 215, 63, 0.08);
          border: 1px solid rgba(235, 215, 63, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-yellow);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .auth-header-text {
          flex: 1;
        }
        .auth-header-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .auth-id-brand {
          font-family: 'Panchang', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: #FFFFFF;
          margin: 0;
        }
        .auth-badge-pill {
          font-family: 'Panchang', sans-serif;
          font-size: 0.52rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: var(--brand-yellow);
          background: rgba(235, 215, 63, 0.08);
          border: 1px solid rgba(235, 215, 63, 0.25);
          padding: 2px 7px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .auth-header-sub {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
          line-height: 1.35;
        }

        /* Error Toast */
        .auth-error-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          padding: 9px 12px;
          border-radius: 10px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 12px;
          animation: authShake 0.4s ease;
        }

        /* Form Body */
        .auth-form-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Inputs & Wrappers */
        .auth-field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .auth-field-wrapper:hover {
          background: rgba(255, 255, 255, 0.035);
          border-color: rgba(255, 255, 255, 0.14);
        }
        .auth-field-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(235, 215, 63, 0.5);
          box-shadow: 0 0 0 1px rgba(235, 215, 63, 0.15);
        }
        .auth-field-icon {
          padding-left: 14px;
          color: rgba(255, 255, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .auth-field-wrapper:focus-within .auth-field-icon {
          color: var(--brand-yellow);
        }

        .cyber-input {
          flex: 1;
          width: 100%;
          padding: 10px 14px 10px 10px;
          background: transparent;
          border: none;
          outline: none;
          color: #FFFFFF;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          box-sizing: border-box;
        }
        .cyber-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
          font-weight: 400;
        }
        .cyber-select {
          flex: 1;
          width: 100%;
          padding: 10px 34px 10px 10px;
          background: transparent;
          border: none;
          outline: none;
          color: #FFFFFF;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          box-sizing: border-box;
        }
        .cyber-select option {
          background: #111116;
          color: #FFFFFF;
          font-family: 'Clash Display', sans-serif;
          padding: 8px;
        }
        .select-chevron {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: rgba(255, 255, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }
        .auth-eye-btn:hover {
          color: var(--brand-yellow);
        }

        /* Password Strength Meter */
        .pw-strength-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 4px;
          gap: 8px;
        }
        .pw-strength-meter {
          display: flex;
          gap: 3px;
          flex: 1;
        }
        .pw-segment {
          height: 3px;
          flex: 1;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          transition: background 0.3s ease;
        }
        .pw-segment.active-1 { background: #ef4444; }
        .pw-segment.active-2 { background: #f97316; }
        .pw-segment.active-3 { background: #eab308; }
        .pw-segment.active-4 { background: #4ade80; }
        .pw-strength-label {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
        }

        /* Phone Row */
        .auth-phone-row {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .auth-country-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          width: 100px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .auth-country-select-wrap:focus-within {
          border-color: rgba(235, 215, 63, 0.5);
        }
        .cyber-country-select {
          padding-left: 12px;
          padding-right: 24px;
          font-size: 0.8rem;
          text-align: left;
        }

        /* Persona Chips Grid */
        .auth-persona-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 2px;
        }
        .persona-section-title {
          font-family: 'Panchang', sans-serif;
          font-size: 0.56rem;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: rgba(255, 255, 255, 0.35);
          padding-left: 2px;
        }
        .persona-chips-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .persona-card-chip {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 9px 4px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.5);
        }
        .persona-card-chip:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.18);
          color: #FFF;
        }
        .persona-card-chip.selected {
          background: rgba(235, 215, 63, 0.08);
          border-color: rgba(235, 215, 63, 0.45);
          color: var(--brand-yellow);
        }
        .persona-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 18px;
        }
        .persona-name {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.74rem;
          font-weight: 600;
          line-height: 1.2;
        }
        .persona-badge {
          font-family: 'Panchang', sans-serif;
          font-size: 0.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .persona-card-chip.selected .persona-badge {
          color: rgba(235, 215, 63, 0.7);
        }

        /* Forgot Password Row */
        .auth-forgot-row {
          text-align: right;
        }
        .auth-forgot-link {
          background: none;
          border: none;
          color: var(--brand-yellow);
          font-family: 'Clash Display', sans-serif;
          font-size: 0.76rem;
          font-weight: 500;
          cursor: pointer;
          opacity: 0.75;
          transition: opacity 0.2s ease;
        }
        .auth-forgot-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        /* Security Capsule */
        .auth-security-capsule {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 9px;
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.4);
        }
        .security-capsule-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .security-capsule-text {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.74rem;
          line-height: 1.35;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          text-align: left;
        }

        /* CTA Button */
        .auth-submit-btn {
          position: relative;
          width: 100%;
          margin-top: 4px;
          padding: 12px 18px;
          border-radius: 12px;
          background: var(--brand-yellow);
          border: none;
          color: #050505;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(235, 215, 63, 0.25);
          transition: all 0.25s ease;
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(235, 215, 63, 0.4);
        }
        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .btn-label-stack {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-symbol {
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }
        .auth-submit-btn:hover .btn-symbol {
          transform: translate(2px, -2px);
        }
        .btn-loading-state {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-cyber-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid #050505;
          border-top-color: transparent;
          border-radius: 50%;
          animation: cyberSpin 0.7s linear infinite;
        }
        .auth-return-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Clash Display', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          margin-top: 4px;
          transition: color 0.2s ease;
        }
        .auth-return-btn:hover {
          color: var(--brand-yellow);
        }

        /* Success Screen */
        .auth-success-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 26px 10px;
          animation: authScaleUp 0.4s ease;
        }
        .auth-success-badge {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--brand-yellow);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.4);
          margin-bottom: 14px;
        }
        .auth-success-tag {
          font-family: 'Panchang', sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          color: var(--brand-yellow);
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .auth-success-title {
          font-family: 'Panchang', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: 0.8px;
          margin: 0 0 6px;
        }
        .auth-success-sub {
          font-family: 'Clash Display', sans-serif;
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.82rem;
          margin: 0 0 16px;
        }
        .auth-success-progress {
          width: 120px;
          height: 3px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .auth-progress-fill {
          height: 100%;
          width: 100%;
          background: var(--brand-yellow);
          animation: fillProgress 1.4s ease forwards;
        }

        /* Autofill Overrides */
        .cyber-input:-webkit-autofill, 
        .cyber-input:-webkit-autofill:hover, 
        .cyber-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px #111115 inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Keyframes */
        @keyframes authFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(20px); }
        }
        @keyframes authScaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes cyberSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes authShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .dripp-auth-card {
            padding: 20px 16px 22px;
            max-width: 92vw;
            border-radius: 18px;
          }
          .auth-id-brand {
            font-size: 1.05rem;
          }
        }
      `}} />
    </div>
  );
}
