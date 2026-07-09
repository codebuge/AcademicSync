import { test, expect } from '@playwright/test';

test.describe('GPA Try Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the public GPA calculator API endpoint
    await page.route('**/api/public/gpa-calculator', async (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');
      const { courses, grading_scale } = requestBody;

      // Validate inputs matching backend constraints
      if (!courses || courses.length === 0) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Courses list cannot be empty' })
        });
      }

      if (courses.length > 20) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Cannot calculate more than 20 courses' })
        });
      }

      const invalidCourse = courses.find(
        (c: any) => c.score < 0 || c.score > 100 || c.credit_hours < 0.5 || c.credit_hours > 6.0
      );

      if (invalidCourse) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Invalid course parameters' })
        });
      }

      // Compute simple weighted GPA mock response
      let gpa = 3.5;
      if (grading_scale === '5.0') gpa = 4.375;
      if (grading_scale === 'percentage') gpa = 85.0;

      const breakdown = courses.map((c: any) => ({
        course_name: c.course_name,
        letter_grade: 'A',
        grade_points: grading_scale === 'percentage' ? c.score : 4.0
      }));

      const total_credits = courses.reduce((acc: number, cur: any) => acc + cur.credit_hours, 0);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gpa,
          total_credit_hours: total_credits,
          course_breakdown: breakdown
        })
      });
    });

    // Go to try calculator page
    await page.goto('/try');
  });

  test('should load the calculator and have 3 default rows', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Calculate your GPA instantly');
    
    // Check for default rows
    const rows = page.locator('input[placeholder="e.g. Intro to Programming"]');
    await expect(rows).toHaveCount(3);
  });

  test('should calculate GPA on happy path', async ({ page }) => {
    // Fill in first row
    await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Math 101');
    await page.locator('input[placeholder="3.0"]').nth(0).fill('3');
    await page.locator('input[placeholder="85"]').nth(0).fill('90');

    // Fill in second row
    await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(1).fill('English 101');
    await page.locator('input[placeholder="3.0"]').nth(1).fill('2');
    await page.locator('input[placeholder="85"]').nth(1).fill('80');

    // Click Calculate
    await page.click('button:has-text("Calculate GPA")');

    // Check results card
    await expect(page.locator('h3:has-text("Calculation Result")')).toBeVisible();
    await expect(page.locator('span:has-text("GPA")').locator('xpath=..')).toContainText('3.50');
  });

  test('should support changing scale to 5.0 and Percentage', async ({ page }) => {
    // Select 5.0 Scale option
    await page.click('button:has-text("5.0 Scale")');
    
    // Fill row
    await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Physics');
    await page.locator('input[placeholder="3.0"]').nth(0).fill('4');
    await page.locator('input[placeholder="85"]').nth(0).fill('95');

    await page.click('button:has-text("Calculate GPA")');
    
    await expect(page.locator('span:has-text("GPA")').locator('xpath=..')).toContainText('4.38');
  });

  test('should handle API rate limit error', async ({ page }) => {
    // Re-mock API to return 429
    await page.route('**/api/public/gpa-calculator', async (route) => {
      return route.fulfill({
        status: 429,
        headers: { 'Retry-After': '45' }
      });
    });

    await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Physics');
    await page.locator('input[placeholder="3.0"]').nth(0).fill('4');
    await page.locator('input[placeholder="85"]').nth(0).fill('95');

    await page.click('button:has-text("Calculate GPA")');

    await expect(page.locator('text=Too many requests. Please try again in 45 seconds.')).toBeVisible();
  });

  test('should save draft courses to sessionStorage on sign up click', async ({ page }) => {
    // Fill and calculate
    await page.locator('input[placeholder="e.g. Intro to Programming"]').nth(0).fill('Draft Course');
    await page.locator('input[placeholder="3.0"]').nth(0).fill('3');
    await page.locator('input[placeholder="85"]').nth(0).fill('88');

    await page.click('button:has-text("Calculate GPA")');

    // Click Save Draft & Create Account
    await page.click('button:has-text("Save Draft & Create Account")');

    // Verify redirect to signup page
    await expect(page).toHaveURL(/\/signup$/);

    // Verify sessionStorage draft is set
    const draft = await page.evaluate(() => sessionStorage.getItem('try_gpa_draft'));
    expect(draft).not.toBeNull();
    
    const parsed = JSON.parse(draft || '{}');
    expect(parsed.courses[0].course_name).toBe('Draft Course');
  });
});
