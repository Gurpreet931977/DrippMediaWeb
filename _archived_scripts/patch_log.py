import re

with open("app/page.jsx", "r") as f:
    code = f.read()

target = """    // High Score tracking and saving to Supabase for Dripp game
    if (gameState === 'failed' && activeGame === 'dripp') {
       if (score > highScoreRef.current) {"""

replacement = """    // High Score tracking and saving to Supabase for Dripp game
    if (gameState === 'failed' && activeGame === 'dripp') {
       console.log("GAME FAILED - Checking score. Score:", score, "HighScoreRef:", highScoreRef.current);
       if (score > highScoreRef.current) {
          console.log("Score is greater! Updating local and DB...");"""

code = code.replace(target, replacement)

target2 = """                if (userObj.email) {
                   supabase.from('users')
                      .update({ highscore: score })
                      .eq('email', userObj.email)
                      .then(({error}) => {
                         if (error) console.error("Error saving highscore to Supabase:", error);
                      });
                }"""

replacement2 = """                if (userObj.email) {
                   console.log("Found user email:", userObj.email, "Updating supabase...");
                   supabase.from('users')
                      .update({ highscore: score })
                      .eq('email', userObj.email)
                      .then(({error}) => {
                         if (error) console.error("Error saving highscore to Supabase:", error);
                         else console.log("Supabase update SUCCESS!");
                      });
                } else {
                   console.log("No email found in userObj");
                }"""

code = code.replace(target2, replacement2)

with open("app/page.jsx", "w") as f:
    f.write(code)
