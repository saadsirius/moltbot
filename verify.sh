#!/bin/bash
exec > verify_log.txt 2>&1
echo "Starting verification..."
echo "PWD: $(pwd)"

echo "Checking dist..."
if [ -d "dist" ]; then
  echo "dist directory exists."
  ls -F dist
else
  echo "dist directory MISSING."
fi

echo "Running tsc..."
pnpm exec tsc --project tsconfig.json
TSC_EXIT=$?
echo "TSC exit code: $TSC_EXIT"

echo "Checking dist after tsc..."
if [ -d "dist" ]; then
  echo "dist directory exists."
  ls -F dist
else
  echo "dist directory MISSING."
fi

echo "Running moltbot health..."
./moltbot.mjs health
HEALTH_EXIT=$?
echo "Health exit code: $HEALTH_EXIT"

echo "Verification done."
