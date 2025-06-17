import frappe

def write_off_unpaid_pos_invoices():
    write_off_account = frappe.db.get_single_value("CP Settings", "default_write_off_account")
    companies = frappe.get_all("Company", pluck="name")

    for company in companies:
        cost_center = frappe.db.get_value("Company", company, "cost_center")
        invoices = frappe.get_all("POS Invoice", filters={
            "docstatus": 1,
            "outstanding_amount": ["<", 1],
            "is_pos": 1,
            "company": company
        }, fields=["name", "customer", "rounded_total", "outstanding_amount"])

        for inv in invoices:
            doc = frappe.get_doc("POS Invoice", inv.name)

            # Get paid_to account
            paid_to = doc.payments[0].account if doc.payments else None
            if not paid_to:
                frappe.logger().warning(f"Skipping {doc.name}: No payment account")
                continue

            # Create Payment Entry
            pe = frappe.new_doc("Payment Entry")
            pe.flags.ignore_permissions = True


            pe.payment_type = "Receive"
            pe.posting_date = frappe.utils.nowdate()
            pe.company = company
            pe.party_type = "Customer"
            pe.party = doc.customer
            pe.paid_to = paid_to
            pe.paid_amount = doc.outstanding_amount
            pe.received_amount = doc.outstanding_amount
            
            
            pe.references = [{
                "reference_doctype": "POS Invoice",
                "reference_name": doc.name,
                "total_amount": doc.rounded_total,
                "outstanding_amount": doc.outstanding_amount,
                "allocated_amount": doc.outstanding_amount
            }]

            pe.append("deductions", {
                "account": write_off_account,
                "cost_center": cost_center,
                "description": "Auto Write-off",
                "amount": doc.outstanding_amount
            })

            pe.insert()

            frappe.db.commit()
            pe.submit()

            frappe.logger().info(f"✅ POS Invoice {doc.name} written off.")
