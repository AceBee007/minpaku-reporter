async (page) => {
  const params = await page.evaluate(() => window.MINPAKU_REPORTER_PARAMS || {});
  const formUrl = 'https://www.minpaku.mlit.go.jp/jigyo/a05/e?retURL=%2Fjigyo%2Fapex%2Fjissekilist&scontrolCaching=1';

  const targetPairs = Array.isArray(params.targetPairs)
    ? params.targetPairs
    : (Array.isArray(params.targetNumbers) && Array.isArray(params.targetPeriods)
      ? params.targetNumbers.flatMap((todokedeNumber) =>
        params.targetPeriods.map((period) => ({ todokedeNumber, period })))
      : []);

  if (!targetPairs.length) {
    return { success: false, error: 'targetPairs or targetNumbers + targetPeriods is required.' };
  }

  async function installAutoConfirm() {
    await page.evaluate(() => {
      window.confirm = () => true;
      window.alert = () => true;
    });
  }

  async function setInputValue(selector, value) {
    await page.locator(selector).evaluate((el, nextValue) => {
      el.value = nextValue;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, value);
  }

  async function setAllCountsToZero() {
    await page.locator('input[type="number"]').evaluateAll((inputs) => {
      inputs.forEach((input) => {
        input.value = '0';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      });
    });
  }

  async function closeResultPage() {
    const selectors = [
      '#Jisseki_CloseButton',
      'input[type="submit"][value="閉じる"]',
      'input[type="button"][value="閉じる"]',
      'button:has-text("閉じる")',
      'a:has-text("閉じる")'
    ];

    for (const selector of selectors) {
      const button = page.locator(selector).first();
      if (await button.count()) {
        await button.click();
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(1200);
        break;
      }
    }

    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
    return {
      closedToList: page.url().toLowerCase().includes('/jigyo/jissekilist') || text.includes('実績一覧'),
      urlAfterClose: page.url()
    };
  }

  async function saveOne(todokedeNumber, period) {
    await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#Jisseki_TodokedeNumber__c', { timeout: 15000 });
    await page.waitForSelector('#Jisseki_Name_Select', { timeout: 15000 });
    await installAutoConfirm();

    await setInputValue('#Jisseki_TodokedeNumber__c', todokedeNumber);
    await page.selectOption('#Jisseki_Name_Select', period);
    await page.waitForTimeout(900);

    await installAutoConfirm();
    await setInputValue('#Jisseki_TodokedeNumber__c', todokedeNumber);
    await setAllCountsToZero();

    const before = await page.evaluate(() => ({
      todokedeNumber: document.querySelector('#Jisseki_TodokedeNumber__c')?.value || '',
      period: document.querySelector('#Jisseki_Name_Select')?.value || '',
      numbers: [...document.querySelectorAll('input[type="number"]')].map((input) => ({
        id: input.id,
        value: input.value
      }))
    }));

    const badNumbers = before.numbers.filter((item) => item.value !== '0');
    if (before.todokedeNumber !== todokedeNumber || before.period !== period || badNumbers.length) {
      return { todokedeNumber, period, success: false, phase: 'pre-save validation', before };
    }

    await installAutoConfirm();
    await page.locator('#Jisseki_SaveButton').click();
    await Promise.race([
      page.waitForURL(/\/jigyo\/JissekiResult/i, { timeout: 20000 }).catch(() => null),
      page.waitForFunction(() => (document.body?.innerText || '').includes('事業実績の登録が完了しました'), { timeout: 20000 }).catch(() => null)
    ]);
    await page.waitForTimeout(1500);

    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
    const success = text.includes('事業実績の登録が完了しました');
    const closeResult = success ? await closeResultPage() : { closedToList: false, urlAfterClose: page.url() };

    return {
      todokedeNumber,
      period,
      success,
      closedToList: closeResult.closedToList,
      url: closeResult.urlAfterClose,
      message: text.slice(0, 1000)
    };
  }

  const results = [];
  for (const pair of targetPairs) {
    results.push(await saveOne(pair.todokedeNumber, pair.period));
  }

  return results;
}
