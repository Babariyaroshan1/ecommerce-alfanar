# GitHub Project Setup Guide (Second PC)

This guide explains how to work with the same GitHub repository on another PC.

---

## Repository

Repository URL:

```bash
https://github.com/Babariyaroshan1/ecommerce-alfanar.git
```

---

# First Time Setup (New PC)

## Step 1: Install Git

Download and install Git:

https://git-scm.com/downloads

After installation, open **Git Bash**.

---

## Step 2: Go to your desired folder

Example:

```bash
cd ~/Desktop
```

or

```bash
cd ~/Documents
```

---

## Step 3: Clone the Repository

```bash
git clone https://github.com/Babariyaroshan1/ecommerce-alfanar.git
```

This will create a folder:

```
ecommerce-alfanar
```

Open this folder in VS Code.

---

# Working on the Project

Make your code changes.

---

# Check Changed Files

```bash
git status
```

---

# Add Files

```bash
git add .
```

---

# Commit Changes

```bash
git commit -m "Describe your changes"
```

Example:

```bash
git commit -m "Added login page"
```

---

# Push to GitHub

```bash
git push origin main
```

---

# Before Starting Work Every Day

Always pull the latest code first.

```bash
git pull origin main
```

Then start coding.

---

# Complete Workflow

```bash
git pull origin main
git status
git add .
git commit -m "Your Commit Message"
git push origin main
```

---

# First-Time Git Configuration (Only Once Per PC)

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Example:

```bash
git config --global user.name "Babariya Roshan"
git config --global user.email "your-email@gmail.com"
```

Check configuration:

```bash
git config --list
```

---

# If Git Asks for Login

Use your GitHub account.

If Password Authentication is disabled, use a **Personal Access Token (PAT)** instead of your GitHub password.

---

# Never Do This

❌ Do NOT download the project as ZIP if you want to push changes.

Always use:

```bash
git clone
```

because it keeps the complete Git history.

---

# Useful Commands

Current status

```bash
git status
```

Current branch

```bash
git branch
```

See commit history

```bash
git log --oneline
```

See remote repository

```bash
git remote -v
```

Pull latest code

```bash
git pull origin main
```

Push code

```bash
git push origin main
```

Clone repository

```bash
git clone https://github.com/Babariyaroshan1/ecommerce-alfanar.git
```

---

# Important Notes

- Always work inside the cloned project folder.
- Never delete the `.git` folder.
- Never use "Download ZIP" if you want to continue pushing code.
- Before starting work, run:

```bash
git pull origin main
```

- After completing work:

```bash
git add .
git commit -m "Your Commit Message"
git push origin main
```

---

Project Repository:

https://github.com/Babariyaroshan1/ecommerce-alfanar.git