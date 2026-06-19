import os

css_append = """
@media (max-width: 480px) {
  form div[style*="display: flex"] {
    flex-direction: column !important;
  }
}
"""

panels = ['frontend-dijital', 'frontend-mesai', 'frontend-teslimat', 'frontend-client', 'frontend-admin']
for p in panels:
    filepath = fr"c:\Users\hyaza\Documents\antigravitiy\qimlikOTP\{p}\src\index.css"
    if os.path.exists(filepath):
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(css_append)
        print(f"Appended form fix to {filepath}")
