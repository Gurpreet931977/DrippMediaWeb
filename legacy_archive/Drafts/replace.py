import re

with open("draft 4.html", "r") as f:
    content = f.read()

# 1. Replace the CSS block
css_pattern = re.compile(r"        /\* --- BOOK NOW SECTION --- \*/\n        \.book-now-section \{.*?        \}\n        \}\n", re.DOTALL)

new_css = """        /* --- BOOK NOW SECTION --- */
        .book-now-section {
            width: 100vw;
            margin-left: calc(-50vw + 50%);
            margin-right: calc(-50vw + 50%);
            background: var(--brand-yellow);
            padding: 120px 0;
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
            color: var(--deep-black);
        }

        .book-now-bg-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Panchang', sans-serif;
            font-size: 15vw;
            font-weight: 800;
            color: rgba(5, 5, 5, 0.05);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            text-transform: uppercase;
            letter-spacing: -2px;
        }

        .book-now-container {
            width: 100%;
            max-width: 1400px;
            padding: 0 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 60px;
            position: relative;
            z-index: 2;
        }

        .book-info {
            flex: 1;
            max-width: 600px;
            position: relative;
            z-index: 2;
        }
        
        .book-info .section-label {
            color: rgba(5, 5, 5, 0.6);
            border-color: rgba(5, 5, 5, 0.2);
            background: transparent;
        }

        .book-title {
            font-family: 'Panchang', sans-serif;
            font-size: 3.8rem;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 20px;
            text-transform: uppercase;
            color: var(--deep-black);
        }

        .book-title span {
            color: var(--pure-white);
            -webkit-text-stroke: 1.5px var(--deep-black);
            text-shadow: 2px 2px 0 var(--deep-black);
            position: relative;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        
        .book-now-section:hover .book-title span {
            transform: skewX(-8deg);
        }

        .book-desc {
            font-size: 1.2rem;
            color: rgba(5, 5, 5, 0.8);
            line-height: 1.6;
            font-weight: 500;
        }

        .book-action {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: flex-end;
        }

        .solid-book-btn {
            position: relative;
            display: inline-flex;
            width: 250px;
            height: 250px;
            border-radius: 50%;
            background: var(--deep-black);
            color: var(--brand-yellow);
            text-decoration: none;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.5s ease;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .solid-book-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px dashed rgba(235, 215, 63, 0.5);
            transform: scale(0.9);
            transition: transform 0.5s ease, opacity 0.5s ease;
            opacity: 0;
            pointer-events: none;
        }

        .solid-book-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        }

        .solid-book-btn:hover::before {
            transform: scale(1.15);
            opacity: 1;
            animation: spin 10s linear infinite;
        }

        @keyframes spin {
            100% { transform: scale(1.15) rotate(360deg); }
        }

        .solid-book-btn .btn-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }

        .solid-book-btn .btn-text {
            font-family: 'Panchang', sans-serif;
            font-size: 1.2rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-align: center;
            transition: transform 0.3s ease;
        }

        .solid-book-btn .btn-arrow {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 1px solid rgba(235, 215, 63, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .solid-book-btn:hover .btn-arrow {
            background: var(--brand-yellow);
            border-color: var(--brand-yellow);
            color: var(--deep-black);
            transform: rotate(-45deg) scale(1.1);
        }
        
        .solid-book-btn:hover .btn-text {
            transform: translateY(-5px);
        }

        @media (max-width: 900px) {
            .book-now-container {
                flex-direction: column;
                text-align: center;
                padding: 0 20px;
            }

            .book-info {
                max-width: 100%;
            }

            .book-title {
                font-size: 2.8rem;
            }
            
            .book-now-bg-text {
                font-size: 25vw;
            }

            .book-action {
                justify-content: center;
                width: 100%;
                margin-top: 40px;
            }

            .solid-book-btn {
                width: 220px;
                height: 220px;
            }
        }
"""
content, count_css = css_pattern.subn(new_css, content)
print(f"CSS replaced: {count_css}")

# 2. Replace the HTML block
html_pattern = re.compile(r"        <!-- BOOK NOW SECTION -->\n        <section class=\"book-now-section\">.*?        </section>\n", re.DOTALL)

new_html = """        <!-- BOOK NOW SECTION -->
        <section class="book-now-section">
            <div class="book-now-bg-text">CLIENT CONNECTION</div>
            <div class="book-now-container">
                <div class="book-info">
                    <span class="section-label">06 / LET'S COLLABORATE</span>
                    <h2 class="book-title">Ready to <br><span>Convert</span>?</h2>
                    <p class="book-desc">
                        Stop blending in. Let's architect a surreal digital presence that commands attention and converts casual users into devoted clients. Secure your spot now.
                    </p>
                </div>
                <div class="book-action">
                    <a href="#contact" class="solid-book-btn">
                        <div class="btn-content">
                            <span class="btn-text">INITIATE<br>PROJECT</span>
                            <div class="btn-arrow">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </section>
"""
content, count_html = html_pattern.subn(new_html, content)
print(f"HTML replaced: {count_html}")

if count_css > 0 and count_html > 0:
    with open("draft 4.html", "w") as f:
        f.write(content)
    print("Successfully updated draft 4.html")
else:
    print("Failed to replace one or both sections")

