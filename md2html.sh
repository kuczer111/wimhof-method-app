#!/usr/bin/env bash
# ============================================================================
# md2html.sh — Convert a markdown file to a styled HTML page.
# ============================================================================
#
# Usage:
#   ./md2html.sh INPUT.md                    Output: INPUT.html (same dir)
#   ./md2html.sh INPUT.md OUTPUT.html        Output: specified path
#   ./md2html.sh INPUT.md -o DIR/            Output: DIR/INPUT.html
#
# Requires: npx (uses `marked` package for GFM conversion)
# ============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./md2html.sh INPUT.md [OUTPUT.html | -o DIR/]"
  exit 1
fi

INPUT="$1"

if [ ! -f "$INPUT" ]; then
  echo "File not found: $INPUT"
  exit 1
fi

# Determine output path
BASENAME=$(basename "$INPUT" .md)
if [ $# -ge 2 ]; then
  if [ "$2" = "-o" ] && [ -n "${3:-}" ]; then
    OUTPUT="${3%/}/${BASENAME}.html"
  else
    OUTPUT="$2"
  fi
else
  OUTPUT="$(dirname "$INPUT")/${BASENAME}.html"
fi

# Extract title from first H1, fallback to filename
TITLE=$(grep -m1 '^# ' "$INPUT" | sed 's/^# //' || echo "$BASENAME")
# Strip "Research: " prefix for cleaner display
CLEAN_TITLE=$(echo "$TITLE" | sed 's/^Research: //')

# Build a short heading + optional subtitle for long titles
DISPLAY_TITLE="$CLEAN_TITLE"
SUBTITLE=""
if [ ${#CLEAN_TITLE} -gt 80 ]; then
  # Split at first dash, colon, or em-dash
  MAYBE_SUB=$(echo "$CLEAN_TITLE" | sed -n 's/^[^—:–]*[—:–] *//p')
  if [ -n "$MAYBE_SUB" ]; then
    DISPLAY_TITLE=$(echo "$CLEAN_TITLE" | sed 's/ *[—:–].*//')
    SUBTITLE="$MAYBE_SUB"
  fi
fi

# Build the replacement H1 tag
if [ -n "$SUBTITLE" ]; then
  NEW_H1="<h1>${DISPLAY_TITLE}<span class=\"subtitle\">${SUBTITLE}</span></h1>"
else
  NEW_H1="<h1>${DISPLAY_TITLE}</h1>"
fi

# Detect language from content
LANG="en"
if grep -qiE 'hortensj|przycina|ogrod|kwiat|wrocław|polska' "$INPUT" 2>/dev/null; then
  LANG="pl"
fi

# Pick accent color based on content type
ACCENT="#4299e1"
ACCENT_LIGHT="#ebf8ff"
ACCENT_DARK="#2b6cb0"
ACCENT_DARKER="#2c5282"
if grep -qiE 'hortensj|ogrod|garden|plant|prune|kwiat' "$INPUT" 2>/dev/null; then
  ACCENT="#48bb78"
  ACCENT_LIGHT="#f0fff4"
  ACCENT_DARK="#2f855a"
  ACCENT_DARKER="#276749"
fi

# Convert markdown to HTML body, replace first h1 with shortened version
BODY=$(npx --yes marked --gfm < "$INPUT")
BODY=$(echo "$BODY" | python3 -c "
import sys, re
html = sys.stdin.read()
new_h1 = '''${NEW_H1}'''
html = re.sub(r'<h1>.*?</h1>', new_h1, html, count=1, flags=re.DOTALL)
sys.stdout.write(html)
")

# Write full HTML page
cat > "$OUTPUT" <<HTMLEOF
<!DOCTYPE html>
<html lang="${LANG}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${TITLE}</title>
  <style>
    body {
      max-width: 750px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      color: #2d3748;
      background: #fafafa;
    }
    h1 {
      font-size: clamp(1.2rem, 4vw, 1.8rem);
      color: #1a202c;
      border-bottom: 2px solid ${ACCENT};
      padding-bottom: 0.5rem;
      line-height: 1.3;
      word-wrap: break-word;
    }
    h1 .subtitle {
      display: block;
      font-size: 0.75em;
      font-weight: 400;
      color: #4a5568;
      margin-top: 0.3rem;
    }
    h2 { font-size: 1.4rem; color: ${ACCENT_DARK}; margin-top: 2rem; }
    h3 { font-size: 1.15rem; color: ${ACCENT_DARKER}; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; overflow-x: auto; display: block; }
    th, td { border: 1px solid #cbd5e0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: ${ACCENT_LIGHT}; font-weight: 600; }
    tr:nth-child(even) { background: #f7fafc; }
    blockquote { border-left: 4px solid ${ACCENT}; margin: 1rem 0; padding: 0.5rem 1rem; background: ${ACCENT_LIGHT}; }
    code { background: #edf2f7; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.9em; }
    pre { background: #edf2f7; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    ul, ol { padding-left: 1.5rem; }
    li { margin-bottom: 0.3rem; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
    strong { color: #1a202c; }
    a { color: ${ACCENT_DARK}; }
    @media print { body { max-width: 100%; font-size: 12pt; } }
    @media (max-width: 600px) { body { font-size: 15px; padding: 0 1rem; } table { font-size: 0.85em; } }
  </style>
</head>
<body>
${BODY}
</body>
</html>
HTMLEOF

echo "Converted: ${OUTPUT}"
