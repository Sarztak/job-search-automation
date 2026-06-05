# LinkedIn Scroll Navigation Extension

## Problem Statement

LinkedIn is a single page application built on React. The job description panel is frequently long, requiring the user to scroll to the bottom to read the full posting and then scroll back to the top to access the apply button. This back and forth movement is repetitive and disruptive to the job search workflow. The goal was to build a lightweight Chrome extension that injects persistent scroll to top and scroll to bottom buttons into the page.

## Approach

The initial approach was to inject two fixed position buttons into the document body using a content script defined in a Manifest V3 extension. The buttons would call `window.scrollTo()` on click, targeting the top and bottom of the page respectively.

## Problems Uncovered

### window.scrollTo Has No Effect

The first problem discovered was that `window.scrollTo()` produced no visible result. LinkedIn does not use the browser window as its primary scroll container. Instead, scrollable content is housed inside specific DOM elements. Calling scroll methods on the window therefore had no effect regardless of the parameters passed.

### Identifying the Correct Scroll Container

A query was run against all elements in the DOM to find those where `scrollHeight` exceeded `clientHeight`, which is the reliable indicator of a scrollable container. This returned a large number of elements including spans, lists, and figures. The correct container was identified as a `main` element with `id="workspace"`, which had a `scrollHeight` of 3483 against a `clientHeight` of 732, confirming it as the primary scroll container for the jobs view.

### Stale DOM References

Once `workspace` was identified, it was stored as a variable at injection time and referenced inside the button click handlers via closure. This approach failed. When the buttons were clicked, the scroll did not occur. Investigation using `isConnected` on the stored reference revealed that the element returned `false`, meaning it was a detached DOM node. LinkedIn's React lifecycle was unmounting and remounting the `workspace` element after the content script had captured the reference, leaving the closure pointing to a ghost node that no longer existed in the live document.

The solution was to discard the stored reference entirely and perform a fresh `document.getElementById('workspace')` lookup inside every click handler. This ensured the handler always operated on the currently live element regardless of how many times React had remounted it.

### Content Script Injection Timing

The extension manifest initially matched only `https://www.linkedin.com/jobs/view/*`. This produced inconsistent behaviour. On some page loads the buttons appeared and on others they did not. The root cause was that LinkedIn navigates between pages without full reloads, meaning the content script is only injected once on the initial page load. Subsequent navigation within the application does not retrigger injection.

The match pattern was broadened to `https://www.linkedin.com/*` to ensure the script was injected on any full page load within the domain. A `setInterval` polling at 500 milliseconds was introduced to continuously check for the presence of `workspace` and inject the buttons when it became available, handling the delay between page load and React rendering the target element.

### Buttons Appearing on Non Scrollable Pages

Broadening the match pattern introduced a new problem. The `workspace` element exists on multiple LinkedIn pages, not only the jobs view. On some of these pages the element is present but contains no overflow content, meaning `scrollHeight` equals `clientHeight` and scrolling has no effect. Buttons were being injected and displayed on these pages despite being non functional, which produced a poor user experience.

The solution was to add a check comparing `scrollHeight` against `clientHeight` before injecting the buttons. Injection only proceeds when the workspace is confirmed to be actually scrollable.

### Button Persistence Across Navigation

Because LinkedIn is a single page application, the document body persists across navigation events. Buttons injected into the body therefore remained visible even after navigating to a page where workspace was absent or non scrollable. A visibility toggle was added to the polling interval so that buttons are hidden when workspace is absent or non scrollable and shown when it is present and scrollable.

## What Was Kept

The final implementation uses a `setInterval` at 500 milliseconds as the primary mechanism for both injection and visibility management. On each interval tick the scroll container is checked. If it is present and scrollable and the buttons do not yet exist, they are injected. If it is present and scrollable and the buttons exist, they are made visible. If it is absent or non scrollable and the buttons exist, they are hidden. Click handlers perform a fresh lookup of `workspace` on every invocation rather than relying on any stored reference.

## What Was Discarded

The following approaches were tried and discarded.

`window.scrollTo()` was discarded because LinkedIn does not scroll the window.

Storing the `workspace` reference as a closure variable was discarded because React unmounts and remounts the element, making stored references stale.

A `MutationObserver` was initially used to watch for DOM changes and trigger injection. It was discarded in favour of `setInterval` because the observer fired during early DOM mutations before `workspace` existed, returned early, and did not reliably retry once the element appeared. The polling interval proved more robust for this use case.

The upfront call to `injectScrollButtons()` before the polling interval was considered unnecessary and removed, then restored after it was found that on certain page loads the buttons would not appear without it.

Restricting the manifest match pattern to `https://www.linkedin.com/jobs/view/*` was discarded because it prevented injection on pages reached via SPA navigation.