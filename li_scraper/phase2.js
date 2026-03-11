let state = JSON.parse(localStorage.getItem('li_scraper'));

if (!state) {
  console.log('No state found, run Phase 1 first');
} else {
  setTimeout(() => {

    const applyBtn = document.querySelector('a[aria-label="Apply on company website"]');

    if (applyBtn) {
      const destination = new URL(applyBtn.href).searchParams.get('url');
      state.results.push(destination);
      console.log('Found:', destination);
    } else {
      console.log('No external apply link found for:', location.href);
    }

    state.queue.shift();
    localStorage.setItem('li_scraper', JSON.stringify(state));

    if (state.queue.length > 0) {
      console.log(`Moving to next job. ${state.queue.length} remaining`);
      location.href = state.queue[0];
    } else {
      console.log('All done. Downloading CSV...');

      state.results = [...new Set(state.results)];

      const csv = 'url\n' + state.results.map(url => `"${url}"`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'apply_links.csv';
      downloadLink.click();

      console.log(`Downloaded ${state.results.length} unique apply links`);
    }

  }, 3000);
}
