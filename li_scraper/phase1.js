// inject a start button into the page
const btn = document.createElement('button');
btn.innerText = 'Start Scrape';
btn.style.cssText = 'position:fixed; top:10px; right:10px; z-index:9999; padding:10px 20px; background:blue; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;';
document.body.appendChild(btn);

btn.addEventListener('click', async function() {
  // clear any previous scrape data
  localStorage.removeItem('li_scraper');
  btn.innerText = 'Running...';
  btn.disabled = true;

  async function collectJobs() {
    let state = JSON.parse(localStorage.getItem('li_scraper') || '{"queue":[], "results":[]}');

    const jobLinks = [...new Set(
      [...document.querySelectorAll('a[href*="/jobs/view/"]')].map(a => a.href)
    )];

    state.queue.push(...jobLinks);
    localStorage.setItem('li_scraper', JSON.stringify(state));
    console.log(`Added ${jobLinks.length} jobs. Total so far: ${state.queue.length}`);

    const nextBtn = document.querySelector('[data-testid="pagination-controls-next-button-visible"]');
    if (nextBtn) {
      console.log('Moving to next page...');
      nextBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      collectJobs();
    } else {
      console.log(`All pages done. Total jobs collected: ${state.queue.length}. Starting scrape...`);
      location.href = state.queue[0];
    }
  }

  collectJobs();
});
