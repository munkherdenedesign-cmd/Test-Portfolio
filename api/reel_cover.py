"""Authenticated Instagram Reel cover extraction, using only yt-dlp metadata.

No video is downloaded, and no cookies or credentials are supplied to Instagram.
The image is returned to the signed-in portfolio admin for saving to Supabase Storage.
"""
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

import yt_dlp

REEL_RE = re.compile(r"^https?://(?:www\.)?instagram\.com/reel/([A-Za-z0-9_-]{5,40})(?:[/?#].*)?$", re.I)
MAX_COVER_BYTES = 8 * 1024 * 1024
ADMIN_EMAIL = "munkherdenedesign@gmail.com"


def allowed_cdn(url):
    try:
        parsed = urllib.parse.urlsplit(url)
        host = (parsed.hostname or "").lower()
        return parsed.scheme == "https" and any(
            host == domain or host.endswith("." + domain)
            for domain in ("fbcdn.net", "cdninstagram.com", "instagram.com")
        )
    except ValueError:
        return False


class SafeImageRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if not allowed_cdn(newurl):
            raise ValueError("Untrusted image redirect")
        return super().redirect_request(request, fp, code, msg, headers, newurl)


def is_admin(token):
    supabase_url = os.environ.get("VITE_SUPABASE_URL", "").rstrip("/")
    anon_key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    if not supabase_url.startswith("https://") or not anon_key:
        raise RuntimeError("Supabase environment configuration missing")
    request = urllib.request.Request(
        supabase_url + "/auth/v1/user",
        headers={"Authorization": "Bearer " + token, "apikey": anon_key},
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            user = json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
        return False
    return user.get("email", "").strip().lower() == ADMIN_EMAIL


class handler(BaseHTTPRequestHandler):
    def send_json(self, code, message):
        payload = json.dumps({"error": message}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return self.send_json(401, "Sign in to extract a cover.")
        token = auth_header[7:].strip()
        if not token or len(token) > 8192:
            return self.send_json(401, "Invalid session.")
        content_length = self.headers.get("Content-Length", "0")
        try:
            length = int(content_length)
        except ValueError:
            return self.send_json(400, "Invalid request.")
        if length < 2 or length > 2048:
            return self.send_json(413, "Invalid request size.")
        try:
            payload = json.loads(self.rfile.read(length))
            url = payload.get("url", "")
            match = REEL_RE.fullmatch(url) if isinstance(url, str) else None
        except (ValueError, TypeError):
            match = None
        if not match:
            return self.send_json(400, "Enter a public Instagram Reel link.")

        try:
            if not is_admin(token):
                return self.send_json(403, "Admin access required.")
        except RuntimeError:
            return self.send_json(503, "Cover service is not configured.")

        # Canonicalize before yt-dlp sees the link. Never pass arbitrary URLs.
        reel_url = "https://www.instagram.com/reel/" + match.group(1) + "/"
        try:
            with yt_dlp.YoutubeDL({
                "skip_download": True,
                "noplaylist": True,
                "quiet": True,
                "no_warnings": True,
                "socket_timeout": 10,
                "retries": 0,
                "extractor_retries": 0,
            }) as ydl:
                metadata = ydl.extract_info(reel_url, download=False)
            if not isinstance(metadata, dict):
                raise ValueError("No Reel metadata")
            thumbnail = metadata.get("thumbnail")
            if not thumbnail:
                thumbnails = metadata.get("thumbnails") or []
                thumbnail = next((item.get("url") for item in reversed(thumbnails)
                                  if isinstance(item, dict) and item.get("url")), None)
            if not isinstance(thumbnail, str) or not allowed_cdn(thumbnail):
                raise ValueError("No safe thumbnail URL")

            opener = urllib.request.build_opener(SafeImageRedirects())
            request = urllib.request.Request(
                thumbnail, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/*"}
            )
            with opener.open(request, timeout=10) as image:
                content_type = image.headers.get("Content-Type", "").split(";")[0].strip().lower()
                if content_type not in ("image/jpeg", "image/png", "image/webp"):
                    raise ValueError("Unsupported image type")
                data = image.read(MAX_COVER_BYTES + 1)
            if not data or len(data) > MAX_COVER_BYTES:
                raise ValueError("Cover unavailable or too large")

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "private, no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(data)
        except Exception:
            self.send_json(422, "Automatic cover unavailable. Upload a cover image instead.")
