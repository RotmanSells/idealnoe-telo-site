(function () {
    var state = {
        activeCategory: 'all'
    };

    function setTextByDataAttr(attr, value) {
        if (!value) {
            return;
        }

        document.querySelectorAll('[data-' + attr + ']').forEach(function (element) {
            element.textContent = value;
        });
    }

    function setPhoneByDataAttr(phone, phoneHref) {
        if (!phone) {
            return;
        }

        var safeHref = 'tel:' + (phoneHref || phone.replace(/[^\d+]/g, ''));

        document.querySelectorAll('[data-business-phone]').forEach(function (element) {
            element.textContent = phone;
        });

        document.querySelectorAll('[data-business-phone-link]').forEach(function (element) {
            element.setAttribute('href', safeHref);
        });
    }

    function setTelegramByDataAttr(telegramUrl) {
        if (!telegramUrl) {
            return;
        }

        document.querySelectorAll('[data-business-telegram-link]').forEach(function (element) {
            element.setAttribute('href', telegramUrl);
        });
    }

    function getStoredTheme() {
        try {
            var saved = localStorage.getItem('site-theme');
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
        } catch (error) {
            return 'light';
        }

        return 'light';
    }

    function getCurrentTheme() {
        var attrTheme = document.documentElement.getAttribute('data-theme');
        if (attrTheme === 'light' || attrTheme === 'dark') {
            return attrTheme;
        }
        return getStoredTheme();
    }

    function syncThemeToggles(theme) {
        document.querySelectorAll('[data-theme-toggle]').forEach(function (toggle) {
            toggle.checked = theme === 'dark';
        });
    }

    function syncThemeFab(theme) {
        var fab = document.querySelector('[data-theme-fab]');
        if (!fab) {
            return;
        }

        var icon = fab.querySelector('i');
        if (!icon) {
            return;
        }

        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
            fab.setAttribute('aria-label', 'Включить светлую тему');
        } else {
            icon.className = 'fa-solid fa-moon';
            fab.setAttribute('aria-label', 'Включить темную тему');
        }
    }

    function setTheme(theme) {
        var resolvedTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolvedTheme);

        try {
            localStorage.setItem('site-theme', resolvedTheme);
        } catch (error) {
            return;
        }
    }

    function toggleTheme() {
        applyTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
    }

    function applyTheme(theme) {
        var resolvedTheme = theme === 'dark' ? 'dark' : 'light';
        setTheme(resolvedTheme);
        syncThemeToggles(resolvedTheme);
        syncThemeFab(resolvedTheme);
        updateNavState();
    }

    function initThemeToggle() {
        var themeToggles = document.querySelectorAll('[data-theme-toggle]');
        var themeFab = document.querySelector('[data-theme-fab]');

        applyTheme(getCurrentTheme());

        themeToggles.forEach(function (toggle) {
            toggle.addEventListener('change', function () {
                applyTheme(toggle.checked ? 'dark' : 'light');
            });
        });

        if (themeFab) {
            themeFab.addEventListener('click', toggleTheme);
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function filterCategories(categories, activeCategory) {
        return (categories || [])
            .filter(function (category) {
                if (activeCategory === 'all') {
                    return true;
                }

                return normalize(category.name) === normalize(activeCategory);
            })
            .map(function (category) {
                return {
                    name: category.name,
                    icon: category.icon,
                    items: category.items || []
                };
            });
    }

    function createGroupedItemsHtml(items) {
        var groups = [];

        (items || []).forEach(function (item) {
            var groupName = item.group || 'Услуги';
            var existingGroup = null;

            for (var i = 0; i < groups.length; i += 1) {
                if (groups[i].name === groupName) {
                    existingGroup = groups[i];
                    break;
                }
            }

            if (!existingGroup) {
                existingGroup = { name: groupName, items: [] };
                groups.push(existingGroup);
            }

            existingGroup.items.push(item);
        });

        return groups
            .map(function (group) {
                var rowsHtml = group.items
                    .map(function (item) {
                        return '<div class="service-row">' +
                            '<span class="service-name">' + escapeHtml(item.name) + '</span>' +
                            '<span class="service-price">' + escapeHtml(item.price) + '</span>' +
                            '</div>';
                    })
                    .join('');

                return '<div class="service-group">' +
                    '<p class="service-group-title">' + escapeHtml(group.name) + '</p>' +
                    rowsHtml +
                    '</div>';
            })
            .join('');
    }

    function createServicesHtml(categories) {
        return categories
            .map(function (category, index) {
                var itemsHtml = createGroupedItemsHtml(category.items || []);

                return '<article class="glass-card service-card" data-aos="fade-up" data-aos-delay="' + (index * 100) + '">' +
                    '<div class="mb-6">' +
                    '<div class="w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center border border-gray-700 mb-6">' +
                    '<i class="fa-solid ' + escapeHtml(category.icon || 'fa-list') + ' text-2xl text-brand"></i>' +
                    '</div>' +
                    '<h3 class="text-2xl font-serif">' + escapeHtml(category.name) + '</h3>' +
                    '</div>' +
                    '<div>' + itemsHtml + '</div>' +
                    '</article>';
            })
            .join('');
    }

    function updateServicesSummary(filteredCategories) {
        var summary = document.getElementById('services-summary');

        if (!summary) {
            return;
        }

        var categoryCount = filteredCategories.length;
        var itemCount = filteredCategories.reduce(function (total, category) {
            return total + category.items.length;
        }, 0);

        if (!itemCount) {
            summary.textContent = 'Нет доступных услуг';
            return;
        }

        summary.textContent = 'Показано услуг: ' + itemCount + ' | Категорий: ' + categoryCount;
    }

    function renderServices(categories) {
        var grid = document.getElementById('services-grid');
        var emptyState = document.getElementById('services-empty');

        if (!grid) {
            return;
        }

        var filtered = filterCategories(categories, state.activeCategory);
        var hasItems = filtered.length > 0;

        grid.innerHTML = hasItems ? createServicesHtml(filtered) : '';

        if (emptyState) {
            emptyState.hidden = hasItems;
        }

        updateServicesSummary(filtered);

        if (window.AOS && hasItems) {
            window.AOS.refreshHard();
        }
    }

    function renderCategoryChips(categories) {
        var container = document.getElementById('service-categories');

        if (!container) {
            return;
        }

        var chipsData = [{ name: 'Все категории', value: 'all' }].concat(
            (categories || []).map(function (category) {
                return {
                    name: category.name,
                    value: category.name
                };
            })
        );

        container.innerHTML = chipsData
            .map(function (chip) {
                var isActive = state.activeCategory === chip.value;

                return '<button type="button" class="category-chip' + (isActive ? ' is-active' : '') + '" role="tab" aria-selected="' + (isActive ? 'true' : 'false') + '" data-category="' + escapeHtml(chip.value) + '">' +
                    escapeHtml(chip.name) +
                    '</button>';
            })
            .join('');

        container.querySelectorAll('[data-category]').forEach(function (button) {
            button.addEventListener('click', function () {
                state.activeCategory = button.getAttribute('data-category') || 'all';
                renderCategoryChips(categories);
                renderServices(categories);
            });
        });
    }

    function initServicesFilters(categories) {
        renderCategoryChips(categories);
        renderServices(categories);
    }

    function closeMobileMenu() {
        var menu = document.getElementById('mobile-menu');
        var toggle = document.getElementById('mobile-menu-toggle');

        if (!menu || !toggle) {
            return;
        }

        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }

    function openMobileMenu() {
        var menu = document.getElementById('mobile-menu');
        var toggle = document.getElementById('mobile-menu-toggle');

        if (!menu || !toggle) {
            return;
        }

        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }

    function initMobileMenu() {
        var menu = document.getElementById('mobile-menu');
        var toggle = document.getElementById('mobile-menu-toggle');

        if (!menu || !toggle) {
            return;
        }

        toggle.addEventListener('click', function () {
            if (menu.hidden) {
                openMobileMenu();
            } else {
                closeMobileMenu();
            }
        });

        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeMobileMenu();
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth >= 768) {
                closeMobileMenu();
            }
        });
    }

    function updateNavState() {
        var nav = document.querySelector('nav');

        if (!nav) {
            return;
        }

        if (window.scrollY > 50) {
            nav.classList.add('shadow-lg', 'is-scrolled');
        } else {
            nav.classList.remove('shadow-lg', 'is-scrolled');
        }
    }

    function initScrollEffects() {
        window.addEventListener('scroll', updateNavState);
        updateNavState();
    }

    function initAnimations() {
        if (window.AOS) {
            window.AOS.init({
                once: true,
                offset: 100,
                duration: 800
            });
        }
    }

    function initPage() {
        var business = window.BUSINESS_INFO || {};
        var categories = window.SERVICE_CATEGORIES || [];

        setTextByDataAttr('business-name', business.name);
        setTextByDataAttr('business-category', business.category);
        setTextByDataAttr('business-address', business.address);
        setTextByDataAttr('business-hours', business.workingHours);
        setTextByDataAttr('business-rating', business.rating);
        setPhoneByDataAttr(business.phone, business.phoneHref);
        setTelegramByDataAttr(business.telegramUrl);

        if (business.name && business.category) {
            document.title = business.name + ' | ' + business.category + ' в Краснодаре';
        }

        initThemeToggle();
        initAnimations();
        initScrollEffects();
        initMobileMenu();
        initServicesFilters(categories);
    }

    document.addEventListener('DOMContentLoaded', initPage);
})();
