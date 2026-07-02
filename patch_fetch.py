import re

with open("app/page.jsx", "r") as f:
    code = f.read()

target = """  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(false);
    try {"""

replacement = """  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(false);
    
    // Sync local score to DB before fetching leaderboard to ensure it's up to date
    try {
      const userStr = localStorage.getItem('dripp_user');
      const localHigh = parseInt(localStorage.getItem('dripp_highScore') || '0', 10);
      if (userStr && localHigh > 0) {
          const userObj = JSON.parse(userStr);
          if (userObj.email) {
             const { data } = await supabase.from('users').select('highscore').eq('email', userObj.email).single();
             if (data && localHigh > (data.highscore || 0)) {
                 await supabase.from('users').update({ highscore: localHigh }).eq('email', userObj.email);
             }
          }
      }
    } catch(e) {}

    try {"""

code = code.replace(target, replacement)

with open("app/page.jsx", "w") as f:
    f.write(code)
