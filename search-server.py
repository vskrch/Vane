#!/usr/bin/env python3
"""Minimal SearXNG-compatible search server - optimized for speed"""
import re
import urllib.parse
from flask import Flask, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests as http

app = Flask(__name__)
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
TIMEOUT = 4  # Reduced timeout for faster fallback
MAX_WORKERS = 4

ENGINES = {
    "google": lambda q: google_search(q),
    "duckduckgo": lambda q: ddg_search(q),
    "brave": lambda q: brave_search(q),
    "bing": lambda q: bing_search(q),
}


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


def ddg_search(query):
    url = "https://html.duckduckgo.com/html/"
    data = {"q": query}
    try:
        r = http.post(url, data=data, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        results = []
        for m in re.finditer(
            r'<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
            r.text,
            re.DOTALL,
        ):
            results.append({
                "title": re.sub(r"<[^>]+>", "", m.group(2)).strip(),
                "url": m.group(1),
                "content": "",
            })
        return results[:20]
    except Exception:
        return []


def brave_search(query):
    url = "https://search.brave.com/search"
    params = {"q": query}
    try:
        r = http.get(url, params=params, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        results = []
        for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>(?:<[^>]+>)*([^<]+)', r.text):
            url = m.group(1)
            title = m.group(2).strip()
            if url and title and "brave.com" not in url:
                results.append({"title": title, "url": url, "content": ""})
        return results[:20]
    except Exception:
        return []


def bing_search(query):
    url = "https://www.bing.com/search"
    params = {"q": query}
    try:
        r = http.get(url, params=params, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        results = []
        for m in re.finditer(r'<a[^>]*href="(https?://[^"]+)"[^>]*>(?:<[^>]+>)*([^<]+)', r.text):
            url = m.group(1)
            title = m.group(2).strip()
            if url and title and "bing.com" not in url and "microsoft.com" not in url:
                results.append({"title": title, "url": url, "content": ""})
        return results[:20]
    except Exception:
        return []


@app.route("/config")
def config_route():
    return jsonify({})


@app.route("/search")
def search():
    q = request.args.get("q", "").strip()
    fmt = request.args.get("format", "html")

    if not q:
        return jsonify({"results": [], "suggestions": []})

    # Run all search engines in parallel for speed
    engines = [
        ("google", google_search),
        ("duckduckgo", ddg_search),
        ("bing", bing_search),
        ("brave", brave_search),
    ]

    all_results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fn, q): name for name, fn in engines}
        for future in as_completed(futures):
            try:
                results = future.result(timeout=TIMEOUT + 1)
                if results:
                    all_results.extend(results)
            except Exception:
                continue

    # Deduplicate results
    seen = set()
    unique = []
    for r in all_results:
        if r["url"] not in seen:
            seen.add(r["url"])
            unique.append(r)

    if fmt == "json":
        return jsonify({"results": unique[:30], "suggestions": []})
    return jsonify({"results": unique[:30], "suggestions": []})


@app.route("/healthz")
def healthz():
    return "OK"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
