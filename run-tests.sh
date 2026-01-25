#!/bin/bash

echo "=== NETFLIX CLONE TEST PIPELINE ==="

# Step 1: jsdom tests
echo ""
echo "[1/3] Running jsdom tests (components, hooks, actions)..."
yarn test --testEnvironment=jsdom --testPathIgnorePatterns="app/api" --coverage --coverageReporters=lcov --coverageReporters=json-summary --coverageDirectory=coverage-jsdom

if [ $? -ne 0 ]; then
    echo "❌ jsdom tests failed"
    exit 1
fi

# Step 2: node tests
echo ""
echo "[2/3] Running node tests (API routes)..."
yarn test --testEnvironment=node app/api --coverage --coverageReporters=lcov --coverageReporters=json-summary --coverageDirectory=coverage-node

if [ $? -ne 0 ]; then
    echo "❌ node tests failed"
    exit 1
fi

# Step 3: merge coverage
echo ""
echo "[3/3] Merging coverage files..."
mkdir -p coverage
cat coverage-jsdom/lcov.info coverage-node/lcov.info > coverage/lcov.info
cp coverage-jsdom/coverage-summary.json coverage/coverage-summary.json

echo ""
echo "✅ All tests passed!"
echo "Coverage: coverage/lcov.info"
