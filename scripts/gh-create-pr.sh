#!/bin/bash
# Create a PR from current branch to main
# Usage: bash scripts/gh-create-pr.sh "PR Title" "PR Body"
export PATH="/c/Program Files/GitHub CLI:$PATH"
TITLE="$1"
BODY="$2"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
gh pr create --title "$TITLE" --body "$BODY" --base main --head "$BRANCH"
