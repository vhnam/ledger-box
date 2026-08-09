#!/usr/bin/env bash
# Block git commit commands that would add Co-authored-by / Made-with Cursor trailers.
set -euo pipefail

input="$(cat)"
command="$(printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

# Always allow if we cannot parse the command.
if [[ -z "${command}" ]]; then
  printf '%s\n' '{"permission":"allow"}'
  exit 0
fi

lower="$(printf '%s' "$command" | tr '[:upper:]' '[:lower:]')"

if printf '%s' "$lower" | grep -Eq 'co-authored-by:|made-with:[[:space:]]*cursor|made with cursor'; then
  printf '%s\n' '{"permission":"deny","user_message":"Do not add Co-authored-by or Made-with Cursor attribution to commits."}'
  exit 0
fi

printf '%s\n' '{"permission":"allow"}'
exit 0
