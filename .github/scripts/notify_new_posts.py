#!/usr/bin/env python3
"""Email the Resend audience about any blog posts added in this push."""
import html
import json
import os
import re
import subprocess
import unicodedata
import urllib.error
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLOG_DIR = "content/blog/"
BASE_URL = "https://www.philip-emmanuele.com"

RESEND_API_KEY = os.environ["RESEND_API_KEY"]
RESEND_AUDIENCE_ID = os.environ["RESEND_AUDIENCE_ID"]
FROM_ADDRESS = os.environ.get("RESEND_FROM", "Philip's Blog <newsletter@philip-emmanuele.com>")
BEFORE_SHA = os.environ["BEFORE_SHA"]
AFTER_SHA = os.environ["AFTER_SHA"]


def added_blog_files():
    if not BEFORE_SHA or set(BEFORE_SHA) == {"0"}:
        # First push to a new branch/repo, or a manual workflow_dispatch run: nothing to diff against.
        return []
    out = subprocess.run(
        ["git", "diff", "--name-status", BEFORE_SHA, AFTER_SHA, "--", BLOG_DIR],
        cwd=REPO_ROOT, capture_output=True, text=True, check=True,
    ).stdout
    files = []
    for line in out.splitlines():
        status, _, path = line.partition("\t")
        if status == "A" and path.endswith(".md") and not path.endswith("_index.md"):
            files.append(path)
    return files


def parse_front_matter(path):
    text = open(os.path.join(REPO_ROOT, path), encoding="utf-8").read()
    match = re.match(r"^\+\+\+\n(.*?)\n\+\+\+", text, re.DOTALL)
    front_matter = match.group(1) if match else ""
    title_match = re.search(r'^title\s*=\s*"(.*)"\s*$', front_matter, re.MULTILINE)
    title = title_match.group(1) if title_match else None
    hidden = bool(re.search(r"^\s*hidden\s*=\s*true\s*$", front_matter, re.MULTILINE))
    return title, hidden


def slugify(title):
    text = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower())
    return text.strip("-")


def send_broadcast(title, url):
    subject = f"New post: {title}"
    body = f'<p>A new post just went up on my blog - check it out here: <a href="{url}">{html.escape(title)}</a></p>'
    payload = json.dumps({
        "audience_id": RESEND_AUDIENCE_ID,
        "from": FROM_ADDRESS,
        "subject": subject,
        "html": body,
        "send": True,
    }).encode()
    req = urllib.request.Request(
        "https://api.resend.com/broadcasts",
        data=payload,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            # Resend's edge (Cloudflare) blocks urllib's default UA as a bot signature.
            "User-Agent": "philip-emmanuele-blog-notifier/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Sent broadcast for {title!r}: {resp.read().decode()}")
    except urllib.error.HTTPError as err:
        print(f"Resend API error for {title!r}: {err.code} {err.read().decode()}")
        raise


def main():
    files = added_blog_files()
    if not files:
        print("No new blog posts in this push.")
        return
    for path in files:
        title, hidden = parse_front_matter(path)
        if not title:
            print(f"Skipping {path}: no title found in front matter.")
            continue
        if hidden:
            print(f"Skipping {path!r} ({title!r}): marked extra.hidden.")
            continue
        url = f"{BASE_URL}/blog/{slugify(title)}/"
        send_broadcast(title, url)


if __name__ == "__main__":
    main()
