// Container div — invisible hit area that wraps both buttons
// Positioned at bottom left, hidden by default, appears on hover
const CONTAINER_STYLE = `
    position: fixed;
    bottom: 30px;
    left: 80px;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.2s ease;
    width: 50px;
    height: 80px;
`;

// Top button — scrolls to the top of the page
// Rounded on top, flat on bottom to connect with the bottom button
const TOP_BTN_STYLE = `
    display: block;
    width: 100%;
    height: 50%;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 50px 50px 0 0;
    cursor: pointer;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    box-sizing: border-box;
`;

// Bottom button — scrolls to the bottom of the page
// Flat on top to connect with the top button, rounded on bottom
const BOTTOM_BTN_STYLE = `
    display: block;
    width: 100%;
    height: 50%;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 0 0 50px 50px;
    cursor: pointer;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    box-sizing: border-box;
`;

function injectScrollButtons() {
    if (document.getElementById('scroll-btn-container')) return;

    const container = document.createElement('div');
    container.id = 'scroll-btn-container';
    container.style.cssText = CONTAINER_STYLE;
    container.addEventListener('mouseenter', () => container.style.opacity = '1');
    container.addEventListener('mouseleave', () => container.style.opacity = '0');

    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.id = 'scroll-top-btn';
    scrollTopBtn.innerText = '▲';
    scrollTopBtn.style.cssText = TOP_BTN_STYLE;
    scrollTopBtn.addEventListener('click', () => {
        const ws = getScrollContainer();
        if (ws) ws.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const scrollBottomBtn = document.createElement('button');
    scrollBottomBtn.id = 'scroll-bottom-btn';
    scrollBottomBtn.innerText = '▼';
    scrollBottomBtn.style.cssText = BOTTOM_BTN_STYLE;
    scrollBottomBtn.addEventListener('click', () => {
        const ws = getScrollContainer();
        if (ws) ws.scrollTo({ top: ws.scrollHeight, behavior: 'smooth' });
    });

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

    container.appendChild(scrollTopBtn);
    container.appendChild(scrollBottomBtn);
    document.body.appendChild(container);
}

function getScrollContainer() {
    const specific = [...document.querySelectorAll('*')].find(el => {
        const style = window.getComputedStyle(el);
        return (
            el.scrollHeight > el.clientHeight &&
            el.clientHeight > window.innerHeight * 0.8 &&
            el.getBoundingClientRect().left < 50 &&
            (style.overflow === 'auto' || style.overflow === 'scroll' ||
             style.overflowY === 'auto' || style.overflowY === 'scroll')
        );
    });
    return specific || document.documentElement;
}


setInterval(() => {
    // const workspace = document.getElementById('workspace');
    scrollContainer = getScrollContainer();
    const topBtn = document.getElementById('scroll-top-btn');
    const bottomBtn = document.getElementById('scroll-bottom-btn');
    // const isScrollable = workspace && workspace.scrollHeight > workspace.clientHeight;
    if (scrollContainer) {
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