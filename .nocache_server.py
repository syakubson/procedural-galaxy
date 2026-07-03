"""Dev-only static file server that disables all HTTP caching.

Serves the current directory over plain HTTP on port 8124 with
``Cache-Control: no-store`` on every response, so edits to the app's JS/CSS/HTML
are always picked up on reload without a hard refresh. Threaded so one slow or
stuck connection (an 8K skybox download, a keep-alive) can't block every other
request.

Run with:
    python3 .nocache_server.py
"""

import http.server
import socketserver


class H(http.server.SimpleHTTPRequestHandler):
    """Request handler that stamps every response as never-cacheable."""

    def end_headers(self) -> None:
        """Add no-cache headers before finishing off the response headers."""
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        """Suppress the default per-request access log line."""


# Threaded so large media (8K skybox, mp3s) or a stuck keep-alive connection
# can't block every other request — the single-threaded TCPServer would wedge.
class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Threading HTTP server so one slow connection can't stall the rest."""

    daemon_threads = True
    allow_reuse_address = True


with Server(('', 8124), H) as httpd:
    httpd.serve_forever()
