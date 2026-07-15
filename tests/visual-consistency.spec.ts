import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
})

test('visitor starts on simplified about with cover and join calls to action', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '把 AI Skill 變成每天用得到的工作流程' })).toBeVisible()
  const heroCover = page.getByRole('img', { name: '社群封面圖' })
  await expect(heroCover).toHaveCSS('background-image', /\/images\/memberhub-login-cover\.png/)
  const heroBox = await heroCover.boundingBox()
  const nextButtonBox = await page.getByRole('button', { name: '下一張社群輪播圖' }).boundingBox()
  expect(heroBox).not.toBeNull()
  expect(nextButtonBox).not.toBeNull()
  expect(Math.abs((heroBox!.width / heroBox!.height) - (1200 / 630))).toBeLessThan(0.03)
  expect(nextButtonBox!.x + nextButtonBox!.width).toBeLessThanOrEqual(heroBox!.x + heroBox!.width)
  expect(nextButtonBox!.y + nextButtonBox!.height).toBeLessThanOrEqual(heroBox!.y + heroBox!.height)
  expect(nextButtonBox!.x).toBeGreaterThanOrEqual(heroBox!.x)
  expect(nextButtonBox!.y).toBeGreaterThanOrEqual(heroBox!.y)
  await expect(page.locator('.about-cover span')).toHaveCount(0)
  await expect(page.getByRole('img', { name: '社群卡片封面圖' })).toHaveCount(0)
  await expect(page.getByRole('img', { name: '社群輪播圖' })).toHaveCount(0)
  await expect(page.locator('.public-group-card .cover-box span')).toHaveCount(0)
  const firstGalleryImage = await heroCover.evaluate((element) => getComputedStyle(element).backgroundImage)
  await page.getByRole('button', { name: '下一張社群輪播圖' }).click()
  expect(await heroCover.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe(firstGalleryImage)
  await expect(page.getByText('公開預覽')).toBeVisible()
  await expect(page.getByText('私密會員區')).toBeVisible()
  await expect(page.locator('.public-meta-grid').getByText('NT$890', { exact: true })).toBeVisible()
  await expect(page.locator('.public-group-card').getByText('Skills School', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Membership Questions' })).toHaveCount(0)
  await expect(page.locator('.public-group-card .public-join-button')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '加入 NT$890/月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '登入社群' })).toHaveCSS('box-shadow', 'none')
  await expect(page.getByRole('button', { name: '登入 / 加入' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '立即加入' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '付費加入' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '免費加入' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '登入', exact: true })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Freemium' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Simple group rules' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Support' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Rules' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '社群規範' })).toBeVisible()
  await expect(page.locator('.about-rules-panel .rule-row')).toHaveCount(3)
  await expect(page.locator('.about-rules-panel .rule-row').first()).toContainText('1.')
  await expect(page.locator('.about-rules-panel .rule-row p').first()).toHaveCSS('font-weight', '400')
  await expect(page.locator('body')).not.toContainText('Newsletter')
  await expect(page.locator('body')).not.toContainText('搜尋')
  await expectNoHorizontalOverflow(page)

  await page.goto('/?view=community')
  await expect(page.getByRole('heading', { name: '把 AI Skill 變成每天用得到的工作流程' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '討論、公告與會員回饋' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
})

test('legacy stored online count is normalized below member total', async ({ page }) => {
  await page.waitForFunction(() => window.localStorage.getItem('memberhub-demo-state-v1') !== null)
  await page.evaluate(() => {
    const key = 'memberhub-demo-state-v1'
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    state.group.onlineLabel = '42 online'
    window.localStorage.setItem(key, JSON.stringify(state))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.locator('.public-meta-grid')).toContainText('2 online')
  await expect(page.locator('body')).not.toContainText('42 online')
})

test('free join asks questions and admin can approve', async ({ page }) => {
  await page.waitForFunction(() => window.localStorage.getItem('memberhub-demo-state-v1') !== null)
  await page.evaluate(() => {
    const key = 'memberhub-demo-state-v1'
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    state.pricingMode = 'free'
    window.localStorage.setItem(key, JSON.stringify(state))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.public-group-card .public-join-button')).toHaveCount(1)
  await page.getByRole('button', { name: '免費加入' }).click()
  const dialog = page.getByRole('dialog', { name: '加入社群申請' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("What's your best email?").fill('new-member@example.test')
  await dialog.getByLabel('Password', { exact: true }).fill('new-member-password')
  await dialog.getByLabel('Confirm password', { exact: true }).fill('new-member-password')
  await dialog.getByLabel('你現在最想把哪一個工作流程做成 AI Skill？').fill('內容企劃')
  await dialog.getByLabel('你的主要身份是創作者、顧問、老師、PM、工程師，還是其他？').fill('顧問')
  await dialog.getByLabel('你從哪裡知道這個社群？').fill('朋友推薦')
  await dialog.getByRole('button', { name: '送出申請' }).click()
  await expect(dialog.getByText('申請已送出，等待審核')).toBeVisible()
  await page.getByLabel('關閉加入申請').click()

  await createLocalAdmin(page)
  await page.getByRole('button', { name: 'Admin' }).click()
  const adminTabs = page.getByLabel('Admin tabs')
  await adminTabs.getByRole('button', { name: 'Access' }).click()
  await page.getByRole('button', { name: 'Review applications' }).click()
  const reviewDialog = page.getByRole('dialog', { name: '加入申請審核' })
  await expect(reviewDialog.getByText('new-member@example.test')).toBeVisible()
  await reviewDialog.getByRole('button', { name: '核准' }).click()
  const approvedApplication = reviewDialog.locator('.application-item').filter({ hasText: 'new-member@example.test' })
  await expect(approvedApplication).toContainText('已同意')
  const applicationHeaderLayout = await approvedApplication.evaluate((item) => {
    const header = item.querySelector('.application-header')
    const email = header?.querySelector('strong')
    const meta = header?.querySelector('small')
    const itemRect = item.getBoundingClientRect()
    const emailRect = email?.getBoundingClientRect()
    const metaRect = meta?.getBoundingClientRect()
    return header && emailRect && metaRect ? {
      metaRightGap: Math.round(itemRect.right - metaRect.right),
      metaAboveEmailBottom: metaRect.top < emailRect.bottom,
      emailLeftOfMeta: emailRect.right <= metaRect.left,
      metaText: meta?.textContent ?? '',
    } : null
  })
  expect(applicationHeaderLayout).toEqual(expect.objectContaining({ metaAboveEmailBottom: true, emailLeftOfMeta: true }))
  expect(applicationHeaderLayout?.metaRightGap).toBeLessThanOrEqual(15)
  expect(applicationHeaderLayout?.metaText).toContain('已同意')
  await reviewDialog.getByLabel('關閉加入申請審核').click()
  await adminTabs.getByRole('button', { name: 'Members' }).click()
  await expect(page.locator('.member-admin-list')).toContainText('new-member')
  await page.getByRole('button', { name: '查看 new-member 入社群問題記錄' }).click()
  const memberRecordDialog = page.getByRole('dialog', { name: '會員入社群問題記錄' })
  await expect(memberRecordDialog).toBeVisible()
  await expect(memberRecordDialog).toContainText('new-member@example.test')
  await expect(memberRecordDialog).toContainText('內容企劃')
  await expect(memberRecordDialog).toContainText('朋友推薦')
  await page.getByLabel('關閉會員記錄').click()
})

test('paid join asks questions and approves directly', async ({ page }) => {
  await page.getByRole('button', { name: '加入 NT$890/月' }).click()
  const dialog = page.getByRole('dialog', { name: '加入社群申請' })
  await expect(dialog).toBeVisible()
  await dialog.getByText('送出後會以本機預覽狀態加入。').waitFor()
  await dialog.getByLabel("What's your best email?").fill('paid-member@example.test')
  await dialog.getByLabel('Password', { exact: true }).fill('paid-member-password')
  await dialog.getByLabel('Confirm password', { exact: true }).fill('paid-member-password')
  await dialog.getByLabel('你現在最想把哪一個工作流程做成 AI Skill？').fill('付費會員 onboarding')
  await dialog.getByLabel('你的主要身份是創作者、顧問、老師、PM、工程師，還是其他？').fill('PM')
  await dialog.getByLabel('你從哪裡知道這個社群？').fill('朋友推薦')
  await dialog.getByRole('button', { name: '送出訂閱申請' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole('heading', { name: '討論、公告與會員回饋' })).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('memberhub-demo-state-v1') ?? '{}'))
  expect(stored.role).toBe('member')
  expect(stored.selectedPlanId).toBe('monthly')
  expect(stored.membershipApplications[0]).toMatchObject({ email: 'paid-member@example.test', status: 'approved', planId: 'monthly' })
})

test('login modal excludes fork setup and admin account skips plan and admin login', async ({ page }) => {
  await page.getByRole('button', { name: '登入社群' }).click()
  const setupDialog = page.getByRole('dialog', { name: '登入社群' })
  await expect(setupDialog.getByRole('heading', { name: '登入社群' })).toBeVisible()
  await expect(setupDialog.getByRole('heading', { name: '建立第一位管理員' })).toHaveCount(0)
  await expect(setupDialog.getByLabel('Admin email')).toHaveCount(0)
  await expect(setupDialog.getByRole('button', { name: 'Create admin' })).toHaveCount(0)
  await setupDialog.getByLabel('Email', { exact: true }).fill('owner@memberhub.test')
  await setupDialog.getByRole('button', { name: '忘記密碼？' }).click()
  await expect(setupDialog).toContainText('本機 demo 不會寄信')
  await setupDialog.getByRole('button', { name: '免費加入' }).click()
  await expect(setupDialog).toBeHidden()
  await expect(page.getByRole('dialog', { name: '加入社群申請' })).toBeVisible()
  await page.getByLabel('關閉加入申請').click()

  await page.getByRole('button', { name: '登入社群' }).click()
  const loginDialog = page.getByRole('dialog', { name: '登入社群' })
  await loginDialog.getByLabel('Email', { exact: true }).fill('owner@memberhub.test')
  await loginDialog.getByLabel('Password', { exact: true }).fill('memberhub-admin-2026')
  await loginDialog.getByRole('button', { name: '登入', exact: true }).click()
  await expect(loginDialog).toBeHidden()
  await expect(page.getByText('社群管理後台已開啟')).toBeVisible()

  await page.getByRole('button', { name: 'Account' }).click()
  await expect(page.getByRole('heading', { name: 'Admin login' })).toHaveCount(0)
  await expect(page.getByLabel('Current password')).toBeVisible()
  await expect(page.getByLabel('New password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Change password' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Subscription plan' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Change plan' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Cancel subscription' })).toHaveCount(0)
  await expect(page.locator('.account-score-card')).toContainText(/Level\s*9/)
  await expect(page.locator('.account-score-card')).toContainText('33015')
  await expect(page.locator('.account-score-card')).toContainText('Role: Admin')
  const adminState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('memberhub-demo-state-v1') ?? '{}'))
  expect(adminState.currentMemberPoints).toBe(33015)
})

test('all modal shells use white surfaces', async ({ page }) => {
  await page.getByRole('button', { name: '登入社群' }).click()
  await expect(page.getByRole('dialog', { name: '登入社群' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
  await page.getByLabel('關閉登入視窗').click()

  await page.getByRole('button', { name: '加入 NT$890/月' }).click()
  await expect(page.getByRole('dialog', { name: '加入社群申請' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
  await page.getByLabel('關閉加入申請').click()

  await createLocalMember(page)
  await page.locator('.post-card .post-open-button').first().click()
  await expect(page.getByRole('dialog', { name: '貼文完整內容' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
  await page.getByLabel('關閉貼文').click()

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Classroom', exact: true }).click()
  await page.locator('.course-card').filter({ hasText: '進階工作流案例庫' }).click()
  await expect(page.getByRole('dialog', { name: '課程無法查看原因' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
  await page.getByLabel('關閉課程鎖定說明').click()

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Calendar', exact: true }).click()
  await page.locator('.calendar-grid').getByRole('button', { name: /Live/ }).click()
  await expect(page.getByRole('dialog', { name: '活動詳細資訊' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
  await page.getByLabel('關閉活動詳細資訊').click()

  await page.evaluate(() => {
    const key = 'memberhub-demo-state-v1'
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    state.role = 'admin'
    state.currentMemberPoints = 33015
    window.localStorage.setItem(key, JSON.stringify(state))
  })
  await page.goto('/?view=admin')
  await page.getByRole('navigation', { name: 'Admin tabs' }).getByRole('button', { name: 'General', exact: true }).click()
  await page.locator('article').filter({ hasText: '社群資訊卡連結' }).getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('dialog', { name: '新增社群資訊卡連結' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
  await page.getByLabel('關閉新增連結').click()

  await page.getByRole('navigation', { name: 'Admin tabs' }).getByRole('button', { name: 'Calendar', exact: true }).click()
  await page.locator('article').filter({ hasText: 'Event access' }).getByRole('button', { name: 'Add event' }).click()
  await expect(page.getByRole('dialog', { name: '新增活動' })).toBeVisible()
  await expectVisibleDialogsWhite(page)
  await expectVisibleDialogsRoundedAndPadded(page)
})

test('about settings exposes invite link records and leave group', async ({ page }) => {
  await createLocalAdmin(page)
  await page.getByRole('button', { name: 'About' }).click()
  await expect(page.getByRole('img', { name: '社群封面圖' })).toBeVisible()
  await expect(page.locator('.public-meta-grid')).toContainText('公開預覽')
  await expect(page.getByRole('button', { name: 'SETTING' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pricing' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Simple group rules' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Support' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Rules' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '社群規範' })).toBeVisible()

  await page.getByRole('button', { name: 'SETTING' }).click()
  await expect(page.getByRole('heading', { name: '社群設定' })).toBeVisible()
  await expect(page.getByLabel('Invite link')).toHaveValue(/\?invite=owner/)
  await page.getByLabel('Invite email').fill('friend@example.test')
  await page.getByRole('button', { name: 'Add invite record' }).click()
  await expect(page.locator('.about-settings-panel')).toContainText('friend@example.test')

  await page.getByRole('button', { name: '退出社群' }).click()
  await expect(page.getByRole('button', { name: '登入社群' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
})

test('member can join, post, like, and gain leaderboard points', async ({ page }) => {
  await createLocalMember(page)
  await expect(page.getByRole('heading', { name: '討論、公告與會員回饋' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await expect(page.locator('.hub-topbar')).toBeVisible()
  await expect(page.getByLabel('Search')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '登出' })).toBeVisible()
  await expect(page.locator('.hub-topbar').getByText(/^Level\b/)).toHaveCount(0)
  await expect(page.locator('.hub-topbar').getByText(/^Points\b/)).toHaveCount(0)
  await expectTopNavigation(page)
  await expectGroupAsideOnLeft(page)
  await expectInsetCardMedia(page, '.hub-group-card', '.cover-box')
  await expectGroupStatsMatchCoverWidth(page)

  await page.getByRole('button', { name: 'Account' }).click()
  await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible()
  await expect(page.locator('.settings-form input[type="file"]')).toHaveCount(0)
  await page.locator('.avatar-upload-control').hover()
  await expect(page.locator('.avatar-upload-overlay')).toHaveCSS('opacity', '1')
  await page.getByLabel('Avatar upload').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'),
  })
  await expect(page.locator('.account-avatar-preview img')).toBeVisible()
  await page.getByLabel('Display name').fill('Demo Member')
  await page.getByLabel('Account email').fill('demo-member@test.local')
  const identityFieldWidths = await page.locator('.account-identity-row').evaluate((row) => {
    const fields = row.querySelectorAll('label')
    return {
      display: getComputedStyle(row).display,
      name: fields[0]?.getBoundingClientRect().width ?? 0,
      email: fields[1]?.getBoundingClientRect().width ?? 0,
    }
  })
  if (identityFieldWidths.display === 'flex') expect(identityFieldWidths.email).toBeGreaterThan(identityFieldWidths.name)
  await expect(page.getByLabel('Membership plan')).toHaveCount(0)
  await expect(page.locator('.account-plan-card .compact-list')).toHaveCount(0)
  await page.getByRole('button', { name: 'Change plan' }).click()
  await expect(page.locator('.account-plan-card')).toContainText('Pro 社群')
  await expect(page.locator('.account-plan-card .account-score-card .account-score-grid .metric')).toHaveCount(2)
  const scoreBeforePlan = await page.locator('.account-plan-card').evaluate((card) => {
    const score = card.querySelector('.account-score-card')
    const subscriptionHeading = Array.from(card.querySelectorAll('h2')).find((heading) => heading.textContent?.includes('Subscription plan'))
    return Boolean(score && subscriptionHeading && (score.compareDocumentPosition(subscriptionHeading) & Node.DOCUMENT_POSITION_FOLLOWING))
  })
  expect(scoreBeforePlan).toBe(true)
  await page.getByRole('button', { name: 'Cancel subscription' }).click()
  await expect(page.locator('.account-plan-card')).toContainText('免費會員')
  await page.getByLabel('Notification scope').selectOption('selected')
  await page.getByLabel('發課程').uncheck()
  await expect(page.locator('body')).not.toContainText('Zeabur')
  await expectInteractiveSpacing(page)
  const accountState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('memberhub-demo-state-v1') ?? '{}'))
  expect(accountState.selectedPlanId).toBe('free')
  expect(accountState.profileAvatarUrl).toContain('data:image/png')
  expect(accountState.notificationSettings).toMatchObject({ scope: 'selected', adminPosts: true, courses: false, events: true })
  const mainNavigation = page.getByRole('navigation', { name: 'Main navigation' })
  await mainNavigation.getByRole('button', { name: 'Members', exact: true }).click()
  await expect(page.locator('.member-list')).toContainText('Demo Member')
  await expect(page.locator('.member-list')).toContainText('demo-member@test.local')
  await mainNavigation.getByRole('button', { name: 'Community', exact: true }).click()

  await page.getByLabel('Create community post').fill('今天把研究摘要 Skill 改成可檢查的三段式輸出。')
  await page.getByRole('button', { name: 'Post', exact: true }).click()
  await expect(page.getByText('今天把研究摘要 Skill 改成可檢查的三段式輸出。')).toBeVisible()
  const newPost = page.locator('.post-card').filter({ hasText: '今天把研究摘要 Skill 改成可檢查的三段式輸出。' })
  const postHeader = await newPost.evaluate((element) => {
    const avatar = element.querySelector('.post-card-header .avatar')?.getBoundingClientRect()
    const author = element.querySelector('.post-author-block')?.getBoundingClientRect()
    return avatar && author
      ? { sameHeight: Math.abs(avatar.height - author.height) <= 1, avatarLeft: avatar.left, authorLeft: author.left }
      : null
  })
  expect(postHeader).toEqual(expect.objectContaining({ sameHeight: true }))
  expect(postHeader?.authorLeft).toBeGreaterThan(postHeader?.avatarLeft ?? 0)

  await newPost.locator('.post-open-button').click()
  const postDialog = page.getByRole('dialog', { name: '貼文完整內容' })
  await expect(postDialog).toBeVisible()
  await expect(postDialog).toContainText('今天把研究摘要 Skill 改成可檢查的三段式輸出。')
  await postDialog.getByLabel('Add comment').fill('我也補一段驗證留言。')
  await postDialog.getByRole('button', { name: 'Comment' }).click()
  await expect(postDialog).toContainText('我也補一段驗證留言。')
  await postDialog.getByRole('button', { name: 'Like post, 0 likes' }).click()
  const likedButton = postDialog.getByRole('button', { name: 'Liked post, 1 likes' })
  await expect(likedButton).toBeDisabled()
  await expect(likedButton.locator('svg')).toBeVisible()
  await expect(likedButton).toHaveClass(/liked/)
  await page.getByLabel('關閉貼文').click()
  await expect(newPost.getByRole('button', { name: '1 comments' })).toBeVisible()
  await page.getByRole('button', { name: 'Leaderboard' }).click()
  await expect(page.getByText('Demo Member', { exact: true })).toBeVisible()
  await expect(page.getByText('4 pts')).toBeVisible()
  const leaderboardRows = await page.evaluate(() => Array.from(document.querySelectorAll('.leaderboard-grid .leaderboard-list > div:first-child')).map((row) => {
    const rank = row.querySelector('.rank-medal')?.getBoundingClientRect()
    const avatar = row.querySelector('.leaderboard-avatar')?.getBoundingClientRect()
    const name = row.querySelector('strong')?.getBoundingClientRect()
    return {
      hasAvatar: Boolean(avatar),
      rankBeforeAvatar: rank && avatar ? rank.right <= avatar.left : false,
      avatarBeforeName: avatar && name ? avatar.right <= name.left : false,
    }
  }))
  expect(leaderboardRows).toHaveLength(3)
  expect(leaderboardRows).toEqual(leaderboardRows.map(() => ({
    hasAvatar: true,
    rankBeforeAvatar: true,
    avatarBeforeName: true,
  })))
  await expectNoHorizontalOverflow(page)
})

test('community and members keep group introduction on the left', async ({ page }) => {
  await createLocalMember(page)
  await expect(page.getByRole('heading', { name: '討論、公告與會員回饋' })).toBeVisible()
  await expectGroupAsideOnLeft(page)

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Members', exact: true }).click()
  const memberFilters = page.locator('.member-filter-row')
  const memberList = page.locator('.member-list')
  await expect(page.getByText('Members 6')).toBeVisible()
  await expect(memberList).toContainText('yuna@skillsschool.test')
  await memberFilters.getByRole('button', { name: 'Admins 1' }).click()
  await expect(memberFilters.getByRole('button', { name: 'Admins 1' })).toHaveClass(/active/)
  await expect(memberList).toContainText('owner@skillsschool.test')
  await expect(memberList).not.toContainText('yuna@skillsschool.test')
  await memberFilters.getByRole('button', { name: 'Online 2' }).click()
  await expect(memberFilters.getByRole('button', { name: 'Online 2' })).toHaveClass(/active/)
  await expect(memberList).toContainText('you@example.test')
  await expect(memberList).toContainText('owner@skillsschool.test')
  await expect(memberList).not.toContainText('billing@skillsschool.test')
  await memberFilters.getByRole('button', { name: 'Members 6' }).click()
  await expect(memberList).toContainText('yuna@skillsschool.test')
  await expectGroupAsideOnLeft(page)
  await expectNoHorizontalOverflow(page)
})

test('classroom shows all access states without card attachment blocks', async ({ page }) => {
  await createLocalMember(page)
  await page.getByRole('button', { name: 'Classroom' }).click()

  for (const label of ['Open', 'Level unlock', 'Buy now', 'Time unlock', 'Private']) {
    await expect(page.getByText(label).first()).toBeVisible()
  }
  await expectInsetCardMedia(page, '.course-card', '.course-cover')
  await expect(page.locator('.course-cover span, .course-cover strong')).toHaveCount(0)
  await expect(page.locator('.course-card .progress-track')).toHaveCount(0)
  await expect(page.locator('.course-card .lesson-list')).toHaveCount(0)
  await expect(page.locator('.course-grid')).not.toContainText('定義可重複的 AI 任務')
  await expect(page.locator('.course-grid')).not.toContainText('AI 任務定義表')
  await expect(page.locator('.course-grid')).not.toContainText('Skill 選題範例庫')
  await expect(page.locator('.course-grid')).not.toContainText('AI Skill SOP 模板')
  const courseCoverBox = await page.locator('.course-cover').first().boundingBox()
  expect(courseCoverBox).not.toBeNull()
  expect(Math.abs((courseCoverBox!.width / courseCoverBox!.height) - (1200 / 630))).toBeLessThan(0.03)

  await page.locator('.course-card').filter({ hasText: '進階工作流案例庫' }).click()
  const lockDialog = page.getByRole('dialog', { name: '課程無法查看原因' })
  await expect(lockDialog).toBeVisible()
  await expect(lockDialog).toContainText('需要 Level 3')
  await expect(lockDialog).toContainText('你目前是 Level 1')
  await page.getByRole('button', { name: '知道了' }).click()
  await expect(lockDialog).toBeHidden()

  await page.locator('.course-card').filter({ hasText: 'Private Beta' }).click()
  await expect(lockDialog).toBeVisible()
  await expect(lockDialog).toContainText('需要管理員手動授權')
  await page.getByLabel('關閉課程鎖定說明').click()
  await expect(lockDialog).toBeHidden()

  await page.locator('.course-card.clickable').first().click()
  await expect(page.locator('.course-detail-layout')).toBeVisible()
  await expect(page.locator('.course-outline')).toContainText('AI Skill 基礎到實戰')
  await expect(page.locator('.course-reader')).toContainText('定義可重複的 AI 任務')
  await expect(page.locator('.course-reader .course-body')).not.toContainText('AI 任務定義表')
  await expect(page.locator('.course-reader')).not.toContainText('Yuna')
  await expect(page.locator('.course-post-preview')).toHaveCount(0)
  await expect(page.locator('.course-reader > .course-attachments')).toHaveCount(0)
  await expect(page.getByLabel('Lesson attachments')).toContainText('AI 任務定義表')
  await expect(page.getByLabel('Lesson attachments')).toContainText('Skill 選題範例庫')
  const firstAttachment = page.getByLabel('Lesson attachments').getByRole('link', { name: 'AI 任務定義表' })
  await expect(firstAttachment).toHaveAttribute('download', 'AI 任務定義表.txt')
  await expect(firstAttachment).toHaveAttribute('href', /^data:text\/plain;charset=utf-8,/)
  await expect(firstAttachment.locator('svg')).toHaveCount(2)
  const downloadPromise = page.waitForEvent('download')
  await firstAttachment.click()
  const attachmentDownload = await downloadPromise
  expect(attachmentDownload.suggestedFilename()).toBe('AI 任務定義表.txt')
  const attachmentLayout = await page.locator('.course-reader-stack').evaluate((element) => {
    const reader = element.querySelector('.course-reader')?.getBoundingClientRect()
    const attachments = element.querySelector('.course-attachments')?.getBoundingClientRect()
    return Boolean(reader && attachments && attachments.top > reader.bottom)
  })
  expect(attachmentLayout).toBe(true)
  await page.locator('.course-complete-toggle').click()
  await expect(page.locator('.course-complete-toggle')).toHaveClass(/complete/)
  await page.getByRole('button', { name: 'Back to Classroom' }).click()
  await expect(page.locator('.course-grid')).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('admin can edit community, classroom, calendar, pricing, and plugins', async ({ page }) => {
  await page.waitForFunction(() => window.localStorage.getItem('memberhub-demo-state-v1') !== null)
  await page.evaluate(() => {
    const key = 'memberhub-demo-state-v1'
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    state.plugins = [
      ...(state.plugins ?? []),
      { id: 'webhook', name: 'Webhook', enabled: true, description: 'legacy' },
      { id: 'zapier', name: 'Zapier Invite', enabled: true, description: 'legacy' },
      { id: 'cancellation-video', name: 'Cancellation Video', enabled: true, description: 'legacy' },
      { id: 'google-ads', name: 'Google Ads', enabled: true, description: 'legacy' },
      { id: 'affiliates', name: 'Member Affiliates', enabled: true, description: 'legacy' },
      { id: 'links', name: 'Links', enabled: true, description: 'legacy' },
    ]
    window.localStorage.setItem(key, JSON.stringify(state))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await createLocalAdmin(page)
  await expect(page.getByText('社群管理後台已開啟')).toBeVisible()

  const adminQuickActions = [
    { view: 'About', action: 'Edit about', tab: 'General' },
    { view: 'Community', action: 'Edit categories', tab: 'Community' },
    { view: 'Classroom', action: 'Manage classroom', tab: 'Classroom' },
    { view: 'Calendar', action: 'Manage events', tab: 'Calendar' },
    { view: 'Members', action: 'Manage members', tab: 'Members' },
    { view: 'Leaderboard', action: 'Edit roles', tab: 'Members' },
  ]
  for (const item of adminQuickActions) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: item.view, exact: true }).click()
    await page.getByRole('button', { name: item.action, exact: true }).click()
    await expect(page.getByRole('navigation', { name: 'Admin tabs' }).getByRole('button', { name: item.tab, exact: true })).toHaveClass(/active/)
  }

  await page.getByRole('button', { name: 'Admin' }).click()
  const adminTabs = page.getByLabel('Admin tabs')
  await expectAdminSpacing(page)

  await adminTabs.getByRole('button', { name: 'General' }).click()
  await page.getByLabel('Group name').fill('Updated Skills School')
  await expect(page.getByLabel('Cover image URL')).toHaveCount(0)
  const coverUploadInput = page.getByLabel('Cover image upload')
  const coverUploadMetrics = await coverUploadInput.evaluate((input) => {
    const style = window.getComputedStyle(input)
    return {
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      height: Math.round(input.getBoundingClientRect().height),
    }
  })
  expect(coverUploadMetrics.paddingTop).toBe('8px')
  expect(coverUploadMetrics.paddingBottom).toBe('8px')
  expect(coverUploadMetrics.height).toBeGreaterThanOrEqual(48)
  await page.getByLabel('Cover image upload').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'),
  })
  await expect(page.locator('.admin-preview-card')).toContainText('Updated Skills School')
  await expect(page.locator('.admin-preview-card .cover-box')).toHaveCSS('background-image', /data:image\/png/)

  await adminTabs.getByRole('button', { name: 'Access' }).click()
  await page.getByLabel('Unlock posting at Level').fill('2')
  await page.getByLabel('Unlock chat at Level').fill('3')
  await page.locator('.switch-row').filter({ hasText: 'Instant membership approval' }).getByRole('checkbox').check()
  const questionsPanel = page.locator('article').filter({ hasText: 'Questions before joining' })
  await expect(questionsPanel.getByRole('button', { name: 'Manage questions' })).toBeVisible()
  await questionsPanel.getByRole('button', { name: 'Manage questions' }).click()
  const questionsDialog = page.getByRole('dialog', { name: '管理審核問題' })
  await expect(questionsDialog).toBeVisible()
  await expect(questionsDialog.locator('.form-row')).toHaveCount(0)
  await expect(questionsDialog.getByRole('button', { name: 'Add' })).toBeDisabled()
  await questionsDialog.getByRole('button', { name: 'Delete question 1' }).click()
  const deleteQuestionDialog = page.getByRole('dialog', { name: '確認刪除審核問題' })
  await expect(deleteQuestionDialog).toBeVisible()
  await expect(questionsDialog.getByText('你現在最想把哪一個工作流程做成 AI Skill？')).toBeVisible()
  await deleteQuestionDialog.getByRole('button', { name: 'Delete' }).click()
  await expect(deleteQuestionDialog).toBeHidden()
  await questionsDialog.getByRole('button', { name: 'Add' }).click()
  const addQuestionDialog = page.getByRole('dialog', { name: '新增審核問題' })
  await expect(addQuestionDialog).toBeVisible()
  await addQuestionDialog.getByLabel('Membership question').fill('What outcome do you want from this community?')
  await addQuestionDialog.getByRole('button', { name: 'Save' }).click()
  await expect(addQuestionDialog).toBeHidden()
  await expect(page.getByText('What outcome do you want from this community?')).toBeVisible()
  await questionsDialog.getByRole('button', { name: 'Edit question 1' }).click()
  const editQuestionDialog = page.getByRole('dialog', { name: '編輯審核問題' })
  await editQuestionDialog.getByLabel('Membership question').fill('Updated screening question?')
  await editQuestionDialog.getByRole('button', { name: 'Save' }).click()
  await expect(editQuestionDialog).toBeHidden()
  await expect(page.getByText('Updated screening question?')).toBeVisible()
  const firstQuestionActions = questionsDialog.locator('.membership-question-list p').first()
  await expect(firstQuestionActions.getByRole('button', { name: 'Edit question 1' })).toBeVisible()
  await expect(firstQuestionActions.getByRole('button', { name: 'Delete question 1' })).toBeVisible()
  await expect(page.locator('.membership-question-list strong').first()).toHaveCSS('font-weight', '500')
  await questionsDialog.getByLabel('關閉審核問題管理').click()
  await expect(questionsDialog).toBeHidden()
  if (page.viewportSize()!.width > 980) {
    const overviewBox = await page.locator('.access-overview-card').boundingBox()
    const joinAccessBox = await page.locator('article').filter({ hasText: '加入規則' }).boundingBox()
    const questionsBox = await page.locator('article').filter({ hasText: 'Questions before joining' }).boundingBox()
    const reviewBox = await page.locator('article').filter({ hasText: 'Review queue' }).boundingBox()
    expect(overviewBox).not.toBeNull()
    expect(joinAccessBox).not.toBeNull()
    expect(questionsBox).not.toBeNull()
    expect(reviewBox).not.toBeNull()
    expect(joinAccessBox!.y).toBeGreaterThan(overviewBox!.y)
    expect(Math.round(questionsBox!.y)).toBe(Math.round(joinAccessBox!.y))
    expect(Math.round(reviewBox!.y)).toBe(Math.round(joinAccessBox!.y))
    expect(Math.abs(Math.round(questionsBox!.height) - Math.round(joinAccessBox!.height))).toBeLessThanOrEqual(1)
    expect(Math.abs(Math.round(reviewBox!.height) - Math.round(joinAccessBox!.height))).toBeLessThanOrEqual(1)
  }
  await expect(page.locator('.access-step-grid')).toContainText('免費會員直接通過')
  await expect(page.locator('.access-step-grid')).toContainText('3/3 questions')
  await expect(page.getByRole('heading', { name: 'Level thresholds and gates' })).toBeVisible()
  await page.getByLabel('Level 2 points').fill('8')
  await expect(page.getByLabel('Level 2 points')).toHaveValue('8')
  await page.getByRole('button', { name: 'Manage level benefits and gates' }).click()
  const levelDialog = page.getByRole('dialog', { name: 'Level benefits and gates' })
  await expect(levelDialog).toBeVisible()
  await expect(levelDialog).toContainText('下方項目會連動 Classroom 課程與 Calendar 活動')
  await expect(levelDialog.locator('.level-gate-row').filter({ hasText: 'Unlock posting' })).toHaveCount(0)
  await expect(levelDialog.locator('.level-gate-row').filter({ hasText: 'Unlock chat' })).toHaveCount(0)
  const courseGateRow = levelDialog.locator('.level-gate-row').filter({ hasText: 'Course: AI Skill 基礎到實戰' })
  await expect(courseGateRow.locator('.level-gate-check input')).toHaveCount(9)
  if (page.viewportSize()!.width > 980) {
    const courseGateLayout = await courseGateRow.evaluate((row) => {
      const label = row.querySelector('strong')?.getBoundingClientRect()
      const check = row.querySelector('input')?.getBoundingClientRect()
      return label && check ? Math.abs((label.top + label.height / 2) - (check.top + check.height / 2)) : 99
    })
    expect(courseGateLayout).toBeLessThanOrEqual(4)
  }
  await levelDialog.getByLabel('Level 3 benefits').fill('進階模板下載\n案例回饋資格')
  await expect(levelDialog.getByLabel('Level 3 benefits')).toHaveValue('進階模板下載\n案例回饋資格')
  await levelDialog.getByLabel('Level 4 unlock event Office hour：AI Skill 導入問答').check()
  await expect(levelDialog.getByLabel('Level 4 unlock event Office hour：AI Skill 導入問答')).toBeChecked()
  await levelDialog.getByLabel('關閉等級福利設定').click()
  await expect(levelDialog).toBeHidden()
  await page.getByLabel('發文 points').fill('3')
  await expect(page.getByLabel('發文 points')).toHaveValue('3')
  await page.getByLabel('留言 points').fill('2')
  await expect(page.getByLabel('留言 points')).toHaveValue('2')
  await page.getByLabel('按讚 points').fill('1')
  await expect(page.getByLabel('按讚 points')).toHaveValue('1')
  await expect(adminTabs.getByRole('button', { name: 'Roles' })).toHaveCount(0)
  await adminTabs.getByRole('button', { name: 'Members' }).click()
  await expect(page.getByLabel('Mika role')).toHaveCount(0)
  const mikaRow = page.locator('.member-admin-row').filter({ hasText: 'Mika' })
  await mikaRow.getByRole('button', { name: 'Edit' }).click()
  const editMikaDialog = page.getByRole('dialog', { name: '編輯會員' })
  await editMikaDialog.getByLabel('Mika role').selectOption('moderator')
  await expect(editMikaDialog.getByLabel('Mika role')).toHaveValue('moderator')
  await editMikaDialog.getByLabel('Mika points').fill('70')
  await expect(editMikaDialog.getByLabel('Mika computed level')).toHaveValue('Level 4')
  await editMikaDialog.getByRole('button', { name: 'Done' }).click()
  await expect(editMikaDialog).toBeHidden()

  await adminTabs.getByRole('button', { name: 'Community' }).click()
  await expect(adminTabs.getByRole('button', { name: 'Community' })).toHaveClass(/active/)
  await expect(page.locator('.rule-list strong').first()).toHaveCSS('font-weight', '500')
  await expect(page.getByText('Questions before joining')).toHaveCount(0)
  const categoriesPanel = page.locator('article').filter({ hasText: 'Community categories' })
  await expect(categoriesPanel.locator('.form-row')).toHaveCount(0)
  await expect(categoriesPanel.getByRole('button', { name: 'Add' })).toBeVisible()
  const categoryLayout = await categoriesPanel.locator('.category-editor-list').evaluate((list) => {
    const style = window.getComputedStyle(list)
    return {
      columns: style.gridTemplateColumns.split(' ').filter(Boolean).length,
      gap: Number.parseFloat(style.gap) || 0,
    }
  })
  expect(categoryLayout).toEqual({ columns: page.viewportSize()!.width > 900 ? 2 : 1, gap: 12 })
  await categoriesPanel.getByLabel('Announcements permission').selectOption('members')
  await expect(page.getByLabel('Announcements permission')).toHaveValue('members')
  await categoriesPanel.getByRole('button', { name: 'Add' }).click()
  const addCategoryDialog = page.getByRole('dialog', { name: '新增社群分類' })
  await expect(addCategoryDialog).toBeVisible()
  await addCategoryDialog.getByLabel('Category name').fill('Showcase')
  await addCategoryDialog.getByRole('button', { name: 'Save' }).click()
  await expect(addCategoryDialog).toBeHidden()
  await expect(page.getByText('Showcase')).toBeVisible()
  const rulesPanel = page.locator('article').filter({ hasText: 'Group rules' })
  await expect(rulesPanel.locator('.form-row')).toHaveCount(0)
  await expect(rulesPanel.getByRole('button', { name: 'Add' })).toBeVisible()
  await rulesPanel.getByRole('button', { name: 'Add' }).click()
  const addRuleDialog = page.getByRole('dialog', { name: '新增社群規範' })
  await addRuleDialog.getByLabel('Group rule').fill('Use clear titles for feedback requests.')
  await addRuleDialog.getByRole('button', { name: 'Save' }).click()
  await expect(addRuleDialog).toBeHidden()
  await expect(rulesPanel.getByText('Use clear titles for feedback requests.')).toBeVisible()
  const addedRule = rulesPanel.locator('.rule-list p').filter({ hasText: 'Use clear titles for feedback requests.' })
  await addedRule.locator('button[aria-label^="Edit rule"]').click()
  const editRuleDialog = page.getByRole('dialog', { name: '編輯社群規範' })
  await editRuleDialog.getByLabel('Group rule').fill('Use clear titles for feedback requests before posting.')
  await editRuleDialog.getByRole('button', { name: 'Save' }).click()
  await expect(editRuleDialog).toBeHidden()
  const editedRule = rulesPanel.locator('.rule-list p').filter({ hasText: 'Use clear titles for feedback requests before posting.' })
  await expect(editedRule.locator('button[aria-label^="Edit rule"]')).toBeVisible()
  await expect(editedRule.locator('button[aria-label^="Delete rule"]')).toBeVisible()
  await editedRule.locator('button[aria-label^="Delete rule"]').click()
  const deleteRuleDialog = page.getByRole('dialog', { name: '確認刪除社群規範' })
  await expect(deleteRuleDialog).toBeVisible()
  await expect(editedRule).toBeVisible()
  await deleteRuleDialog.getByRole('button', { name: 'Delete' }).click()
  await expect(deleteRuleDialog).toBeHidden()
  await expect(rulesPanel.getByText('Use clear titles for feedback requests before posting.')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Post moderation' })).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Community', exact: true }).click()
  const feedbackPost = page.locator('.post-card').filter({ hasText: 'Yuna' })
  await feedbackPost.getByRole('button', { name: 'Pin' }).click()
  await expect(feedbackPost.getByRole('button', { name: 'Unpin' })).toBeVisible()
  await expect(feedbackPost.locator('.post-admin-actions')).not.toContainText('Unpin')
  await expect(feedbackPost.locator('.post-admin-actions')).not.toContainText('Clear comments')
  await expect(feedbackPost.locator('.post-admin-actions')).not.toContainText('Delete post')
  await feedbackPost.getByRole('button', { name: 'Clear comments' }).click()
  const clearCommentsDialog = page.getByRole('dialog', { name: '確認清除留言' })
  await expect(clearCommentsDialog).toBeVisible()
  await clearCommentsDialog.getByRole('button', { name: 'Clear comments' }).click()
  await expect(feedbackPost.getByRole('button', { name: '0 comments' })).toBeVisible()
  await page.getByLabel('Create community post').fill('Moderation delete check')
  await page.locator('.composer').getByRole('button', { name: 'Post', exact: true }).click()
  const deleteCheckPost = page.locator('.post-card').filter({ hasText: 'Moderation delete check' })
  await expect(deleteCheckPost).toBeVisible()
  await deleteCheckPost.getByRole('button', { name: 'Delete post' }).click()
  const deletePostDialog = page.getByRole('dialog', { name: '確認刪除貼文' })
  await expect(deletePostDialog).toBeVisible()
  await deletePostDialog.getByRole('button', { name: 'Delete post' }).click()
  await expect(page.locator('.post-card').filter({ hasText: 'Moderation delete check' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Admin' }).click()
  await adminTabs.getByRole('button', { name: 'Classroom' }).click()
  await expect(page.getByRole('heading', { name: 'Add classroom course' })).toHaveCount(0)
  const coursesPanel = page.locator('article').filter({ hasText: 'Courses' }).first()
  await expect(coursesPanel.getByRole('button', { name: 'Add classroom course' })).toBeVisible()
  const courseRow = page.locator('.course-access-row').filter({ hasText: '進階工作流案例庫' })
  await expect(courseRow.getByRole('button', { name: 'Edit' })).toBeVisible()
  const courseSummaryLayout = await courseRow.evaluate((row) => {
    const title = row.querySelector('.course-summary strong')?.getBoundingClientRect()
    const meta = row.querySelector('.course-summary small')?.getBoundingClientRect()
    return title && meta ? { metaBelowTitle: meta.top >= title.bottom, sameLeft: Math.abs(meta.left - title.left) <= 1 } : null
  })
  expect(courseSummaryLayout).toEqual({ metaBelowTitle: true, sameLeft: true })
  await expect(page.getByLabel('進階工作流案例庫 level')).toHaveCount(0)
  await courseRow.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByText('Course settings')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Course content' })).toBeVisible()
  await page.getByLabel('Edit course title').fill('進階工作流案例庫 Pro')
  await page.getByLabel('Edit course description').fill('會員拆解真實流程並整理可複製模板。')
  await page.getByLabel('Edit course level').fill('4')
  await expect(page.getByLabel('Edit course level')).toHaveValue('4')
  const firstLessonRow = page.locator('.lesson-item-row').filter({ hasText: '多步驟研究工作流' }).first()
  await expect(firstLessonRow.getByRole('button', { name: 'Edit' })).toBeVisible()
  await firstLessonRow.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByText('Lesson editor')).toBeVisible()
  const lessonEditorLayout = await page.locator('.lesson-editor-page').evaluate((element) => {
    const editor = element.querySelector('.lesson-content-editor')?.getBoundingClientRect()
    const sidebar = element.querySelector('.lesson-settings-sidebar')?.getBoundingClientRect()
    if (!editor || !sidebar) return null
    return {
      sideBySide: window.innerWidth > 900 ? editor.right <= sidebar.left : sidebar.top >= editor.bottom,
      editorWidthOk: window.innerWidth > 900 ? editor.width > sidebar.width : Math.abs(editor.width - sidebar.width) <= 1,
    }
  })
  expect(lessonEditorLayout).toEqual({ sideBySide: true, editorWidthOk: true })
  await page.getByLabel('Lesson title').fill('多步驟研究工作流 Pro')
  await page.getByLabel('Lesson minutes').fill('45')
  await page.getByLabel('Lesson body').fill('把搜尋、篩選、摘要、評分和輸出包成一個可檢查流程，並加上交付規格。')
  page.once('dialog', async (dialog) => {
    await dialog.accept('https://example.test/lesson-cover.png')
  })
  await page.getByRole('button', { name: '圖片' }).click()
  await expect(page.locator('.rich-text-editable img')).toHaveAttribute('src', 'https://example.test/lesson-cover.png')
  await page.getByLabel('Lesson transcript').fill('逐字稿：先定義輸入，再定義輸出檢查。')
  await page.getByLabel('Lesson resources').fill('研究流程評分表\n案例輸出模板')
  await page.getByLabel('Lesson attachments').setInputFiles({
    name: 'workflow-template.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 workflow template'),
  })
  await expect(page.getByLabel('Lesson resources')).toHaveValue(/workflow-template\.pdf/)
  await page.getByRole('button', { name: 'Back to Course content' }).click()
  await page.getByRole('button', { name: 'Add lesson' }).click()
  await expect(page.getByText('Lesson editor')).toBeVisible()
  await page.getByLabel('Lesson title').fill('案例拆解作業')
  await page.getByLabel('Lesson body').fill('請上傳自己的流程案例，並依照模板拆成三個步驟。')
  await page.getByRole('button', { name: 'Back to Course content' }).click()
  await expect(page.locator('.lesson-item-row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Back to courses' }).click()
  await expect(page.getByText('Course settings')).toHaveCount(0)
  await expect(page.locator('.course-access-row').filter({ hasText: '進階工作流案例庫 Pro' })).toBeVisible()
  await coursesPanel.getByRole('button', { name: 'Add classroom course' }).click()
  await expect(page.getByRole('heading', { name: 'Course content' }).first()).toBeVisible()
  await page.getByLabel('Edit course title').fill('Workflow Review Lab')
  await page.getByLabel('Edit course access').selectOption('buy-now')
  await expect(page.getByLabel('Edit course access')).toHaveCSS('padding-left', '11px')
  await expect(page.getByLabel('Edit course access')).toHaveCSS('padding-right', '38px')
  const selectArrowStyle = await page.getByLabel('Edit course access').evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { appearance: style.appearance, backgroundPositionX: style.backgroundPositionX, backgroundSize: style.backgroundSize }
  })
  expect(selectArrowStyle).toEqual({ appearance: 'none', backgroundPositionX: 'calc(100% - 11px)', backgroundSize: '16px 16px' })
  await page.getByRole('button', { name: 'Back to courses' }).click()
  await expect(page.getByText('Workflow Review Lab')).toBeVisible()

  await adminTabs.getByRole('button', { name: 'Calendar' }).click()
  await expect(page.getByRole('heading', { name: 'Add event' })).toHaveCount(0)
  const eventAccessPanel = page.locator('article').filter({ hasText: 'Event access' }).first()
  await expect(eventAccessPanel.getByRole('button', { name: 'Add event' })).toBeVisible()
  const officeEventRow = page.locator('.event-access-row').filter({ hasText: 'Office hour：AI Skill 導入問答' })
  await officeEventRow.getByLabel('Office hour：AI Skill 導入問答 level').fill('3')
  await expect(officeEventRow.getByLabel('Office hour：AI Skill 導入問答 level')).toHaveValue('3')
  await expect(officeEventRow.locator('.event-access-summary small')).toContainText('2026-07-02 · 21:00 · Level 3+')
  await expect(officeEventRow.getByRole('button', { name: 'Edit' })).toBeVisible()
  await expect(officeEventRow.getByRole('button', { name: 'Delete' })).toBeVisible()
  await eventAccessPanel.getByRole('button', { name: 'Add event' }).click()
  const addEventDialog = page.getByRole('dialog', { name: '新增活動' })
  await expect(addEventDialog).toBeVisible()
  await expect(addEventDialog).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await addEventDialog.getByLabel('Title').fill('Member teardown night')
  await addEventDialog.getByLabel('Event access').selectOption('course')
  await addEventDialog.getByLabel('Required course').selectOption('course-1')
  await addEventDialog.getByRole('button', { name: 'Save event' }).click()
  await expect(addEventDialog).toBeHidden()
  await page.getByRole('button', { name: 'Calendar' }).first().click()
  await expect(page.getByText('Member teardown night')).toBeVisible()

  await page.getByRole('button', { name: 'Admin' }).click()
  await adminTabs.getByRole('button', { name: 'Calendar' }).click()
  const teardownEventRow = page.locator('.event-access-row').filter({ hasText: 'Member teardown night' })
  await teardownEventRow.getByRole('button', { name: 'Edit' }).click()
  const editEventDialog = page.getByRole('dialog', { name: '編輯活動' })
  await expect(editEventDialog).toBeVisible()
  await editEventDialog.getByLabel('Title').fill('Member teardown review')
  await editEventDialog.getByRole('button', { name: 'Save event' }).click()
  await expect(editEventDialog).toBeHidden()
  const editedEventRow = page.locator('.event-access-row').filter({ hasText: 'Member teardown review' })
  await expect(editedEventRow).toBeVisible()
  await editedEventRow.getByRole('button', { name: 'Delete' }).click()
  const deleteEventDialog = page.getByRole('dialog', { name: '確認刪除活動' })
  await expect(deleteEventDialog).toContainText('Member teardown review')
  await deleteEventDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(deleteEventDialog).toBeHidden()
  await expect(editedEventRow).toBeVisible()
  await editedEventRow.getByRole('button', { name: 'Delete' }).click()
  await deleteEventDialog.getByRole('button', { name: 'Delete' }).click()
  await expect(page.locator('.event-access-row').filter({ hasText: 'Member teardown review' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Admin' }).click()
  await adminTabs.getByRole('button', { name: 'General' }).click()
  const linksPanel = page.locator('article').filter({ hasText: '社群資訊卡連結' })
  await expect(linksPanel.locator('.form-row')).toHaveCount(0)
  await linksPanel.getByRole('button', { name: 'Add' }).click()
  const addLinkDialog = page.getByRole('dialog', { name: '新增社群資訊卡連結' })
  await expect(addLinkDialog).toBeVisible()
  await addLinkDialog.getByLabel('Link label').fill('Docs')
  await addLinkDialog.getByLabel('Link URL').fill('https://example.com/docs')
  await addLinkDialog.getByLabel('Link visibility').selectOption('members')
  await addLinkDialog.getByRole('button', { name: 'Add' }).click()
  await expect(addLinkDialog).toBeHidden()
  await page.getByLabel('External link 1 label').fill('Guides')
  await expect(page.getByLabel('External link 1 label')).toHaveValue('Guides')

  await adminTabs.getByRole('button', { name: 'Pricing' }).click()
  await expect(page.getByText('Pricing mode')).toHaveCount(0)
  await expect(page.getByLabel('Mode')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '訂閱金額設定' })).toHaveCount(0)
  await expect(page.getByLabel('Pro 社群 price')).toHaveCount(0)
  await expect(page.getByText('AI 串接提示詞')).toBeVisible()
  await expect(page.getByRole('heading', { name: '方案設定' })).toBeVisible()
  await expect(page.locator('.compact-list')).toContainText('Pro 社群')

  await adminTabs.getByRole('button', { name: 'Members' }).click()
  const memberOperationsPanel = page.locator('article').filter({ hasText: 'Member operations' })
  await expect(memberOperationsPanel).toBeVisible()
  await expect(page.getByText('匯入會員')).toHaveCount(0)
  await expect(page.getByText('加入申請審核')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Invite member' })).toHaveCount(0)
  await expect(page.getByText('Invite and import')).toHaveCount(0)
  await expect(memberOperationsPanel.getByRole('button', { name: '匯入 .CSV 名單' })).toBeVisible()
  await memberOperationsPanel.getByRole('button', { name: 'Add' }).click()
  const addMemberDialog = page.getByRole('dialog', { name: '新增會員' })
  await addMemberDialog.getByLabel('Member name').fill('Manual Member')
  await addMemberDialog.getByLabel('Member email').fill('manual@example.test')
  await addMemberDialog.getByLabel('Member role').selectOption('moderator')
  await addMemberDialog.getByLabel('Member plan').selectOption('monthly')
  await addMemberDialog.getByRole('button', { name: 'Add member' }).click()
  await expect(addMemberDialog).toBeHidden()
  const manualMemberRow = page.locator('.member-admin-row').filter({ hasText: 'Manual Member' })
  await expect(manualMemberRow).toContainText('moderator')
  await page.getByRole('button', { name: '查看 Manual Member 入社群問題記錄' }).click()
  const memberRecordDialog = page.getByRole('dialog', { name: '會員入社群問題記錄' })
  await expect(memberRecordDialog).toContainText('Manual Member')
  await expect(memberRecordDialog).toContainText('無申請記錄')
  await expect(memberRecordDialog).toContainText('這位會員沒有入社群問題記錄。')
  await page.getByLabel('關閉會員記錄').click()
  await expect(page.getByLabel('Yuna course access')).toHaveCount(0)
  const yunaRow = page.locator('.member-admin-row').filter({ hasText: 'Yuna' })
  await yunaRow.getByRole('button', { name: 'Edit' }).click()
  const editYunaDialog = page.getByRole('dialog', { name: '編輯會員' })
  await editYunaDialog.getByLabel('Yuna Private Beta access').check()
  await expect(yunaRow).toContainText('Private Beta')
  await editYunaDialog.getByLabel('Yuna Private Beta access').uncheck()
  await expect(yunaRow).not.toContainText('Private Beta')
  await editYunaDialog.getByRole('button', { name: 'Done' }).click()

  await adminTabs.getByRole('button', { name: 'Plugins' }).click()
  await expect(page.getByText('AutoDM')).toBeVisible()
  await expect(page.locator('.plugin-card').filter({ hasText: 'Webhook' })).toHaveCount(0)
  await expect(page.locator('.plugin-card').filter({ hasText: 'Zapier Invite' })).toHaveCount(0)
  await expect(page.locator('.plugin-card').filter({ hasText: 'Cancellation Video' })).toHaveCount(0)
  await expect(page.locator('.plugin-card').filter({ hasText: 'Google Ads' })).toHaveCount(0)
  await expect(page.locator('.plugin-card').filter({ hasText: 'Member Affiliates' })).toHaveCount(0)
  await expect(page.locator('.plugin-card').filter({ hasText: 'Links' })).toHaveCount(0)
  await expect(page.getByLabel('Affiliate commission')).toHaveCount(0)
  const pluginSwitch = await page.locator('.plugin-card .switch').first().evaluate((switchElement) => {
    const input = switchElement.querySelector('input')
    const label = switchElement.querySelector('span')
    const inputRect = input?.getBoundingClientRect()
    const labelRect = label?.getBoundingClientRect()
    const style = window.getComputedStyle(switchElement)
    return inputRect && labelRect ? {
      display: style.display,
      whiteSpace: style.whiteSpace,
      centerDiff: Math.abs((inputRect.top + inputRect.height / 2) - (labelRect.top + labelRect.height / 2)),
      sameLine: inputRect.right < labelRect.left,
    } : null
  })
  expect(pluginSwitch).toEqual(expect.objectContaining({ display: 'flex', whiteSpace: 'nowrap', sameLine: true }))
  expect(pluginSwitch?.centerDiff).toBeLessThanOrEqual(2)
  for (const label of ['Dashboard', 'General', 'Access', 'Community', 'Classroom', 'Calendar', 'Members', 'Pricing', 'Plugins']) {
    await adminTabs.getByRole('button', { name: label }).click()
    await expectAdminContentFits(page)
    await expectInteractiveSpacing(page)
  }
  await expectNoHorizontalOverflow(page)
})

test('responsive layouts have no horizontal overflow', async ({ page }) => {
  await createLocalMember(page)
  await seedCalendarActionEvents(page)
  for (const label of ['Community', 'Classroom', 'Calendar', 'About']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: label, exact: true }).click()
    if (label === 'Calendar') {
      await expectCalendarEventLayout(page)
      await expectCalendarEventModal(page)
    }
    await expectNoHorizontalOverflow(page)
    await expectInteractiveSpacing(page)
    await expectMinimumVisibleFontSize(page)
  }
})

async function createLocalAdmin(page: Page) {
  await page.getByRole('button', { name: '登入社群' }).click()
  const dialog = page.getByRole('dialog', { name: '登入社群' })
  await expect(dialog).toBeVisible()
  await expect(page).not.toHaveURL(/view=login/)
  await expect(dialog.getByLabel('Email', { exact: true })).toHaveValue('')
  await expect(dialog.getByLabel('Password', { exact: true })).toHaveValue('')
  await dialog.getByLabel('Email', { exact: true }).fill('owner@memberhub.test')
  await dialog.getByLabel('Password', { exact: true }).fill('memberhub-admin-2026')
  await dialog.getByRole('button', { name: '登入', exact: true }).click()
  await expect(dialog).toBeHidden()
}

async function createLocalMember(page: Page) {
  await page.waitForFunction(() => window.localStorage.getItem('memberhub-demo-state-v1') !== null)
  await page.evaluate(() => {
    const key = 'memberhub-demo-state-v1'
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    state.role = 'member'
    state.selectedPlanId = 'free'
    state.currentMemberPoints = Math.max(state.currentMemberPoints ?? 0, 1)
    window.localStorage.setItem(key, JSON.stringify(state))
  })
  await page.goto('/?view=community')
}

async function seedCalendarActionEvents(page: Page) {
  await page.evaluate(() => {
    const key = 'memberhub-demo-state-v1'
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    const events = Array.isArray(state.events) ? state.events.filter((event: { id?: string }) => event.id !== 'event-future-qa' && event.id !== 'event-expired-qa') : []
    state.events = [
      {
        id: 'event-future-qa',
        title: 'Future QA event',
        date: '2099-06-27',
        time: '20:00',
        duration: '60m',
        timezone: 'Asia/Taipei',
        location: 'Zoom',
        recurrence: 'none',
        description: 'Future event for add-calendar button QA.',
      },
      {
        id: 'event-expired-qa',
        title: 'Expired QA event',
        date: '2020-01-01',
        time: '10:00',
        duration: '60m',
        timezone: 'Asia/Taipei',
        location: 'Meet',
        recurrence: 'none',
        description: 'Expired event for disabled add-calendar button QA.',
      },
      ...events,
    ]
    window.localStorage.setItem(key, JSON.stringify(state))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => Math.ceil(document.documentElement.scrollWidth - document.documentElement.clientWidth))
  expect(overflow).toBeLessThanOrEqual(1)
}

async function expectInteractiveSpacing(page: Page) {
  const issues = await page.evaluate(() => {
    const minGap = 8
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,input:not([type="hidden"]),select,textarea,a[href]'))
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
    }
    const scopeSelector = [
      '.hub-nav-row',
      '.hub-topbar-actions',
      '.admin-tabs',
      '.category-tabs',
      '.form-row',
      '.two-col',
      '.button-stack',
      '.about-actions',
      '.admin-front-actions',
      '.mini-action-row',
      '.member-filter-row',
      '.post-actions',
      '.calendar-provider-list',
      '.settings-form',
      '.admin-view article',
      '[role="dialog"]',
    ].join(',')
    const controls = candidates
      .filter((element) => visible(element) && !element.matches('.avatar-upload-control input'))
      .filter((element) => !candidates.some((other) => other !== element && other.contains(element) && visible(other)))
      .map((element) => ({ element, scope: element.closest(scopeSelector) }))
      .filter((item) => item.scope)
    const describe = (element: HTMLElement) => `${element.tagName.toLowerCase()} ${element.getAttribute('aria-label') || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || element.getAttribute('placeholder') || ''}`.trim()
    const spacingIssues: Array<{ a: string; b: string; hGap: number; vGap: number; overlap: boolean }> = []
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        if (controls[i].scope !== controls[j].scope) continue
        const first = controls[i].element
        const second = controls[j].element
        if (first.contains(second) || second.contains(first)) continue
        const firstRect = first.getBoundingClientRect()
        const secondRect = second.getBoundingClientRect()
        const horizontalOverlap = Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left)
        const verticalOverlap = Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top)
        const hGap = Math.max(secondRect.left - firstRect.right, firstRect.left - secondRect.right)
        const vGap = Math.max(secondRect.top - firstRect.bottom, firstRect.top - secondRect.bottom)
        const overlap = horizontalOverlap > 1 && verticalOverlap > 1
        const closeSide = verticalOverlap > 0 && hGap >= 0 && hGap < minGap
        const closeStack = horizontalOverlap > 0 && vGap >= 0 && vGap < minGap
        if (overlap || closeSide || closeStack) {
          spacingIssues.push({ a: describe(first), b: describe(second), hGap: Math.round(hGap), vGap: Math.round(vGap), overlap })
        }
      }
    }
    const labelIssues = Array.from(document.querySelectorAll<HTMLElement>('label'))
      .filter((label) => visible(label) && !label.matches('.avatar-upload-control') && label.querySelector('input,select,textarea'))
      .map((label) => {
        const style = window.getComputedStyle(label)
        return { label: label.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || label.getAttribute('aria-label') || 'label', gap: Number.parseFloat(style.rowGap || style.gap) || 0 }
      })
      .filter((item) => item.gap < minGap)
    return { spacingIssues: spacingIssues.slice(0, 20), labelIssues: labelIssues.slice(0, 20) }
  })
  expect(issues).toEqual({ spacingIssues: [], labelIssues: [] })
}

async function expectVisibleDialogsWhite(page: Page) {
  const surfaces = await page.evaluate(() => {
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    return Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="dialog"] > article'))
      .filter(visible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        return {
          className: element.className,
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
        }
      })
  })
  expect(surfaces.length).toBeGreaterThan(0)
  expect(surfaces.filter((surface) => surface.backgroundColor !== 'rgb(255, 255, 255)' || surface.backgroundImage !== 'none')).toEqual([])
}

async function expectVisibleDialogsRoundedAndPadded(page: Page) {
  const dialogs = await page.evaluate(() => {
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    return Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'))
      .filter(visible)
      .map((element) => {
        const style = window.getComputedStyle(element)
        const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(Number.parseFloat)
        return {
          className: element.className,
          borderRadius: Number.parseFloat(style.borderTopLeftRadius),
          borderStyle: style.borderTopStyle,
          padding,
        }
      })
  })
  expect(dialogs.length).toBeGreaterThan(0)
  expect(dialogs.filter((dialog) => dialog.borderRadius < 8 || dialog.borderStyle !== 'solid' || dialog.padding.some((value) => value < 18))).toEqual([])
}

async function expectMinimumVisibleFontSize(page: Page) {
  const minimum = await page.evaluate(() => {
    const sizes = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
      .filter((element) => element.textContent?.trim())
      .filter((element) => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      })
      .map((element) => Number.parseFloat(window.getComputedStyle(element).fontSize))
      .filter(Number.isFinite)
    return Math.min(...sizes)
  })
  expect(minimum).toBeGreaterThanOrEqual(13)
}

async function expectTopNavigation(page: Page) {
  const layout = await page.evaluate(() => {
    const nav = document.querySelector('[aria-label="Main navigation"]')
    const topbar = document.querySelector('.hub-topbar')
    const topbarMain = document.querySelector('.hub-topbar-main')
    const search = document.querySelector('.hub-search')
    const activeTab = nav?.querySelector('button.active')
    if (!nav || !topbar || !topbarMain || !search || !activeTab) return null
    const navRect = nav.getBoundingClientRect()
    const topbarRect = topbar.getBoundingClientRect()
    const topbarMainRect = topbarMain.getBoundingClientRect()
    const searchRect = search.getBoundingClientRect()
    const navStyle = window.getComputedStyle(nav)
    const activeTabStyle = window.getComputedStyle(activeTab)
    const activeTabRect = activeTab.getBoundingClientRect()
    const tabs = Array.from(nav.querySelectorAll('button')).map((tab) => tab.getBoundingClientRect())
    const tabsLeft = Math.min(...tabs.map((tab) => tab.left))
    const tabsRight = Math.max(...tabs.map((tab) => tab.right))
    return {
      navTop: Math.round(navRect.top),
      topbarTop: Math.round(topbarRect.top),
      topbarHeight: Math.round(topbarRect.height),
      navBottom: Math.round(navRect.bottom),
      topbarBottom: Math.round(topbarRect.bottom),
      activeTabClipPath: activeTabStyle.clipPath,
      activeTabHeight: Math.round(activeTabRect.height),
      activeTabShadow: activeTabStyle.boxShadow,
      navPaddingTop: Number.parseFloat(navStyle.paddingTop) || 0,
      navPaddingBottom: Number.parseFloat(navStyle.paddingBottom) || 0,
      isDesktopHeader: window.innerWidth > 980,
      isScrollable: nav.scrollWidth > nav.clientWidth + 1,
      searchCenterDiff: Math.abs(Math.round((searchRect.left + searchRect.right) / 2 - (topbarMainRect.left + topbarMainRect.right) / 2)),
      navCenterDiff: Math.abs(Math.round((tabsLeft + tabsRight) / 2 - (navRect.left + navRect.right) / 2)),
    }
  })

  expect(layout).not.toBeNull()
  expect(layout?.navTop).toBeGreaterThanOrEqual(layout?.topbarTop ?? 0)
  expect(layout?.navBottom).toBeLessThanOrEqual((layout?.topbarBottom ?? 0) + 2)
  expect(layout?.activeTabClipPath).toBe('none')
  expect(layout?.activeTabHeight).toBeGreaterThanOrEqual(32)
  expect(layout?.activeTabHeight).toBeLessThanOrEqual(34)
  expect(layout?.activeTabShadow).toBe('none')
  expect(layout?.navPaddingTop).toBeGreaterThanOrEqual(3)
  expect(layout?.navPaddingBottom).toBeGreaterThanOrEqual(8)
  if (layout?.isDesktopHeader) {
    expect(layout?.topbarHeight).toBeLessThanOrEqual(112)
    expect(layout?.searchCenterDiff).toBeLessThanOrEqual(2)
    if (!layout?.isScrollable) expect(layout?.navCenterDiff).toBeLessThanOrEqual(2)
  }
}

async function expectGroupAsideOnLeft(page: Page) {
  const layout = await page.evaluate(() => {
    const aside = document.querySelector('.hub-rail')
    const feed = document.querySelector('.feed-column')
    if (!aside || !feed) return null
    const asideRect = aside.getBoundingClientRect()
    const feedRect = feed.getBoundingClientRect()
    return {
      asideLeft: Math.round(asideRect.left),
      feedLeft: Math.round(feedRect.left),
      isSingleColumn: Math.abs(Math.round(asideRect.left) - Math.round(feedRect.left)) <= 2,
    }
  })

  expect(layout).not.toBeNull()
  if (!layout?.isSingleColumn) expect(layout?.asideLeft).toBeLessThan(layout?.feedLeft ?? 0)
}

async function expectAdminSpacing(page: Page) {
  const spacing = await page.evaluate(() => {
    const parsePx = (value: string) => Number.parseFloat(value) || 0
    const view = document.querySelector('.admin-view')
    const grid = document.querySelector('.admin-view .dashboard-grid')
    const tab = document.querySelector('.admin-view .admin-tabs button')
    const activeTab = document.querySelector('.admin-view .admin-tabs button.active')
    const inactiveTab = document.querySelector('.admin-view .admin-tabs button:not(.active)')
    if (!view || !grid || !tab || !activeTab || !inactiveTab) return null
    const viewStyle = window.getComputedStyle(view)
    const gridStyle = window.getComputedStyle(grid)
    const tabsStyle = window.getComputedStyle(tab.parentElement as Element)
    const tabStyle = window.getComputedStyle(tab)
    const activeTabStyle = window.getComputedStyle(activeTab)
    const inactiveTabStyle = window.getComputedStyle(inactiveTab)
    const tabRect = tab.getBoundingClientRect()
    const metrics = Array.from(grid.querySelectorAll('.metric')).map((metric) => metric.getBoundingClientRect())
    const firstMetricTop = Math.round(metrics[0]?.top ?? 0)
    return {
      viewGap: parsePx(viewStyle.gap),
      gridGap: parsePx(gridStyle.gap),
      gridColumns: gridStyle.gridTemplateColumns.split(' ').length,
      metricCount: metrics.length,
      sameMetricRow: metrics.every((metric) => Math.abs(Math.round(metric.top) - firstMetricTop) <= 1),
      tabsPadding: parsePx(tabsStyle.paddingTop),
      tabsBorderStyle: tabsStyle.borderTopStyle,
      tabsBackground: tabsStyle.backgroundColor,
      tabClipPath: tabStyle.clipPath,
      tabHeight: tabRect.height,
      activeBackground: activeTabStyle.backgroundColor,
      inactiveBackground: inactiveTabStyle.backgroundColor,
    }
  })

  expect(spacing).not.toBeNull()
  expect(spacing?.viewGap).toBeGreaterThanOrEqual(14)
  expect(spacing?.gridGap).toBeLessThanOrEqual(14)
  expect(spacing?.gridColumns).toBe(5)
  expect(spacing?.metricCount).toBe(5)
  expect(spacing?.sameMetricRow).toBe(true)
  expect(spacing?.tabsPadding).toBeGreaterThanOrEqual(8)
  expect(spacing?.tabsBorderStyle).toBe('solid')
  expect(spacing?.tabsBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(spacing?.tabClipPath).toBe('none')
  expect(spacing?.tabHeight).toBeGreaterThanOrEqual(38)
  expect(spacing?.activeBackground).not.toBe(spacing?.inactiveBackground)
}

async function expectAdminContentFits(page: Page) {
  const offenders = await page.evaluate(() => {
    const issues: Array<{ article: string; tag: string; text: string; overRight: number; overLeft: number }> = []
    for (const article of Array.from(document.querySelectorAll('.admin-view article'))) {
      const articleRect = article.getBoundingClientRect()
      for (const element of Array.from(article.querySelectorAll<HTMLElement>('*'))) {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        const overRight = Math.ceil(rect.right - articleRect.right)
        const overLeft = Math.ceil(articleRect.left - rect.left)
        if ((overRight > 1 || overLeft > 1) && style.position !== 'fixed' && rect.width > 0 && rect.height > 0) {
          issues.push({
            article: (article.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
            tag: element.tagName.toLowerCase(),
            text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
            overRight,
            overLeft,
          })
        }
      }
    }
    return issues
  })
  expect(offenders).toEqual([])
}

async function expectCalendarEventLayout(page: Page) {
  const layout = await page.evaluate(() => {
    const card = document.querySelector('.event-card')
    const dateBox = card?.querySelector('.date-box')
    const details = card?.querySelector('.event-card-main')
    const description = details?.querySelector('p')
    if (!card || !dateBox || !details || !description) return null
    const dateRect = dateBox.getBoundingClientRect()
    const detailsRect = details.getBoundingClientRect()
    const detailsStyle = window.getComputedStyle(details)
    const dateStyle = window.getComputedStyle(dateBox)
    const descriptionStyle = window.getComputedStyle(description)
    return {
      isSideBySide: dateRect.right <= detailsRect.left,
      centerDiff: Math.abs((dateRect.top + dateRect.height / 2) - (detailsRect.top + detailsRect.height / 2)),
      detailsGap: Number.parseFloat(detailsStyle.gap) || 0,
      dateGap: Number.parseFloat(dateStyle.gap) || 0,
      lineHeight: Number.parseFloat(descriptionStyle.lineHeight) || 0,
      fontSize: Number.parseFloat(descriptionStyle.fontSize) || 1,
    }
  })

  expect(layout).not.toBeNull()
  if (layout?.isSideBySide) expect(layout.centerDiff).toBeLessThanOrEqual(4)
  expect(layout?.detailsGap).toBeGreaterThanOrEqual(7)
  expect(layout?.dateGap).toBeLessThanOrEqual(4)
  expect((layout?.lineHeight ?? 0) / (layout?.fontSize ?? 1)).toBeGreaterThanOrEqual(1.6)

  const futureCard = page.locator('.event-card').filter({ hasText: 'Future QA event' })
  await futureCard.getByRole('button', { name: 'Add to calendar' }).click()
  const providerDialog = page.getByRole('dialog', { name: '選擇行事曆' })
  await expect(providerDialog).toBeVisible()
  await expect(providerDialog.getByRole('link', { name: 'Google' })).toHaveAttribute('href', /calendar\.google\.com\/calendar\/render/)
  await page.getByLabel('關閉行事曆選擇').click()

  const expiredCard = page.locator('.event-card').filter({ hasText: 'Expired QA event' })
  await expect(expiredCard.getByRole('button', { name: 'Event ended' })).toBeDisabled()
  await expect(expiredCard.getByRole('button', { name: 'Add to calendar' })).toHaveCount(0)
}

async function expectCalendarEventModal(page: Page) {
  await page.locator('.calendar-grid').getByRole('button', { name: /Live/ }).click()
  const dialog = page.getByRole('dialog', { name: '活動詳細資訊' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Live')
  await expect(dialog).toContainText('2026-06-27')
  await expect(dialog).toContainText('MemberHub Call')
  await dialog.getByRole('button', { name: /Add to calendar/i }).click()
  const providerDialog = page.getByRole('dialog', { name: '選擇行事曆' })
  await expect(providerDialog).toBeVisible()
  const googleLink = providerDialog.getByRole('link', { name: 'Google' })
  await expect(googleLink).toHaveAttribute('href', /calendar\.google\.com\/calendar\/render/)
  await expect(googleLink).toHaveAttribute('href', /dates=20260627T200000%2F20260627T213000/)
  await expect(googleLink).toHaveAttribute('target', '_blank')
  await expect(providerDialog.getByRole('link', { name: 'Apple' })).toHaveAttribute('download', /2026-06-27-.*\.ics/)
  await expect(providerDialog.getByRole('link', { name: 'Apple' })).toHaveAttribute('href', /^data:text\/calendar/)
  await expect(providerDialog.getByRole('link', { name: 'Outlook', exact: true })).toHaveAttribute('href', /outlook\.office\.com\/calendar\/0\/deeplink\/compose/)
  await expect(providerDialog.getByRole('link', { name: 'Outlook.com' })).toHaveAttribute('href', /outlook\.live\.com\/calendar\/0\/deeplink\/compose/)
  await expect(providerDialog.getByRole('link', { name: 'Yahoo' })).toHaveAttribute('href', /calendar\.yahoo\.com/)
  const providerListScroll = await providerDialog.locator('.calendar-provider-list').evaluate((element) => element.scrollHeight - element.clientHeight)
  expect(providerListScroll).toBeLessThanOrEqual(1)
  await page.getByLabel('關閉行事曆選擇').click()
  await page.getByLabel('關閉活動詳細資訊').click()
  await expect(dialog).toBeHidden()
}

async function expectInsetCardMedia(page: Page, cardSelector: string, mediaSelector: string) {
  const media = await page.evaluate(({ cardSelector, mediaSelector }) => {
    const card = document.querySelector(cardSelector)
    const media = card?.querySelector(mediaSelector)
    if (!card || !media) return null
    const cardRect = card.getBoundingClientRect()
    const mediaRect = media.getBoundingClientRect()
    const style = window.getComputedStyle(media)
    return {
      leftInset: Math.round(mediaRect.left - cardRect.left),
      topInset: Math.round(mediaRect.top - cardRect.top),
      rightInset: Math.round(cardRect.right - mediaRect.right),
      borderStyle: style.borderStyle,
      borderWidth: Number.parseFloat(style.borderTopWidth) || 0,
      backgroundImage: style.backgroundImage,
    }
  }, { cardSelector, mediaSelector })

  expect(media).not.toBeNull()
  expect(media?.leftInset).toBeGreaterThanOrEqual(12)
  expect(media?.topInset).toBeGreaterThanOrEqual(12)
  expect(media?.rightInset).toBeGreaterThanOrEqual(12)
  expect(media?.borderStyle).toBe('solid')
  expect(media?.borderWidth).toBeGreaterThanOrEqual(1)
  expect(media?.backgroundImage).toContain('/images/memberhub-login-cover.png')
}

async function expectGroupStatsMatchCoverWidth(page: Page) {
  const layout = await page.evaluate(() => {
    const cover = document.querySelector('.hub-group-card .cover-box')
    const stats = document.querySelector('.hub-group-card .group-stats')
    const metrics = Array.from(document.querySelectorAll('.hub-group-card .group-stats .metric'))
    if (!cover || !stats || metrics.length !== 3) return null
    const coverRect = cover.getBoundingClientRect()
    const statsRect = stats.getBoundingClientRect()
    const metricWidths = metrics.map((metric) => Math.round(metric.getBoundingClientRect().width))
    return {
      leftDiff: Math.abs(Math.round(coverRect.left - statsRect.left)),
      rightDiff: Math.abs(Math.round(coverRect.right - statsRect.right)),
      widthDiff: Math.abs(Math.round(coverRect.width - statsRect.width)),
      metricWidthSpread: Math.max(...metricWidths) - Math.min(...metricWidths),
    }
  })

  expect(layout).not.toBeNull()
  expect(layout?.leftDiff).toBeLessThanOrEqual(1)
  expect(layout?.rightDiff).toBeLessThanOrEqual(1)
  expect(layout?.widthDiff).toBeLessThanOrEqual(1)
  expect(layout?.metricWidthSpread).toBeLessThanOrEqual(1)
}
