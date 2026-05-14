import { expect, test, type Page, type TestInfo } from '@playwright/test'

const viewCases = [
  { id: 'home', label: '預覽', expectedText: '加入前可以先看見的內容與社群節奏' },
  { id: 'blog', label: '部落格', expectedText: 'Skills School 社群預覽頁' },
  { id: 'join', label: '加入會員', expectedText: '加入 Skills School，開始課程、社群與每週實作' },
  { id: 'content', label: '內容庫', expectedText: '公開文章、會員內容與付費牆' },
  { id: 'newsletter', label: '通訊', expectedText: 'Email/LINE 通訊、付費轉換與推薦贈閱' },
  { id: 'courses', label: '課程', expectedText: '課程、進度與等級解鎖' },
  { id: 'community', label: '社群', expectedText: '分類、權限、公告、留言與反應' },
  { id: 'members', label: '成員', expectedText: '會員目錄、角色、個人頁與活躍度' },
  { id: 'search', label: '搜尋', expectedText: '搜尋文章、課程、逐字稿、討論、活動與會員' },
  { id: 'challenges', label: '打卡', expectedText: '打卡挑戰、積分、等級與排行榜' },
  { id: 'events', label: '活動', expectedText: 'Webinar、Live、Office hour 與回放' },
  { id: 'login', label: '登入', expectedText: '登入 Skills School 職能加速社群' },
  { id: 'member', label: '會員', expectedText: '會員方案、收據/發票狀態與付款自助' },
  { id: 'admin', label: '後台', expectedText: 'Skills School 職能加速社群 營運後台' },
  { id: 'setup', label: '設定', expectedText: '調整品牌、內容與會員設定' },
] as const

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
})

for (const viewCase of viewCases) {
  test(`${viewCase.id} view renders with the shared visual system`, async ({ page }, testInfo) => {
    const consoleErrors = collectConsoleErrors(page)
    const homeRhythm = await getLayoutRhythm(page)

    await openView(page, viewCase)
    await expect(page.locator('.workspace')).toBeVisible()
    await expect(page.locator('.topbar h1')).toHaveText('Skills School 職能加速社群')
    await expect(page.getByText(viewCase.expectedText, { exact: true })).toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectMobileContentStartsInFirstViewport(page)
    await expectDesktopSpacingBreathes(page)
    await expectNoDemoCopy(page)
    await expectLayoutRhythmMatchesHome(page, homeRhythm)
    await expectSharedVisualTokens(page)
    await expectReadableTypography(page)
    await expectConsistentSpacingAndTextMetrics(page)
    await expectNoLayoutCollisions(page)
    await expectDetailLayoutQuality(page)
    await attachViewportScreenshot(page, testInfo, viewCase.id)

    expect(consoleErrors.errors).toEqual([])
  })
}

test('interactive flows stay usable and visually stable', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.getByRole('button', { name: '管理員' }).click()
  await openNav(page, '內容庫')
  await page.getByPlaceholder('輸入文章標題').fill('QA 測試文章')
  await page.getByPlaceholder('列表與分享時顯示的短摘要').fill('這是 Playwright QA 產生的測試摘要。')
  await page.getByPlaceholder('撰寫文章、課程公告或通訊內容…').fill('這篇內容用來確認發文、搜尋與後台列表仍能正常運作。')
  await page.getByRole('button', { name: /發布到內容庫/ }).click()
  await expect(page.getByRole('heading', { name: 'QA 測試文章' })).toBeVisible()

  await openNav(page, '搜尋')
  await page.getByPlaceholder('輸入想搜尋的東西').fill('QA 測試文章')
  await expect(page.getByText('QA 測試文章')).toBeVisible()

  await openNav(page, '通訊')
  await page.getByRole('button', { name: /新增通訊/ }).click()
  await expect(page.getByText(/新增快訊/).first()).toBeVisible()
  await page.getByRole('button', { name: /建立贈閱碼/ }).click()
  await expect(page.getByText(/會員贈閱活動/).first()).toBeVisible()

  await openNav(page, '成員')
  await page.getByRole('button', { name: /邀請會員/ }).click()
  await expect(page.getByText(/新會員/).first()).toBeVisible()
  await page.getByRole('button', { name: /入會問題/ }).click()
  await expect(page.getByText('Skills School 職能加速社群 營運後台', { exact: true })).toBeVisible()

  await openNav(page, '課程')
  await page.getByRole('button', { name: /完成第一版作品頁/ }).first().click()
  await expect(page.locator('.lesson-card.complete').filter({ hasText: '完成第一版作品頁' })).toBeVisible()

  await openNav(page, '打卡')
  await page.getByRole('button', { name: '完成打卡' }).first().click()
  await expect(page.getByRole('button', { name: '今日已打卡' }).first()).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectMobileContentStartsInFirstViewport(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'interactive-flows')

  expect(consoleErrors.errors).toEqual([])
})

