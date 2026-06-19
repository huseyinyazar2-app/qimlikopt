import os
import glob

# Replace version strings in all jsx files
jsx_files = glob.glob(r"c:\Users\hyaza\Documents\antigravitiy\qimlikOTP\**\*.jsx", recursive=True)
count = 0
for filepath in jsx_files:
    if "node_modules" in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace("v1.0.2", "v1.0.3")
    new_content = new_content.replace("v1.7.4", "v1.7.5")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated version in {filepath}")
        count += 1

print(f"Updated {count} files for version bump.")
