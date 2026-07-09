# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: try_calculator.spec.ts >> GPA Try Calculator >> should load the calculator and have 3 default rows
- Location: tests\try_calculator.spec.ts:67:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Calculate your GPA instantly"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- img
- text: Next.js 16.2.10 Turbopack
- img
- dialog "Runtime Error":
  - text: Runtime Error
  - button "Copy Error Info":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - button "Attach Node.js inspector":
    - img
  - text: Your project's URL and Key are required to create a Supabase client! Check your Supabase project's API settings to find these values
  - link "https://supabase.com/dashboard/project/_/settings/api":
    - /url: https://supabase.com/dashboard/project/_/settings/api
  - paragraph:
    - img
    - text: proxy.ts (9:38) @ proxy
    - button "Open in editor":
      - img
  - text: "7 | }) 8 | > 9 | const supabase = createServerClient( | ^ 10 | process.env.NEXT_PUBLIC_SUPABASE_URL!, 11 | process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 12 | {"
  - paragraph: Call Stack 22
  - button "Show 21 ignore-listed frame(s)":
    - text: Show 21 ignore-listed frame(s)
    - img
  - text: proxy
  - button "Open proxy in editor":
    - img
  - text: proxy.ts (9:38)
- contentinfo:
  - region "Error feedback":
    - paragraph:
      - link "Was this helpful?":
        - /url: https://nextjs.org/telemetry#error-feedback
    - button "Mark as helpful"
    - button "Mark as not helpful"
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- button "Collapse issues badge":
  - img
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('GPA Try Calculator', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Mock the public GPA calculator API endpoint
  6   |     await page.route('**/api/public/gpa-calculator', async (route) => {
  7   |       const requestBody = JSON.parse(route.request().postData() || '{}');
  8   |       const { courses, grading_scale } = requestBody;
  9   | 
  10  |       // Validate inputs matching backend constraints
  11  |       if (!courses || courses.length === 0) {
  12  |         return route.fulfill({
  13  |           status: 422,
  14  |           contentType: 'application/json',
  15  |           body: JSON.stringify({ detail: 'Courses list cannot be empty' })
  16  |         });
  17  |       }
  18  | 
  19  |       if (courses.length > 20) {
  20  |         return route.fulfill({
  21  |           status: 422,
  22  |           contentType: 'application/json',
  23  |           body: JSON.stringify({ detail: 'Cannot calculate more than 20 courses' })
  24  |         });
  25  |       }
  26  | 
  27  |       const invalidCourse = courses.find(
  28  |         (c: any) => c.score < 0 || c.score > 100 || c.credit_hours < 0.5 || c.credit_hours > 6.0
  29  |       );
  30  | 
  31  |       if (invalidCourse) {
  32  |         return route.fulfill({
  33  |           status: 422,
  34  |           contentType: 'application/json',
  35  |           body: JSON.stringify({ detail: 'Invalid course parameters' })
  36  |         });
  37  |       }
  38  | 
  39  |       // Compute simple weighted GPA mock response
  40  |       let gpa = 3.5;
  41  |       if (grading_scale === '5.0') gpa = 4.375;
  42  |       if (grading_scale === 'percentage') gpa = 85.0;
  43  | 
  44  |       const breakdown = courses.map((c: any) => ({
  45  |         course_name: c.course_name,
  46  |         letter_grade: 'A',
  47  |         grade_points: grading_scale === 'percentage' ? c.score : 4.0
  48  |       }));
  49  | 
  50  |       const total_credits = courses.reduce((acc: number, cur: any) => acc + cur.credit_hours, 0);
  51  | 
  52  |       return route.fulfill({
  53  |         status: 200,
  54  |         contentType: 'application/json',
  55  |         body: JSON.stringify({
  56  |           gpa,
  57  |           total_credit_hours: total_credits,
  58  |           course_breakdown: breakdown
  59  |         })
  60  |       });
  61  |     });
  62  | 
  63  |     // Go to try calculator page
  64  |     await page.goto('/try');
  65  |   });
  66  | 
  67  |   test('should load the calculator and have 3 default rows', async ({ page }) => {
> 68  |     await expect(page.locator('h1')).toContainText('Calculate your GPA instantly');
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  69  |     
  70  |     // Check for default rows
  71  |     const rows = page.locator('input[placeholder="e.g. Intro to Programming"]');
  72  |     await expect(rows).toHaveCount(3);
  73  |   });
  74  | 
  75  |   test('should calculate GPA on happy path', async ({ page }) => {
  76  |     // Fill in first row
  77  |     await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Math 101');
  78  |     await page.locator('input[placeholder="3.0"]').nth(0).fill('3');
  79  |     await page.locator('input[placeholder="85"]').nth(0).fill('90');
  80  | 
  81  |     // Fill in second row
  82  |     await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(1).fill('English 101');
  83  |     await page.locator('input[placeholder="3.0"]').nth(1).fill('2');
  84  |     await page.locator('input[placeholder="85"]').nth(1).fill('80');
  85  | 
  86  |     // Click Calculate
  87  |     await page.click('button:has-text("Calculate GPA")');
  88  | 
  89  |     // Check results card
  90  |     await expect(page.locator('h3:has-text("Calculation Result")')).toBeVisible();
  91  |     await expect(page.locator('span:has-text("GPA")').locator('xpath=..')).toContainText('3.50');
  92  |   });
  93  | 
  94  |   test('should support changing scale to 5.0 and Percentage', async ({ page }) => {
  95  |     // Select 5.0 Scale option
  96  |     await page.click('button:has-text("5.0 Scale")');
  97  |     
  98  |     // Fill row
  99  |     await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Physics');
  100 |     await page.locator('input[placeholder="3.0"]').nth(0).fill('4');
  101 |     await page.locator('input[placeholder="85"]').nth(0).fill('95');
  102 | 
  103 |     await page.click('button:has-text("Calculate GPA")');
  104 |     
  105 |     await expect(page.locator('span:has-text("GPA")').locator('xpath=..')).toContainText('4.38');
  106 |   });
  107 | 
  108 |   test('should handle API rate limit error', async ({ page }) => {
  109 |     // Re-mock API to return 429
  110 |     await page.route('**/api/public/gpa-calculator', async (route) => {
  111 |       return route.fulfill({
  112 |         status: 429,
  113 |         headers: { 'Retry-After': '45' }
  114 |       });
  115 |     });
  116 | 
  117 |     await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Physics');
  118 |     await page.locator('input[placeholder="3.0"]').nth(0).fill('4');
  119 |     await page.locator('input[placeholder="85"]').nth(0).fill('95');
  120 | 
  121 |     await page.click('button:has-text("Calculate GPA")');
  122 | 
  123 |     await expect(page.locator('text=Too many requests. Please try again in 45 seconds.')).toBeVisible();
  124 |   });
  125 | 
  126 |   test('should save draft courses to sessionStorage on sign up click', async ({ page }) => {
  127 |     // Fill and calculate
  128 |     await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Draft Course');
  129 |     await page.locator('input[placeholder="3.0"]').nth(0).fill('3');
  130 |     await page.locator('input[placeholder="85"]').nth(0).fill('88');
  131 | 
  132 |     await page.click('button:has-text("Calculate GPA")');
  133 | 
  134 |     // Click Save Draft & Create Account
  135 |     await page.click('button:has-text("Save Draft & Create Account")');
  136 | 
  137 |     // Verify redirect to signup page
  138 |     await expect(page).toHaveURL(/\/signup$/);
  139 | 
  140 |     // Verify sessionStorage draft is set
  141 |     const draft = await page.evaluate(() => sessionStorage.getItem('try_gpa_draft'));
  142 |     expect(draft).not.toBeNull();
  143 |     
  144 |     const parsed = JSON.parse(draft || '{}');
  145 |     expect(parsed.courses[0].course_name).toBe('Draft Course');
  146 |   });
  147 | });
  148 | 
```