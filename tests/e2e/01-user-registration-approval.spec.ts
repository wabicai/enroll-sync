import { test, expect } from '@playwright/test';

// 测试账号配置
const TEST_ACCOUNTS = {
  admin: { username: 'admin_test', password: '123456', role: '总经理' },
  finance: { username: 'finance_test', password: '123456', role: '财务' },
  exam: { username: 'exam_test', password: '123456', role: '考务组' },
  leader: { username: 'leader_test', password: '123456', role: '团队负责人' },
  fulltime: { username: 'fulltime_1', password: '123456', role: '全职招生员' },
  parttime: { username: 'parttime_1', password: '123456', role: '兼职招生员' },
};

// 测试用户数据
const TEST_USER = {
  email: 'test_user_playwright@example.com',
  password: 'Test123456',
  name: 'Playwright测试用户',
  idCard: '110101199001010001',
  phone: '13900000001',
  identity: 'full_time'
};

test.describe('流程1 - 用户注册与审批流程', () => {
  
  test.beforeEach(async ({ page }) => {
    // 确保每个测试开始时都是未登录状态
    await page.goto('/');
  });

  test('1.1 测试用户注册功能', async ({ page }) => {
    console.log('🧪 开始测试用户注册功能...');
    
    // 访问注册页面
    await page.goto('/register');
    await expect(page).toHaveTitle(/后台管理系统/);
    
    // 检查注册表单是否存在
    await expect(page.locator('h1, h2, h3').filter({ hasText: '注册' })).toBeVisible();
    
    // 填写注册表单
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#name', TEST_USER.name);
    await page.fill('#idcard', TEST_USER.idCard);
    await page.fill('#phone', TEST_USER.phone);
    
    // 选择身份类型
    await page.click('[data-testid="identity-select"], .select-trigger, [role="combobox"]');
    await page.click(`text=全职招生`);
    
    // 提交注册
    await page.click('button[type="submit"]');
    
    // 等待响应（可能是成功或错误）
    await page.waitForTimeout(2000);
    
    console.log('✅ 注册表单提交完成');
  });

  test('1.2 测试各角色登录功能', async ({ page }) => {
    console.log('🧪 开始测试各角色登录功能...');
    
    for (const [key, account] of Object.entries(TEST_ACCOUNTS)) {
      console.log(`🔐 测试 ${account.role} (${account.username}) 登录...`);
      
      // 访问登录页面
      await page.goto('/login');
      
      // 清空表单
      await page.fill('#username', '');
      await page.fill('#password', '');
      
      // 填写登录信息
      await page.fill('#username', account.username);
      await page.fill('#password', account.password);
      
      // 点击登录
      await page.click('button[type="submit"]');
      
      // 等待登录完成
      await page.waitForTimeout(2000);
      
      // 检查是否成功登录（应该跳转到首页或看到导航栏）
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log(`❌ ${account.role} 登录失败，仍在登录页面`);
      } else {
        console.log(`✅ ${account.role} 登录成功，跳转到: ${currentUrl}`);
        
        // 检查页面是否有导航栏或用户信息
        const hasNavigation = await page.locator('nav, .navigation, .sidebar, .header').count() > 0;
        if (hasNavigation) {
          console.log(`✅ ${account.role} 界面正常显示`);
        }
      }
      
      // 登出（如果有登出按钮）
      const logoutButton = page.locator('text=退出, text=登出, text=logout').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('1.3 测试不同角色的界面权限', async ({ page }) => {
    console.log('🧪 开始测试不同角色的界面权限...');
    
    // 测试管理员权限
    await loginAs(page, TEST_ACCOUNTS.admin);
    await checkAdminPermissions(page);
    
    // 测试财务权限
    await loginAs(page, TEST_ACCOUNTS.finance);
    await checkFinancePermissions(page);
    
    // 测试考务组权限
    await loginAs(page, TEST_ACCOUNTS.exam);
    await checkExamPermissions(page);
    
    // 测试招生员权限
    await loginAs(page, TEST_ACCOUNTS.fulltime);
    await checkRecruiterPermissions(page);
  });

  test('1.4 测试审批流程', async ({ page }) => {
    console.log('🧪 开始测试审批流程...');
    
    // 以管理员身份登录
    await loginAs(page, TEST_ACCOUNTS.admin);
    
    // 查看待审批列表
    await page.goto('/approvals');
    await page.waitForTimeout(2000);
    
    // 检查是否有审批页面
    const hasApprovals = await page.locator('text=审批, text=待审核, text=pending').count() > 0;
    if (hasApprovals) {
      console.log('✅ 找到审批相关页面');
    } else {
      console.log('⚠️ 未找到审批页面或无待审批项目');
    }
  });
});

// 辅助函数：登录指定账号
async function loginAs(page: any, account: any) {
  await page.goto('/login');
  await page.fill('#username', account.username);
  await page.fill('#password', account.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  console.log(`🔐 已登录为: ${account.role}`);
}

// 检查管理员权限
async function checkAdminPermissions(page: any) {
  const adminPages = ['/users', '/approvals', '/dashboard'];
  for (const pagePath of adminPages) {
    await page.goto(pagePath);
    await page.waitForTimeout(1000);
    const isAccessible = !page.url().includes('/login');
    console.log(`${isAccessible ? '✅' : '❌'} 管理员访问 ${pagePath}: ${isAccessible ? '成功' : '失败'}`);
  }
}

// 检查财务权限
async function checkFinancePermissions(page: any) {
  const financePages = ['/rewards', '/exports'];
  for (const pagePath of financePages) {
    await page.goto(pagePath);
    await page.waitForTimeout(1000);
    const isAccessible = !page.url().includes('/login');
    console.log(`${isAccessible ? '✅' : '❌'} 财务访问 ${pagePath}: ${isAccessible ? '成功' : '失败'}`);
  }
}

// 检查考务组权限
async function checkExamPermissions(page: any) {
  const examPages = ['/students', '/exams', '/schedules'];
  for (const pagePath of examPages) {
    await page.goto(pagePath);
    await page.waitForTimeout(1000);
    const isAccessible = !page.url().includes('/login');
    console.log(`${isAccessible ? '✅' : '❌'} 考务组访问 ${pagePath}: ${isAccessible ? '成功' : '失败'}`);
  }
}

// 检查招生员权限
async function checkRecruiterPermissions(page: any) {
  const recruiterPages = ['/students', '/rewards'];
  for (const pagePath of recruiterPages) {
    await page.goto(pagePath);
    await page.waitForTimeout(1000);
    const isAccessible = !page.url().includes('/login');
    console.log(`${isAccessible ? '✅' : '❌'} 招生员访问 ${pagePath}: ${isAccessible ? '成功' : '失败'}`);
  }
}
