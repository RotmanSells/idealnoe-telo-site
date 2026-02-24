(function () {
    var state = {
        activeCategory: 'all',
        activeProcedureIndex: 0
    };

    var dom = {
        nav: null,
        servicesGrid: null,
        servicesEmpty: null,
        servicesSummary: null,
        categoryContainer: null,
        proceduresContainer: null
    };

    var preparedData = {
        categories: [],
        procedures: []
    };

    var uiRefs = {
        categoryButtons: [],
        procedureCards: [],
        procedureToggles: [],
        procedurePanels: []
    };

    var listenersBound = {
        categoryClick: false,
        procedureClick: false
    };

    var isNavTicking = false;
    var prefersReducedMotion = Boolean(
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

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

    function getClosestFromEventTarget(event, selector) {
        var target = event && event.target;

        if (!target || target.nodeType !== 1 || typeof target.closest !== 'function') {
            return null;
        }

        return target.closest(selector);
    }

    function cacheDomElements() {
        dom.nav = document.querySelector('nav');
        dom.servicesGrid = document.getElementById('services-grid');
        dom.servicesEmpty = document.getElementById('services-empty');
        dom.servicesSummary = document.getElementById('services-summary');
        dom.categoryContainer = document.getElementById('service-categories');
        dom.proceduresContainer = document.getElementById('procedures-grid');
    }

    function prepareCategories(categories) {
        return (categories || []).map(function (category) {
            return {
                name: category.name || '',
                normalizedName: normalize(category.name),
                icon: category.icon || 'fa-list',
                items: category.items || []
            };
        });
    }

    function prepareProcedures(procedures) {
        return (procedures || []).map(function (procedure) {
            return {
                name: procedure.name || 'Процедура',
                category: procedure.category || 'Процедура',
                icon: procedure.icon || 'fa-circle-info',
                shortDescription: procedure.shortDescription || '',
                purpose: procedure.purpose || '',
                suitableFor: procedure.suitableFor || '',
                benefits: procedure.benefits || [],
                notes: procedure.notes || ''
            };
        });
    }

    function filterCategories() {
        if (state.activeCategory === 'all') {
            return preparedData.categories;
        }

        var active = normalize(state.activeCategory);

        return preparedData.categories.filter(function (category) {
            return category.normalizedName === active;
        });
    }

    function createGroupedItemsHtml(items) {
        var groupsMap = Object.create(null);
        var groupOrder = [];

        (items || []).forEach(function (item) {
            var groupName = item.group || 'Услуги';

            if (!groupsMap[groupName]) {
                groupsMap[groupName] = [];
                groupOrder.push(groupName);
            }

            groupsMap[groupName].push(item);
        });

        return groupOrder
            .map(function (groupName) {
                var rowsHtml = groupsMap[groupName]
                    .map(function (item) {
                        return '<div class="service-row">' +
                            '<span class="service-name">' + escapeHtml(item.name) + '</span>' +
                            '<span class="service-price">' + escapeHtml(item.price) + '</span>' +
                            '</div>';
                    })
                    .join('');

                return '<div class="service-group">' +
                    '<p class="service-group-title">' + escapeHtml(groupName) + '</p>' +
                    rowsHtml +
                    '</div>';
            })
            .join('');
    }

    function createServicesHtml(categories) {
        return categories
            .map(function (category, index) {
                var itemsHtml = createGroupedItemsHtml(category.items);

                return '<article class="glass-card service-card" data-aos="fade-up" data-aos-delay="' + (index * 100) + '">' +
                    '<div class="mb-6">' +
                    '<div class="w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center border border-gray-700 mb-6">' +
                    '<i class="fa-solid ' + escapeHtml(category.icon) + ' text-2xl text-brand"></i>' +
                    '</div>' +
                    '<h3 class="text-2xl font-serif">' + escapeHtml(category.name) + '</h3>' +
                    '</div>' +
                    '<div>' + itemsHtml + '</div>' +
                    '</article>';
            })
            .join('');
    }

    function updateServicesSummary(filteredCategories) {
        if (!dom.servicesSummary) {
            return;
        }

        var categoryCount = filteredCategories.length;
        var itemCount = filteredCategories.reduce(function (total, category) {
            return total + category.items.length;
        }, 0);

        if (!itemCount) {
            dom.servicesSummary.textContent = 'Нет доступных услуг';
            return;
        }

        dom.servicesSummary.textContent = 'Показано услуг: ' + itemCount + ' | Категорий: ' + categoryCount;
    }

    function renderServices() {
        if (!dom.servicesGrid) {
            return;
        }

        var filtered = filterCategories();
        var hasItems = filtered.length > 0;

        dom.servicesGrid.innerHTML = hasItems ? createServicesHtml(filtered) : '';

        if (dom.servicesEmpty) {
            dom.servicesEmpty.hidden = hasItems;
        }

        updateServicesSummary(filtered);
    }

    function updateCategoryButtonsState() {
        uiRefs.categoryButtons.forEach(function (button) {
            var value = button.getAttribute('data-category') || 'all';
            var isActive = value === state.activeCategory;

            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    function renderCategoryChips() {
        if (!dom.categoryContainer) {
            return;
        }

        var chipsData = [{ name: 'Все категории', value: 'all' }].concat(
            preparedData.categories.map(function (category) {
                return {
                    name: category.name,
                    value: category.name
                };
            })
        );

        dom.categoryContainer.innerHTML = chipsData
            .map(function (chip) {
                return '<button type="button" class="category-chip" role="tab" aria-selected="false" data-category="' + escapeHtml(chip.value) + '">' +
                    escapeHtml(chip.name) +
                    '</button>';
            })
            .join('');

        uiRefs.categoryButtons = Array.prototype.slice.call(
            dom.categoryContainer.querySelectorAll('[data-category]')
        );
        updateCategoryButtonsState();
    }

    function onCategoryClick(event) {
        var button = getClosestFromEventTarget(event, '[data-category]');

        if (!button || !dom.categoryContainer || !dom.categoryContainer.contains(button)) {
            return;
        }

        var nextCategory = button.getAttribute('data-category') || 'all';

        if (state.activeCategory === nextCategory) {
            return;
        }

        state.activeCategory = nextCategory;
        updateCategoryButtonsState();
        renderServices();
    }

    function initServicesFilters(categories) {
        preparedData.categories = prepareCategories(categories);
        renderCategoryChips();
        renderServices();

        if (dom.categoryContainer && !listenersBound.categoryClick) {
            dom.categoryContainer.addEventListener('click', onCategoryClick);
            listenersBound.categoryClick = true;
        }
    }

    function createProcedureBenefitsHtml(benefits) {
        return (benefits || [])
            .map(function (benefit) {
                return '<li>' + escapeHtml(benefit) + '</li>';
            })
            .join('');
    }

    function createProceduresHtml(procedures) {
        return procedures
            .map(function (procedure, index) {
                var isOpen = state.activeProcedureIndex === index;
                var panelId = 'procedure-panel-' + index;
                var benefitsHtml = createProcedureBenefitsHtml(procedure.benefits);

                return '<article class="glass-card procedure-card' + (isOpen ? ' is-open' : '') + '" data-procedure-card-index="' + index + '">' +
                    '<button type="button" class="procedure-toggle" data-procedure-index="' + index + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '" aria-controls="' + panelId + '">' +
                    '<div class="procedure-toggle-main">' +
                    '<div class="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center border border-gray-700">' +
                    '<i class="fa-solid ' + escapeHtml(procedure.icon) + ' text-brand"></i>' +
                    '</div>' +
                    '<div class="procedure-heading">' +
                    '<p class="procedure-category">' + escapeHtml(procedure.category) + '</p>' +
                    '<h3 class="procedure-name">' + escapeHtml(procedure.name) + '</h3>' +
                    '<p class="procedure-short">' + escapeHtml(procedure.shortDescription) + '</p>' +
                    '</div>' +
                    '</div>' +
                    '<span class="procedure-chevron" aria-hidden="true">' +
                    '<i class="fa-solid fa-chevron-down"></i>' +
                    '</span>' +
                    '</button>' +
                    '<div id="' + panelId + '" class="procedure-details"' + (isOpen ? '' : ' hidden') + '>' +
                    '<p class="procedure-detail-line"><span>Что это:</span> ' + escapeHtml(procedure.purpose) + '</p>' +
                    '<p class="procedure-detail-line"><span>Кому подходит:</span> ' + escapeHtml(procedure.suitableFor) + '</p>' +
                    '<p class="procedure-detail-line"><span>Чем поможет:</span></p>' +
                    '<ul class="procedure-benefits">' + benefitsHtml + '</ul>' +
                    '<p class="procedure-note">' + escapeHtml(procedure.notes) + '</p>' +
                    '</div>' +
                    '</article>';
            })
            .join('');
    }

    function cacheProcedureElements() {
        if (!dom.proceduresContainer) {
            return;
        }

        uiRefs.procedureCards = Array.prototype.slice.call(
            dom.proceduresContainer.querySelectorAll('[data-procedure-card-index]')
        );
        uiRefs.procedureToggles = Array.prototype.slice.call(
            dom.proceduresContainer.querySelectorAll('[data-procedure-index]')
        );
        uiRefs.procedurePanels = uiRefs.procedureToggles.map(function (toggle) {
            var panelId = toggle.getAttribute('aria-controls');
            return panelId ? document.getElementById(panelId) : null;
        });
    }

    function setProcedureOpen(index, shouldOpen) {
        var card = uiRefs.procedureCards[index];
        var toggle = uiRefs.procedureToggles[index];
        var panel = uiRefs.procedurePanels[index];

        if (!card || !toggle || !panel) {
            return;
        }

        card.classList.toggle('is-open', shouldOpen);
        toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        panel.hidden = !shouldOpen;
    }

    function toggleProcedure(index) {
        if (Number.isNaN(index) || index < 0 || index >= preparedData.procedures.length) {
            return;
        }

        var previousIndex = state.activeProcedureIndex;
        var nextIndex = previousIndex === index ? null : index;
        state.activeProcedureIndex = nextIndex;

        if (previousIndex !== null) {
            setProcedureOpen(previousIndex, false);
        }

        if (nextIndex !== null) {
            setProcedureOpen(nextIndex, true);
        }
    }

    function onProcedureClick(event) {
        var button = getClosestFromEventTarget(event, '[data-procedure-index]');

        if (!button || !dom.proceduresContainer || !dom.proceduresContainer.contains(button)) {
            return;
        }

        var nextIndex = Number(button.getAttribute('data-procedure-index'));
        toggleProcedure(nextIndex);
    }

    function renderProcedures(procedures) {
        if (!dom.proceduresContainer) {
            return;
        }

        preparedData.procedures = prepareProcedures(procedures);

        if (!preparedData.procedures.length) {
            dom.proceduresContainer.innerHTML = '<div class="glass-card procedure-empty">Описание процедур скоро появится.</div>';
            return;
        }

        if (state.activeProcedureIndex !== null && state.activeProcedureIndex >= preparedData.procedures.length) {
            state.activeProcedureIndex = 0;
        }

        dom.proceduresContainer.innerHTML = createProceduresHtml(preparedData.procedures);
        cacheProcedureElements();

        if (dom.proceduresContainer && !listenersBound.procedureClick) {
            dom.proceduresContainer.addEventListener('click', onProcedureClick);
            listenersBound.procedureClick = true;
        }
    }

    function updateNavState() {
        if (!dom.nav) {
            return;
        }

        if (window.scrollY > 50) {
            dom.nav.classList.add('shadow-lg', 'is-scrolled');
        } else {
            dom.nav.classList.remove('shadow-lg', 'is-scrolled');
        }
    }

    function onScroll() {
        if (isNavTicking) {
            return;
        }

        isNavTicking = true;
        window.requestAnimationFrame(function () {
            updateNavState();
            isNavTicking = false;
        });
    }

    function getAnchorOffset() {
        return 24;
    }

    function scrollToHash(hash, behavior) {
        if (!hash || hash.charAt(0) !== '#') {
            return;
        }

        var target = document.querySelector(hash);

        if (!target) {
            return;
        }

        var top = target.getBoundingClientRect().top + window.pageYOffset - getAnchorOffset();

        window.scrollTo({
            top: Math.max(0, top),
            behavior: behavior || (prefersReducedMotion ? 'auto' : 'smooth')
        });
    }

    function onAnchorClick(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        var link = getClosestFromEventTarget(event, 'a[href^="#"]');

        if (!link) {
            return;
        }

        var hash = link.getAttribute('href');

        if (!hash || hash === '#') {
            return;
        }

        if (!document.querySelector(hash)) {
            return;
        }

        event.preventDefault();
        scrollToHash(hash);

        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', hash);
        } else {
            window.location.hash = hash;
        }
    }

    function initScrollEffects() {
        window.addEventListener('scroll', onScroll, { passive: true });
        updateNavState();
    }

    function initAnchorNavigation() {
        document.addEventListener('click', onAnchorClick);

        if (window.location.hash) {
            window.requestAnimationFrame(function () {
                scrollToHash(window.location.hash, 'auto');
            });
        }
    }

    function initPage() {
        var business = window.BUSINESS_INFO || {};
        var categories = window.SERVICE_CATEGORIES || [];
        var procedures = window.PROCEDURES_INFO || [];

        cacheDomElements();

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

        initScrollEffects();
        initAnchorNavigation();
        initServicesFilters(categories);
        renderProcedures(procedures);
    }

    document.addEventListener('DOMContentLoaded', initPage);
})();
