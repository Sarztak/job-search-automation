// ══════════════════════════════════════════════════════════════════════════════
// LinkedIn Job Saver
// Filters jobs from the left panel cards first, then loads the right panel
// for deeper checks, and saves qualifying jobs automatically.
// ══════════════════════════════════════════════════════════════════════════════

// right panel load TIMEOUT
const RIGHT_PANEL_LOAD_TIME = 5000;

// left card load TIMEOUT
const LEFT_CARD_TIMEOUT = 1000;

// time between two cards loading
const TIME_BETWEEN_LEFT_CARD_LOAD = 1000;

// next page load time
const NEXT_PAGE_LOAD_TIME = 5000;

// session level job + company name storage
const seenJobs = new Set();

// ── Right panel: job title must match one of these (case insensitive) ─────────
const TITLE_INCLUDE = [
    "data scientist",
    "decision scientist",
    "machine learning engineer",
    "ml engineer",
    "artificial intelligence engineer",
    "ai engineer",
    "ai/ml engineer",
    "ai developer",
    "\\bai\\b.*engineer",   // AI + anything + engineer
    "\\bai\\b.*developer"   // AI + anything + develop
];

// ── Right panel: job title must NOT contain these words ───────────────────────
const TITLE_EXCLUDE = [
    "analyst", "intern", "manager", "senior", "quant", "quantitative", "staff", "lead", "sr", "principal"
];

// ── Right panel: company name exclusions ──────────────────────────────────────
const COMPANY_EXCLUDE = [
    "dataannotation", "booz allen hamilton", "inside higher ed", "tiktok", "ara",
    "handshake", "jobs via dice", "jobright.ai", "emonics llc", "hackajob",
    "haystack", "apex systems", "alignerr", "meta", "apple", "amazon",
    "netflix", "google", "openai", "doordash", "shipt", "affirm", "thermo fisher scientific", "tata consultancy services", "alvarez & marsal", "scale.jobs", "qualcomm", "lyft", "synergisticit", "jpmorgan"
];

// ── Right panel: job description keyword exclusions ───────────────────────────
const DESCRIPTION_EXCLUDE = [
    "sponsorship", "sponsoring", "tsa", "tsc/sci", "polygraph", "clearance", "clearances", "green card", "must be a us citizen", "must be a u.s. citizen", "us citizenship", "u.s. citizenship", "us work authorization", "u.s. work authorization"
];

// ── Right panel: experience year pattern to exclude ───────────────────────────
// Matches "3+ years", "4+ years", "5+ years", "6+ years" etc.
const EXPERIENCE_EXCLUDE = /\b([3-9]|10)\+?\s*years?\s+of\s+experience\b/i;


// ══════════════════════════════════════════════════════════════════════════════
// VISUALS
// ══════════════════════════════════════════════════════════════════════════════

function addCardControls(card, key, passed) {
    const btn = document.createElement('button');
    btn.innerText = passed ? '-' : '+';
    btn.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 9999;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        color: white;
        background: ${passed ? '#d50000' : '#00c853'};
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent card click
        if (passed) {
            seenJobs.delete(key);
            btn.innerText = '+';
            btn.style.background = '#00c853';
            card.style.outline = '3px solid #d50000';
        } else {
            seenJobs.add(key);
            btn.innerText = '-';
            btn.style.background = '#d50000';
            card.style.outline = '3px solid #00c853';
        }
        passed = !passed;
    });

    card.appendChild(btn);
}

// Add a colored border to the card
function markCard(card, passed, reasons) {
    card.style.outline = passed ? '3px solid #00c853' : '3px solid #d50000';
    card.style.outlineOffset = '-3px';
    card.style.borderRadius = '8px';
    card.style.position = 'relative';

    const label = document.createElement('div');
    label.style.cssText = `
        position: absolute;
        bottom: 4px;
        left: 4px;
        z-index: 9999;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px;
        color: white;
        background: ${passed ? '#00c853' : '#d50000'};
        pointer-events: auto;
        cursor: ${passed ? 'default' : 'pointer'};
        max-width: 70%;
    `;

    if (passed || reasons.length === 0) {
        label.innerText = 'SAVED';
    } else {
        label.innerText = `SKIPPED ▼ (${reasons.length})`;

        const dropdown = document.createElement('div');
        dropdown.style.cssText = `
            display: none;
            position: absolute;
            bottom: 100%;
            left: 0;
            background: #222;
            color: white;
            font-size: 10px;
            border-radius: 3px;
            padding: 4px 8px;
            min-width: 200px;
            z-index: 99999;
            pointer-events: none;
        `;
        dropdown.innerHTML = reasons.map(r => `<div>• ${r}</div>`).join('');

        label.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            label.innerText = dropdown.style.display === 'none'
                ? `SKIPPED ▼ (${reasons.length})`
                : `SKIPPED ▲ (${reasons.length})`;
        });

        label.appendChild(dropdown);
    }

    card.appendChild(label);
}

