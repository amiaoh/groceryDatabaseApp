#!/bin/bash

echo "Running claude post-commit hook"

python scripts/claude_summarise.py