test('Skills School and SuperStake reference cases are both usable', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await expect(page.locator('.topbar h1')).toHaveText('Skills School 職能加速社群')
  await openNav(page, '部落格')
  await expect(page.getByText('Skills School 社群預覽頁')).toBeVisible()
  await expect(page.getByText('課程預覽：第一週如何完成一份可被回饋的作品')).toBeVisible()
  await openNav(page, '加入會員')
  await expect(page.getByText('加入 Skills School，開始課程、社群與每週實作')).toBeVisible()
  await openNav(page, '內容庫')
  await expect(page.getByText('公開文章：如何安排 30 天職能升級計畫')).toBeVisible()
  await expect(page.locator('.editor-panel')).toHaveCount(0)

  await page.locator('.preset-select-trigger').click()
  await page.getByRole('option', { name: 'SuperStake' }).click()
  await expect(page.locator('.topbar h1')).toHaveText('SuperStake 策略通訊')

  await openNav(page, '部落格')
  await expect(page.getByText('SuperStake 公開部落格')).toBeVisible()
  await expect(page.getByRole('heading', { name: '公開文章：AI 工具從嘗鮮走向日常工作的三個訊號' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '會員專欄：自動化內容工具的商業模式與留存風險' })).toBeVisible()
  await openNav(page, '加入會員')
  await expect(page.getByText('訂閱 SuperStake，閱讀完整研究與會員專欄')).toBeVisible()
  await openNav(page, '內容庫')
  await expect(page.locator('.editor-panel')).toHaveCount(0)

  await openNav(page, '預覽')
  await expect(page.getByRole('heading', { name: '每週讀懂 AI 工具、內容產品與創作者商業模式' })).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectMobileContentStartsInFirstViewport(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'reference-cases')

  expect(consoleErrors.errors).toEqual([])
})

test('reference cases have direct online URLs', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.goto('/?case=skills-school&view=join')
  await expect(page.locator('.topbar h1')).toHaveText('Skills School 職能加速社群')
  await expect(page.getByText('加入 Skills School，開始課程、社群與每週實作')).toBeVisible()

  await page.goto('/?case=superstake&view=blog')
  await expect(page.locator('.topbar h1')).toHaveText('SuperStake 策略通訊')
  await expect(page.getByText('SuperStake 公開部落格')).toBeVisible()
  await expect(page.getByRole('heading', { name: '公開文章：AI 工具從嘗鮮走向日常工作的三個訊號' }).first()).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectMobileContentStartsInFirstViewport(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'direct-case-urls')

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
  await page.locator('.nav-list').getByRole('button', { name: label, exact: true }).click()
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

async function expectMobileContentStartsInFirstViewport(page: Page) {
  const mobileLayout = await page.evaluate(() => {
    if (window.innerWidth > 680) return null

    const sidebar = document.querySelector('.sidebar')?.getBoundingClientRect()
    const workspace = document.querySelector('.workspace')?.getBoundingClientRect()
    const topbar = document.querySelector('.topbar')?.getBoundingClientRect()
    const navList = document.querySelector('.nav-list') as HTMLElement | null

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      sidebarHeight: Math.round(sidebar?.height ?? 0),
      workspaceTop: Math.round(workspace?.top ?? 0),
      topbarTop: Math.round(topbar?.top ?? 0),
      navHeight: Math.round(navList?.getBoundingClientRect().height ?? 0),
      navCanScrollWithinItself: navList ? navList.scrollWidth >= navList.clientWidth : false,
    }
  })

  if (!mobileLayout) return

  expect(mobileLayout.documentWidth, JSON.stringify(mobileLayout)).toBeLessThanOrEqual(mobileLayout.viewportWidth + 1)
  expect(mobileLayout.sidebarHeight, 'mobile navigation should be compact enough for page content to enter the first viewport').toBeLessThanOrEqual(240)
  expect(mobileLayout.workspaceTop, 'workspace should start shortly after the compact mobile navigation').toBeLessThanOrEqual(240)
  expect(mobileLayout.topbarTop, 'page title and actions should not be pushed below the first mobile viewport').toBeLessThanOrEqual(260)
  expect(mobileLayout.navHeight, 'mobile navigation should stay one compact horizontal row').toBeLessThanOrEqual(48)
  expect(mobileLayout.navCanScrollWithinItself, 'mobile navigation should scroll horizontally instead of stretching the page').toBe(true)
}

