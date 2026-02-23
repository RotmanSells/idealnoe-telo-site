(function () {
    var state = {
        activeCategory: 'all',
        activeProcedureIndex: 0
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

                return '<article class="glass-card procedure-card' + (isOpen ? ' is-open' : '') + '" data-aos="fade-up" data-aos-delay="' + (index * 80) + '">' +
                    '<button type="button" class="procedure-toggle" data-procedure-index="' + index + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '" aria-controls="' + panelId + '">' +
                    '<div class="procedure-toggle-main">' +
                    '<div class="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center border border-gray-700">' +
                    '<i class="fa-solid ' + escapeHtml(procedure.icon || 'fa-circle-info') + ' text-brand"></i>' +
                    '</div>' +
                    '<div class="procedure-heading">' +
                    '<p class="procedure-category">' + escapeHtml(procedure.category || 'Процедура') + '</p>' +
                    '<h3 class="procedure-name">' + escapeHtml(procedure.name) + '</h3>' +
                    '<p class="procedure-short">' + escapeHtml(procedure.shortDescription || '') + '</p>' +
                    '</div>' +
                    '</div>' +
                    '<span class="procedure-chevron" aria-hidden="true">' +
                    '<i class="fa-solid fa-chevron-down"></i>' +
                    '</span>' +
                    '</button>' +
                    '<div id="' + panelId + '" class="procedure-details"' + (isOpen ? '' : ' hidden') + '>' +
                    '<p class="procedure-detail-line"><span>Что это:</span> ' + escapeHtml(procedure.purpose || '') + '</p>' +
                    '<p class="procedure-detail-line"><span>Кому подходит:</span> ' + escapeHtml(procedure.suitableFor || '') + '</p>' +
                    '<p class="procedure-detail-line"><span>Чем поможет:</span></p>' +
                    '<ul class="procedure-benefits">' + benefitsHtml + '</ul>' +
                    '<p class="procedure-note">' + escapeHtml(procedure.notes || '') + '</p>' +
                    '</div>' +
                    '</article>';
            })
            .join('');
    }

    function renderProcedures(procedures) {
        var container = document.getElementById('procedures-grid');

        if (!container) {
            return;
        }

        if (!procedures.length) {
            container.innerHTML = '<div class="glass-card procedure-empty">Описание процедур скоро появится.</div>';
            return;
        }

        if (state.activeProcedureIndex !== null && state.activeProcedureIndex >= procedures.length) {
            state.activeProcedureIndex = 0;
        }

        container.innerHTML = createProceduresHtml(procedures);

        container.querySelectorAll('[data-procedure-index]').forEach(function (button) {
            button.addEventListener('click', function () {
                var nextIndex = Number(button.getAttribute('data-procedure-index'));

                if (state.activeProcedureIndex === nextIndex) {
                    state.activeProcedureIndex = null;
                } else {
                    state.activeProcedureIndex = nextIndex;
                }

                renderProcedures(procedures);
            });
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

    function initPage() {
        var business = window.BUSINESS_INFO || {};
        var categories = window.SERVICE_CATEGORIES || [];
        var procedures = window.PROCEDURES_INFO || [];

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
        initServicesFilters(categories);
        renderProcedures(procedures);
    }

    document.addEventListener('DOMContentLoaded', initPage);
})();
