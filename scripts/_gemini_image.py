import json, os, sys, urllib.request

api_key = os.environ["GEMINI_API_KEY"]
model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-image-preview")
prompt = open(sys.argv[1], encoding="utf-8").read()
out = sys.argv[2]

body = json.dumps({
    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "imageConfig": {"aspectRatio": "16:9"},
    },
}).encode("utf-8")

url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace")
    print(f"HTTP {e.code}: {err}", file=sys.stderr)
    sys.exit(1)

parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
saved = False
for part in parts:
    inline = part.get("inlineData") or part.get("inline_data")
    if inline and inline.get("data"):
        import base64
        with open(out, "wb") as f:
            f.write(base64.b64decode(inline["data"]))
        print(f"saved {out}")
        saved = True
    elif part.get("text"):
        print("text:", part["text"][:200])

if not saved:
    print(json.dumps(data, ensure_ascii=False, indent=2))
    sys.exit(1)