async function expectDesktopSpacingBreathes(page: Page) {
  const desktopLayout = await page.evaluate(() => {
    if (window.innerWidth < 1081) return null

    const readBox = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return {
        width: Math.round(rect.width),
        paddingTop: Math.round(Number.parseFloat(style.paddingTop) || 0),
        paddingRight: Math.round(Number.parseFloat(style.paddingRight) || 0),
        paddingBottom: Math.round(Number.parseFloat(style.paddingBottom) || 0),
        paddingLeft: Math.round(Number.parseFloat(style.paddingLeft) || 0),
        gap: Math.round(Number.parseFloat(style.gap) || 0),
        marginBottom: Math.round(Number.parseFloat(style.marginBottom) || 0),
      }
    }

    return {
      workspace: readBox('.workspace'),
      topbar: readBox('.topbar'),
      section: readBox('.section-block'),
      sectionHeading: readBox('.section-heading'),
      grid: readBox('.plan-grid, .course-grid, .challenge-grid, .event-grid, .newsletter-grid, .setup-grid, .self-service-grid, .auth-layout'),
      panel: readBox('.plan-card, .course-panel, .challenge-card, .event-card, .newsletter-panel, .member-card, .admin-panel, .auth-card'),
    }
  })

  if (!desktopLayout) return

  expect(desktopLayout.workspace?.width, JSON.stringify(desktopLayout)).toBeLessThanOrEqual(1360)
  expect(desktopLayout.workspace?.paddingLeft, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(34)
  expect(desktopLayout.topbar?.marginBottom, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(24)
  if (desktopLayout.section) {
    expect(desktopLayout.section.paddingLeft, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(28)
    expect(desktopLayout.section.paddingRight, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(28)
  }
  if (desktopLayout.sectionHeading) expect(desktopLayout.sectionHeading.marginBottom, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(24)
  if (desktopLayout.grid) expect(desktopLayout.grid.gap, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(18)
  if (desktopLayout.panel) expect(desktopLayout.panel.paddingLeft, JSON.stringify(desktopLayout)).toBeGreaterThanOrEqual(22)
}

async function expectNoDemoCopy(page: Page) {
  const forbiddenCopy = await page.evaluate(() => {
    const text = document.body.innerText
    return [
      'Demo',
      'demo',
      '示範',
      '這是示範',
      '模擬',
      'MemberHub',
      '私有化會員平台',
      'Before joining',
      'Public blog',
      'Post editor',
      'Newsletter + growth',
      'Broadcasts',
      'Notification adapter',
      'Referral engine',
      'Global search',
      'Gamification',
      'Member self-service',
      'Admin workspace',
      'Newsletter ops',
      'Content ops',
      'MRR',
      'Active members',
      'Paid members',
      'Top source',
      'min read',
      'chars',
      'example.com',
    ].filter((term) => text.includes(term))
  })

  expect(forbiddenCopy, 'case pages should read like a real operating site, not an internal template').toEqual([])
}

async function getLayoutRhythm(page: Page) {
  return page.evaluate(() => {
    const getStyle = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const style = window.getComputedStyle(element)
      return {
        display: style.display,
        gap: style.gap,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
      }
    }

    const body = window.getComputedStyle(document.body)
    const root = window.getComputedStyle(document.documentElement)

    return {
      viewport: window.innerWidth < 681 ? 'mobile' : 'desktop',
      body: {
        fontSize: body.fontSize,
        lineHeight: body.lineHeight,
        letterSpacing: body.letterSpacing,
      },
      workspace: getStyle('.workspace'),
      topbar: getStyle('.topbar'),
      tokens: {
        fontXs: root.getPropertyValue('--font-xs').trim(),
        fontSm: root.getPropertyValue('--font-sm').trim(),
        fontBase: root.getPropertyValue('--font-base').trim(),
        fontMd: root.getPropertyValue('--font-md').trim(),
        fontLg: root.getPropertyValue('--font-lg').trim(),
        fontXl: root.getPropertyValue('--font-xl').trim(),
        fontTitle: root.getPropertyValue('--font-title').trim(),
        fontHero: root.getPropertyValue('--font-hero').trim(),
        radiusCard: root.getPropertyValue('--radius-card').trim(),
        radiusControl: root.getPropertyValue('--radius-control').trim(),
        controlHeight: root.getPropertyValue('--control-height').trim(),
      },
    }
  })
}

async function expectLayoutRhythmMatchesHome(page: Page, homeRhythm: Awaited<ReturnType<typeof getLayoutRhythm>>) {
  const currentRhythm = await getLayoutRhythm(page)
  expect(currentRhythm, 'page-level spacing and type rhythm should match the home view').toEqual(homeRhythm)
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

async function expectConsistentSpacingAndTextMetrics(page: Page) {
  const report = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const parsePixels = (value: string) => {
      if (value === 'normal') return Number.NaN
      return Number.parseFloat(value)
    }

    const allowedFontSizes = new Set([12, 13, 14, 15, 16, 18, 22, 24, 26, 30, 42])
    const textElements = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, p, li, small, label, button, input, textarea, .pill, .status-pill, .eyebrow'),
    ).filter(isVisible)

    const textMetricIssues = textElements
      .map((element) => {
        const style = window.getComputedStyle(element)
        const fontSize = Math.round(parsePixels(style.fontSize))
        const lineHeight = parsePixels(style.lineHeight)
        const lineHeightRatio = Number.isFinite(lineHeight) ? Number((lineHeight / fontSize).toFixed(2)) : null
        const letterSpacing = style.letterSpacing
        const isControl = element.matches('button, input, textarea, .pill, .status-pill')
        const isBodyText = element.matches('p, li, textarea')
        const isAuxiliaryText = element.matches('small')
        const text = (element.textContent ?? (element as HTMLInputElement).placeholder ?? '').trim().slice(0, 80)

        return {
          tag: element.tagName.toLowerCase(),
          text,
          fontSize,
          lineHeight: style.lineHeight,
          lineHeightRatio,
          letterSpacing,
          fontWeight: Number(style.fontWeight),
          issues: [
            !allowedFontSizes.has(fontSize) ? `unexpected font size ${fontSize}` : null,
            letterSpacing !== 'normal' && letterSpacing !== '0px' ? `unexpected letter spacing ${letterSpacing}` : null,
            !isControl && isBodyText && lineHeightRatio !== null && (lineHeightRatio < 1.45 || lineHeightRatio > 1.75)
              ? `body line-height ratio ${lineHeightRatio}`
              : null,
            !isControl && isAuxiliaryText && lineHeightRatio !== null && (lineHeightRatio < 1.3 || lineHeightRatio > 1.75)
              ? `auxiliary line-height ratio ${lineHeightRatio}`
              : null,
            Number(style.fontWeight) > 600 ? `font weight ${style.fontWeight}` : null,
          ].filter(Boolean),
        }
      })
      .filter((item) => item.issues.length > 0)

    const sectionBlocks = Array.from(document.querySelectorAll('.section-block')).filter(isVisible)
    const sectionPaddingIssues = sectionBlocks
      .map((element) => {
        const style = window.getComputedStyle(element)
        const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]
        return {
          className: (element as HTMLElement).className,
          padding,
        }
      })
      .filter((item) => {
        const expected = window.innerWidth <= 680 ? '18px' : '28px'
        return item.padding.some((value) => value !== expected)
      })

    const surfaceSelectors = [
      '.plan-card',
      '.course-panel',
      '.challenge-card',
      '.event-card',
      '.newsletter-panel',
      '.member-card',
      '.admin-panel',
      '.auth-card',
      '.setup-grid article',
      '.self-service-grid article',
    ].join(',')

    const surfaceIssues = Array.from(document.querySelectorAll(surfaceSelectors))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        return {
          className: (element as HTMLElement).className,
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
          radius: style.borderRadius,
          borderStyle: style.borderStyle,
        }
      })
      .filter((item) => {
        const expectedPadding = window.innerWidth <= 680 ? '18px' : '22px'
        return item.padding.some((value) => value !== expectedPadding) || item.radius !== '8px' || item.borderStyle !== 'solid'
      })

    const clippedControls = Array.from(document.querySelectorAll('button, .pill, .status-pill, [data-slot="select-trigger"]'))
      .filter(isVisible)
      .map((element) => ({
        text: (element.textContent ?? '').trim().slice(0, 80),
        scrollWidth: (element as HTMLElement).scrollWidth,
        clientWidth: (element as HTMLElement).clientWidth,
        scrollHeight: (element as HTMLElement).scrollHeight,
        clientHeight: (element as HTMLElement).clientHeight,
      }))
      .filter((item) => item.scrollWidth > item.clientWidth + 1 || item.scrollHeight > item.clientHeight + 1)

    return { textMetricIssues, sectionPaddingIssues, surfaceIssues, clippedControls }
  })

  expect(report.textMetricIssues, 'font sizes, line heights, weights, and letter spacing should stay on the shared scale').toEqual([])
  expect(report.sectionPaddingIssues, 'section padding should be consistent across pages').toEqual([])
  expect(report.surfaceIssues, 'card/panel spacing should stay consistent across pages').toEqual([])
  expect(report.clippedControls, 'button and pill labels should not be clipped').toEqual([])
}

