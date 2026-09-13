#!/usr/bin/env bash
# Pull the collector's finished chunks out of the page and write them to disk.
#
# The page cannot write files and its downloads are gated: Chrome blocks
# programmatic downloads after the first one unless the site holds the
# "automatic downloads" permission, and a blocked click throws nothing. That is
# how 66 conversations were lost on 2026-08-22 while the collector reported
# success. So the collector parks each chunk in `window.__cgVault` and this
# drains it over the same chrome-cli channel the status is read on.
#
# The file is written before the entry is dropped, and the entry is dropped only
# after the write is verified as parseable JSON. A crash mid-drain therefore
# costs a repeated chunk, never a lost one.
#
# Usage:  tools/chatgpt/drain.sh [output-directory]

set -uo pipefail
OUT="${1:-$HOME/Downloads}"
SLICE=100000

command -v chrome-cli >/dev/null 2>&1 || { echo "chrome-cli not installed" >&2; exit 1; }

# Same pinned tab `run.sh` wrote, and for the same reason: chrome-cli's default
# target is the active tab of the frontmost window, so draining without an id
# reads whatever the operator happens to be looking at. Here that is worse than
# a stall - the vault is the only copy of a fetched chunk until this writes it
# out, and "no collector in the active tab" is what a wrong tab looks like.
TABFILE="${CHATGPT_TAB_FILE:-$HOME/.brain-chatgpt-tab}"
TAB="$(cat "$TABFILE" 2>/dev/null || true)"
[ -n "$TAB" ] || { echo "no pinned tab in $TABFILE; run.sh pins one" >&2; exit 0; }
cg() { timeout 60 chrome-cli execute "$1" -t "$TAB" 2>/dev/null; }

count=$(cg 'String((window.__cgVault||[]).length)')
case "$count" in ''|*[!0-9]*) echo "no collector in pinned tab $TAB"; exit 0;; esac
[ "$count" -eq 0 ] && exit 0

drained=0
while [ "$count" -gt 0 ]; do
  name=$(cg 'String(window.__cgVault[0].name)')
  size=$(cg 'String(window.__cgVault[0].json.length)')
  case "$name" in ''|*/*|*..*) echo "refusing suspicious vault name: $name" >&2; exit 1;; esac
  case "$size" in ''|*[!0-9]*) echo "unreadable vault entry size" >&2; exit 1;; esac

  tmp="$OUT/.$name.partial"
  : > "$tmp"
  offset=0
  while [ "$offset" -lt "$size" ]; do
    end=$((offset + SLICE))
    cg "window.__cgVault[0].json.slice($offset,$end)" >> "$tmp" || break
    offset=$end
  done
  # chrome-cli appends a newline per slice; JSON.stringify output contains no
  # literal newline, so stripping every one of them reassembles the original.
  tr -d '\n' < "$tmp" > "$tmp.joined" && mv "$tmp.joined" "$tmp"

  if python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$tmp" 2>/dev/null; then
    mv "$tmp" "$OUT/$name"
    cg 'window.__cgVault.shift(); String(window.__cgVault.length)' >/dev/null
    drained=$((drained + 1))
  else
    rm -f "$tmp"
    echo "vault entry $name did not reassemble; leaving it in the page" >&2
    break
  fi
  count=$(cg 'String((window.__cgVault||[]).length)')
  case "$count" in ''|*[!0-9]*) break;; esac
done

echo "drained $drained chunk(s)"
