const { chromium } = require('playwright');

async function testBaoyanAgent() {
  console.log('Starting browser test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    // Navigate to the local server
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if the main elements are visible
    console.log('Checking page elements...');
    
    // Check for sidebar
    const sidebar = await page.$('aside');
    if (sidebar) {
      console.log('✓ Sidebar is present');
    } else {
      console.log('✗ Sidebar is missing');
    }
    
    // Check for header
    const header = await page.$('header');
    if (header) {
      console.log('✓ Header is present');
    } else {
      console.log('✗ Header is missing');
    }
    
    // Check for main content area
    const main = await page.$('main');
    if (main) {
      console.log('✓ Main content area is present');
    } else {
      console.log('✗ Main content area is missing');
    }
    
    // Check for page title
    const title = await page.title();
    console.log(`✓ Page title: ${title}`);
    
    // Test navigation
    console.log('\nTesting navigation...');
    
    // Click on Material Library
    const libraryBtn = await page.$('button:has-text("材料库")');
    if (libraryBtn) {
      await libraryBtn.click();
      await page.waitForTimeout(500);
      const libraryTitle = await page.$('h1:has-text("材料库")');
      if (libraryTitle) {
        console.log('✓ Navigation to Material Library works');
      }
    }
    
    // Click on Projects
    const projectsBtn = await page.$('button:has-text("报名项目")');
    if (projectsBtn) {
      await projectsBtn.click();
      await page.waitForTimeout(500);
      const projectsTitle = await page.$('h1:has-text("报名项目")');
      if (projectsTitle) {
        console.log('✓ Navigation to Projects works');
      }
    }
    
    // Click on Settings
    const settingsBtn = await page.$('button:has-text("设置")');
    if (settingsBtn) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      const settingsTitle = await page.$('h1:has-text("个人信息")');
      if (settingsTitle) {
        console.log('✓ Navigation to Settings works');
      }
    }
    
    // Go back to dashboard
    const dashboardBtn = await page.$('button:has-text("仪表盘")');
    if (dashboardBtn) {
      await dashboardBtn.click();
      await page.waitForTimeout(500);
      const dashboardTitle = await page.$('h1:has-text("仪表盘")');
      if (dashboardTitle) {
        console.log('✓ Navigation back to Dashboard works');
      }
    }
    
    // Report errors
    console.log('\n--- Console Errors ---');
    if (errors.length === 0) {
      console.log('✓ No console errors detected');
    } else {
      console.log(`✗ Found ${errors.length} console error(s):`);
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBaoyanAgent();
