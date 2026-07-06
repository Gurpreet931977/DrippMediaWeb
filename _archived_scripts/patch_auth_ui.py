import re

with open("app/components/AuthModal.jsx", "r") as f:
    code = f.read()

# 1. Reduce header margins
code = code.replace("marginBottom: '24px'", "marginBottom: '15px'")
code = code.replace("padding: '20px 24px', width: '100%', maxWidth: '340px',", "padding: '16px 20px', width: '100%', maxWidth: '320px',")

# 2. Hide subtitle on signup to save space
target_subtitle = """            <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '15px', lineHeight: 1.5, padding: '0 10px' }}>
              Establish your digital identity to secure your high scores and personalize your journey.
            </p>"""
replacement_subtitle = """            <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: 1.3, padding: '0 10px', display: activeTab === 'signup' ? 'none' : 'block' }}>
              Establish your digital identity to secure your high scores.
            </p>"""
code = code.replace(target_subtitle, replacement_subtitle)

# 3. Reduce input paddings and margins
code = code.replace("paddingBottom: '12px'", "paddingBottom: '8px'")
code = code.replace("padding: '14px 18px'", "padding: '10px 14px'")
code = code.replace("padding: '14px 28px 14px 10px'", "padding: '10px 24px 10px 8px'")
code = code.replace("fontSize: '0.95rem'", "fontSize: '0.85rem'")
code = code.replace("gap: '12px'", "gap: '8px'")

# 4. Reduce button padding
code = code.replace("padding: '14px'", "padding: '12px'")

with open("app/components/AuthModal.jsx", "w") as f:
    f.write(code)
