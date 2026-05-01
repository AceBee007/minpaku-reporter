async (page) => {
  const params = await page.evaluate(() => window.MINPAKU_REPORTER_PARAMS || {});
  const targetNumbers = Array.isArray(params.targetNumbers) ? params.targetNumbers : [];
  const listUrl = 'https://www.minpaku.mlit.go.jp/jigyo/jissekilist';
  const formUrl = 'https://www.minpaku.mlit.go.jp/jigyo/a05/e?retURL=%2Fjigyo%2Fapex%2Fjissekilist&scontrolCaching=1';

  if (!targetNumbers.length) {
    return { success: false, error: 'targetNumbers is required.' };
  }

  const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  async function pageStatus() {
    return await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      text: document.body?.innerText || ''
    }));
  }

  async function paginatorMeta() {
    return await page.evaluate(() => {
      const instances = window.Paginator?.instances || {};
      const paginator = instances['thePage:j_id1_paginator'] || Object.values(instances)[0];
      if (!paginator) return {};
      return {
        currentPage: Number(paginator.currentPage) || 0,
        recordsPerPage: Number(paginator.recordsPerPage) || 0,
        totalPages: Number(paginator.totalPages) || 0,
        totalRecords: Number(paginator.totalRecords) || 0,
        startingRecord: Number(paginator.startingRecord) || 0,
        lastRecord: Number(paginator.lastRecord) || 0
      };
    });
  }

  async function extractRowsFromCurrentPage() {
    return await page.evaluate((numbers) => {
      const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const periodPattern = /^\d{4}年度\d{2}月～\d{2}月$/;

      return [...document.querySelectorAll('tr')]
        .map((tr) => [...tr.querySelectorAll('th,td')].map((td) => compact(td.innerText)))
        .filter((cells) => cells.length >= 2)
        .map((cells) => ({
          cells,
          todokedeNumber: cells.find((cell) => numbers.includes(cell)) || '',
          period: cells.find((cell) => periodPattern.test(cell)) || ''
        }))
        .filter((row) => row.todokedeNumber && row.period);
    }, targetNumbers);
  }

  async function goToNextPage(pageNo, currentText) {
    const nextPage = pageNo + 1;
    const moved = await page.evaluate((targetPage) => {
      const instances = window.Paginator?.instances || {};
      const paginator = instances['thePage:j_id1_paginator'] || Object.values(instances)[0];
      if (!paginator || typeof paginator.goToPage !== 'function') return false;
      const totalPages = Number(paginator.totalPages) || 0;
      if (totalPages && targetPage > totalPages) return false;
      paginator.goToPage(targetPage);
      return true;
    }, nextPage);

    if (!moved) return false;
    await page.waitForFunction((previous) => (document.body?.innerText || '') !== previous, currentText, { timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(700);
    const after = await paginatorMeta();
    return after.currentPage === nextPage;
  }

  await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const initial = await pageStatus();
  if (/login/i.test(initial.url) || /Username|Password|ログイン/.test(initial.text)) {
    return { success: false, requiresLogin: true, url: initial.url, title: initial.title };
  }

  const initialPaginator = await paginatorMeta();
  const maxPages = initialPaginator.totalPages || 1;
  const existingRows = [];
  const seenFingerprints = new Set();
  let pagesScanned = 0;

  for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
    const status = await pageStatus();
    const fingerprint = compact(status.text).slice(0, 1000);
    if (seenFingerprints.has(fingerprint)) break;
    seenFingerprints.add(fingerprint);
    pagesScanned += 1;

    existingRows.push(...await extractRowsFromCurrentPage());

    if (pageNo >= maxPages) break;
    const moved = await goToNextPage(pageNo, status.text);
    if (!moved) break;
  }

  await page.goto(formUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#Jisseki_Name_Select', { timeout: 15000 });
  const selectablePeriods = await page.locator('#Jisseki_Name_Select option').evaluateAll((options) =>
    options.map((option) => option.value || option.textContent.trim()).filter(Boolean)
  );

  const existing = {};
  const proposed = {};
  for (const number of targetNumbers) {
    existing[number] = [...new Set(existingRows
      .filter((row) => row.todokedeNumber === number)
      .map((row) => row.period))];

    const done = new Set(existing[number]);
    proposed[number] = selectablePeriods.filter((period) => !done.has(period));
  }

  const uniqueMatchedPairs = new Set(existingRows.map((row) => `${row.todokedeNumber}\t${row.period}`));

  return {
    success: true,
    targetNumbers,
    selectablePeriods,
    existing,
    proposed,
    pagesScanned,
    paginator: initialPaginator,
    rowsMatched: uniqueMatchedPairs.size,
    warning: existingRows.length === 0 ? 'No target rows were found in the list scan.' : ''
  };
}
