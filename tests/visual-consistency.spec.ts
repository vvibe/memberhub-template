import { expect, test, type Page, type TestInfo } from '@playwright/test'

const viewCases = [
  { id: 'home', label: '預覽', expectedText: '最新 AI Skill 文章' },
  { id: 'blog', label: '部落格', expectedText: 'AI Skill 文章、工作流拆解與工具教學' },
  { id: 'join', label: '加入會員', expectedText: '加入 Skills School，開始 AI Skill 課程、社群與每週實作' },
  { id: 'content', label: '內容庫', expectedText: '公開文章、會員內容與付費牆' },
  { id: 'newsletter', label: '通訊', expectedText: 'Email/LINE 通訊、付費轉換與推薦贈閱' },
  { id: 'courses', label: '課程', expectedText: 'AI Skill 課程、進度與等級解鎖' },
  { id: 'community', label: '社群', expectedText: 'AI Skill 討論區' },
  { id: 'members', label: '成員', expectedText: '會員目錄、角色、個人頁與活躍度' },
  { id: 'search', label: '搜尋', expectedText: '搜尋文章、課程、逐字稿、討論、活動與會員' },
  { id: 'challenges', label: '打卡', expectedText: '打卡挑戰、積分、等級與排行榜' },
  { id: 'events', label: '活動', expectedText: 'Webinar、Live、Office hour 與回放' },
  { id: 'login', label: '登入', expectedText: '登入 Skills School AI Skill 實作社群' },
  { id: 'member', label: '會員', expectedText: '會員方案、收據/發票狀態與付款自助' },
  { id: 'admin', label: '後台', expectedText: 'Skills School AI Skill 實作社群 設定' },
  { id: 'setup', label: '設定', expectedText: '調整 AI Skill 品牌、內容與會員設定' },
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
    await expect(page.locator('.topbar h1')).toHaveText('Skills School AI Skill 實作社群')
    await expect(page.getByText(viewCase.expectedText, { exact: true })).toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectMobileContentStartsInFirstViewport(page)
    await expectDesktopSpacingBreathes(page)
    await expectNoDemoCopy(page)
    await expectLayoutRhythmMatchesHome(page, homeRhythm)
    await expectSharedVisualTokens(page)
    await expectFormControlConsistency(page)
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

  await setRole(page, '管理員')
  await openNav(page, '內容庫')
  await page.getByPlaceholder('輸入文章標題').fill('QA 測試文章')
  await page.getByPlaceholder('列表與分享時顯示的短摘要').fill('這是 Playwright QA 產生的測試摘要。')
  const contentEditor = page.getByLabel('文章內文')
  await contentEditor.fill('這篇內容用來確認發文、搜尋與後台列表仍能正常運作。')
  await contentEditor.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.locator('.editor-panel').getByRole('button', { name: '粗體' }).click()
  await expect(page.locator('.editor-panel .rich-text-editable strong')).toContainText('這篇內容用來確認發文')
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
  await expect(page.getByText('Skills School AI Skill 實作社群 設定', { exact: true })).toBeVisible()

  await openNav(page, '課程')
  await page.getByRole('button', { name: /完成第一版 Skill SOP/ }).first().click()
  await expect(page.locator('.lesson-card.complete').filter({ hasText: '完成第一版 Skill SOP' })).toBeVisible()

  await openNav(page, '打卡')
  await page.getByRole('button', { name: '檢查打卡' }).first().click()
  await expect(page.getByRole('button', { name: '今日已打卡' }).first()).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectMobileContentStartsInFirstViewport(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'interactive-flows')

  expect(consoleErrors.errors).toEqual([])
})

