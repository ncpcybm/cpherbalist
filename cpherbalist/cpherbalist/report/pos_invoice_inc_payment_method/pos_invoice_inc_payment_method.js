// Copyright (c) 2025, cybeem and contributors
// For license information, please see license.txt

frappe.query_reports["POS Invoice inc Payment Method"] = {
    "filters": [
		{
            "fieldname": "company",
            "label": "Company",
            "fieldtype": "Link",
            "options": "Company",
            "default": frappe.defaults.get_user_default("Company"),
            "reqd": 1
        },
        {
            "fieldname": "from_date",
            "label": "From Date",
            "fieldtype": "Date",
            "default": frappe.datetime.month_start()
        },
        {
            "fieldname": "to_date",
            "label": "To Date",
            "fieldtype": "Date",
            "default": frappe.datetime.month_end()
        },
        {
            "fieldname": "pos_profile",
            "label": "POS Profile",
            "fieldtype": "Link",
            "options": "POS Profile",
            "reqd": 0
        }
    ]
};
