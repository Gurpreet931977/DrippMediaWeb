import re

with open("app/page.jsx", "r") as f:
    code = f.read()

target = """  useEffect(() => {
    try {
      const storedCount = localStorage.getItem('dripp_playCount');
      if (storedCount) setPlayCount(parseInt(storedCount, 10));
      
      const user = localStorage.getItem('dripp_user');
      if (user) setHasSignedUp(true);

      const cachedHighScore = localStorage.getItem('dripp_highScore');
      if (cachedHighScore) highScoreRef.current = parseInt(cachedHighScore, 10);
      else localStorage.setItem('dripp_highScore', '0');
    } catch(e) {}
  }, []);"""

replacement = """  useEffect(() => {
    try {
      const storedCount = localStorage.getItem('dripp_playCount');
      if (storedCount) setPlayCount(parseInt(storedCount, 10));
      
      const userStr = localStorage.getItem('dripp_user');
      let userObj = null;
      if (userStr) {
          setHasSignedUp(true);
          try { userObj = JSON.parse(userStr); } catch(e) {}
      }

      let localHigh = 0;
      const cachedHighScore = localStorage.getItem('dripp_highScore');
      if (cachedHighScore) {
          localHigh = parseInt(cachedHighScore, 10);
          highScoreRef.current = localHigh;
      } else {
          localStorage.setItem('dripp_highScore', '0');
      }

      // Sync high score in both directions
      if (userObj && userObj.email) {
          supabase.from('users').select('highscore').eq('email', userObj.email).single()
            .then(({ data }) => {
                if (data) {
                    const dbHigh = data.highscore || 0;
                    if (localHigh > dbHigh) {
                        supabase.from('users').update({ highscore: localHigh }).eq('email', userObj.email).then();
                    } else if (dbHigh > localHigh) {
                        highScoreRef.current = dbHigh;
                        localStorage.setItem('dripp_highScore', dbHigh.toString());
                    }
                }
            });
      }
    } catch(e) {}
  }, []);"""

code = code.replace(target, replacement)

with open("app/page.jsx", "w") as f:
    f.write(code)
