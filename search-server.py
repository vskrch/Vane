#!/usr/bin/env python3
"""Fast search server using Google with caching"""
import re
import urllib.parse
import time
from flask import Flask, request, jsonify
import requests as http

app = Flask(__name__)
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
TIMEOUT = 3
CACHE = {}
CACHE_TTL = 300


def google_search(query):
    url = "https://www.google.com/search"
    params = {"q": query, "hl": "en", "num": 20}
    try:
        r = http.get(url, params=params, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        results = []
        for m in re.finditer(r'<a[^>]*href="/url\?q=([^"&]+)[^"]*"[^>]*>(?:<[^>]+>)*([^<]+)', r.text):
            url = urllib.parse.unquote(m.group(1))
            title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
            if url and title and not url.startswith("/"):
                results.append({"title": title, "url": url, "content": ""})
        return results[:20]
    except Exception:
        return []


@app.route("/search")
def search():
    q = request.args.get("q", "").strip()
    fmt = request.args.get("format", "html")

    if not q:
        return jsonify({"results": [], "suggestions": []})

    # Check cache
    cache_key = f"{q}:{fmt}"
    if cache_key in CACHE:
        cached_time, cached_result = CACHE[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return jsonify(cached_result)

    # Use Google search
    results = google_search(q)

    # Deduplicate
    seen = set()
    unique = []
    for r in (results or []):
        if r["url"] not in seen:
            seen.add(r["url"])
            unique.append(r)

    result_data = {"results": unique[:30], "suggestions": []}

    # Cache the result
    CACHE[cache_key] = (time.time(), result_data)
    # Limit cache size
    if len(CACHE) > 100:
        oldest_key = next(iter(CACHE))
        del CACHE[oldest_key]

    return jsonify(result_data)


@app.route("/healthz")
def healthz():
    return "OK"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
