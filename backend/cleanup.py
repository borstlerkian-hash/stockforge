path = r"C:\Users\fritj\Documents\Default Project\stockforge-extract\stockforge\backend\routers\prediction_tracker.py"
content = open(path, encoding='utf-8').read()
# Remove leftover script code
content = content.replace("content = open(path, encoding='utf-8').read()\n\naddition = '''\n", "")
open(path, 'w', encoding='utf-8').write(content)
print("Cleaned")