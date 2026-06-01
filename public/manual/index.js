// Track the current navigation state
let currentPage = 1;
let currentSubPage = null; // Tracks sub-steps (1, 2, 3, 4, 5) cleanly
let totalPages = 6;
let visiblePages = [1, 2, 3, 4, 5, 6]; 
let currentType = 'customer';          

function toggleMenu(headerElement) {
    const menuGroup = headerElement.closest('.menu-group');
    const menuList = menuGroup.querySelector('.menu-list');
    const arrow = headerElement.querySelector('.arrow');
    
    const isCollapsed = menuList.classList.toggle('collapsed');
    arrow.textContent = isCollapsed ? '▼' : '▲';
}

// Global programmatic navigation routing engine
function navigateToPage(type, pageNumber, subPage = null) {
    if (typeof type === 'number') {
        pageNumber = type;
        type = 'customer';
    }

    // Reset default page pools when switching tracks
    if (type !== currentType) {
        currentType = type;
        visiblePages = type === 'provider' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6];
        totalPages = visiblePages.length;
    }

    currentPage = pageNumber;
    currentSubPage = (type === 'provider' && pageNumber === 2) ? (subPage || 1) : null;

    // Hide all view/page sections
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // Clear active highlights across all sidebar lists and inner wrappers
    document.querySelectorAll('.menu-list li, .registration-bullets li, .registration-header').forEach(el => {
        el.classList.remove('active');
    });

    const prefix = currentType === 'provider' ? 'provider-' : '';
    
    // Route display target logic
    if (currentType === 'provider' && currentPage === 2 && currentSubPage) {
        // Activate specific registration step page
        const targetCard = document.getElementById(`provider-page-2-${currentSubPage}`);
        if (targetCard) targetCard.classList.add('active');

        // Highlight main Registration header and the specific sub-bullet line item
        const parentHeader = document.getElementById('provider-side-step-2');
        const targetBullet = document.getElementById(`provider-side-step-2-${currentSubPage}`);
        
        if (parentHeader) parentHeader.classList.add('active');
        if (targetBullet) targetBullet.classList.add('active');
    } else {
        // Activate standard main content page views
        const targetCard = document.getElementById(`${prefix}page-${pageNumber}`);
        const targetSidebarLink = document.getElementById(`${prefix}side-step-${pageNumber}`);
        
        if (targetCard) targetCard.classList.add('active');
        if (targetSidebarLink) targetSidebarLink.classList.add('active');
    }

    // Update pagination numerical indicator safely
    const indicator = document.getElementById('page-num-display');
    if (indicator) {
        const currentDisplayIndex = visiblePages.indexOf(currentPage) + 1;
        const totalDisplayPages = visiblePages.length;
        indicator.textContent = (totalDisplayPages > 0 && currentDisplayIndex > 0) 
            ? `${currentDisplayIndex} of ${totalDisplayPages}` 
            : "0 of 0";
    }
}

// Handle Next/Previous pagination button clicks smoothly
function changePage(direction) {
    // Intercept inside registration sub-steps before jumping main pages
    if (currentType === 'provider' && currentPage === 2) {
        let nextSub = (currentSubPage || 1) + direction;
        if (nextSub >= 1 && nextSub <= 5) {
            navigateToPage('provider', 2, nextSub);
            return;
        } else if (nextSub < 1) {
            navigateToPage('provider', 1); // Step back out to Getting Started
            return;
        } else if (nextSub > 5) {
            navigateToPage('provider', 3); // Advance forward to Verification
            return;
        }
    }

    const currentIndex = visiblePages.indexOf(currentPage);
    const targetIndex = currentIndex + direction;
    
    if (targetIndex >= 0 && targetIndex < visiblePages.length) {
        const nextPage = visiblePages[targetIndex];
        // Route entry points when using arrow actions
        if (currentType === 'provider' && nextPage === 2) {
            navigateToPage('provider', 2, direction === 1 ? 1 : 5);
        } else {
            navigateToPage(currentType, nextPage);
        }
    }
}

// Global Search Filter Engine for Content & Pagination Structure
const searchInput = document.querySelector('.search-container input');

if (searchInput) {
    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const prefix = currentType === 'provider' ? 'provider-' : '';
        const allPages = document.querySelectorAll(`[id^="${prefix}page-"]`);
        
        visiblePages = [];

        allPages.forEach(page => {
            let pageId = page.id.includes('page-2-') ? 2 : parseInt(page.id.replace(`${prefix}page-`, ''), 10);
            const sidebarItem = document.getElementById(`${prefix}side-step-${pageId}`);
            const pageText = page.textContent.toLowerCase();
            const isMatch = pageText.includes(query);

            page.querySelectorAll('.step-text, h2, h3, .subtitle, .tip-content p').forEach(item => {
                const textContent = item.textContent.toLowerCase();
                if (query !== '' && textContent.includes(query)) {
                    item.style.backgroundColor = '#fff9c4'; 
                    item.style.borderRadius = '4px';
                    item.style.opacity = '1';
                } else {
                    item.style.backgroundColor = 'transparent';
                    item.style.opacity = query !== '' ? '0.4' : '1'; 
                }
            });

            if (isMatch || query === '') {
                if (!visiblePages.includes(pageId)) visiblePages.push(pageId);
                if (sidebarItem) sidebarItem.style.display = 'block'; 
            } else {
                if (!visiblePages.includes(pageId) && sidebarItem) sidebarItem.style.display = 'none';  
            }
        });

        totalPages = visiblePages.length;

        if (visiblePages.length > 0) {
            if (!visiblePages.includes(currentPage)) {
                navigateToPage(currentType, visiblePages[0]); 
            } else {
                navigateToPage(currentType, currentPage, currentSubPage);     
            }
        } else {
            allPages.forEach(page => page.classList.remove('active'));
            document.querySelectorAll(`.sidebar [id^="${prefix}side-step-"]`).forEach(el => el.classList.remove('active'));
            const indicator = document.getElementById('page-num-display');
            if (indicator) indicator.textContent = "0 of 0";
        }
    });
}