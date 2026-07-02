import re

with open("app/page.jsx", "r") as f:
    code = f.read()

target = """        onLoginSuccess={() => {
           setHasSignedUp(true);
           setPlayCount(0);
           setGameState('playing'); setIsPaused(false); setShowShareOptions(false);
           if (typeof window !== 'undefined' && window.initDrippGame) window.initDrippGame();
           
           // Dispatch event for other components listening
           if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('dripp_login_success'));
           }
        }}"""

replacement = """        onLoginSuccess={() => {
           setHasSignedUp(true);
           setPlayCount(0);
           const cachedHighScore = localStorage.getItem('dripp_highScore');
           if (cachedHighScore) highScoreRef.current = parseInt(cachedHighScore, 10);
           setGameState('playing'); setIsPaused(false); setShowShareOptions(false);
           if (typeof window !== 'undefined' && window.initDrippGame) window.initDrippGame();
           
           // Dispatch event for other components listening
           if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('dripp_login_success'));
           }
        }}"""

code = code.replace(target, replacement)

with open("app/page.jsx", "w") as f:
    f.write(code)
