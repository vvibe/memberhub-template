import { expect, test, type Page, type TestInfo } from '@playwright/test'

const viewCases = [
  { id: 'home', label: '首頁', expectedText: '會員可以理解並選擇的方案結構' },
  { id: 'content', label: '內容', expectedText: '文章、影片、Podcast、資源與付費牆' },
  { id: 'newsletter', label: '通訊', expectedText: 'Email/LINE 通訊、付費轉換與推薦贈閱' },
  { id: 'courses', label: '課程', expectedText: '課程、進度與等級解鎖' },
  { id: 'community', label: '社群', expectedText: '分類、權限、公告、留言與反應' },
  { id: 'members', label: '成員', expectedText: '會員目錄、角色、個人頁與活躍度' },
  { id: 'search', label: '搜尋', expectedText: '搜尋文章、課程、逐字稿、討論、活動與會員' },
  { id: 'challenges', label: '打卡', expectedText: '打卡挑戰、積分、等級與排行榜' },
  { id: 'events', label: '活動', expectedText: 'Webinar、Live、Office hour 與回放' },
  { id: 'login', label: '登入', expectedText: '登入 SweetCrumb 烘焙研究室' },
  { id: 'member', label: '會員', expectedText: '會員方案、收據/發票狀態與付款自助' },
  { id: 'admin', label: '後台', expectedText: 'SweetCrumb 烘焙研究室 營運後台案例' },
  { id: 'setup', label: '設定', expectedText: '把這個服務改成你的領域' },
] as const

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
})

for (const viewCase of viewCases) {
  test(`${viewCase.id} view renders with the shared visual system`, async ({ page }, testInfo) => {
    const consoleErrors = collectConsoleErrors(page)

    await openView(page, viewCase)
    await expect(page.locator('.workspace')).toBeVisible()
    await expect(page.locator('.topbar h1')).toHaveText('SweetCrumb 烘焙研究室')
    await expect(page.getByText(viewCase.expectedText, { exact: true })).toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectSharedVisualTokens(page)
    await expectReadableTypography(page)
    await attachViewportScreenshot(page, testInfo, viewCase.id)

    expect(consoleErrors.errors).toEqual([])
  })
}

test('interactive flows stay usable and visually stable', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await openNav(page, '內容')
  await page.getByPlaceholder('輸入文章標題').fill('QA 測試文章')
  await page.getByPlaceholder('列表與分享時顯示的短摘要').fill('這是 Playwright QA 產生的測試摘要。')
  await page.getByPlaceholder('撰寫文章、課程公告或 newsletter 內容...').fill('這篇內容用來確認發文、搜尋與後台列表仍能正常運作。')
  await page.getByRole('button', { name: /發布到內容庫/ }).click()
  await expect(page.getByRole('heading', { name: 'QA 測試文章' })).toBeVisible()

  await openNav(page, '搜尋')
  await page.getByPlaceholder('輸入關鍵字，例如 逐字稿、直播、Yuna').fill('QA 測試文章')
  await expect(page.getByText('QA 測試文章')).toBeVisible()

  await openNav(page, '通訊')
  await page.getByRole('button', { name: /新增 issue/ }).click()
  await expect(page.getByText(/Demo issue/).first()).toBeVisible()
  await page.getByRole('button', { name: /建立贈閱碼/ }).click()
  await expect(page.getByText(/Demo 贈閱活動/).first()).toBeVisible()

  await openNav(page, '成員')
  await page.getByRole('button', { name: /邀請會員/ }).click()
  await expect(page.getByText(/Demo Member/).first()).toBeVisible()
  await page.getByRole('button', { name: /入會問題/ }).click()
  await expect(page.getByText('SweetCrumb 烘焙研究室 營運後台案例', { exact: true })).toBeVisible()

  await openNav(page, '課程')
  await page.getByRole('button', { name: /實作流程拆解/ }).first().click()
  await expect(page.locator('.lesson-card.complete').filter({ hasText: '實作流程拆解' })).toBeVisible()

  await openNav(page, '打卡')
  await page.getByRole('button', { name: '完成打卡' }).first().click()
  await expect(page.getByRole('button', { name: '今日已打卡' }).first()).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectSharedVisualTokens(page)
  await attachViewportScreenshot(page, testInfo, 'interactive-flows')

  expect(consoleErrors.errors).toEqual([])
})

