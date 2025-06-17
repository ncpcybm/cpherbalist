import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    # columns = [
    #     {"label": "Mode of Payment", "fieldname": "mode_of_payment", "fieldtype": "Data", "width": 200}	]
    
    columns = [
        {"label": "Invoice", "fieldname": "invoice", "fieldtype": "Link", "options": "POS Invoice", "width": 180},
        {"label": "Mode(s) of Payment", "fieldname": "mode_of_payments", "fieldtype": "Data", "width": 300},
        {"label": "Total Amount", "fieldname": "total_amount", "fieldtype": "Currency", "width": 120},
	]

    conditions = """
        p.docstatus = 1
        AND p.status = 'Consolidated'
        AND sip.amount > 0
        AND p.posting_date >= %(from_date)s
        AND p.posting_date <= %(to_date)s
    """

    if filters.get("pos_profile"):
        conditions += " AND p.pos_profile = %(pos_profile)s"

    # data = frappe.db.sql(f"""
    #     SELECT
    #         sip.mode_of_payment AS mode_of_payment, p.name
    #     FROM
    #         `tabPOS Invoice` p
    #     INNER JOIN
    #         `tabSales Invoice Payment` sip ON p.name = sip.parent
    #     WHERE {conditions}
    #     GROUP BY p.name
    # """, {
    #     "from_date": filters.get("from_date"),
    #     "to_date": filters.get("to_date"),
    #     "pos_profile": filters.get("pos_profile"),
    # }, as_dict=True)

    data = frappe.db.sql(f"""
		SELECT
			p.name AS invoice,
			GROUP_CONCAT(CONCAT(sip.mode_of_payment, ' (', ROUND(sip.amount,2), ') ' ) SEPARATOR ', ') AS mode_of_payments,
			SUM(sip.amount) AS total_amount
		FROM
			`tabPOS Invoice` p
		INNER JOIN
			`tabSales Invoice Payment` sip ON p.name = sip.parent
		WHERE {conditions}
		GROUP BY p.name
	""", {
		"from_date": filters.get("from_date"),
		"to_date": filters.get("to_date"),
		"pos_profile": filters.get("pos_profile"),
	}, as_dict=True)



    return columns, data