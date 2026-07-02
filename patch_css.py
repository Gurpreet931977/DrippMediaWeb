import re

with open("app/page.jsx", "r") as f:
    code = f.read()

# 1. Add classNames to the blocks
code = code.replace(
    "<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '10px' }}>\n             <span className=\"highest-score-text\"",
    "<div className=\"leaderboard-block\" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '10px' }}>\n             <span className=\"highest-score-text\""
)
code = code.replace(
    "<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>\n            <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>",
    "<div className=\"score-block\" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>\n            <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>"
)

# 2. Update the media query CSS
old_css = """           .dripp-game-ui {
              top: 5% !important;
              bottom: auto !important;
              right: 5% !important;
           }"""

new_css = """           .dripp-game-ui {
              top: 2% !important;
              bottom: auto !important;
              right: 4% !important;
              gap: 0 !important;
           }
           .leaderboard-block {
              order: 2;
              margin-bottom: 0 !important;
              margin-top: 0px !important;
           }
           .score-block {
              order: 1;
           }"""

code = code.replace(old_css, new_css)

with open("app/page.jsx", "w") as f:
    f.write(code)
