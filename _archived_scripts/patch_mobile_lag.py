import re

with open("app/globals.css", "r") as f:
    code = f.read()

target = """        /* --- Component 5: Reduce backdrop-filter GPU load on mobile --- */
        @media (max-width: 900px) {
            .community-wrapper {
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }

            .navbar {
                backdrop-filter: blur(8px);
            }

            .nav-links {
                backdrop-filter: blur(8px);
            }

            .glass-label,
            .c-nav-group {
                backdrop-filter: blur(4px);
            }

            .hero-sub {
                backdrop-filter: blur(5px);
            }

            .builder-right {
                backdrop-filter: blur(8px);
            }
        }"""

replacement = """        /* --- Component 5: Disable backdrop-filter GPU load on mobile --- */
        @media (max-width: 900px) {
            * {
                /* Aggressively disable heavy CSS filters on mobile for buttery smooth 60fps */
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                /* Disable mix-blend-mode if not already */
            }
            .community-wrapper, .navbar, .nav-links, .glass-label, .c-nav-group, .hero-sub, .builder-right {
                background-color: rgba(15, 15, 15, 0.95) !important;
            }
        }"""

code = code.replace(target, replacement)

with open("app/globals.css", "w") as f:
    f.write(code)