test('visitor, member, and admin states show different screens in both reference sites', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await expect(page.getByText('訪客視角')).toBeVisible()
  await expect(page.getByText('只看到公開預覽')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '後台', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '會員', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '成員', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '通訊', exact: true })).toHaveCount(0)
  await openNav(page, '課程')
  await expect(page.getByText('訪客可以看課程架構')).toBeVisible()
  await expect(page.getByRole('button', { name: /會員限定/ }).first()).toBeDisabled()
  await openNav(page, '打卡')
  await expect(page.getByRole('button', { name: '加入後打卡' }).first()).toBeDisabled()

  await setRole(page, '會員')
  await expect(page.getByText('會員視角')).toBeVisible()
  await expect(page.getByText('課程與社群已解鎖')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '會員', exact: true })).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '後台', exact: true })).toHaveCount(0)
  await openNav(page, '課程')
  await expect(page.getByRole('button', { name: /完成第一版 Skill SOP/ }).first()).not.toBeDisabled()
  await openNav(page, '打卡')
  await page.getByRole('button', { name: '完成打卡' }).first().click()
  await expect(page.getByRole('button', { name: '今日已打卡' }).first()).toBeVisible()

  await setRole(page, '管理員')
  await expect(page.getByText('管理員視角')).toBeVisible()
  await expect(page.getByText('管理員編輯權限開啟')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '後台', exact: true })).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '設定', exact: true })).toBeVisible()
  await expect(page.getByText('Skills School AI Skill 實作社群 設定')).toBeVisible()

  await page.locator('.preset-select-trigger').click()
  await page.getByRole('option', { name: 'Signal Brief' }).click()
  await setRole(page, '訪客')
  await expect(page.getByRole('heading', { name: '先閱讀公開文章' })).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '我的訂閱', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '電子報', exact: true })).toHaveCount(0)
  await openNav(page, '文章')
  await page.locator('.publication-post-card').filter({ hasText: 'AI 內容產品追蹤資料表的使用方法' }).click()
  await expect(page.getByText('付費牆已啟用')).toBeVisible()
  await expect(page.getByText('使用這份表時，我建議先看')).toHaveCount(0)

  await setRole(page, '會員')
  await expect(page.getByText('付費讀者視角')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '我的訂閱', exact: true })).toBeVisible()
  await openNav(page, '文章')
  await page.locator('.publication-post-card').filter({ hasText: 'AI 內容產品追蹤資料表的使用方法' }).click()
  await expect(page.getByText('使用這份表時，我建議先看')).toBeVisible()
  await expect(page.getByText('付費牆已啟用')).toHaveCount(0)

  await setRole(page, '管理員')
  await expect(page.getByText('出版者後台開啟')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '電子報', exact: true })).toBeVisible()
  await expect(page.getByText('Signal Brief 策略通訊 出版後台')).toBeVisible()
  await expect(page.locator('.publication-admin-tabs').getByRole('button', { name: /文章與付費牆/ })).toBeVisible()
  await page.locator('.publication-admin-tabs').getByRole('button', { name: /設定/ }).click()
  await expect(page.getByText('站點、品牌與訂閱方案')).toBeVisible()
  await expect(page.getByText('課程與進度')).toHaveCount(0)

  await expectNoHorizontalOverflow(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'role-states')

  expect(consoleErrors.errors).toEqual([])
})

test('Skills School formal site removes role switching and uses real AI Skill content', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.goto('/?case=skills-school&formal=skills-school')
  await expect(page.locator('.topbar h1')).toHaveText('Skills School AI Skill 實作社群')
  await expect(page.locator('.segmented')).toHaveCount(0)
  await expect(page.getByText('訪客視角')).toHaveCount(0)
  await expect(page.getByText('管理員視角')).toHaveCount(0)
  await expect(page.getByText('用每週實作，完成能被看見的職能作品')).toHaveCount(0)
  await expect(page.getByText('把 AI Skill 變成每天用得到的工作流程')).toBeVisible()
  await openNav(page, '文章')
  await expect(
    page.getByRole('button', { name: /公開文章：AI Skill 是什麼，為什麼它比單次提示詞更重要/ }).first(),
  ).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '後台', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '登入', exact: true })).toBeVisible()

  await openNav(page, '登入')
  await expect(page.getByRole('heading', { name: '登入 Skills School AI Skill 實作社群' })).toBeVisible()
  await expect(page.getByPlaceholder('輸入密碼')).toBeVisible()
  await expect(page.getByText('輸入測試密碼')).toHaveCount(0)
  await expect(page.locator('form').getByRole('button', { name: '登入', exact: true })).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await attachViewportScreenshot(page, testInfo, 'skills-school-formal')

  expect(consoleErrors.errors).toEqual([])
})

