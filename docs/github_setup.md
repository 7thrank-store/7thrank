# 7th Rank — GitHub Repository Setup & CI/CD Pipeline Guide

## Overview

This guide covers setting up a GitHub repository for the 7th Rank chess apparel website, including branch strategy, CI/CD pipeline configuration, and deployment automation.

---

## 1. Repository Setup

### Create the Repository

1. **Go to GitHub** and create a new repository:
   - Repository name: `7th-rank-website`
   - Description: "Chess-inspired streetwear brand website — 7th Rank"
   - Visibility: Private (or Public if open-source)
   - Initialize with a README: Yes
   - Add `.gitignore`: Node
   - License: Choose as appropriate (e.g., MIT for open-source)

2. **Clone the repository locally:**
   ```bash
   git clone https://github.com/your-org/7th-rank-website.git
   cd 7th-rank-website
   ```

3. **Copy project files into the repository:**
   ```bash
   cp -r /path/to/project/* .
   ```

   The repository structure should be:
   ```
   7th-rank-website/
   ├── research/
   │   ├── jesko_jets_analysis.md
   │   ├── seo_strategy.md
   │   └── design_strategy.md
   ├── website/
   │   ├── index.html
   │   ├── css/
   │   │   └── style.css
   │   ├── js/
   │   │   └── main.js
   │   ├── images/
   │   │   ├── logo.svg
   │   │   └── placeholder-product.svg
   │   └── pages/
   │       ├── collections.html
   │       └── about.html
   ├── docs/
   │   ├── strategy_and_research.md
   │   ├── developer_guide.md
   │   └── github_setup.md
   ├── .gitignore
   └── README.md
   ```

4. **Initial commit and push:**
   ```bash
   git add .
   git commit -m "Initial commit: 7th Rank chess apparel website"
   git push origin main
   ```

---

## 2. Branch Strategy

### Git Flow (Recommended)

| Branch | Purpose | Merges Into |
|---|---|---|
| `main` | Production-ready code | — |
| `develop` | Integration branch for features | `main` |
| `feature/*` | Individual features or pages | `develop` |
| `hotfix/*` | Urgent production fixes | `main` and `develop` |
| `release/*` | Release preparation | `main` and `develop` |

### Branch Naming Conventions

```
feature/add-product-page
feature/shopify-integration
feature/responsive-fixes
hotfix/broken-nav-link
release/v1.0.0
```

### Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/shopify-integration
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: integrate Shopify Buy Button for product pages"
   ```

3. Push and create a Pull Request:
   ```bash
   git push origin feature/shopify-integration
   ```

4. After code review, merge into `develop`

5. When ready for release, merge `develop` into `main`

### Commit Message Convention

Follow the Conventional Commits specification:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting, missing semicolons (no code change)
refactor: restructure code without changing behavior
perf: performance improvement
test: add or update tests
chore: maintenance tasks
```

Examples:
```
feat: add chess board scroll-snap navigation
fix: resolve mobile menu overlay z-index issue
docs: update Shopify integration instructions
style: format CSS custom properties section
perf: add lazy loading to product images
```

---

## 3. Pull Request Workflow

### Creating a Pull Request

1. **Push your feature branch to GitHub:**
   ```bash
   git push origin feature/shopify-integration
   ```

2. **Open a Pull Request on GitHub:**
   - Go to the repository on GitHub
   - Click "Compare & pull request" (appears after pushing a new branch)
   - Or go to Pull Requests → New Pull Request → select your branch

3. **Fill in the PR template:**

   **Title**: Use the same convention as commit messages:
   ```
   feat: integrate Shopify Buy Button for product pages
   ```

   **Description** — include the following sections:
   ```markdown
   ## Summary
   Brief description of what this PR does.

   ## Changes
   - Added Shopify Buy Button embed code to `website/pages/collections.html`
   - Updated product card markup in `website/index.html` (Rank 7)
   - Added Shopify SDK script loader to `website/js/main.js`

   ## Files Changed
   - `website/pages/collections.html`
   - `website/index.html`
   - `website/js/main.js`

   ## Testing
   - [ ] Tested locally with Live Server
   - [ ] Verified on Chrome, Firefox, Safari
   - [ ] Checked mobile responsiveness
   - [ ] Validated HTML (no new errors)
   - [ ] Verified Shopify Buy Button loads and functions

   ## Screenshots
   (Attach before/after screenshots if UI changed)
   ```

4. **Assign reviewers**: Add at least one team member as a reviewer.

5. **Add labels**: Use labels like `feature`, `bugfix`, `documentation`, `design`, `urgent`.

### Reviewing a Pull Request

1. **Check the PR description**: Ensure it clearly explains what changed and why.

2. **Review the code diff**:
   - Look for HTML validity (proper closing tags, semantic elements)
   - Check CSS for specificity issues, unused styles, or responsive breakpoints
   - Verify JavaScript for errors, performance issues, or accessibility concerns
   - Ensure file paths are correct (especially relative paths between `pages/` and root)

