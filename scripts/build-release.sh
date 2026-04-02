#!/usr/bin/env bash
# build-release.sh — Load .env.local into the shell, then run Gradle assembleRelease.
#
# Usage (from project root):
#   bash scripts/build-release.sh
#
# Why this is needed:
#   Gradle's assembleRelease does not run Metro/Expo's JS bundler through the
#   normal "expo start" path, so EXPO_PUBLIC_* variables declared in .env.local
#   are never injected unless they are already present in the shell environment
#   that launches Gradle.

set -e

ENV_FILE="$(dirname "$0")/../.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: .env.local not found at $ENV_FILE — EXPO_PUBLIC_* vars will be empty."
else
  echo "Loading environment from .env.local …"
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip blank lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # Only export lines that look like KEY=VALUE
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
    fi
  done < "$ENV_FILE"
  echo "Done loading .env.local"
fi

echo "Running Gradle assembleRelease …"
cd "$(dirname "$0")/../android"
./gradlew assembleRelease "$@"