function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return { errors }
}

async function openView(page: Page, viewCase: (typeof viewCases)[number]) {
  await openNav(page, viewCase.label)
}

async function openNav(page: Page, label: string) {
  await page.locator('.nav-list').getByRole('button', { name: label }).click()
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }))

  expect(overflow.documentWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth + 1)
  expect(overflow.bodyWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth + 1)
}

async function expectSharedVisualTokens(page: Page) {
  const visual = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const root = window.getComputedStyle(document.documentElement)
    const buttons = Array.from(document.querySelectorAll('.primary-button, .secondary-button, .ghost-button, .plan-card button, .challenge-card button, .lock-button'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return {
          text: element.textContent?.trim() ?? '',
          height: Math.round(rect.height),
          radius: style.borderRadius,
          fontSize: style.fontSize,
          fontWeight: Number(style.fontWeight),
        }
      })

    const cardSelectors = '.hero-band, .section-block, .plan-card, .course-panel, .challenge-card, .event-card, .newsletter-panel, .member-card, .admin-panel, .auth-card'
    const cards = Array.from(document.querySelectorAll(cardSelectors))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        return {
          className: (element as HTMLElement).className,
          radius: style.borderRadius,
          borderStyle: style.borderStyle,
          backgroundColor: style.backgroundColor,
        }
      })

    return {
      tokens: {
        controlHeight: root.getPropertyValue('--control-height').trim(),
        radiusCard: root.getPropertyValue('--radius-card').trim(),
        radiusControl: root.getPropertyValue('--radius-control').trim(),
        baseFont: root.getPropertyValue('--font-base').trim(),
        textColor: root.getPropertyValue('--text').trim(),
        canvas: root.getPropertyValue('--canvas').trim(),
      },
      buttonIssues: buttons.filter((button) => (
        button.height < 34 ||
        button.height > 48 ||
        button.radius !== '8px' ||
        button.fontSize !== '14px' ||
        button.fontWeight > 600
      )),
      cardIssues: cards.filter((card) => (
        card.radius !== '8px' ||
        card.borderStyle !== 'solid' ||
        card.backgroundColor === 'rgba(0, 0, 0, 0)'
      )),
    }
  })

  expect(visual.tokens).toEqual({
    controlHeight: '38px',
    radiusCard: '8px',
    radiusControl: '8px',
    baseFont: '14px',
    textColor: '#2f3437',
    canvas: '#f7f6f3',
  })
  expect(visual.buttonIssues).toEqual([])
  expect(visual.cardIssues).toEqual([])
}

async function expectReadableTypography(page: Page) {
  const typography = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const heavyBodyText = Array.from(document.querySelectorAll('p, li, small'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        return {
          text: (element.textContent ?? '').trim().slice(0, 80),
          fontSize: style.fontSize,
          fontWeight: Number(style.fontWeight),
        }
      })
      .filter((item) => item.fontWeight > 500)

    const oversizedPanelHeadings = Array.from(document.querySelectorAll('.section-block h4, .admin-panel h4, .newsletter-panel h4, .plan-card h4'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        return {
          text: (element.textContent ?? '').trim(),
          fontSize: Number.parseFloat(style.fontSize),
        }
      })
      .filter((item) => item.fontSize > 18)

    return { heavyBodyText, oversizedPanelHeadings }
  })

  expect(typography.heavyBodyText).toEqual([])
  expect(typography.oversizedPanelHeadings).toEqual([])
}

async function attachViewportScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const screenshot = await page.screenshot({ fullPage: false })
  expect(screenshot.byteLength).toBeGreaterThan(10_000)
  await testInfo.attach(`${name}-viewport`, {
    body: screenshot,
    contentType: 'image/png',
  })
}
