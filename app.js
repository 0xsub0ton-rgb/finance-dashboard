// ========================================
// Multi-Month Expense Dashboard
// ========================================

class ExpenseDashboard {
    constructor() {
        this.data = null;
        this.charts = {};
        this.currentCurrency = localStorage.getItem('dashboard_currency') || 'VND';
        this.fixedCategories = ['rent', 'visa', 'health', 'insurance', 'savings'];

        // Multi-month: default to last month in registry (latest)
        this.currentMonthIndex = (typeof MONTHS_REGISTRY !== 'undefined')
            ? MONTHS_REGISTRY.length - 1
            : 0;

        // Set global chart font
        if (window.Chart) {
            Chart.defaults.font.family = "'Quantico', sans-serif";
            Chart.defaults.color = '#a3a3a3';
        }

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupModal();
        this.loadData();
        this.updateCurrencyUI();
        this.updateMonthNavUI();
        this.renderAll();
    }

    // ========================================
    // Month Navigation
    // ========================================

    getCurrentMonthId() {
        if (typeof MONTHS_REGISTRY === 'undefined' || !MONTHS_REGISTRY.length) return null;
        return MONTHS_REGISTRY[this.currentMonthIndex].id;
    }

    prevMonth() {
        if (this.currentMonthIndex <= 0) return;
        this.currentMonthIndex--;
        this.onMonthChange();
    }

    nextMonth() {
        if (typeof MONTHS_REGISTRY === 'undefined') return;
        if (this.currentMonthIndex >= MONTHS_REGISTRY.length - 1) return;
        this.currentMonthIndex++;
        this.onMonthChange();
    }

    onMonthChange() {
        window._currentMonthId = this.getCurrentMonthId();
        this.loadData();
        this.updateMonthNavUI();
        this.renderAll();
    }