test('Skills School and Signal Brief reference cases are both usable', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await expect(page.locator('.topbar h1')).toHaveText('Skills School AI Skill 實作社群')
  await openNav(page, '部落格')
  await expect(page.getByText('AI Skill 文章、工作流拆解與工具教學')).toBeVisible()
  await expect(page.getByText('課程預覽：第一週建立你的第一個 AI Skill')).toBeVisible()
  await openNav(page, '加入會員')
  await expect(page.getByText('加入 Skills School，開始 AI Skill 課程、社群與每週實作')).toBeVisible()
  await openNav(page, '內容庫')
  await expect(page.getByText('公開文章：AI Skill 是什麼，為什麼它比單次提示詞更重要')).toBeVisible()
  await expect(page.locator('.editor-panel')).toHaveCount(0)

  await page.locator('.preset-select-trigger').click()
  await page.getByRole('option', { name: 'Signal Brief' }).click()
  await expect(page.locator('.topbar h1')).toHaveText('Signal Brief 策略通訊')

  await openNav(page, '文章')
  await expect(page.locator('.publication-masthead h2')).toHaveText('Signal Brief')
  await expect(page.getByRole('heading', { name: '最新文章' })).toBeVisible()
  await expect(page.getByText('AI 工具從嘗鮮走向日常工作的三個訊號')).toBeVisible()
  await expect(page.getByText('自動化內容工具的商業模式與留存風險')).toBeVisible()
  await openNav(page, '訂閱')
  await expect(page.getByText('訂閱 Signal Brief，閱讀付費文章與每週電子報')).toBeVisible()
  await openNav(page, '文章庫')
  await expect(page.locator('.editor-panel')).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '課程', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '社群', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '打卡', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '活動', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '成員', exact: true })).toHaveCount(0)

  await openNav(page, '首頁')
  await expect(page.locator('.publication-masthead h2')).toHaveText('Signal Brief')
  await expect(page.getByText('AI 工具從嘗鮮走向日常工作的三個訊號')).toBeVisible()
  await expect(page.getByText('課程與社群')).toHaveCount(0)

  await page.getByRole('button', { name: /公開文章：AI 工具從嘗鮮走向日常工作的三個訊號/ }).first().click()
  await expect(page.getByText('AI 工具從輸出按鈕變成工作流程')).toBeVisible()
  await expect(page.getByText('喜歡這篇文章？')).toHaveCount(0)
  await expect(page.getByText('訂閱後可以閱讀付費分析')).toHaveCount(0)
  await page.getByRole('button', { name: '回到文章列表' }).click()
  await page.locator('.publication-post-card').filter({ hasText: 'AI 內容產品追蹤資料表的使用方法' }).click()
  await expect(page.getByText('付費牆已啟用')).toBeVisible()
  await expect(page.getByText('創作者設定在第 1 段後')).toBeVisible()
  await expect(page.getByText('使用這份表時，我建議先看')).toHaveCount(0)

  await expectNoHorizontalOverflow(page)
  await expectMobileContentStartsInFirstViewport(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
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
  await expect(page.locator('.topbar h1')).toHaveText('Skills School AI Skill 實作社群')
  await expect(page.getByText('加入 Skills School，開始 AI Skill 課程、社群與每週實作')).toBeVisible()

  await page.goto('/?case=signal-brief&view=blog')
  await expect(page.locator('.topbar h1')).toHaveText('Signal Brief 策略通訊')
  await expect(page.locator('.publication-masthead h2')).toHaveText('Signal Brief')
  await expect(page.getByRole('heading', { name: '最新文章' })).toBeVisible()

  await page.goto('/?case=signal-brief&view=courses')
  await expect(page.locator('.publication-masthead h2')).toHaveText('Signal Brief')
  await expect(page.locator('.nav-list').getByRole('button', { name: '課程', exact: true })).toHaveCount(0)
  await expect(page.locator('.nav-list').getByRole('button', { name: '成員', exact: true })).toHaveCount(0)

  await page.goto('/?case=signal-brief&view=admin')
  await expect(page.locator('.topbar h1')).toHaveText('Signal Brief 策略通訊')
  await expect(page.getByRole('heading', { name: '先閱讀公開文章' })).toBeVisible()
  await expect(page.getByText('出版站可調整的內容')).toHaveCount(0)
  await setRole(page, '管理員')
  await expect(page.getByText('用分頁管理出版站日常工作')).toBeVisible()
  await expectPublicationAdminTabs(page)
  await page.locator('.publication-admin-tabs').getByRole('button', { name: /文章與付費牆/ }).click()
  await expect(page.getByText('付費牆段落位置').first()).toBeVisible()
  await page.locator('.publication-admin-tabs').getByRole('button', { name: /讀者/ }).click()
  await expect(page.getByRole('heading', { name: '讀者與訂閱狀態' })).toBeVisible()
  await page.locator('.publication-admin-tabs').getByRole('button', { name: /總覽/ }).click()
  await expect(page.getByText('留言、讀者回覆與付款爭議')).toBeVisible()
  await expect(page.getByText('課程與進度')).toHaveCount(0)
  await expect(page.getByText('社群審核與互動')).toHaveCount(0)
  await expect(page.getByText('活動、直播與回放')).toHaveCount(0)

  await page.goto('/?case=superstake&view=blog')
  await expect(page.locator('.topbar h1')).toHaveText('Signal Brief 策略通訊')
  await expect(page.locator('.publication-masthead h2')).toHaveText('Signal Brief')

  await expectNoHorizontalOverflow(page)
  await expectMobileContentStartsInFirstViewport(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'direct-case-urls')

  expect(consoleErrors.errors).toEqual([])
})

