import frappe

from erpnext.accounts.doctype.pos_invoice.pos_invoice import POSInvoice
from frappe import _
from frappe.model.naming import make_autoname


def custom_on_submit(doc, method):
	frappe.msgprint("Custom Submit Logic Triggered for Sales Invoice")
	frappe.log_error(f"👉 method ", doc)

# class CustomPOSInvoice(POSInvoice):

# 	def autoname(self):
# 		frappe.log_error(f"👉 autoname ", self)

# 		# if self.docstatus == 0:
# 		# 	self.name = frappe.model.naming.make_autoname("POS-DRAFT-.##########")
# 		# elif self.docstatus == 1:
# 		# 	self.name = frappe.model.naming.make_autoname("POS-SUB-.##########")
# 		# else:
# 		# 	self.name = frappe.model.naming.make_autoname("POS-GEN-.##########")

# 	def on_submit(doc, method):
# 		frappe.log_error("👉 ", doc.custom_credit_forward_amount_)

# 		# Rename document to use submission prefix
# 		# new_name = frappe.model.naming.make_autoname("POS-SUB-.##########")
# 		# if self.name != new_name:
# 		# 	frappe.rename_doc(self.doctype, self.name, new_name, force=True)
# 		# 	self.name = new_name
				
# 	def validate_return_items_qty(self):
# 		pass
# 		# super().validate_return_items_qty()
# 		# frappe.log_error(f"👉 Custom validate_return_items_qty called ", self)

#         # # frappe.msgprint("👉 Custom validate_return_items_qty called")

#         # # Optional: Call the original logic if needed
#         # # super().validate_return_items_qty()

#         # # For example, skip quantity check for certain item groups
#         # for item in self.items:
#         # 	if item.qty > 0:
#         # 		continue
#         # 	if not item.return_against:
#         # 		frappe.throw(f"Item {item.item_code} is a return but has no return_against reference.")

#         # # You can modify or skip ERPNext's strict return quantity matching logic