    updateMonthNavUI() {
        if (typeof MONTHS_REGISTRY === 'undefined') return;

        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.disabled = this.currentMonthIndex <= 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentMonthIndex >= MONTHS_REGISTRY.length - 1;
        }
    }

    // ========================================
    // Currency Toggle
    // ========================================

    toggleCurrency() {
        this.currentCurrency = this.currentCurrency === 'VND' ? 'USD' : 'VND';
        localStorage.setItem('dashboard_currency', this.currentCurrency);
        this.updateCurrencyUI();
        this.renderAll();
    }

    updateCurrencyUI() {
        const btn = document.getElementById('currencyBtn');
        if (btn) {
            btn.textContent = this.currentCurrency;
            btn.classList.toggle('active-usd', this.currentCurrency === 'USD');
        }
    }

    // ========================================
    // Modal
    // ========================================

    setupModal() {
        const modal = document.getElementById('categoryModal');
        const closeBtn = document.getElementById('closeModal');

        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.classList.remove('active');
            }
        };
    }

    // ========================================
    // Event Listeners
    // ========================================

    setupEventListeners() {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.onclick = () => {
                this.loadData();
                this.renderAll();
                alert('Данные обновлены! Дата: ' + (this.data?.lastUpdated || 'неизвестно'));
            };
        }

        const daysCard = document.querySelector('.days-count');
        if (daysCard) {
            daysCard.onclick = () => this.showFullCalendar();
            daysCard.style.cursor = 'pointer';
        }

        // Month navigation buttons
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        if (prevBtn) prevBtn.onclick = () => this.prevMonth();
        if (nextBtn) nextBtn.onclick = () => this.nextMonth();
    }

    // ========================================
    // Data Loading
    // ========================================

    loadData() {
        const monthId = this.getCurrentMonthId();

        if (monthId && typeof MONTHS_DATA !== 'undefined' && MONTHS_DATA[monthId]) {
            this.data = MONTHS_DATA[monthId];
            window._currentMonthId = monthId;
        } else if (typeof EXPENSE_DATA !== 'undefined') {
            this.data = EXPENSE_DATA;
        } else {
            this.data = this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            month: "Март 2026",
            currency: { usd_to_vnd: 26613 },
            income: { monthly: 1250, currency: "USD" },
            lastUpdated: "2026-03-01",
            expenses: [],
            categories: {
                "food": { icon: "🍽️", name: "Еда", color: "#FF6384" },
                "coffee": { icon: "☕", name: "Кофе/кафе", color: "#8B4513" },
                "energy": { icon: "🥤", name: "Напитки", color: "#36A2EB" },
                "habits": { icon: "🚬", name: "Вредные привычки", color: "#9966FF" },
                "entertainment": { icon: "🎭", name: "Развлечения", color: "#FF9F40" },
                "transport": { icon: "🚕", name: "Транспорт", color: "#FFCE56" },
                "water": { icon: "💧", name: "Вода", color: "#4BC0C0" }
            }
        };
    }

    // ========================================
    // Calendar Helpers
    // ========================================

    getMonthInfo() {
        const monthId = this.getCurrentMonthId();
        if (!monthId) return { daysInMonth: 31, firstDayOfWeek: 0, year: 2026, month: 3 };

        const [year, month] = monthId.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
        return { daysInMonth, firstDayOfWeek, year, month };
    }

    // ========================================
    // Rendering
    // ========================================

    renderAll() {
        if (!this.data) return;
        this.renderStats();
        this.renderCharts();
        this.updateFooter();
    }

    formatVND(amount) {
        if (this.currentCurrency === 'USD') {
            return this.formatUSD(this.vndToUsd(amount));
        }
        const rounded = Math.round(amount / 1000) * 1000;
        return new Intl.NumberFormat('vi-VN').format(rounded) + ' ₫';
    }

    formatUSD(amount) {
        return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    getAverageRate() {
        if (!this.data?.currency?.converted?.length) return 26613;
        const rates = this.data.currency.converted.map(c => c.vnd / c.usd);
        return rates.reduce((a, b) => a + b, 0) / rates.length;
    }

    vndToUsd(vnd) {
        return vnd / this.getAverageRate();
    }

    usdToVnd(usd) {
        return usd * this.getAverageRate();
    }

    getFilteredDailyTotal(day) {
        return day.items
            .filter(item => !this.fixedCategories.includes(item.category) && !item.oneTime)
            .reduce((sum, item) => sum + item.amount, 0);
    }

    getTotalExpenses() {
        return this.data.expenses.reduce((sum, day) => sum + day.total, 0);
    }

    getDaysCount() {
        return this.data.expenses.length;
    }

    getDailyAverage() {
        const days = this.getDaysCount();
        if (days === 0) return 0;
        const totalVariable = this.data.expenses.reduce((sum, day) => {
            return sum + this.getFilteredDailyTotal(day);
        }, 0);
        return totalVariable / days;
    }

    getCategoryTotals() {
        const totals = {};
        this.data.expenses.forEach(day => {
            day.items.forEach(item => {
                if (!totals[item.category]) totals[item.category] = 0;
                totals[item.category] += item.amount;
            });
        });
        return totals;
    }

    renderStats() {
        const total = this.getTotalExpenses();
        const dailyAvg = this.getDailyAverage();
        const incomeUsd = this.data.income?.monthly ?? 1250;
        const additionalVnd = this.data.income?.additional_vnd || 0;
        const incomeVnd = this.usdToVnd(incomeUsd) + additionalVnd;

        const totalSpentUsd = this.vndToUsd(total);
        const totalIncomeUsd = incomeUsd + this.vndToUsd(additionalVnd);
        const budgetLeftUsd = totalIncomeUsd - totalSpentUsd;
        const budgetLeftVnd = incomeVnd - total;

        const budgetPercent = incomeVnd > 0 ? ((budgetLeftVnd / incomeVnd) * 100).toFixed(1) : 0;

        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) currentMonthEl.textContent = this.data.month;

        document.getElementById('totalSpent').textContent = this.formatVND(total);
        document.getElementById('totalSpentUsd').style.display = 'none';

        document.getElementById('dailyAvg').textContent = this.formatVND(Math.round(dailyAvg));
        document.getElementById('dailyAvgUsd').style.display = 'none';

        document.getElementById('daysCount').textContent = this.getDaysCount();

        // Update days progress with dynamic days in month
        const { daysInMonth } = this.getMonthInfo();
        const daysProgress = document.getElementById('daysProgress');
        if (daysProgress) daysProgress.textContent = `из ${daysInMonth}`;

        // Show budget left in current currency
        const budgetLeftEl = document.getElementById('budgetLeft');
        if (this.currentCurrency === 'USD') {
            budgetLeftEl.textContent = this.formatUSD(this.vndToUsd(budgetLeftVnd));
        } else {
            budgetLeftEl.textContent = this.formatVND(budgetLeftVnd);
        }

        const budgetText = document.getElementById('budgetLeftText');
        const budgetBar = document.getElementById('budgetProgressBar');
        if (budgetText) budgetText.textContent = budgetPercent + '% осталось';
        if (budgetBar) budgetBar.style.width = budgetPercent + '%';
    }

    renderCharts() {
        this.renderPieChart();
        this.renderBarChart();
    }

    renderPieChart() {
        const canvas = document.getElementById('pieChart');
        if (!canvas || !window.Chart) return;
        const ctx = canvas.getContext('2d');
        if (this.charts.pie) this.charts.pie.destroy();

        const categoryTotals = this.getCategoryTotals();
        const labels = [];
        const data = [];
        const colors = [];
        const categoryKeys = [];

        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, value]) => {
                const cat = this.data.categories[key];
                if (cat) {
                    labels.push(cat.icon + ' ' + cat.name);
                    data.push(this.currentCurrency === 'USD' ? this.vndToUsd(value) : value);
                    colors.push(cat.color);
                    categoryKeys.push(key);
                }
            });

        // Handle empty data
        if (data.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#525252';
            ctx.font = "16px 'Quantico', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText('Нет данных за этот месяц', canvas.width / 2, canvas.height / 2);
            return;
        }

        this.charts.pie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#16213e',
                    borderWidth: 2,
                    hoverOffset: 18,
                    hoverBorderColor: '#ffffff',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 14 }
                        },
                        onClick: (e, legendItem, legend) => {
                            const index = legendItem.index;
                            if (categoryKeys[index]) {
                                this.showCategoryDetails(categoryKeys[index]);
                            }
                        },
                        onHover: (event, legendItem, legend) => {
                            const chart = legend.chart;
                            const idx = legendItem.index;
                            chart.setActiveElements([{ datasetIndex: 0, index: idx }]);
                            chart.tooltip.setActiveElements([{ datasetIndex: 0, index: idx }], { x: 0, y: 0 });
                            chart.update('none');
                            event.native.target.style.cursor = 'pointer';
                        },
                        onLeave: (event, legendItem, legend) => {
                            const chart = legend.chart;
                            chart.setActiveElements([]);
                            chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                            chart.update('none');
                            event.native.target.style.cursor = 'default';
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((val / total) * 100).toFixed(1);
                                return (this.currentCurrency === 'USD' ? this.formatUSD(val) : this.formatVND(val)) + ` (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Native Click Handler for Chart Segments
        canvas.onclick = (evt) => {
            const points = this.charts.pie.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                const index = firstPoint.index;
                if (categoryKeys[index]) {
                    this.showCategoryDetails(categoryKeys[index]);
                }
            }
        };
    }

    renderBarChart() {
        const canvas = document.getElementById('barChart');
        if (!canvas || !window.Chart) return;
        const ctx = canvas.getContext('2d');
        if (this.charts.bar) this.charts.bar.destroy();

        // Handle empty data
        if (!this.data.expenses.length) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#525252';
            ctx.font = "16px 'Quantico', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText('Нет данных за этот месяц', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = this.data.expenses.map(day => {
            const d = new Date(day.date);
            return d.getDate() + ' ' + d.toLocaleDateString('ru-RU', { month: 'short' });
        });
        const data = this.data.expenses.map(day => {
            const filteredTotal = this.getFilteredDailyTotal(day);
            return this.currentCurrency === 'USD' ? this.vndToUsd(filteredTotal) : filteredTotal;
        });

        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Расходы',
                    data: data,
                    backgroundColor: '#22c55e',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#a3a3a3' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        afterFit: (axis) => {
                            axis.width = 65;
                        },
                        ticks: {
                            color: '#a3a3a3',
                            padding: 10,
                            callback: (val) => this.currentCurrency === 'USD' ? this.formatUSD(val) : (val / 1000) + 'k'
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                return 'Расходы: ' + (this.currentCurrency === 'USD' ? this.formatUSD(val) : this.formatVND(val));
                            }
                        }
                    }
                }
            }
        });
    }

    // ========================================
    // Modals
    // ========================================

    showCategoryDetails(categoryKey) {
        const cat = this.data.categories[categoryKey];
        if (!cat) return;

        const modal = document.getElementById('categoryModal');
        const body = document.getElementById('modalBody');

        document.querySelector('.modal-container').classList.remove('modal-narrow');

        document.getElementById('modalTitle').textContent = cat.name;
        document.getElementById('modalIcon').textContent = cat.icon;

        const byDate = {};
        const expenseByDay = {};
        let categoryTotal = 0;

        this.data.expenses.forEach(day => {
            const items = day.items.filter(i => i.category === categoryKey);
            if (items.length > 0) {
                byDate[day.date] = items;
                const daySum = items.reduce((s, i) => s + i.amount, 0);
                expenseByDay[new Date(day.date).getDate()] = daySum;
                categoryTotal += daySum;
            }
        });

        const totalUsd = this.vndToUsd(categoryTotal);
        const { daysInMonth, firstDayOfWeek } = this.getMonthInfo();
        const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        let calendarHtml = `
            <div style="margin-bottom: 1.5rem;">
                <div class="calendar-header" style="margin-bottom: 0.5rem;">
                    ${weekDays.map(d => `<div class="calendar-header-day" style="font-size: 0.75rem;">${d}</div>`).join('')}
                </div>
                <div class="calendar-grid">
        `;

        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarHtml += `<div class="calendar-day empty" style="min-height: 60px;"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const amount = expenseByDay[day] || 0;
            const hasData = amount > 0;

            let classes = 'calendar-day';
            let amountText = '';

            if (hasData) {
                classes += ' has-data';
                const amountUsd = this.vndToUsd(amount);
                if (amountUsd < 5) classes += ' budget-ok';
                else classes += ' budget-warning';

                if (this.currentCurrency === 'USD') {
                    amountText = '$' + amountUsd.toFixed(1);
                } else {
                    const roundedAmt = Math.round(amount / 1000) * 1000;
                    amountText = new Intl.NumberFormat('vi-VN').format(roundedAmt);
                }
            }

            calendarHtml += `
                <div class="${classes}" style="min-height: 60px; padding: 4px;">
                    <span class="calendar-day-number" style="font-size: 0.75rem;">${day}</span>
                    ${amountText ? `<span class="calendar-day-amount" style="font-size: 0.7rem;">${amountText}</span>` : ''}
                </div>
            `;
        }
        calendarHtml += '</div></div>';

        let html = `
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${this.formatVND(categoryTotal)}</div>
                <div style="color: #64748b;">~${this.formatUSD(totalUsd)}</div>
            </div>
            ${calendarHtml}
        `;

        body.innerHTML = html;
        modal.classList.add('active');
    }

    showFullCalendar() {
        const modal = document.getElementById('categoryModal');
        const body = document.getElementById('modalBody');

        document.querySelector('.modal-container').classList.remove('modal-narrow');

        document.getElementById('modalTitle').textContent = 'Календарь расходов';
        document.getElementById('modalIcon').textContent = '📅';

        const expenseByDate = {};
        this.data.expenses.forEach(day => {
            const d = new Date(day.date);
            const key = d.getDate();
            expenseByDate[key] = day;
        });

        const { daysInMonth, firstDayOfWeek } = this.getMonthInfo();
        const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        // Calculate daily budget dynamically
        const incomeUsd = this.data.income?.monthly || 1250;
        const fixedExpensesUsd = this.data.expenses.reduce((sum, day) => {
            const fixedTotal = day.items
                .filter(item => this.fixedCategories.includes(item.category))
                .reduce((s, item) => s + item.amount, 0);
            return sum + this.vndToUsd(fixedTotal);
        }, 0);
        const variableBudgetUsd = incomeUsd - fixedExpensesUsd;
        const dailyBudget = Math.max(variableBudgetUsd / daysInMonth, 410 / daysInMonth);

        let html = `
            <div class="calendar-header">
                ${weekDays.map(d => `<div class="calendar-header-day">${d}</div>`).join('')}
            </div>
            <div class="calendar-grid">
        `;

        for (let i = 0; i < firstDayOfWeek; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = expenseByDate[day];
            const hasData = !!dayData;

            let classes = 'calendar-day';
            let amountText = '';

            if (hasData) {
                const variableTotal = this.getFilteredDailyTotal(dayData);
                const variableTotalUsd = this.vndToUsd(variableTotal);

                if (variableTotal > 0) {
                    classes += ' has-data';
                    if (variableTotalUsd <= dailyBudget) {
                        classes += ' budget-ok';
                    } else {
                        classes += ' budget-warning';
                    }

                    if (this.currentCurrency === 'USD') {
                        amountText = '$' + variableTotalUsd.toFixed(2);
                    } else {
                        const roundedVar = Math.round(variableTotal / 1000) * 1000;
                        amountText = new Intl.NumberFormat('vi-VN').format(roundedVar);
                    }
                }
            }

            html += `
                <div class="${classes}" onclick="expenseDashboard.showDayDetails(${day})">
                    <span class="calendar-day-number">${day}</span>
                    ${amountText ? `<span class="calendar-day-amount">${amountText}</span>` : ''}
                </div>
            `;
        }
        html += '</div>';

        // Legend
        const dailyBudgetDisplay = (410 / daysInMonth).toFixed(2);
        html += `
            <div style="margin-top: 0.5rem; display: flex; gap: 1rem; justify-content: center; font-size: 0.8rem; color: #a3a3a3;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; border-radius: 2px;"></div>
                    <span>< $${dailyBudgetDisplay}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 2px;"></div>
                    <span>> $${dailyBudgetDisplay}</span>
                </div>
            </div>
        `;

        body.innerHTML = html;
        modal.classList.add('active');
    }

    showDayDetails(dayNum) {
        const dayData = this.data.expenses.find(d => new Date(d.date).getDate() === dayNum);
        if (!dayData) return;

        const modal = document.getElementById('categoryModal');
        const body = document.getElementById('modalBody');

        document.querySelector('.modal-container').classList.add('modal-narrow');

        const date = new Date(dayData.date);

        document.getElementById('modalTitle').textContent = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        document.getElementById('modalIcon').textContent = '📅';

        const totalUsd = this.vndToUsd(dayData.total);

        body.innerHTML = `
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 1.5rem; font-weight: 700; color: #6366f1;">${this.formatVND(dayData.total)}</div>
                <div style="color: #64748b;">~${this.formatUSD(totalUsd)}</div>
            </div>
            ${[...dayData.items].sort((a, b) => b.amount - a.amount).map(i => `
                <div class="modal-item">
                    <span>${i.icon} ${i.name}</span>
                    <span class="modal-item-amount">${this.formatVND(i.amount)}</span>
                </div>
            `).join('')}
        `;
        modal.classList.add('active');
    }

    updateFooter() {
        const el = document.getElementById('footerLastUpdated');
        if (el && this.data.lastUpdated) {
            el.textContent = 'Последнее обновление: ' + this.data.lastUpdated;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.expenseDashboard = new ExpenseDashboard();
});