test('Signal Brief admin separates functions into consistent tabs', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)
  const tabChecks = [
    { button: /總覽/, expected: '今日待辦' },
    { button: /文章與付費牆/, expected: '文章、付費牆與限時免費' },
    { button: /Newsletter/, expected: 'Newsletter 發送設定' },
    { button: /讀者/, expected: '讀者與訂閱狀態' },
    { button: /成長/, expected: '推薦、贈閱與來源成長' },
    { button: /金流與系統/, expected: 'InsForge / Portaly Vibe 設定狀態' },
    { button: /設定/, expected: '站點、品牌與訂閱方案' },
  ]

  await page.goto('/?case=signal-brief&view=admin')
  await setRole(page, '管理員')
  await expect(page.getByText('Signal Brief 策略通訊 出版後台')).toBeVisible()
  await expectPublicationAdminTabs(page)

  await page.locator('.publication-admin-tabs').getByRole('button', { name: /文章與付費牆/ }).click()
  const signalEditor = page.locator('.publication-admin-content .rich-text-editor').first()
  await expect(signalEditor.getByRole('button', { name: '粗體' })).toBeVisible()
  await expect(signalEditor.getByRole('button', { name: '項目清單' })).toBeVisible()
  await signalEditor.locator('[contenteditable="true"]').fill('Signal Brief 後台富文字內容')
  await expect(signalEditor.locator('[contenteditable="true"]')).toContainText('Signal Brief 後台富文字內容')

  for (const item of tabChecks) {
    await page.locator('.publication-admin-tabs').getByRole('button', { name: item.button }).click()
    await expect(page.getByText(item.expected).first()).toBeVisible()
    await expectPublicationAdminVisualConsistency(page)
    await expectNoHorizontalOverflow(page)
  }

  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await attachViewportScreenshot(page, testInfo, 'signal-brief-admin-tabs')

  expect(consoleErrors.errors).toEqual([])
})

