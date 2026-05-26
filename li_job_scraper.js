// ── Excluded keywords in job description ──────────────────────────────────────
const DESCRIPTION_EXCLUDE = [
    "sponsorship", "tsa", "clearance", "clearances", "green card",
    "must be a us citizen", "must be a u.s. citizen",
    "us citizenship", "u.s. citizenship", "us work authorization", "u.s. work authorization"
];

// ── Excluded keywords in job title ────────────────────────────────────────────
const JOB_TITLE_EXCLUDE = [
    "analyst", "intern", "manager", "senior", "quant", "quantitative", "staff", "lead"
];

const COMPANY_EXCLUDE = ["dataannotation", "booz allen hamilton", "inside higher ed", "tiktok", "handshake", "jobs via dice", "jobright.ai", "emonics llc", "hackajob", "haystack", "apex systems", "alignerr", "meta", "apple", "amazon", "netflix", "google", 
];

function tryToSaveCurrentJob() {
    // Get job title from the right panel anchor tag
    const jobLink = document.querySelector('a[href*="/jobs/view/"]');
    if (!jobLink) {
        console.log('SKIP: Could not find job title link');
        return;
    }
    const jobTitle = jobLink.innerText.trim();
    console.log('Job title:', jobTitle);

    // Check jobTitle against excluded keywords
    const jobTitleLower = jobTitle.toLowerCase();
    const jobTitleMatch = JOB_TITLE_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(jobTitleLower));
    if (jobTitleMatch) {
        console.log(`SKIP: jobTitle contains "${jobTitleMatch}"`);
        return;
    }

    // Get company title from the right panel anchor tag
    const companyLink = document.querySelector('a[href*="/company/"]');
    if (!companyLink) {
        console.log('SKIP: Could not find company title link');
        return;
    }
    const companyTitle = companyLink.innerText.trim();
    console.log('company title:', companyTitle);

    // Check company companyTitle against excluded keywords
    const companyTitleLower = companyTitle.toLowerCase();
    const companyTitleMatch = COMPANY_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(companyTitleLower));
    if (companyTitleMatch) {
        console.log(`SKIP: companyTitle contains "${companyTitleMatch}"`);
        return;
    }

    // Check for Easy Apply anchor tag in right panel
    const easyApply = document.querySelector('a[aria-label="Easy Apply to this job"]');
    if (easyApply) {
        console.log('SKIP: Easy Apply');
        return;
    }

    // Check page text for excluded description keywords
    const pageText = document.body.innerText.toLowerCase();
    const descMatch = DESCRIPTION_EXCLUDE.find(k => new RegExp(`\\b${k}\\b`, 'i').test(pageText));
    if (descMatch) {
        console.log(`SKIP: Description contains "${descMatch}"`);
        return;
    }

    // All checks passed — save
    const saveBtn = document.querySelector('button[aria-label="Save the job"]');
    if (!saveBtn) {
        console.log('SKIP: No Save button found — may already be saved');
        return;
    }

    saveBtn.click();
    console.log(`SAVED: "${jobTitle}"`);
}

// ── Click through all cards and process each ──────────────────────────────────
const dismissBtns = document.querySelectorAll('button[aria-label^="Dismiss"]');
console.log(`Found ${dismissBtns.length} job cards`);

async function processCards() {
    for (const dismissBtn of dismissBtns) {
        const rawLabel = dismissBtn.getAttribute('aria-label');
        const jobTitle = rawLabel.replace(/^Dismiss\s+/, '').replace(/\s+job$/, '').trim();
        console.log(`\n--- Loading: "${jobTitle}" ---`);

        const card = dismissBtn.closest('div[role="button"]');

        if (!card) {
            console.log('SKIP: Could not find card');
            continue;
        }

        // Find the time span inside the card — use the aria-hidden one since it has clean text
        const timeSpan = [...card.querySelectorAll('span')]
            .find(s => /\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/i.test(s.innerText.trim()));

        if (!timeSpan) {
            console.log('SKIP: Could not find posting time');
            continue;
        }

        const timeText = timeSpan.innerText.trim();
        console.log('Posted:', timeText);

        // Parse the time and filter out anything older than 6 days
        const match = timeText.match(/(\d+)\s+(second|minute|hour|day|month|year)s?/i);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();

            // anything in months or years is immediately stale
            if (unit === 'month' || unit === 'year') {
                console.log(`SKIP: Too old — "${timeText}"`);
                continue;
            }

            // convert to days
            const days = unit === 'day' ? value
                    : unit === 'hour' ? value / 24
                    : unit === 'minute' ? value / 1440
                    : 0;

            if (days > 6) {
                console.log(`SKIP: Too old — "${timeText}"`);
                continue;
            }
        }

        card.click();

        // Wait for right panel to load before running checks
        await new Promise(r => setTimeout(r, 2000));

        tryToSaveCurrentJob();
    }

    console.log('\nAll done!');
}

processCards();