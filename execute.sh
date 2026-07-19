#!/bin/bash

echo "Environment: $ENV"

if [ "$ENV" = "staging" ]; then
  echo "Running tests with @staging tag..."
  npx playwright test --grep @staging
else
  echo "Running all tests (no @staging filter)..."
  npx playwright test
fi
