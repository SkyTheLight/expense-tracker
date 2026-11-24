#!/bin/sh
set -eu

BUILD_NUMBER="${1:-${BUILD_NUMBER:-}}"
if [ -z "$BUILD_NUMBER" ]; then
  echo "Usage: ./package-artifact.sh <build-number> (or set BUILD_NUMBER)"
  exit 1
fi

if [ ! -d dist ]; then
  echo "dist/ not found. Run 'npm run build' first."
  exit 1
fi

ARTIFACT="react-app-${BUILD_NUMBER}.tar.gz"
tar -czf "$ARTIFACT" dist Dockerfile
echo "Created $ARTIFACT"
tar -tzf "$ARTIFACT"
