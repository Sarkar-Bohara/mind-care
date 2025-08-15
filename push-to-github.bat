@echo off
echo Initializing Git repository...
git init

echo Adding remote repository...
git remote add origin https://github.com/Sarkar-Bohara/mind-care.git

echo Adding all files...
git add .

echo Committing files...
git commit -m "Initial commit: MindCare Hub mental health platform"

echo Pushing to GitHub main branch...
git push -u origin main

echo Done! Repository pushed to GitHub.
pause