// Inject or update a banner at the top of the right panel
function showRightPanelBanner(passed, reason) {
    // Remove any existing banner
    const existing = document.getElementById('job-saver-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'job-saver-banner';
    banner.innerText = passed ? 'SAVED' : `SKIPPED — ${reason}`;
    banner.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 9999;
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: bold;
        color: white;
        background: ${passed ? '#00c853' : '#d50000'};
        box-sizing: border-box;
    `;

    // Inject at the top of the main content area
    const main = document.querySelector('main') || document.body;
    main.prepend(banner);
}

function waitForResume() {
    return new Promise((resolve) => {
        // Create Next Page button
        const nextPageBtn = document.createElement('button');
        nextPageBtn.innerText = 'Next Page';
        nextPageBtn.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:9999; padding:10px 20px; background:green; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;';

        // Create Stop button
        const stopBtn = document.createElement('button');
        stopBtn.innerText = 'Stop';
        stopBtn.style.cssText = 'position:fixed; bottom:30px; right:150px; z-index:9999; padding:10px 20px; background:red; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;';

        document.body.appendChild(nextPageBtn);
        document.body.appendChild(stopBtn);

        nextPageBtn.addEventListener('click', () => {
            nextPageBtn.remove();
            stopBtn.remove();
            resolve(true);
        });

        stopBtn.addEventListener('click', () => {
            nextPageBtn.remove();
            stopBtn.remove();
            resolve(false);
        });
    });
}
// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — Filter from the left card before clicking anything
// ══════════════════════════════════════════════════════════════════════════════

function filterCard(card) {
    let reasons = [];

    // Skip if already viewed, saved, or applied
    const statusMatch = [...card.querySelectorAll('p')]
        .find(p => /^(Viewed|Saved|Applied)$/.test(p.innerText.trim()));
    if (statusMatch) reasons.push(`Already ${statusMatch.innerText.trim()}`);

    // Skip Easy Apply — identified by "Easy Apply" text inside a <p> in the card
    const easyApply = [...card.querySelectorAll('p')]
        .find(p => p.innerText.includes('Easy Apply'));
    if (easyApply) reasons.push('Easy Apply');

    // Skip if posting date is older than 6 days
    // Use aria-hidden span for clean text without "Posted" prefix
    const timeSpan = [...card.querySelectorAll('span[aria-hidden="true"]')]
        .find(s => /\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/i.test(s.innerText.trim()));
    if (!timeSpan) {
        reasons.push('Could not find posting date');
    } else {
        const timeText = timeSpan.innerText.trim();
        const timeMatch = timeText.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?/i);
        if (timeMatch) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();

            const days = unit === 'year' ? value * 365
                : unit === 'month' ? value * 30
                    : unit === 'week' ? value * 7
                        : unit === 'day' ? value
                            : unit === 'hour' ? value / 24
                                : unit === 'minute' ? value / 1440
                                    : 0;

            if (days > 14) reasons.push(`Too old — "${timeText}"`);
        }
    }

    const passed = reasons.length === 0;

    return {passed: passed, reasons: reasons};
}


// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Filter from the right panel after clicking the card
// ══════════════════════════════════════════════════════════════════════════════

function filterAndSave() {
    //return {passed, jobTitle, companyName, reasons}

    // all the reasons shall be saved and passed
    const reasons = [];
    let jobTitle = null;
    let companyName = null;

    // order of filtering - 
    // 1. Sponsorship & Clearance
    // 2. Experience
    // 3. Company Name
    // 4. Job Title

    // Get full page text once for both experience and description checks
    const jobPage = document.querySelector('div[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]')
    if (!jobPage) {
        return {passed: false, jobTitle: null, companyName: null, reasons: ['Could not find job page']};
    }

    const pageText = jobPage.innerText.toLowerCase(); // get the job description raw text

    // Description — must not contain excluded keywords for sponsorship and clearance
    const descMatch = DESCRIPTION_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(pageText));
    if (descMatch) reasons.push(`Description contains "${descMatch}"`);

    // experience — must not require more than 3 years
    if (EXPERIENCE_EXCLUDE.test(pageText)) {
        const expMatch = pageText.match(EXPERIENCE_EXCLUDE);
        reasons.push(`Experience too high — "${expMatch[0]}"`);
    }

    // Company name — must not be in exclusion list
    const companyLink = jobPage.querySelector('a[href*="/company/"]');
    if (!companyLink) {
        reasons.push('Could not find company link');
    } else {
        companyName = companyLink.innerText.trim();
        const companyMatch = COMPANY_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(companyName.toLowerCase()));
        if (companyMatch) reasons.push(`Company excluded — "${companyName}"`);
    }


    // Job title — must match one of the allowed titles
    const jobLink = jobPage.querySelector('a[href*="/jobs/view/"]');
    if (!jobLink) {
        reasons.push('Could not find job title link')
    } else {
        jobTitle = jobLink.innerText.trim();

        // Must match at least one allowed title
        const titleIncludeMatch = TITLE_INCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(jobTitle));
        if (!titleIncludeMatch) reasons.push(`Title "${jobTitle}" does not match allowed titles`);

        // Must not contain any excluded title words
        const titleExcludeMatch = TITLE_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(jobTitle));
        if (titleExcludeMatch) reasons.push(`Title "${jobTitle}" contains excluded word "${titleExcludeMatch}"`);
    }

    // add additional check to see if
    // 1. The job title and the company name are similar -- this can happen because the companies
    // post the same job with different locations.
    // 2. The same job may be reposted again and again. This job may have already been applied to.
    // However, LinkedIn won't stop showing that even if it is dismissed.

    // check if the key has already been seen during the session
    if (reasons.length == 0 && jobTitle && companyName) {
        const key = create_job_company_key(jobTitle, companyName);
        if (seenJobs.has(key)) {
            reasons.push('Job already seen this session');
        } else {
            seenJobs.add(key);
        }
    }

    // check for saved button
    const saveBtn = document.querySelector('button[aria-label="Save the job"]');
    if (!saveBtn) reasons.push('No Save button — may already be saved or applied');

    // if any reasons collected then skip
    if (reasons.length > 0) {
        return {passed: false, jobTitle: jobTitle, companyName: companyName, reasons: reasons};
    }

    // save the job if all the check passed
    saveBtn.click();
    return {passed: true, jobTitle: jobTitle, companyName: companyName, reasons: reasons};
}

function create_job_company_key(jobName, companyName) {

    // normalize the string
    const normJobName = normalize_str(jobName);
    const normCompanyName = normalize_str(companyName);
    return normJobName + '_' + normCompanyName;
}

function normalize_str(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — iterate through all cards
// ══════════════════════════════════════════════════════════════════════════════

async function processCards() {
    const searchResults = document.querySelector('div[componentkey="SearchResultsMainContent"]')
    const dismissBtns = searchResults.querySelectorAll('button[aria-label^="Dismiss"]');
    console.log(`Found ${dismissBtns.length} job cards\n`);
    let saved = 0, skipped = 0;

    for (const dismissBtn of dismissBtns) {

        const rawLabel = dismissBtn.getAttribute('aria-label');
        const cardTitle = rawLabel.replace(/^Dismiss\s+/, '').replace(/\s+job$/, '').trim();
        console.log(`--- Card: "${cardTitle}" ---`);

        const card = dismissBtn.closest('div[role="button"]');
        if (!card) {
            console.log('SKIP: Could not find card element');
            skipped++;
            continue;
        }

        // Phase 1 — left card filters
        const cardResult = filterCard(card);
        // if (!cardResult.pass) {
        //     console.log(`SKIP (card): ${cardResult.reason}`);
        //     markCard(card, false, cardResult.reason);
        //     showRightPanelBanner(false, cardResult.reason);
        //     skipped++;
        //     // dismissBtn.click();
        //     await new Promise(r => setTimeout(r, LEFT_CARD_TIMEOUT));
        //     continue;
        // }

        // Phase 1 passed — click to load right panel
        card.click();
        await new Promise(r => setTimeout(r, RIGHT_PANEL_LOAD_TIME));

        // Retry again if the company link not found
        if (document.querySelector('a[href*="/company/"]')) {
            await new Promise(r => setTimeout(r, RIGHT_PANEL_LOAD_TIME));
        }

        // Phase 2 — right panel filters and save
        const panelResult = filterAndSave();
    
    const key = (panelResult.jobTitle && panelResult.companyName)
        ? create_job_company_key(panelResult.jobTitle, panelResult.companyName)
        : null;

    if (!panelResult.passed || !cardResult.passed) {
        const allReasons = [...panelResult.reasons, ...cardResult.reasons];
        console.log(`SKIP: ${allReasons}`);
        markCard(card, false, allReasons);
        if (key) addCardControls(card, key, false);
        skipped++;
    } else {
        console.log(`SAVED: "${panelResult.jobTitle}" at ${panelResult.companyName}`);
        markCard(card, true, []);
        if (key) addCardControls(card, key, true);
        saved++;
    }
            // Dismiss the card regardless of outcome so LinkedIn stops showing it
            // dismissBtn.click();
            await new Promise(r => setTimeout(r, TIME_BETWEEN_LEFT_CARD_LOAD));
        }

    console.log(`\nDone! Saved: ${saved} | Skipped: ${skipped}`);
}


async function run(totalPages = 5) {
    for (let page = 1; page <= totalPages; page++) {
        console.log(`\n═══ Page ${page} of ${totalPages} ═══`);

        // Process all cards on current page and wait for it to finish
        await processCards();


        // Pause — gives you time to review before moving on
        const shouldContinue = await waitForResume();
        if (!shouldContinue) {
            console.log('Stopped by user.');
            break;
        }        // Then click next

        const nextBtn = document.querySelector('[data-testid="pagination-controls-next-button-visible"]');
        if (!nextBtn) {
            console.log('No next button found — stopping early');
            break;
        }

        nextBtn.click();
        await new Promise(r => setTimeout(r, NEXT_PAGE_LOAD_TIME));
    }

    console.log('\nAll pages done!');
}

run(10);
