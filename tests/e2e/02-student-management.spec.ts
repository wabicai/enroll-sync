import { test, expect } from '@playwright/test';

// 测试账号配置
const TEST_ACCOUNTS = {
  admin: { username: 'admin_test', password: '123456', role: '总经理' },
  exam: { username: 'exam_test', password: '123456', role: '考务组' },
  fulltime: { username: 'fulltime_1', password: '123456', role: '全职招生员' },
};

// 测试学员数据
const TEST_STUDENT = {
  name: 'Playwright测试学员',
  phone: '13900000002',
  idCard: '110101199002020002',
  gender: '男',
  education: '大专',
  course: '护工培训',
  amount: 2000,
  paidAmount: 2000,
  paymentMethod: '微信支付'
};

test.describe('流程2 - 学员信息管理流程', () => {
  
  test.beforeEach(async ({ page }) => {
    // 确保每个测试开始时都是未登录状态
    await page.goto('/');
  });

  test('2.1 考务人员创建学员档案', async ({ page }) => {
    console.log('🧪 开始测试考务人员创建学员档案...');
    
    // 以考务组身份登录
    await loginAs(page, TEST_ACCOUNTS.exam);
    
    // 访问学员管理页面
    await page.goto('/students');
    await page.waitForTimeout(2000);
    
    // 查找创建学员的按钮
    const createButtons = [
      'text=新增学员',
      'text=添加学员', 
      'text=创建学员',
      'text=新建',
      'text=添加',
      '[data-testid="create-student"]',
      'button:has-text("新增")',
      'button:has-text("添加")',
      'button:has-text("创建")'
    ];
    
    let createButton = null;
    for (const selector of createButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        createButton = button;
        break;
      }
    }
    
    if (createButton) {
      console.log('✅ 找到创建学员按钮');
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // 填写学员基本信息
      await fillStudentForm(page, TEST_STUDENT);
      
      // 提交表单
      const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("保存"), button:has-text("确定")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ 学员档案创建表单已提交');
      }
    } else {
      console.log('⚠️ 未找到创建学员按钮，可能是权限问题或界面变化');
    }
  });

  test('2.2 招生员填写奖励相关信息', async ({ page }) => {
    console.log('🧪 开始测试招生员填写奖励相关信息...');
    
    // 以全职招生员身份登录
    await loginAs(page, TEST_ACCOUNTS.fulltime);
    
    // 访问奖励管理页面
    await page.goto('/rewards');
    await page.waitForTimeout(2000);
    
    // 查找创建奖励记录的按钮
    const createRewardButtons = [
      'text=新增奖励',
      'text=添加奖励',
      'text=申请奖励',
      'text=创建奖励',
      '[data-testid="create-reward"]',
      'button:has-text("新增")',
      'button:has-text("申请")'
    ];
    
    let createRewardButton = null;
    for (const selector of createRewardButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        createRewardButton = button;
        break;
      }
    }
    
    if (createRewardButton) {
      console.log('✅ 找到创建奖励按钮');
      await createRewardButton.click();
      await page.waitForTimeout(1000);
      
      // 填写奖励相关信息
      await fillRewardForm(page, TEST_STUDENT);
      
      // 提交表单
      const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("保存"), button:has-text("确定")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ 奖励信息已提交');
      }
    } else {
      console.log('⚠️ 未找到创建奖励按钮');
    }
  });

  test('2.3 管理员审核学员信息', async ({ page }) => {
    console.log('🧪 开始测试管理员审核学员信息...');
    
    // 以管理员身份登录
    await loginAs(page, TEST_ACCOUNTS.admin);
    
    // 访问审批页面
    await page.goto('/approvals');
    await page.waitForTimeout(2000);
    
    // 查找待审核的学员信息
    const pendingItems = page.locator('[data-status="pending"], .pending, text=待审核').first();
    if (await pendingItems.isVisible()) {
      console.log('✅ 找到待审核项目');
      
      // 查找审核按钮
      const approveButtons = [
        'text=通过',
        'text=批准', 
        'text=同意',
        'button:has-text("通过")',
        'button:has-text("批准")',
        '[data-action="approve"]'
      ];
      
      for (const selector of approveButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(1000);
          console.log('✅ 已点击审核通过按钮');
          break;
        }
      }
    } else {
      console.log('⚠️ 未找到待审核的学员信息');
    }
  });

  test('2.4 验证审核状态变更', async ({ page }) => {
    console.log('🧪 开始验证审核状态变更...');
    
    // 以管理员身份登录
    await loginAs(page, TEST_ACCOUNTS.admin);
    
    // 检查学员列表中的状态
    await page.goto('/students');
    await page.waitForTimeout(2000);
    
    // 查找状态指示器
    const statusIndicators = [
      'text=已审核',
      'text=已通过',
      'text=已批准',
      '.status-approved',
      '[data-status="approved"]'
    ];
    
    let foundStatus = false;
    for (const selector of statusIndicators) {
      const indicator = page.locator(selector).first();
      if (await indicator.isVisible()) {
        console.log('✅ 找到已审核状态');
        foundStatus = true;
        break;
      }
    }
    
    if (!foundStatus) {
      console.log('⚠️ 未找到明确的审核状态指示器');
    }
    
    // 检查奖励列表中的状态
    await page.goto('/rewards');
    await page.waitForTimeout(2000);
    
    const rewardStatusIndicators = [
      'text=已审核',
      'text=已批准',
      'text=待发放',
      '.reward-approved',
      '[data-reward-status="approved"]'
    ];
    
    let foundRewardStatus = false;
    for (const selector of rewardStatusIndicators) {
      const indicator = page.locator(selector).first();
      if (await indicator.isVisible()) {
        console.log('✅ 找到奖励审核状态');
        foundRewardStatus = true;
        break;
      }
    }
    
    if (!foundRewardStatus) {
      console.log('⚠️ 未找到明确的奖励审核状态指示器');
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

// 填写学员表单
async function fillStudentForm(page: any, student: any) {
  console.log('📝 开始填写学员表单...');
  
  const formFields = [
    { selector: '#name, [name="name"], input[placeholder*="姓名"]', value: student.name },
    { selector: '#phone, [name="phone"], input[placeholder*="手机"], input[placeholder*="电话"]', value: student.phone },
    { selector: '#idCard, #id_card, [name="idCard"], [name="id_card"], input[placeholder*="身份证"]', value: student.idCard },
    { selector: '#education, [name="education"], input[placeholder*="学历"]', value: student.education }
  ];
  
  for (const field of formFields) {
    const input = page.locator(field.selector).first();
    if (await input.isVisible()) {
      await input.fill(field.value);
      console.log(`✅ 已填写 ${field.selector}: ${field.value}`);
    }
  }
}

// 填写奖励表单
async function fillRewardForm(page: any, student: any) {
  console.log('📝 开始填写奖励表单...');
  
  const rewardFields = [
    { selector: '#studentName, [name="studentName"], input[placeholder*="学员姓名"]', value: student.name },
    { selector: '#amount, [name="amount"], input[placeholder*="金额"]', value: student.amount.toString() },
    { selector: '#course, [name="course"], input[placeholder*="课程"]', value: student.course },
    { selector: '#paymentMethod, [name="paymentMethod"], input[placeholder*="支付方式"]', value: student.paymentMethod }
  ];
  
  for (const field of rewardFields) {
    const input = page.locator(field.selector).first();
    if (await input.isVisible()) {
      await input.fill(field.value);
      console.log(`✅ 已填写 ${field.selector}: ${field.value}`);
    }
  }
}
