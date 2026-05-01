---
name: minpaku-reporter
description: Automate Japanese Minpaku reporting on the 民泊制度運営システム（事業者） site with Playwright MCP. Use when Codex needs to inspect a user's logged-in Minpaku business performance report list, ask for one or more 届出番号, propose unreported reporting periods, and optionally submit zero-stay reports after confirmation.
---

# Minpaku Reporter

Use Playwright MCP against the logged-in `https://www.minpaku.mlit.go.jp/jigyo/` session. Never ask the user to paste credentials into chat, and never store credentials in this skill.

## Required Interaction

- Always ask for the target `届出番号` if the current user request does not provide it.
- If the request provides multiple `届出番号`, treat each independently and report results per number.
- Before submitting anything, propose the missing target periods and ask the user to confirm the exact submission list.
- If the current date falls inside a selectable reporting period, label that period as current/incomplete and ask explicitly before submitting it.
- Submit only reports the user has confirmed. Use `0` for every numeric field unless the user gives different values.

## Reporting Periods

The site uses these two-month labels:

- `YYYY年度04月～05月`
- `YYYY年度06月～07月`
- `YYYY年度08月～09月`
- `YYYY年度10月～11月`
- `YYYY年度12月～01月`
- `YYYY年度02月～03月`

The fiscal year label is the year that starts in April. For example, `2025年度02月～03月` means February to March 2026.

## Workflow

1. Navigate to `https://www.minpaku.mlit.go.jp/jigyo/jissekilist`.
2. If redirected to login, ask the user to log in in the browser, then continue.
3. Ask for target `届出番号` unless already supplied.
4. Run `scripts/discover-unreported.js` to inspect existing reports and selectable periods.
5. Propose unreported periods: selectable periods that do not already appear for that `届出番号`.
6. Ask for confirmation with a compact list: `届出番号 -> period labels`.
7. Run `scripts/submit-zero-reports.js` only for confirmed pairs.
8. After every save, require `事業実績の登録が完了しました。`, click `閉じる`, and wait until the report list page is shown before processing the next report.

## Running Scripts

The scripts read parameters from `window.MINPAKU_REPORTER_PARAMS` before they navigate away from the current page. Set parameters with `browser_run_code_unsafe`, then run the script file with `browser_run_code_unsafe` using its `filename` argument.

Discovery parameters:

```javascript
async (page) => {
  await page.evaluate((params) => {
    window.MINPAKU_REPORTER_PARAMS = params;
  }, { targetNumbers: ['第M130020507号'] });
  return 'params set';
}
```

Then run:

- `scripts/discover-unreported.js`

Submission parameters:

```javascript
async (page) => {
  await page.evaluate((params) => {
    window.MINPAKU_REPORTER_PARAMS = params;
  }, {
    targetPairs: [
      { todokedeNumber: '第M130020507号', period: '2025年度06月～07月' }
    ]
  });
  return 'params set';
}
```

Then run:

- `scripts/submit-zero-reports.js`

`submit-zero-reports.js` also accepts `{ targetNumbers, targetPeriods }` and submits the cross product, but prefer `targetPairs` after user confirmation to avoid accidental broad submissions.

## Script Responsibilities

- `scripts/discover-unreported.js`: scan the Visualforce list with pagination, collect existing period labels per `届出番号`, read selectable periods from the new-report form, and return `proposed` missing periods.
- `scripts/submit-zero-reports.js`: open a fresh form for each confirmed pair, input the `届出番号`, select the period, set every number field to `0`, validate values before saving, confirm the save, verify completion text, click `閉じる`, and report whether it returned to the list page.

If discovery cannot confidently inspect the list because the page structure changes, state the uncertainty and ask the user for the last completed period before proposing submissions.

## Reporting Results

End with:

- proposed or submitted periods grouped by `届出番号`
- any skipped periods and why
- any failures with the page message or validation phase

Keep the final answer concise, but include exact period labels.
