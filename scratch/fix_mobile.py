import os
import glob
import re

css_appends = {
    "frontend-website": """
/* Mobile Responsiveness */
@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
  .hero-content h1 {
    font-size: 2.5rem;
  }
  .hero-content p {
    font-size: 1.1rem;
    margin-left: auto;
    margin-right: auto;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
  .nav-links {
    display: none;
  }
  .product-showcase {
    padding: 4rem 0;
  }
  .product-showcase:nth-child(even) .hero-grid {
    direction: ltr;
  }
  .container > div[style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }
}
""",
    "admin-panels": """
/* Mobile Responsiveness */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    padding: 1rem;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    border-right: none;
    border-bottom: 1px solid var(--glass-border);
  }
  .sidebar .nav-link {
    margin-bottom: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
  .main-content {
    padding: 1rem;
  }
  .glass-panel, .glass-card {
    padding: 1.5rem 1rem;
  }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
}
"""
}

def append_to_css(filepath, content):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        existing = f.read()
    if "/* Mobile Responsiveness */" not in existing:
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(content)
        print(f"Appended media queries to {filepath}")
    else:
        print(f"Already responsive: {filepath}")

# Append to website
append_to_css(r"c:\Users\hyaza\Documents\antigravitiy\qimlikOTP\frontend-website\src\index.css", css_appends["frontend-website"])

# Append to admin panels
panels = ['frontend-dijital', 'frontend-mesai', 'frontend-teslimat', 'frontend-client', 'frontend-admin']
for p in panels:
    append_to_css(fr"c:\Users\hyaza\Documents\antigravitiy\qimlikOTP\{p}\src\index.css", css_appends["admin-panels"])

# Find all jsx files and replace '1fr 1fr' with 'repeat(auto-fit, minmax(280px, 1fr))'
jsx_files = glob.glob(r"c:\Users\hyaza\Documents\antigravitiy\qimlikOTP\**\*.jsx", recursive=True)
count = 0
for filepath in jsx_files:
    if "node_modules" in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace("'1fr 1fr'", "'repeat(auto-fit, minmax(280px, 1fr))'")
    new_content = new_content.replace('"1fr 1fr"', "'repeat(auto-fit, minmax(280px, 1fr))'")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated grid in {filepath}")
        count += 1

print(f"Updated {count} files for responsive grid.")
