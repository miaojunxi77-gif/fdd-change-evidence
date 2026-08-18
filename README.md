# FDD Change Evidence Explorer

An interactive research site for examining change across Franchise Disclosure Documents (FDDs).

The public dataset contains derived research results only: company, comparison years, Item number, change score, interpretation, English evidence quotations, and page locators. Original FDD files are not distributed in this repository.

## Coverage

- Consecutive-year change: DeepSeek v4.3 cleaned results across all 23 FDD Items. The production set contains 4,557 prepared jobs, 4,352 complete comparisons, 1,661 comparisons with an included conservative change, and 7,705 included atomic changes.
- Cross-period substantive change: DeepSeek v4.5 production output for nine research-priority Items, with 1,334 successful comparisons, 14,505 candidate atomic changes and 6,211 outcome-ready atomic changes across 231 route-specific company-year pairs.
- The consecutive row-level explorer contains included change jobs only; complete no-change comparisons remain in the aggregate denominator. Cross-period rows retain outcome-ready and review-required flags.
- Consecutive evidence quotations and page locators come from the cleaned DeepSeek export and are explicitly labeled when source-PDF page verification remains pending.
- `scripts/generate_deepseek_site_data.py` reproducibly rebuilds both route datasets from `FDD_consecutive_results_cleaned_2026-08-17.xlsx` and `FDD_cross_period_v4_5_upload.zip`.

## Local development

Requires Node.js 22 or newer.

```bash
npm ci
GITHUB_PAGES=true GITHUB_REPOSITORY=miaojunxi77-gif/fdd-change-evidence npm run build:github
```

The GitHub Actions workflow deploys the static export to GitHub Pages after each push to `main`.
