import os
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

assets = {
    "d3.min.js": "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js",
    "require.min.js": "https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js",
    "html2canvas.min.js": "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "jspdf.umd.min.js": "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
}

for name, url in assets.items():
    dest_path = os.path.join(FRONTEND_DIR, name)
    print(f"Descargando {name}...")
    urllib.request.urlretrieve(url, dest_path)
    print(f"OK: {dest_path}")
