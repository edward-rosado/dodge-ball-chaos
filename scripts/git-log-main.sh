#!/bin/bash
# Show commits unique to current branch (not in main)
git log --oneline main..HEAD
