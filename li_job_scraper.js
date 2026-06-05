// ══════════════════════════════════════════════════════════════════════════════
// LinkedIn Job Saver
// Filters jobs from the left panel cards first, then loads the right panel
// for deeper checks, and saves qualifying jobs automatically.
// ══════════════════════════════════════════════════════════════════════════════


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
    "netflix", "google", "openai", "doordash", "shipt", "affirm", "thermo fisher scientific", "tata consultancy services", "alvarez & marsal", "scale.jobs", "qualcomm", "lyft", "synergisticit"
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

// Add a colored border to the card
function markCard(card, passed, reason) {
    card.style.outline = passed
        ? '3px solid #00c853'   // green for saved
        : '3px solid #d50000';  // red for skipped
    card.style.outlineOffset = '-3px';
    card.style.borderRadius = '8px';

    // Add a small label inside the card showing the reason
    const label = document.createElement('div');
    label.innerText = passed ? 'SAVED' : `SKIP: ${reason}`;
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
        pointer-events: none;
        max-width: 90%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    `;
    card.style.position = 'relative';
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

    // Skip if already viewed, saved, or applied
    const statusMatch = [...card.querySelectorAll('p')]
        .find(p => /^(Viewed|Saved|Applied)$/.test(p.innerText.trim()));
    if (statusMatch) {
        return { pass: false, reason: `Already ${statusMatch.innerText.trim()}` };
    }

    // Skip Easy Apply — identified by "Easy Apply" text inside a <p> in the card
    const easyApply = [...card.querySelectorAll('p')]
        .find(p => p.innerText.includes('Easy Apply'));
    if (easyApply) {
        return { pass: false, reason: 'Easy Apply' };
    }

    // Skip if posting date is older than 6 days
    // Use aria-hidden span for clean text without "Posted" prefix
    const timeSpan = [...card.querySelectorAll('span[aria-hidden="true"]')]
        .find(s => /\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/i.test(s.innerText.trim()));
    if (!timeSpan) {
        return { pass: false, reason: 'Could not find posting date' };
    }
    const timeText = timeSpan.innerText.trim();
    const timeMatch = timeText.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?/i);
    if (timeMatch) {
        const value = parseInt(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase();

        const days = unit === 'year'   ? value * 365
                : unit === 'month'  ? value * 30
                : unit === 'week'   ? value * 7
                : unit === 'day'    ? value
                : unit === 'hour'   ? value / 24
                : unit === 'minute' ? value / 1440
                : 0;

        if (days > 14) {
            return { pass: false, reason: `Too old — "${timeText}"` };
        }
    }

    return { pass: true };
}


// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Filter from the right panel after clicking the card
// ══════════════════════════════════════════════════════════════════════════════

function filterAndSave() {

    // order of filtering - 
    // 1. Sponsorship & Clearance
    // 2. Experience
    // 3. Company Name
    // 4. Job Title
    
    // Get full page text once for both experience and description checks
    const jobPage = document.querySelector('div[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]')
    const pageText = jobPage.innerText.toLowerCase()

    // Description — must not contain excluded keywords
    const descMatch = DESCRIPTION_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(pageText));
    if (descMatch) {
        return { pass: false, reason: `Description contains "${descMatch}"` };
    }

    // Experience — must not require more than 3 years
    if (EXPERIENCE_EXCLUDE.test(pageText)) {
        const expMatch = pageText.match(EXPERIENCE_EXCLUDE);
        return { pass: false, reason: `Experience too high — "${expMatch[0]}"` };
    }

    // Company name — must not be in exclusion list
    const companyLink = jobPage.querySelector('a[href*="/company/"]');
    if (!companyLink) {
        return { pass: false, reason: 'Could not find company link' };
    }
    const companyName = companyLink.innerText.trim();
    const companyMatch = COMPANY_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(companyName.toLowerCase()));
    if (companyMatch) {
        return { pass: false, reason: `Company excluded — "${companyName}"` };
    }

    // Job title — must match one of the allowed titles
    const jobLink = jobPage.querySelector('a[href*="/jobs/view/"]');
    if (!jobLink) {
        return { pass: false, reason: 'Could not find job title link' };
    }
    const jobTitle = jobLink.innerText.trim();

    // Must match at least one allowed title
    const titleIncludeMatch = TITLE_INCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(jobTitle));
    if (!titleIncludeMatch) {
        return { pass: false, reason: `Title "${jobTitle}" does not match allowed titles` };
    }

    // Must not contain any excluded title words
    const titleExcludeMatch = TITLE_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(jobTitle));
    if (titleExcludeMatch) {
        return { pass: false, reason: `Title "${jobTitle}" contains excluded word "${titleExcludeMatch}"` };
    }

    // All checks passed — click Save
    const saveBtn = document.querySelector('button[aria-label="Save the job"]');
    if (!saveBtn) {
        return { pass: false, reason: 'No Save button — may already be saved' };
    }

    saveBtn.click();
    return { pass: true, title: jobTitle, company: companyName };
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
        if (!cardResult.pass) {
            console.log(`SKIP (card): ${cardResult.reason}`);
            markCard(card, false, cardResult.reason);
            showRightPanelBanner(false, cardResult.reason);
            skipped++;
            // dismissBtn.click();
            await new Promise(r => setTimeout(r, 500));
            continue;
        }

        // Phase 1 passed — click to load right panel
        card.click();
        await new Promise(r => setTimeout(r, 2000));

        // Phase 2 — right panel filters and save
        const panelResult = filterAndSave();
        if (!panelResult.pass) {
            console.log(`SKIP (panel): ${panelResult.reason}`);
            markCard(card, false, panelResult.reason);
            showRightPanelBanner(false, panelResult.reason);
            skipped++;
        } else {
            console.log(`SAVED: "${panelResult.title}" at ${panelResult.company}`);
            markCard(card, true, '');
            showRightPanelBanner(true, '');
            saved++;
        }

        // Dismiss the card regardless of outcome so LinkedIn stops showing it
        // dismissBtn.click();
        await new Promise(r => setTimeout(r, 500));
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
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log('\nAll pages done!');
}

run(3);