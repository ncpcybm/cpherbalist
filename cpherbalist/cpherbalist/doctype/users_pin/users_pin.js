// Copyright (c) 2025, cybeem and contributors
// For license information, please see license.txt

frappe.ui.form.on("Users PIN", {
	onload(frm) {
        document.querySelector('input[data-fieldname="pin"]').type = "password"
	},
    refresh(frm) {
        document.querySelector('input[data-fieldname="pin"]').type = "password"

    }
});
