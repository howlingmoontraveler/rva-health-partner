import os
import re

nav_html = """<nav>
  <a href="/" class="nav-logo">RVA <span>Health Partner</span></a>
  <ul class="nav-links">
    <li><a href="/#how-it-works">How It Works</a></li>
    <li><a href="/#packages">Programs</a></li>
    <li><a href="/peptide-therapy/">Peptide &amp; Recovery Protocols</a></li>
    <li><a href="/#faq">FAQ</a></li>
  </ul>
  <a href="/#apply-form" class="nav-cta">Inquire About Coaching</a>
</nav>"""

nav_css = """
    .nav-links { display: flex; gap: 32px; list-style: none; }
    .nav-links a { text-decoration: none; font-size: 15px; font-weight: 500; color: var(--text-muted); transition: color 0.45s; }
    .nav-links a:hover { color: var(--text); }
    @media (max-width: 860px) { .nav-links { display: none; } }
  </style>"""

files_to_update = [
    "peptide-therapy/index.html",
    "blog/ghk-cu-richmond/index.html",
    "blog/muscle-loss-on-semaglutide/index.html",
    "blog/thymalin-richmond/index.html",
    "blog/bpc-157-richmond/index.html",
    "privacy-policy.html"
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, "r") as f:
        content = f.read()
    
    # Replace <nav>...</nav>
    content = re.sub(r'<nav>.*?</nav>', nav_html, content, flags=re.DOTALL)
    
    # Add CSS before </style> if not already there
    if ".nav-links {" not in content:
        content = content.replace("</style>", nav_css)
        
    with open(file_path, "w") as f:
        f.write(content)
    
    print(f"Updated {file_path}")
