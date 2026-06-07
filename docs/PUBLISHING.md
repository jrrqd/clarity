# Publishing to GitHub

The folder is already initialized as a Git repository on the `main` branch
with an initial commit.

## GitHub CLI

From the repository folder:

```bash
gh auth login
gh repo create clarity --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` for a private repository.

## Existing GitHub repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/clarity.git
git push -u origin main
```

## Before publishing

Check the commit identity:

```bash
git log -1 --format="%an <%ae>"
```

To change it before pushing:

```bash
git config user.name "Your Name"
git config user.email "your-github-email@example.com"
git commit --amend --reset-author --no-edit
```

GitHub accepts every bundled file without Git LFS; no file exceeds its
100 MB per-file limit.
