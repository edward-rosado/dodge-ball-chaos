#!/bin/bash
# Push current branch to origin
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$BRANCH"
