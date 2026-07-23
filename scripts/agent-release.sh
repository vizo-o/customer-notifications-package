#!/bin/bash
# Agent-friendly release for @vizo-o/customer-notifications.
# Runs pre-release gates then publishes via release-it --ci.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "agent-release: not a git repository"
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "agent-release: commit or stash changes before releasing"
    git status --short
    exit 1
fi

echo "Releasing @vizo-o/customer-notifications..."
npm run release:ci -- "$@"

echo "Done. Bump consumers with:"
echo "  cd dev-tools && ./scripts/global-package-update.sh @vizo-o/customer-notifications"
