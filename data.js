// Multi-month data registry
// Each month's data is loaded from data/<month>.js files

const MONTHS_REGISTRY = [
    { id: "2026-02", label: "Февраль 2026", file: "data/february_2026.js" },
    { id: "2026-03", label: "Март 2026", file: "data/march_2026.js" },
    { id: "2026-04", label: "Апрель 2026", file: "data/april_2026.js" },
    { id: "2026-05", label: "Май 2026", file: "data/may_2026.js" }
];

// MONTHS_DATA is populated by individual month files (e.g. data/february_2026.js)
if (typeof MONTHS_DATA === 'undefined') var MONTHS_DATA = {};

// Default to latest month for backward compatibility
const DEFAULT_MONTH = MONTHS_REGISTRY[MONTHS_REGISTRY.length - 1].id;

// Backward-compatible getter — EXPENSE_DATA points to the currently selected month
Object.defineProperty(window, 'EXPENSE_DATA', {
    get: function () {
        const id = window._currentMonthId || DEFAULT_MONTH;
        return MONTHS_DATA[id] || null;
    }
});
