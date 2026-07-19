# FDD Change Evidence Explorer

An interactive research site for examining change across Franchise Disclosure Documents (FDDs).

The public dataset contains derived research results only: company, comparison years, Item number, change score, interpretation, English evidence quotations, and page locators. Original FDD files are not distributed in this repository.

## Coverage

- Consecutive-year change: all 23 FDD Items, 200 quality-ready comparisons per Item (4,600 Item comparisons; 261 route-specific company-year pairs).
- Cross-period substantive change: nine research-priority Items, 150 quality-ready comparisons per Item (1,350 Item comparisons; 233 route-specific company-year pairs).
- Score-0 and no-change comparisons are retained.
- Item rows open into company-level evidence with old/new quotations and PDF page references.

## Local development

Requires Node.js 22 or newer.

```bash
npm ci
GITHUB_PAGES=true GITHUB_REPOSITORY=miaojunxi77-gif/fdd-change-evidence npm run build:github
```

The GitHub Actions workflow deploys the static export to GitHub Pages after each push to `main`.
