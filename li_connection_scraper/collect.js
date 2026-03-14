// collect.js
// Injects a button into the LinkedIn people search page.
// On click, it collects name, headline, and profile URL from all pages
// and downloads the results as a CSV when pagination is exhausted.

const btn = document.createElement('button');
btn.innerText = 'Harvest Profiles';
btn.style.cssText = 'position:fixed; top:10px; right:10px; z-index:9999; padding:10px 20px; background:blue; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;';
document.body.appendChild(btn);

btn.addEventListener('click', async function () {
  // Clear any previous run's data
  localStorage.removeItem('li_people_scraper');
  btn.innerText = 'Running...';
  btn.disabled = true;

  async function collectProfiles() {
    // Load current state from localStorage or initialize fresh
    let state = JSON.parse(localStorage.getItem('li_people_scraper') || '{"results":[]}');

    // Each person card is wrapped in an <a> with tabindex="0" linking to a /in/ profile
    const cards = [...document.querySelectorAll('a[tabindex="0"][href*="/in/"]')];

    cards.forEach(card => {
      // Strip query params from the profile URL for a clean link
      const href = card.href.split('?')[0];

      // Paragraphs inside the card follow this order:
      // [0] = name, [1] = headline, [2] = location
      const paragraphs = [...card.querySelectorAll('p')];
      const name = paragraphs[0] ? paragraphs[0].innerText.trim() : '';
      const headline = paragraphs[1] ? paragraphs[1].innerText.trim() : '';

      // Only push if we have at least a URL and a name
      if (href && name) {
        state.results.push({ href, name, headline });
      }
    });

    // Deduplicate by profile URL in case of any overlap between pages
    state.results = [...new Map(state.results.map(p => [p.href, p])).values()];
    localStorage.setItem('li_people_scraper', JSON.stringify(state));
    console.log(`Collected ${state.results.length} profiles so far...`);

    // Check if there is a next page button
    const nextBtn = document.querySelector('[data-testid="pagination-controls-next-button-visible"]');
    if (nextBtn) {
      console.log('Going to next page...');
      nextBtn.click();
      // Wait for the next page to load before collecting again
      await new Promise(r => setTimeout(r, 2500));
      collectProfiles();
    } else {
      // No more pages — build and download the CSV
      console.log(`All pages done. ${state.results.length} total profiles. Downloading CSV...`);
      btn.innerText = `Done! ${state.results.length} profiles`;

      const header = 'name,headline,url';
      const rows = state.results.map(p => {
        // Escape any double quotes inside field values per CSV spec
        const name = `"${(p.name || '').replace(/"/g, '""')}"`;
        const headline = `"${(p.headline || '').replace(/"/g, '""')}"`;
        const url = `"${p.href}"`;
        return `${name},${headline},${url}`;
      });

      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'linkedin_profiles.csv';
      a.click();

      console.log(`Downloaded ${state.results.length} unique profiles.`);
    }
  }

  collectProfiles();
});