import frappe
from frappe.utils import flt
from erpnext.stock.doctype.stock_entry.stock_entry_utils import make_stock_entry

@frappe.whitelist()
def move_stock_to_default_warehouse(item_code=None):
    # frappe.log_error(f"⚠️ move_stock_to_default_warehouse",f"{item_code}" )

    if not item_code:
        frappe.throw("Item Code is required")

    # item = frappe.get_doc("Item", item_code)
    # frappe.log_error(f"⚠️ move_stock_to_default_warehouse [item]",f"{item}" )

    default_wh = "Central - Ithomis - CP"
    # default_wh = item.custom_default_warehouse


    # if not default_wh:
    #     default_wh = "Central - Ithomis - CP"
    #     frappe.log_error("No default warehouse for this item.")

    bins = frappe.get_all('Bin', filters={'item_code': item_code}, fields=['warehouse', 'actual_qty'])

    moved = 0
    for bin in bins:
        warehouse = bin.warehouse
        qty = flt(bin.actual_qty)

        if warehouse == default_wh or qty <= 0:
            continue

        try:
            stock_entry = frappe.new_doc("Stock Entry")
            stock_entry.purpose = "Material Transfer"
            stock_entry.stock_entry_type = "Material Transfer"
            stock_entry.from_warehouse = warehouse
            stock_entry.to_warehouse = default_wh
            stock_entry.append("items", {
                "item_code": item_code,
                "qty": qty,
                "s_warehouse": warehouse,
                "t_warehouse": default_wh,
            })
            stock_entry.insert()
            stock_entry.submit()
            moved += qty
        except Exception as e:
            frappe.log_error(f"⚠️ " + str(e),f"Transfer error for {item_code}" )
            frappe.log_error(str(e), f"Transfer error for {item_code}")

    return f"Moved {moved} units of {item_code} to {default_wh}"