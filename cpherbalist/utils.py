import frappe
import math

def is_customer():
	if frappe.session.user and frappe.session.user != "Guest":
		contact_name = frappe.get_value("Contact", {"email_id": frappe.session.user})
		if contact_name:
			contact = frappe.get_doc("Contact", contact_name)
			for link in contact.links:
				if link.link_doctype == "Customer":
					return True
		return False
    
@frappe.whitelist()
def get_source_warehouse(item):
	item_code = item

	return frappe.get_all('Bin', 
							fields=["name", "owner", "creation", "modified", "modified_by", "_user_tags", "_comments", "_assign", 
								"_liked_by", "docstatus", "idx", "item_code", "warehouse", "actual_qty", 
								"ordered_qty", "reserved_qty"],
						filters=[["item_code", "=", item_code],
								["warehouse", "!=", frappe.get_doc('Michalis Diamond Gallery Settings').default_consignment_warehouse], ["warehouse", "!=", "Goods In Transit - MDG"], ["Bin","actual_qty",">=",1]])