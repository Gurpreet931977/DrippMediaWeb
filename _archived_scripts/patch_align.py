import re

with open("app/page.jsx", "r") as f:
    code = f.read()

# 1. Update control-buttons-wrapper
code = code.replace(
    "<div className=\"control-buttons-wrapper\" style={{ position: 'absolute', top: '5%', left: '5%', zIndex: 9999, display: 'flex', gap: '10px' }}>",
    "<div className=\"control-buttons-wrapper\" style={{ position: 'absolute', top: '20px', left: '30px', zIndex: 9999, display: 'flex', gap: '10px', alignItems: 'center' }}>"
)

# 2. Update Pause button
code = code.replace(
    "width: '40px', height: '40px', marginTop: '15px',",
    "width: '40px', height: '40px',"
)

# 3. Update Help button
code = code.replace(
    "width: '40px', height: '40px', marginTop: activeGame !== 'none' && gameState === 'playing' && !isPaused ? '15px' : '0',",
    "width: '40px', height: '40px',"
)

with open("app/page.jsx", "w") as f:
    f.write(code)
