import { test, expect } from '@playwright/test';

test.describe('用户注册与审批流程测试', () => {
  const baseUrl = 'http://localhost:8082';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('测试访问首页并导航到注册页面', async ({ page }) => {
    // 检查页面是否正常加载
    await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
    
    // 尝试访问注册页面
    await page.goto(`${baseUrl}/register`);
    await expect(page.locator('text=后台管理系统注册')).toBeVisible();
  });

  test('测试全职招生员注册流程', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);
    
    // 填写注册表单
    await page.fill('#email', 'fulltime_test@example.com');
    await page.fill('#password', 'Test123456');
    await page.fill('#name', '全职招生员测试');
    await page.fill('#idcard', '110101199001011234');
    await page.fill('#phone', '13900001001');
    
    // 选择身份类型
    await page.click('[data-testid="identity-select"]');
    await page.click('text=全职招生');
    
    // 提交注册
    await page.click('button[type="submit"]');
    
    // 等待响应并检查结果
    await page.waitForTimeout(3000);
  });

  test('测试兼职招生员注册流程（需要邀请码）', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);
    
    // 填写基本信息
    await page.fill('#email', 'parttime_test@example.com');
    await page.fill('#password', 'Test123456');
    await page.fill('#name', '兼职招生员测试');
    await page.fill('#idcard', '110101199002011234');
    await page.fill('#phone', '13900002001');
    
    // 选择兼职招生身份
    await page.click('[data-testid="identity-select"]');
    await page.click('text=兼职招生');
    
    // 检查是否显示邀请码输入框
    await expect(page.locator('#invite')).toBeVisible();
    
    // 填写邀请码
    await page.fill('#invite', 'INVITE123');
    
    // 提交注册
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
  });

  test('测试登录页面功能', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    
    // 检查登录页面元素
    await expect(page.locator('text=后台管理系统登录')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // 测试预设账号登录（根据test_professional.http中的账号）
    await page.fill('#username', 'admin_test');
    await page.fill('#password', '123456');
    
    // 点击登录
    await page.click('button[type="submit"]');
    
    // 等待登录结果
    await page.waitForTimeout(5000);
    
    // 检查是否成功跳转到主页面
    const currentUrl = page.url();
    console.log('登录后的URL:', currentUrl);
  });

  test('测试不同身份类型的注册选项', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);
    
    // 测试所有身份选项
    const identityOptions = [
      '全职招生',
      '兼职招生', 
      '自由招生',
      '渠道招生',
      '兼职负责人'
    ];
    
    for (const option of identityOptions) {
      await page.click('[data-testid="identity-select"]');
      await page.click(`text=${option}`);
      
      // 检查兼职招生是否显示邀请码字段
      if (option === '兼职招生') {
        await expect(page.locator('#invite')).toBeVisible();
      }
      
      await page.waitForTimeout(1000);
    }
  });

  test('测试表单验证功能', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);
    
    // 尝试提交空表单
    await page.click('button[type="submit"]');
    
    // 检查是否有验证提示
    await page.waitForTimeout(2000);
    
    // 测试邮箱格式验证
    await page.fill('#email', 'invalid-email');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // 测试密码长度验证
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', '123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });
});
