"""Restricted localhost bridge for Verse formatter integration tests.

This listener intentionally exposes only test-safe operations:
- ping
- deploy_verse_files
- clear_verse_formatter_tests
- compile_verse
- compile_verse_files

It must not expose arbitrary Python execution.
"""

import json
import shutil
import socket
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import unreal

PORTS = range(8785, 8792)
TEST_ROOT_NAME = "VerseFormatterCompileTests"


def _state():
    defaults = {
        "_verse_formatter_test_server": None,
        "_verse_formatter_test_thread": None,
        "_verse_formatter_test_port": 0,
        "_verse_formatter_test_lock": threading.RLock(),
    }
    for name, value in defaults.items():
        if not hasattr(unreal, name):
            setattr(unreal, name, value)


def _content_root():
    return Path(__file__).resolve().parents[1]


def _test_root():
    return _content_root() / TEST_ROOT_NAME


def _json(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple)):
        return [_json(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json(item) for key, item in value.items()}
    return str(value)


def _free_port():
    for port in PORTS:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("127.0.0.1", port))
            return port
        except OSError:
            pass
        finally:
            sock.close()
    raise RuntimeError("No free Verse formatter test listener port")


def _workflow_message(message):
    body = json.dumps(message, separators=(",", ":")).encode("utf-8")
    return b"Content-Length: " + str(len(body)).encode("ascii") + b"\r\n\r\n" + body


def _workflow_recv(buffer):
    messages = []
    while b"\r\n\r\n" in buffer:
        header, rest = buffer.split(b"\r\n\r\n", 1)
        length = None
        for line in header.decode("utf-8", "replace").split("\r\n"):
            key, _, value = line.partition(":")
            if key.lower() == "content-length":
                length = int(value.strip())
                break
        if length is None or len(rest) < length:
            break
        messages.append(json.loads(rest[:length].decode("utf-8", "replace")))
        buffer = rest[length:]
    return messages, buffer


def _compile_verse(timeout=120.0):
    request = {"seq": 1, "type": 1, "command": "compileProject", "params": {}}
    deadline = time.time() + float(timeout)
    events, buffer = [], b""
    with socket.create_connection(("127.0.0.1", 1962), timeout=float(timeout)) as sock:
        sock.settimeout(0.25)
        sock.sendall(_workflow_message(request))
        while time.time() < deadline:
            try:
                data = sock.recv(65536)
            except socket.timeout:
                continue
            if not data:
                break
            buffer += data
            messages, buffer = _workflow_recv(buffer)
            for message in messages:
                events.append(message)
                if message.get("type") == 2 and message.get("seq") == 1:
                    result = message.get("result", {})
                    return {
                        "ok": not result.get("numErrors", 1),
                        "message": result.get("message", ""),
                        "numWarnings": result.get("numWarnings"),
                        "numErrors": result.get("numErrors"),
                        "events": events,
                    }
    return {"ok": False, "error": "Timed out waiting for Verse compile", "events": events}


def _ping():
    content_root = _content_root()
    return {
        "ok": True,
        "kind": "verse_formatter_test_listener",
        "port": unreal._verse_formatter_test_port,
        "python": sys.version,
        "contentRoot": str(content_root),
        "testRoot": str(_test_root()),
    }


def _clear_tests():
    root = _test_root()
    if root.exists():
        shutil.rmtree(root)
    return {"ok": True, "removed": str(root)}


def _safe_target(relative_path):
    if not isinstance(relative_path, str) or not relative_path.endswith(".verse"):
        raise ValueError("deployed file path must be a .verse relative path")
    if Path(relative_path).is_absolute():
        raise ValueError("deployed file path must be relative")

    root = _test_root().resolve()
    target = (root / relative_path).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        raise ValueError("deployed file path escapes the Verse formatter test root")
    return target


def _write_verse_files(files):
    if not isinstance(files, list):
        raise ValueError("files must be a list")

    written = []
    for file_data in files:
        if not isinstance(file_data, dict):
            raise ValueError("each file entry must be an object")
        target = _safe_target(file_data.get("path"))
        content = file_data.get("content")
        if not isinstance(content, str):
            raise ValueError("file content must be a string")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8", newline="\n")
        written.append(str(target))

    return {"ok": True, "written": written}


def _deploy_verse_files(files):
    _clear_tests()
    return _write_verse_files(files)


def _compile_verse_files(files, timeout=240.0):
    written = []
    try:
        _clear_tests()
        deploy_result = _write_verse_files(files)
        written = deploy_result["written"]
        compile_result = _compile_verse(timeout=timeout)
        compile_result["written"] = written
        return compile_result
    finally:
        _clear_tests()


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload, default=_json).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(200, _ping())

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            command, params = body.get("command"), body.get("params", {})

            if command == "ping":
                self._send(200, _ping())
            elif command == "clear_verse_formatter_tests":
                with unreal._verse_formatter_test_lock:
                    self._send(200, _clear_tests())
            elif command == "deploy_verse_files":
                with unreal._verse_formatter_test_lock:
                    self._send(200, _deploy_verse_files(params.get("files")))
            elif command == "compile_verse":
                with unreal._verse_formatter_test_lock:
                    self._send(200, _compile_verse(**params))
            elif command == "compile_verse_files":
                with unreal._verse_formatter_test_lock:
                    self._send(
                        200,
                        _compile_verse_files(
                            params.get("files"),
                            timeout=params.get("timeout", 240.0),
                        ),
                    )
            else:
                self._send(400, {"ok": False, "error": "Unknown or disallowed command"})
        except Exception as exc:
            self._send(500, {"ok": False, "error": str(exc), "traceback": traceback.format_exc()})

    def log_message(self, *_args):
        pass


def start_listener():
    _state()
    if unreal._verse_formatter_test_server is not None:
        return unreal._verse_formatter_test_port

    port = _free_port()
    unreal._verse_formatter_test_server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    unreal._verse_formatter_test_port = port
    unreal._verse_formatter_test_thread = threading.Thread(
        target=unreal._verse_formatter_test_server.serve_forever,
        daemon=True,
    )
    unreal._verse_formatter_test_thread.start()
    unreal.log("[VerseFormatterTest] Listener started on http://127.0.0.1:%s" % port)
    return port


_state()
try:
    start_listener()
except Exception as exc:
    unreal.log_error("[VerseFormatterTest] Listener failed: %s" % exc)