async function expectNoLayoutCollisions(page: Page) {
  const collisions = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const selector = [
      '.topbar-actions > *',
      '.nav-list button',
      '.button-row > *',
      '.plan-card',
      '.course-panel',
      '.challenge-card',
      '.event-card',
      '.newsletter-panel',
      '.member-card',
      '.content-row',
      '.thread-row',
      '.lesson-row',
      '.search-result',
      '.admin-panel',
      '.auth-card',
      '.setup-grid article',
    ].join(',')

    const elements = Array.from(document.querySelectorAll(selector)).filter(isVisible)
    const rows = elements.map((element, index) => ({
      index,
      text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
      rect: element.getBoundingClientRect(),
    }))

    const result: Array<{ a: string; b: string; overlapWidth: number; overlapHeight: number }> = []

    for (let a = 0; a < rows.length; a += 1) {
      for (let b = a + 1; b < rows.length; b += 1) {
        if (elements[a].contains(elements[b]) || elements[b].contains(elements[a])) continue

        const left = Math.max(rows[a].rect.left, rows[b].rect.left)
        const right = Math.min(rows[a].rect.right, rows[b].rect.right)
        const top = Math.max(rows[a].rect.top, rows[b].rect.top)
        const bottom = Math.min(rows[a].rect.bottom, rows[b].rect.bottom)
        const overlapWidth = Math.max(0, right - left)
        const overlapHeight = Math.max(0, bottom - top)

        if (overlapWidth > 2 && overlapHeight > 2) {
          result.push({
            a: rows[a].text,
            b: rows[b].text,
            overlapWidth: Math.round(overlapWidth),
            overlapHeight: Math.round(overlapHeight),
          })
        }
      }
    }

    return result
  })

  expect(collisions, 'visible layout surfaces and controls should not overlap').toEqual([])
}

