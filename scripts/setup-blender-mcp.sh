#!/usr/bin/env bash
set -euo pipefail
# Installs Python dependencies locally; Blender itself remains separately installed.
root="$(cd "$(dirname "$0")/.." && pwd)"
venv="$root/.runtime/venv"
uv venv --allow-existing "$venv"
uv pip install --python "$venv/bin/python" -r "$root/mcp/requirements.txt" socksio \
 'blender-mcp @ git+https://github.com/sandraschi/blender-mcp.git@78f73ce8668f7fcbc92028dc476b9e1e35b521d6'
printf 'MCP Python: %s\nBlender MCP: %s\nSet BLENDER_EXECUTABLE to your Blender executable.\n' "$venv/bin/python" "$venv/bin/blender-mcp-server"
