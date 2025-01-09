#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "You must provide a commit message"
  exit 1
fi

# Check if this is the first time setting up the repo
if [ ! -d ".git" ]; then
  echo "Setting up git repository for the first time..."

  # Initialize the git repository
  git init

  # Create a README.md if it doesn't exist
  if [ ! -f "README.md" ]; then
    echo "# now_gpt" >> README.md
    git add README.md
    git commit -m "Add README.md for initial setup"
  fi

  # Set up the remote and push
  git remote add origin https://github.com/tillo13/now_gpt.git
  git branch -M main
  git push -u origin main
fi

# Add all changes to git
git add .

# Commit the changes with the provided message
git commit -m "$1"

# Push to GitHub
git push origin main

if [ $? -ne 0 ]; then
  echo ""
  echo "####################################"
  echo "# MERGE CONFLICT RESOLUTION STEPS: #"
  echo "####################################"
  echo ""
  echo "1. Fetch the latest changes from the remote repository:"
  echo "   git fetch origin"
  echo ""
  echo "2. Merge the changes from the remote branch into your local branch:"
  echo "   git merge origin/main"
  echo ""
  echo "3. If you encounter merge conflicts, open the conflicting files and resolve all conflicts manually."
  echo ""
  echo "4. Once resolved, stage the resolved files:"
  echo "   git add <filename>"
  echo ""
  echo "5. Finalize the merge with a commit:"
  echo "   git commit -m 'Resolve merge conflicts'"
  echo ""
  echo "6. Now push your changes again:"
  echo "   git push origin main"
  echo ""
  exit 1
fi

