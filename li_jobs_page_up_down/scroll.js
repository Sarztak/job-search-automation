// LinkedIn Scroll Buttons
// Injects scroll to top and bottom buttons on any LinkedIn page that has
// a main element with id="workspace".

function injectScrollButtons() {

    // ── Scroll to top button

    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.id = 'scroll-top-btn';
    scrollTopBtn.innerText = '▲';

    // ── Scroll to bottom button

    const scrollBottomBtn = document.createElement('button');
    scrollBottomBtn.id = 'scroll-bottom-btn';
    scrollBottomBtn.innerText = '▼';
    scrollTopBtn.style.cssText = 'position:fixed; top:50%; left:80px; z-index:9999; padding:12px 20px; background:#0a66c2; color:white; border:none; border-radius:50px 50px 0 0; cursor:pointer; font-size:16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display:block;';

    scrollBottomBtn.style.cssText = 'position:fixed; top:calc(50% + 45px); left:80px; z-index:9999; padding:12px 20px; background:#0a66c2; color:white; border:none; border-radius:0 0 50px 50px; cursor:pointer; font-size:16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display:block;';
    document.body.appendChild(scrollTopBtn);
    document.body.appendChild(scrollBottomBtn);

    [scrollTopBtn, scrollBottomBtn].forEach(btn => {
        btn.addEventListener('mousedown', () => {
            btn.style.background = '#004182';
            btn.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.4)';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.background = '#0a66c2';
            btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        });
    });

    scrollTopBtn.addEventListener('click', () => {
        const workspace = document.getElementById('workspace');
        if (workspace) workspace.scrollTo({ top: 0, behavior: 'smooth' });
    });

    scrollBottomBtn.addEventListener('click', () => {
        const workspace = document.getElementById('workspace');
        if (workspace) workspace.scrollTo({ top: workspace.scrollHeight, behavior: 'smooth' });
    });

}

setInterval(() => {
    const workspace = document.getElementById('workspace');
    const topBtn = document.getElementById('scroll-top-btn');
    const bottomBtn = document.getElementById('scroll-bottom-btn');
    const isScrollable = workspace && workspace.scrollHeight > workspace.clientHeight;

    if (isScrollable) {
        // workspace exists — inject if not there, show if hidden
        if (!topBtn) {
            injectScrollButtons();
        } else {
            topBtn.style.display = 'block';
            bottomBtn.style.display = 'block';
        }
    } else {
        // no workspace — hide if present
        if (topBtn) topBtn.style.display = 'none';
        if (bottomBtn) bottomBtn.style.display = 'none';
    }
}, 500);