test('setup page lets fork users choose the product mode', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await setRole(page, '管理員')
  await openNav(page, '設定')
  await expect(page.getByRole('heading', { name: '全功能會員社群' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '出版訂閱通訊' })).toBeVisible()
  await expect(page.getByText('類 Skool / School')).toBeVisible()
  await expect(page.getByText('類 Substack')).toBeVisible()

  await page.locator('.setup-choice-card').filter({ hasText: '出版訂閱通訊' }).getByRole('button').click()
  await expect(page.locator('.topbar h1')).toHaveText('Signal Brief 策略通訊')
  await expect(page.getByText('調整出版品牌、文章與訂閱設定')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '課程', exact: true })).toHaveCount(0)

  await page.locator('.setup-choice-card').filter({ hasText: '全功能會員社群' }).getByRole('button').click()
  await expect(page.locator('.topbar h1')).toHaveText('Skills School AI Skill 實作社群')
  await expect(page.getByText('調整 AI Skill 品牌、內容與會員設定')).toBeVisible()
  await expect(page.locator('.nav-list').getByRole('button', { name: '課程', exact: true })).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'setup-product-mode')

  expect(consoleErrors.errors).toEqual([])
})

test('admin can edit fork-ready site settings and newsletter configuration', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await setRole(page, '管理員')
  await openNav(page, '後台')
  await expect(page.locator('.skills-admin-tabs').getByRole('button', { name: /社團設定/ })).toHaveClass(/active/)
  await expect(page.getByText('這裡不是另一個後台')).toBeVisible()
  await expect(page.getByText('會員名單與狀態')).toHaveCount(0)
  await page.locator('.skills-admin-tabs').getByRole('button', { name: /會員/ }).click()
  await expect(page.getByText('會員名單與狀態')).toBeVisible()
  await expect(page.getByText('Share your group link')).toBeVisible()
  await expect(page.getByText('Import .CSV file')).toBeVisible()
  await expect(page.getByRole('button', { name: /Invite/ })).toBeVisible()
  await expect(page.locator('.skills-admin-tabs').getByRole('button', { name: /文章/ })).toBeVisible()
  await page.locator('.skills-admin-tabs').getByRole('button', { name: /文章/ }).click()
  const skillsAdminEditor = page.locator('.skills-admin-workspace .rich-text-editor').first()
  await expect(skillsAdminEditor.getByRole('button', { name: '粗體' })).toBeVisible()
  await expect(skillsAdminEditor.getByRole('button', { name: '項目清單' })).toBeVisible()
  await skillsAdminEditor.locator('[contenteditable="true"]').fill('Skills School 後台富文字內容')
  await expect(skillsAdminEditor.locator('[contenteditable="true"]')).toContainText('Skills School 後台富文字內容')
  await page.locator('.skills-admin-tabs').getByRole('button', { name: /社團設定/ }).click()
  await expect(page.getByText('網站、品牌與會員方案')).toBeVisible()

  await page.getByLabel('網站名稱').fill('Kevin Growth Letter')
  await page.getByLabel('首頁主標題').fill('把每週內容變成可訂閱的產品')
  await page.getByLabel('主要按鈕').fill('開始訂閱')
  await expect(page.locator('.topbar h1')).toHaveText('Kevin Growth Letter')

  await openNav(page, '預覽')
  await expect(page.getByRole('heading', { name: '把每週內容變成可訂閱的產品' })).toBeVisible()
  await expect(page.getByRole('button', { name: '開始訂閱' }).first()).toBeVisible()

  await openNav(page, '後台')
  await page.locator('.skills-admin-tabs').getByRole('button', { name: /電子報/ }).click()
  await page.locator('input[name="newsletter-skills-school-n1-subject"]').fill('本週 AI Skill 回饋與直播提醒')
  await openNav(page, '通訊')
  await expect(page.getByText('本週 AI Skill 回饋與直播提醒')).toBeVisible()
  await expect(page.getByText('把文章、課程或活動寄給會員')).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectDesktopSpacingBreathes(page)
  await expectNoDemoCopy(page)
  await expectSharedVisualTokens(page)
  await expectFormControlConsistency(page)
  await expectReadableTypography(page)
  await expectConsistentSpacingAndTextMetrics(page)
  await expectNoLayoutCollisions(page)
  await expectDetailLayoutQuality(page)
  await attachViewportScreenshot(page, testInfo, 'admin-editing')

  expect(consoleErrors.errors).toEqual([])
})

