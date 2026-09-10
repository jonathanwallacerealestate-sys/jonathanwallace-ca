import base64, json, sys, urllib.request

HOOK = "https://hook.us2.make.com/se5b11cceeuomzei1qha8ififszdbkoa"

def commit(path, local, message, binary=False):
    data = open(local, "rb").read()
    b64 = base64.b64encode(data).decode()
    payload = {"path": path, "message": message, "contentB64": b64, "sha": ""}
    req = urllib.request.Request(
        HOOK, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        body = r.read().decode()
    print(f"{path}  ({len(data)} bytes)  ->  HTTP {r.status}  {body[:300]}")
    return body

if __name__ == "__main__":
    which = sys.argv[1]
    if which == "image":
        commit("assets/img/market-aug-31-sep-6-2026.jpg",
               "/home/claude/site/assets_market-aug-31-sep-6-2026.jpg",
               "Add weekly market hero, Aug 31 to Sep 6 2026")
    elif which == "post":
        commit("blog-market-update-aug-31-sep-6-2026.html",
               "/home/claude/site/blog-market-update-aug-31-sep-6-2026.html",
               "Add market update, Aug 31 to Sep 6 2026")

def commit_index():
    commit("blog.html", "/home/claude/site/blog.html",
           "Blog index: market update Aug 31 to Sep 6 2026, ItemList rebuilt from visible order")
