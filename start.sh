#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "================================================"
echo "          MorphLive Local Reality Studio         "
echo "================================================"

if [ ! -d "node_modules" ]; then
    echo "Installing application dependencies..."
    npm install
fi

echo "Launching MorphLive..."
npm start