test('Signal Brief standalone article and limited-free rules work', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.goto('http://signal-brief.localhost:5176/', { waitUntil: 'networkidle' })
  await expect(page.getByText('關於創作者')).toBeVisible()
  await expect(page.getByText('免費讀者')).toBeVisible()
  await expect(page.getByText('付費讀者')).toBeVisible()
  await expect(page.locator('.signal-author-card').getByText('付費轉換')).toHaveCount(0)
  const authorProfileLayout = await page.locator('.signal-author-card').evaluate((card) => {
    const avatar = card.querySelector('.signal-author-avatar')
    if (!avatar) throw new Error('Missing Signal Brief author avatar')
    const cardRect = card.getBoundingClientRect()
    const avatarRect = avatar.getBoundingClientRect()
    return {
      avatarWidth: Math.round(avatarRect.width),
      avatarCenterOffset: Math.round(Math.abs((avatarRect.left + avatarRect.width / 2) - (cardRect.left + cardRect.width / 2))),
    }
  })
  expect(authorProfileLayout.avatarWidth).toBeGreaterThanOrEqual(94)
  expect(authorProfileLayout.avatarCenterOffset).toBeLessThanOrEqual(1)
  await page.getByRole('navigation', { name: 'Signal Brief navigation' }).getByRole('button', { name: '訂閱', exact: true }).click()
  const planGridLayout = await page.locator('.signal-plan-grid').evaluate((grid) => {
    const rect = grid.getBoundingClientRect()
    return {
      centerOffset: Math.round(Math.abs((rect.left + rect.width / 2) - window.innerWidth / 2)),
      width: Math.round(rect.width),
    }
  })
  expect(planGridLayout.centerOffset).toBeLessThanOrEqual(1)
  await page.getByRole('navigation', { name: 'Signal Brief navigation' }).getByRole('button', { name: '文章', exact: true }).click()
  await page.locator('.signal-feature-post').click()
  await expect(page.getByRole('heading', { name: 'AI 工具從嘗鮮走向日常工作的三個訊號' })).toBeVisible()
  await expect(page.getByText('想讀完整付費分析？')).toHaveCount(0)
  await expect(page.getByText('升級後可以閱讀會員專欄')).toHaveCount(0)

  const backButtonStyle = await page.getByRole('button', { name: '回到文章列表' }).evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      display: style.display,
      alignItems: style.alignItems,
      justifyContent: style.justifyContent,
      borderRadius: style.borderRadius,
    }
  })
  expect(backButtonStyle.display).toContain('flex')
  expect(backButtonStyle).toMatchObject({ alignItems: 'center', justifyContent: 'center' })

  await page.getByRole('button', { name: '回到文章列表' }).click()
  await page.locator('.signal-post-row').filter({ hasText: '自動化內容工具的商業模式與留存風險' }).click()
  await expect(page.getByText('限時免費至')).toBeVisible()
  await expect(page.getByText('付費牆已啟用')).toHaveCount(0)
  await expect(page.getByText('付費牆後的完整分析會拆解三種定價模型')).toBeVisible()

  await page.goto('/?case=signal-brief&view=admin')
  await setRole(page, '管理員')
  await page.locator('.publication-admin-tabs').getByRole('button', { name: /文章與付費牆/ }).click()
  await expect(page.getByText('限時免費公開到').first()).toBeVisible()
  await expect(page.getByText('時間過後會自動回到付費牆').first()).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectFormControlConsistency(page)
  await attachViewportScreenshot(page, testInfo, 'signal-brief-limited-free')
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
  if (viewCase.id === 'admin' || viewCase.id === 'setup' || viewCase.id === 'newsletter') {
    await setRole(page, '管理員')
  } else if (viewCase.id === 'member' || viewCase.id === 'members') {
    await setRole(page, '會員')
  } else if (viewCase.id === 'login') {
    await setRole(page, '訪客')
  }
  await openNav(page, viewCase.label)
}

