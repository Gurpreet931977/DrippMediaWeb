import re

with open("app/components/AuthModal.jsx", "r") as f:
    code = f.read()

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

with open("app/components/AuthModal.jsx", "w") as f:
    f.write(code)
