import frappe
from frappe import _, _dict


def after_insert_customer(doc, method):
    try:
        # Step 1: Create Contact from Customer data
        frappe.log_error(f"✅ New Customer (Name) ",doc.customer_name )
        frappe.log_error(f"✅ New Customer (Phone) ",doc.custom_phone)
        frappe.log_error(f"✅ New Customer (Email) ",doc.custom_email)

        contact = frappe.new_doc("Contact")

        # Use customer name for contact (assuming it's "First Last")
        name_parts = doc.customer_name.split(" ", 1)
        contact.first_name = name_parts[0]
        contact.last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Copy phone, email, or other info from the customer if available


        if doc.custom_email:

            contact.append("email_ids", {
                "email_id": doc.custom_email,
                "is_primary": 1
            })
            # contact.email_id = doc.custom_email
        if doc.custom_phone:
            
            contact.mobile_no = doc.custom_phone

            contact.append("phone_nos", {
                "phone": doc.custom_phone,
                "is_primary_mobile_no": 1
            })
            # contact.is_primary_mobile_no = 1
            # contact.mobile_no = doc.custom_phone

        # Link this contact to the customer
        contact.append("links", {
            "link_doctype": "Customer",
            "link_name": doc.name
        })

        contact.is_primary_contact = 1

        contact.insert(ignore_permissions=True)
        frappe.log_error(f"✅ Contact {contact.name} created for Customer {doc.customer_name}")

        # Step 2: Update Customer
        frappe.db.set_value("Customer", doc.name, "customer_primary_contact", contact.name)
        frappe.db.set_value("Customer", doc.name, "mobile_no", doc.custom_phone)    
        frappe.db.commit()

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "❌ Error in after_insert_customer")