async function setRole(page: Page, label: '訪客' | '會員' | '管理員') {
  await page.locator('.segmented').getByRole('button', { name: label, exact: true }).click()
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
    textColor: '#282d2b',
    canvas: '#f6f4ef',
  })
  expect(visual.buttonIssues).toEqual([])
  expect(visual.cardIssues).toEqual([])
}

async function expectFormControlConsistency(page: Page) {
  const report = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const controls = Array.from(document.querySelectorAll('[data-slot="input"], [data-slot="textarea"]'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        const isTextarea = element.getAttribute('data-slot') === 'textarea'
        const isEmbedded = Boolean(element.closest('.search-box, .auth-input, .signal-subscribe-form, .publication-subscribe-inline'))
        const borderWidth = Number.parseFloat(style.borderTopWidth)
        const borderRadius = Number.parseFloat(style.borderRadius)
        const fontSize = Number.parseFloat(style.fontSize)
        const paddingLeft = Number.parseFloat(style.paddingLeft)
        const backgroundIsTransparent = style.backgroundColor === 'rgba(0, 0, 0, 0)'

        return {
          tag: element.tagName.toLowerCase(),
          name: (element as HTMLInputElement).name || (element as HTMLInputElement).placeholder || element.getAttribute('type') || '',
          height: Math.round(rect.height),
          borderRadius: style.borderRadius,
          borderWidth: style.borderTopWidth,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
          issue:
            fontSize !== 14 ||
            paddingLeft < 10 ||
            (isTextarea ? rect.height < 90 : rect.height < 38) ||
            (!isEmbedded && (borderWidth < 1 || borderRadius !== 8 || backgroundIsTransparent)) ||
            (isEmbedded && borderRadius > 8 && !element.closest('.signal-subscribe-form, .publication-subscribe-inline')),
        }
      })
      .filter((control) => control.issue)

    const toggles = Array.from(document.querySelectorAll('.editor-toggle'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        const input = element.querySelector('input[type="checkbox"]')
        const inputRect = input?.getBoundingClientRect()
        const inputStyle = input ? window.getComputedStyle(input) : null
        const display = style.display
        const height = Math.round(rect.height)
        const inputWidth = inputRect ? Math.round(inputRect.width) : 0
        const inputHeight = inputRect ? Math.round(inputRect.height) : 0

        return {
          text: element.textContent?.trim() ?? '',
          display,
          height,
          borderRadius: style.borderRadius,
          borderWidth: style.borderTopWidth,
          alignItems: style.alignItems,
          inputWidth,
          inputHeight,
          inputAppearance: inputStyle?.appearance ?? '',
          issue:
            !display.includes('flex') ||
            style.alignItems !== 'center' ||
            Number.parseFloat(style.borderTopWidth) < 1 ||
            style.borderRadius !== '8px' ||
            height < 30 ||
            inputWidth !== 18 ||
            inputHeight !== 18 ||
            inputStyle?.appearance !== 'none',
        }
      })
      .filter((toggle) => toggle.issue)

    return { controls, toggles }
  })

  expect(report.controls, 'form controls should use the shared input/textarea styling instead of browser defaults').toEqual([])
  expect(report.toggles, 'checkbox toggles should stay inline and use the shared custom control styling').toEqual([])
}

async function expectPublicationAdminTabs(page: Page) {
  const tabLabels = ['總覽', '文章與付費牆', 'Newsletter', '讀者', '成長', '金流與系統', '設定']
  const tabs = page.locator('.publication-admin-tabs')
  await expect(tabs).toBeVisible()
  for (const label of tabLabels) {
    await expect(tabs.getByRole('button', { name: new RegExp(label) })).toBeVisible()
  }
  await expect(tabs.getByRole('button')).toHaveCount(tabLabels.length)
  await expect(page.locator('.publication-admin-tab-head .publication-admin-tabs')).toBeVisible()
}

