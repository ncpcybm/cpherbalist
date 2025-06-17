frappe.logout = (function(originalLogout) {
    return function(...args) {
        // CLEAR localStorage keys related to POS
        Object.keys(localStorage).forEach(key => {
            if (key.includes("pos") || key.includes("POS") || key.includes("frappe.pos")) {
                localStorage.removeItem(key);
            }
        });

        // CLEAR sessionStorage just in case
        sessionStorage.clear();

        // CLEAR IndexedDB POS tables
        let request = indexedDB.deleteDatabase("frappe_pos");
        request.onsuccess = function () {
            console.log("POS IndexedDB cleared on logout ✅");
        };

        return originalLogout.apply(this, args);
    };
})(frappe.logout);