async function expectDetailLayoutQuality(page: Page) {
  const report = await page.evaluate(() => {
    const isVisible = (element: Element | null): element is Element => {
      if (!element) return false
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const headingAlignmentIssues = Array.from(document.querySelectorAll('.section-heading h3, .course-title h4'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        return { text: (element.textContent ?? '').trim(), textAlign: style.textAlign }
      })
      .filter((item) => item.textAlign !== 'start' && item.textAlign !== 'left')

    const isGlobalSearchPage = (document.querySelector('.section-heading h3')?.textContent ?? '').includes('搜尋文章')
    const searchInput = document.querySelector('.section-heading .search-box input') as HTMLInputElement | null
    const searchPlaceholderIssue = isGlobalSearchPage && searchInput && searchInput.placeholder !== '輸入想搜尋的東西'
      ? { placeholder: searchInput.placeholder }
      : null

    const searchResultIssues = Array.from(document.querySelectorAll('.search-result'))
      .filter(isVisible)
      .map((element) => {
        const row = element.getBoundingClientRect()
        const main = element.querySelector('.search-result-main')?.getBoundingClientRect()
        const type = element.querySelector('.search-result-type')?.getBoundingClientRect()
        const display = window.getComputedStyle(element).display
        return {
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100),
          display,
          rowLeft: Math.round(row.left),
          rowRight: Math.round(row.right),
          mainLeft: Math.round(main?.left ?? 0),
          mainRight: Math.round(main?.right ?? 0),
          typeLeft: Math.round(type?.left ?? 0),
          typeRight: Math.round(type?.right ?? 0),
          issue: display !== 'grid' || !main || !type || main.left >= type.left || type.right > row.right + 1,
        }
      })
      .filter((item) => item.issue)

    const lessonRowIssues = Array.from(document.querySelectorAll('.lesson-row'))
      .filter(isVisible)
      .map((element) => {
        const row = element.getBoundingClientRect()
        const title = element.querySelector('span')?.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return {
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
          display: style.display,
          titleOffset: Math.round((title?.left ?? row.left) - row.left),
          issue: style.display !== 'grid' || !title || title.left - row.left > 120,
        }
      })
      .filter((item) => item.issue)

    const leaderboardIssues = Array.from(document.querySelectorAll('.leaderboard > div'))
      .filter(isVisible)
      .map((element) => {
        const row = element.getBoundingClientRect()
        const name = element.querySelector('strong')?.getBoundingClientRect()
        const score = element.querySelector('small')?.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return {
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
          display: style.display,
          nameOffset: Math.round((name?.left ?? row.left) - row.left),
          scoreRightGap: Math.round(row.right - (score?.right ?? row.right)),
          issue: style.display !== 'grid' || !name || !score || name.left - row.left > 140 || row.right - score.right > 24,
        }
      })
      .filter((item) => item.issue)

    const blogFeature = document.querySelector('.blog-feature')
    const firstBlogItem = document.querySelector('.blog-list .content-row')
    const blogGap = isVisible(blogFeature) && isVisible(firstBlogItem)
      ? Math.round(firstBlogItem.getBoundingClientRect().top - blogFeature.getBoundingClientRect().bottom)
      : null

    return {
      headingAlignmentIssues,
      searchPlaceholderIssue,
      searchResultIssues,
      lessonRowIssues,
      leaderboardIssues,
      blogGapIssue: blogGap !== null && blogGap < 12 ? { gap: blogGap } : null,
    }
  })

  expect(report.headingAlignmentIssues, 'section and course headings should stay left aligned').toEqual([])
  expect(report.searchPlaceholderIssue, 'global search placeholder should be short and direct').toBeNull()
  expect(report.searchResultIssues, 'search results should show title/meta on the left and type on the right').toEqual([])
  expect(report.lessonRowIssues, 'lesson rows should use stable icon/title/time columns instead of centered titles').toEqual([])
  expect(report.leaderboardIssues, 'leaderboard names should align near the rank instead of floating in the center').toEqual([])
  expect(report.blogGapIssue, 'featured blog article needs enough breathing room before the list').toBeNull()
}

async function attachViewportScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const screenshot = await page.screenshot({ fullPage: false })
  expect(screenshot.byteLength).toBeGreaterThan(10_000)
  await testInfo.attach(`${name}-viewport`, {
    body: screenshot,
    contentType: 'image/png',
  })
}
