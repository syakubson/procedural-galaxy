import http.server
import socketserver


class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, *args):
        pass


# Threaded so large media (8K skybox, mp3s) or a stuck keep-alive connection
# can't block every other request — the single-threaded TCPServer would wedge.
class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


with Server(('', 8124), H) as httpd:
    httpd.serve_forever()