async function expectPublicationAdminVisualConsistency(page: Page) {
  const report = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const tabButtons = Array.from(document.querySelectorAll('.publication-admin-tabs button'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return {
          text: element.textContent?.trim() ?? '',
          height: Math.round(rect.height),
          radius: style.borderRadius,
          fontSize: style.fontSize,
          display: style.display,
          justifyContent: style.justifyContent,
          textAlign: style.textAlign,
          top: Math.round(rect.top),
        }
      })

    const tabContainer = document.querySelector('.publication-admin-tabs')
    const tabContainerStyle = tabContainer ? window.getComputedStyle(tabContainer) : null
    const tabHead = document.querySelector('.publication-admin-tab-head')
    const content = document.querySelector('.publication-admin-content')
    const tabHeadRect = tabHead?.getBoundingClientRect()
    const contentRect = content?.getBoundingClientRect()

    const panels = Array.from(document.querySelectorAll('.publication-admin-content .admin-panel, .publication-admin-tab-head'))
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
      tabContainer: {
        display: tabContainerStyle?.display ?? '',
        inHeader: Boolean(tabContainer?.closest('.publication-admin-tab-head')),
        headWidth: tabHeadRect ? Math.round(tabHeadRect.width) : 0,
        contentWidth: contentRect ? Math.round(contentRect.width) : 0,
      },
      tabIssues: tabButtons.filter((button) => (
        button.height < 34 ||
        button.radius !== '8px' ||
        button.display !== 'flex' ||
        button.justifyContent !== 'center'
      )),
      panelIssues: panels.filter((panel) => (
        panel.radius !== '8px' ||
        panel.borderStyle !== 'solid' ||
        panel.backgroundColor === 'rgba(0, 0, 0, 0)'
      )),
    }
  })

  expect(report.tabContainer, 'publication admin tabs should live in the top tab header and span the content width').toMatchObject({
    display: 'flex',
    inHeader: true,
  })
  expect(report.tabContainer.headWidth).toBeGreaterThanOrEqual(report.tabContainer.contentWidth - 2)
  expect(report.tabIssues, 'publication admin tabs should use stable centered top-tab controls').toEqual([])
  expect(report.panelIssues, 'publication admin panels should match the shared panel visual system').toEqual([])
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

    const clippedControls = Array.from(document.querySelectorAll('button, .pill, .status-pill, .creator-stats span, .signal-author-stats span, .member-stats span, .admin-mini-stats article, [data-slot="select-trigger"]'))
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
  expect(report.clippedControls, 'button, pill, compact stat, and tab labels should not be clipped').toEqual([])
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

    const parseRgb = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return null
      return [Number(match[1]), Number(match[2]), Number(match[3])]
    }

    const disabledLessonContrastIssues = Array.from(document.querySelectorAll('.lesson-row:disabled'))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        const title = element.querySelector('span')
        const titleStyle = title ? window.getComputedStyle(title) : null
        const titleRgb = titleStyle ? parseRgb(titleStyle.color) : null
        const isWashedOut = titleRgb ? titleRgb.every((channel) => channel > 150) : true
        return {
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
          opacity: style.opacity,
          titleColor: titleStyle?.color ?? '',
          issue: Number(style.opacity) < 0.95 || isWashedOut,
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
      disabledLessonContrastIssues,
      leaderboardIssues,
      blogGapIssue: blogGap !== null && blogGap < 12 ? { gap: blogGap } : null,
    }
  })

  expect(report.headingAlignmentIssues, 'section and course headings should stay left aligned').toEqual([])
  expect(report.searchPlaceholderIssue, 'global search placeholder should be short and direct').toBeNull()
  expect(report.searchResultIssues, 'search results should show title/meta on the left and type on the right').toEqual([])
  expect(report.lessonRowIssues, 'lesson rows should use stable icon/title/time columns instead of centered titles').toEqual([])
  expect(report.disabledLessonContrastIssues, 'locked lesson labels should remain readable and must not rely on low opacity').toEqual([])
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