3. **Test locally** (for significant changes):
   ```bash
   git fetch origin
   git checkout feature/shopify-integration
   # Open website/index.html with Live Server and test
   ```

4. **Leave feedback**:
   - **Approve**: If changes look good and tests pass
   - **Request changes**: If issues need to be fixed before merging
   - **Comment**: For non-blocking suggestions or questions

5. **Merge the PR**:
   - Use **"Squash and merge"** for feature branches (keeps `develop` history clean)
   - Use **"Merge commit"** when merging `develop` into `main` (preserves full history)
   - Delete the feature branch after merging

### PR Checklist for 7th Rank Project

Before requesting review, verify:

- [ ] HTML validates without errors (`html-validate` or W3C validator)
- [ ] No broken internal links (check relative paths from both root and `pages/` directory)
- [ ] CSS changes don't break existing layouts (test all three pages: `index.html`, `collections.html`, `about.html`)
- [ ] JavaScript changes don't introduce console errors
- [ ] Responsive design works at mobile (375px), tablet (768px), and desktop (1024px+)
- [ ] JSON-LD structured data is still valid (test with Google Rich Results Test)
- [ ] Images have alt text
- [ ] New content follows the chess/brand terminology conventions

---

## 4. GitHub Actions CI/CD Pipeline

### HTML/CSS/JS Validation Pipeline

Create `.github/workflows/validate.yml`:

```yaml
name: Validate Website

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install html-validate
        run: npm install -g html-validate

      - name: Validate HTML files
        run: |
          html-validate website/index.html
          html-validate website/pages/collections.html
          html-validate website/pages/about.html

      - name: Check for broken links
        run: |
          npx linkinator website/index.html --recurse --skip "https://"

      - name: Lighthouse CI audit
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            website/index.html
          uploadArtifacts: true
```

### Deploy to GitHub Pages

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Deploy to Netlify

Create `.github/workflows/netlify.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: './website'
          production-branch: main
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 5. GitHub Repository Settings

### Branch Protection Rules

For the `main` branch, enable:

1. **Require pull request reviews before merging**
   - Required approving reviews: 1
2. **Require status checks to pass before merging**
   - Select the "Validate Website" workflow
3. **Require branches to be up to date before merging**
4. **Do not allow force pushes**
5. **Do not allow deletions**

### Repository Secrets

Add the following secrets in Settings → Secrets and variables → Actions:

| Secret Name | Description |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token (if using Netlify) |
| `NETLIFY_SITE_ID` | Netlify site ID (if using Netlify) |
| `SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront API access token |

### Repository Topics

Add these topics for discoverability:
- `chess`
- `streetwear`
- `apparel`
- `e-commerce`
- `css-grid`
- `vanilla-javascript`
- `responsive-design`

---

## 6. .gitignore Configuration

Create or update `.gitignore`:

```gitignore
# Dependencies
node_modules/

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
temp/
*.tmp
*.log

# Environment files
.env
.env.local
.env.production

# Build output
dist/
build/

# Shopify credentials (never commit)
shopify-config.json
```

---

## 7. README.md Template

Create a `README.md` at the repository root:

```markdown
# 7th Rank — Chess-Inspired Streetwear

> One Square From Promotion

Premium chess-inspired streetwear and apparel. 7th Rank creates fashion
for those who see the board differently.

## Quick Start

1. Clone the repository
2. Open `website/index.html` in your browser
3. Or use a local server: `npx serve website`

## Project Structure

- `website/` — Main website files (HTML, CSS, JS, images)
- `research/` — Design and SEO research documentation
- `docs/` — Developer guides and setup instructions

## Tech Stack

- HTML5 (semantic markup, JSON-LD structured data)
- CSS3 (CSS Grid, Custom Properties, scroll-snap, animations)
- Vanilla JavaScript (Intersection Observer, scroll handling)
- Shopify Buy Button (e-commerce integration ready)

## Documentation

- [Strategy & Research](docs/strategy_and_research.md)
- [Developer Guide](docs/developer_guide.md)
- [GitHub Setup](docs/github_setup.md)

## License

Copyright 2026 7th Rank. All rights reserved.
```

---

## 8. Release Process

### Creating a Release

1. **Merge `develop` into `main`:**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Tag the release:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0: Initial website launch"
   git push origin v1.0.0
   ```

3. **Create a GitHub Release:**
   - Go to Releases → Draft a new release
   - Select the tag `v1.0.0`
   - Title: "v1.0.0 — Initial Launch"
   - Describe changes in the release notes
   - Publish

### Version Numbering

Follow Semantic Versioning (SemVer):
- **Major** (v2.0.0): Breaking changes, major redesign
- **Minor** (v1.1.0): New features, new pages, new collections
- **Patch** (v1.0.1): Bug fixes, content updates, minor styling changes
