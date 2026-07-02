import re

with open("app/components/AuthModal.jsx", "r") as f:
    code = f.read()

# 1. Update localStorage saving logic
target1 = """         if (typeof window !== 'undefined') {
            const userData = data && data.length > 0 ? data[0] : { name: signupName, email: signupEmail, nature: signupNature };
            localStorage.setItem('dripp_user', JSON.stringify(userData));
         }"""

replacement1 = """         if (typeof window !== 'undefined') {
            const userData = data && data.length > 0 ? data[0] : { name: signupName, email: signupEmail, nature: signupNature };
            localStorage.setItem('dripp_user', JSON.stringify(userData));
            if (userData.highscore !== undefined) {
                localStorage.setItem('dripp_highScore', userData.highscore.toString());
            } else {
                localStorage.setItem('dripp_highScore', '0');
            }
         }"""

code = code.replace(target1, replacement1)

target2 = """         const userData = data[0];
         if (typeof window !== 'undefined') {
            localStorage.setItem('dripp_user', JSON.stringify(userData));
         }"""

replacement2 = """         const userData = data[0];
         if (typeof window !== 'undefined') {
            localStorage.setItem('dripp_user', JSON.stringify(userData));
            if (userData.highscore !== undefined) {
                localStorage.setItem('dripp_highScore', userData.highscore.toString());
            }
         }"""

code = code.replace(target2, replacement2)

# 2. Add SECURITY_QUOTES right after COUNTRY_CODES
quotes_def = """
const SECURITY_QUOTES = [
  "I am the master of my fate",
  "Stay hungry, stay foolish",
  "To infinity and beyond",
  "May the force be with you",
  "Just do it",
  "Hakuna Matata"
];
"""
code = code.replace("];\n\nexport default function AuthModal", "];" + quotes_def + "\nexport default function AuthModal")

# 3. Reduce popup size
code = code.replace("padding: '32px 28px', width: '100%', maxWidth: '380px',", "padding: '20px 24px', width: '100%', maxWidth: '340px',")

# 4. Add signupSecurityPhrase dropdown
target_nature = """                         <svg style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <polyline points="6 9 12 15 18 9"></polyline>
                         </svg>
                      </div>"""

replacement_nature = target_nature + """
                      <div style={{ position: 'relative' }}>
                         <select 
                           className="modern-input"
                           value={signupSecurityPhrase}
                           onChange={e => setSignupSecurityPhrase(e.target.value)}
                           required={activeTab === 'signup'}
                           style={{
                             width: '100%', padding: '14px 18px', borderRadius: '12px',
                             background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                             color: signupSecurityPhrase ? 'white' : 'rgba(255,255,255,0.4)', 
                             fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem',
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
                      </div>"""

code = code.replace(target_nature, replacement_nature)

# 5. Convert forgot password input to select
target_forgot = """                    <input 
                      type="text" 
                      className="modern-input"
                      placeholder="Secret Recovery Phrase" 
                      value={resetSecurityPhrase}
                      onChange={e => setResetSecurityPhrase(e.target.value)}
                      required={activeTab === 'forgot_password'}
                      style={{
                        width: '100%', padding: '14px 18px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />"""

replacement_forgot = """                    <select 
                      className="modern-input"
                      value={resetSecurityPhrase}
                      onChange={e => setResetSecurityPhrase(e.target.value)}
                      required={activeTab === 'forgot_password'}
                      style={{
                        width: '100%', padding: '14px 18px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        color: resetSecurityPhrase ? 'white' : 'rgba(255,255,255,0.4)', 
                        fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem',
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
                    </svg>"""

code = code.replace(target_forgot, replacement_forgot)

with open("app/components/AuthModal.jsx", "w") as f:
    f.write(code)
