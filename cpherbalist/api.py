import json
import frappe
import math

from frappe import log, _

from frappe.utils import (
	cint,
	date_diff,
	flt,
	get_datetime,
	get_link_to_form,
	getdate,
	now,
	nowdate,
	parse_json,
	time_diff_in_hours,
    now_datetime,
    today
)


from erpnext.manufacturing.doctype.bom.bom import (
	get_bom_item_rate,
	get_bom_items_as_dict,
	validate_bom_no,
)
from erpnext.manufacturing.doctype.manufacturing_settings.manufacturing_settings import (
	get_mins_between_operations,
)
from erpnext.stock.doctype.batch.batch import make_batch
from erpnext.stock.doctype.item.item import get_item_defaults, validate_end_of_life
from erpnext.stock.doctype.serial_no.serial_no import get_available_serial_nos, get_serial_nos
from erpnext.stock.stock_balance import get_planned_qty, update_bin_qty
from erpnext.stock.utils import get_bin, get_latest_stock_qty, validate_warehouse_company
from erpnext.utilities.transaction_base import validate_uom_is_integer

def __init__(self):
    self.domain = frappe.request.host


# TODO: Insert into live enviroment
@frappe.whitelist()
def get_user_info(email):
    user = frappe.get_doc("User", email)
    return {
        "full_name": user.full_name,
        "mobile_no": user.mobile_no,
        "roles": [r.role for r in user.roles]
    }
    
    
        
@frappe.whitelist()
def get_coupon_data(coupon_code):
    docname = frappe.db.get_value("Coupon Code", {"coupon_code": coupon_code})
    if not docname:
        frappe.throw(_("Invalid coupon code"))

    doc = frappe.get_doc("Coupon Code", docname)
    return doc 

@frappe.whitelist()
def has_opening_pos_entry(pos_profile_name, user=None, date=None):
    """
    Check if an opening POS entry exists for the given POS profile (and optional user/date).
    
    :param pos_profile_name: Name of the POS Profile
    :param user: (Optional) User linked to the POS Opening Entry
    :param date: (Optional) Posting date to check, defaults to today
    :return: True if entry exists, else False
    """
    filters = {
        "pos_profile": pos_profile_name,
        "docstatus": 1  # Submitted
    }

    if user:
        filters["user"] = user

    if date:
        filters["posting_date"] = date
    else:
        filters["posting_date"] = today()

    entries = frappe.get_list("POS Opening Entry", filters=filters, limit=1)

    return bool(entries)


@frappe.whitelist()
def create_pos_coupon_sales_order(item_code, value, customer, coupon_code ):
    try:
        frappe.log_error(f"⚠️ coupon_code ", type(value))

        # value = float(value) 
        
        pos_invoice = frappe.get_doc({
            "doctype": "POS Invoice",
            "is_pos": 1,
            "update_stock": 1,
            "pos_profile": "Ithomis",
            "customer": customer,
            "custom_remarks": f"Coupon Code: {coupon_code}, Value: {str(value)}",
            "items": [
                {
                    "item_code": item_code,
                    "qty": 1,
                    "rate": float(value) 
                }
            ],
            "payments": [
                {
                    "mode_of_payment": "Cash",  # Adjust based on your POS Profile
                    "amount": float(value) 
                }
            ]
        })

        pos_invoice.insert()
        
        return {
            "status": "success",
            "message": "POS invoice created as draft",
            "invoice_name": pos_invoice.name
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "create_pos_coupon_sales_order")
        return {
            "status": "error",
            "message": str(e)
        }
    # invoice.submit()

@frappe.whitelist()
def handle_pos_invoice_submit(doc, action):
    frappe.log_error(f"⚠️ handle_pos_invoice_submit [packed_items]", doc.packed_items)
    
    for d in doc.get("items"):
        frappe.log_error(f"⚠️ handle_pos_invoice_submit [items]",_("Row #{}: Item Code: {} Warehouse {}.").format(d.idx, d.item_code, d.warehouse))
        
        if(frappe.db.exists("Product Bundle", {"new_item_code": d.item_code}) is not None):
            doc.custom_has_bundle = True
            bundle_items = get_bundle_items(d.item_code)
            
            for item in bundle_items:
                frappe.log_error(f"⚠️ handle_pos_invoice_submit [get_bundle_items]",_("Row #{}: Item Code: {} QTY {}.").format(item.idx, item.item_code, item.qty))

    return True


def get_bundle_items(bundle_item_code):
    bundle = frappe.get_doc("Product Bundle", {"new_item_code": bundle_item_code})
    return bundle.items


@frappe.whitelist()
def submit_matrial_request(doc, method=None): 
    frappe.log_error("🔥 Hook triggered", f"Material Request: {doc.name}, docstatus: {doc.docstatus}")
    
    try:
        doc.submit()
        frappe.log_error("✅ submit_matrial_request success", f"Material Request: {doc.name}")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "❌ Auto Submit Error")
        




@frappe.whitelist()
def wc_coupon_sync(doc, method=None): 
    frappe.log_error("✅ wc_coupon_sync success", f"doc: {doc}")
    frappe.log_error("✅ wc_coupon_sync TODO SYNC", f"doc: {doc}")






@frappe.whitelist()
def auto_create_stock_entry(item_code):
    # Create new Stock Entry document
    stock_entry = frappe.new_doc("Stock Entry")
    
    # Set required fields
    stock_entry.stock_entry_type = "Material Receipt"
    stock_entry.company = "CHRYSTALLENA POULLI HERBAL SKIN CARE PRODUCTS LTD"
    stock_entry.to_warehouse = "Central - Ithomis - CP"  # Replace with your warehouse

    # Add item(s)
    stock_entry.append("items", {
        "item_code": item_code,
        "qty": 999,
        "t_warehouse": "Central - Ithomis - CP",
    })

    # Save and submit
    stock_entry.insert(ignore_permissions=True)
    stock_entry.submit()

    return stock_entry.name




@frappe.whitelist()
def submit_wo(doc, method=None): 
    frappe.log_error("🔥 Hook triggered", f"Work Order: {doc.name}, docstatus: {doc.docstatus}")

    try:
        doc.submit()
        # frappe.db.commit()
        frappe.log_error("✅ submit_wo success", f"Work Order: {doc.name}")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "❌ Auto Submit Error")

@frappe.whitelist()
def log_seller_profile(s_user): 
    try:
        doc = frappe.get_doc({
            'doctype': 'Seller Profile Logs',
            'user': s_user,
            'on': now_datetime(),  # Default to current datetime
        })
        
        doc.insert()
                
        frappe.db.commit()
        return doc.name
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "❌ Log Error")


@frappe.whitelist()
def submit_coupon(doc, method=None): 
    frappe.log_error("🔥 Hook triggered", f"Coupon: {doc.name}, docstatus: {doc.docstatus}")

    try:
        doc.submit()
        frappe.log_error("✅ submit_coupon success", f"Coupon: {doc.name}")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "❌ Auto Submit Error")


@frappe.whitelist()
def on_wo_submitted(doc, method=None):

    try:
        frappe.log_error("🔥 [on_wo_submitted] Hook triggered", f"Work Order: {doc.name}, docstatus: {doc.docstatus}")
        
        wo = frappe.get_doc("Work Order", doc.name)
        
        frappe.log_error("✅ wo ", f"Work Order: {doc}")

        if wo.docstatus != 1:
            raise Exception("Work Order must be submitted before starting.")
        
        return f"✅ Work Order {wo.name} started with Stock Entry"
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "❌ Error in auto-submit/start")
               
@frappe.whitelist()
def redirect_to_v1(set_warehouse,the_item):
    from frappe.auth import CookieManager, LoginManager
    
    # set_warehouse = Set Target Warehouse
    # set_from_warehouse = Set Source Warehouse
    frappe.local.cookie_manager = CookieManager()
    
    
    
    frappe.local.cookie_manager.set_cookie("set_warehouse", set_warehouse)
    frappe.local.cookie_manager.set_cookie("request_item", the_item)
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = ("/app/material-request/new-material-request")
    
    
@frappe.whitelist()
def redirect_to(set_from_warehouse, set_warehouse,the_item):
    from frappe.auth import CookieManager, LoginManager
    
    
    # set_warehouse = Set Target Warehouse
    # set_from_warehouse = Set Source Warehouse
    

    frappe.local.cookie_manager = CookieManager()
    
    frappe.local.cookie_manager.set_cookie("set_from_warehouse", set_from_warehouse)
    frappe.local.cookie_manager.set_cookie("set_warehouse", set_warehouse)
    frappe.local.cookie_manager.set_cookie("request_item", the_item)
    
    
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = ("/app/material-request/new-material-request")
    
@frappe.whitelist()
def clear_cookies(): 
    from frappe.auth import CookieManager, LoginManager
    frappe.local.cookie_manager = CookieManager()
    frappe.local.cookie_manager.delete_cookie("set_warehouse")
    frappe.local.cookie_manager.delete_cookie("request_item")


@frappe.whitelist()
def create_cookie(key,value):
    from frappe.auth import CookieManager, LoginManager
    frappe.local.cookie_manager = CookieManager()
    frappe.local.cookie_manager.set_cookie(key, value)

def generate_coupon_code(length=10):
    chars = string.ascii_uppercase + string.digits
    coupon = ''.join(random.choices(chars, k=length))
    return coupon

@frappe.whitelist()
def perform_item_bulk_action(item, percent_value=0, fixed_value=0, decrease=0, round = 0):  
    try:
        # Ensure percent_value and fixed_value are floats
        percent_value = float(percent_value)
        fixed_value = float(fixed_value)
        to_round = bool(int(round))
        
        # item_dict = json.loads(items)  # Parse the items list
        new_price = 0.00
        
        frappe.log_error(f" (1) item ({item})", item)
    
        # Fetch the existing prices for the given item
        r_obj = frappe.get_all("Item Price", fields=["*"], filters={"item_code": item, "price_list": ["=","Standard Selling"]}, order_by="idx")
        
        if len(r_obj):
            
            current_price = r_obj[0].price_list_rate

            frappe.log_error(f"(2) price_obj ({item})", r_obj[0])
            frappe.log_error(f"(3) price_record ({item})", current_price)
            
            frappe.log_error(f"(-) calc ({item})", f""" current_price {current_price}\n percent_value {percent_value}\n fixed_value {fixed_value}\n decrease {decrease} """)

            # frappe.log_error(f"(-) decrease ({item})", type(bool(int(decrease))))

            # system_setting_value = get_custom_setting("round_to_nearest_10", "Michalis Diamond Gallery Settings")
            frappe.log_error(f"(-) round ({item})", f""" round {round}\n """)


            to_decrease = bool(int(decrease))

            if percent_value != 0:
                if to_decrease:
                    new_price = current_price * (1 - abs(percent_value) / 100)
                else:
                    new_price = current_price * (1 + abs(percent_value) / 100)
            else:
                if to_decrease:
                    frappe.log_error(f"(-) percent_value ({item})", abs(percent_value))
                    frappe.log_error(f"(-) fixed_value ({item})", abs(fixed_value))
                    new_price = current_price - abs(fixed_value)
                else:
                    frappe.log_error(f"(-) percent_value ({item})", abs(percent_value))
                    frappe.log_error(f"(-) fixed_value ({item})", abs(fixed_value))
                    new_price = current_price + abs(fixed_value)
            
            if (to_round):
                tempPrice = new_price
                new_price = round_to_nearest_10(tempPrice)
                
            # Update the price in the database
            item_r = frappe.get_doc("Item", item)
            item_r.standard_rate = new_price
            item_r.save()

            # frappe.db.sql(
            #     """
            #     UPDATE `Item`
            #     SET 
            #         standard_rate=%(standard_rate)s
            #     WHERE item_code=%(item_code)s
            #     """,
            # dict(standard_rate=new_price,item_code= item)        
            # )
            
            frappe.db.sql(
                """
                UPDATE `tabItem Price`
                SET 
                    price_list_rate=%(standard_rate)s
                WHERE item_code=%(item_code)s
                """,
            dict(standard_rate=new_price,item_code= item)        
            )
            
            # frappe.db.set_value("Item Price", price_record.name, "price_list_rate", new_price)
            # frappe.db.commit()

            frappe.log_error(f"(4) Updated price for item '{item}': {new_price}")
            
    except frappe.exceptions.DoesNotExistError as e:
        frappe.log_error(f"Error: Item '{item}' not found in Item Price table.")

    except Exception as e:
        frappe.log_error(f"An error occurred while updating price for item '{item}': {str(e)}")
    
    # for item in item_dict:
        
    #     frappe.log_error(f"{item_dict[index]} ::",item_dict[index])
    #     index += 1
    #     r_obj = frappe.get_all("Item Price", fields=["*"], filters={"item_name": item, "price_list": "Standard Selling"}, order_by="idx")
        
    #     if r_obj:
    #         frappe.log_error(f"item_dict ::", r_obj)
            
    return "Bulk price update completed."


def round_to_nearest_10(number):
    if number % 10 == 0:
        return number
    return math.ceil(number / 10) * 10 if number > 0 else math.floor(number / 10) * 10


def get_system_settings(setting_name):
    """
    Retrieve a setting from the System Settings doctype.
    """
    try:
        setting = frappe.get_single('System Settings')
        return getattr(setting, setting_name, None)
    except Exception as e:
        frappe.log_error(f"Error retrieving setting {setting_name}: {e}")
        return None

def get_custom_setting(setting_name, doctype='Custom Setting'):
    """
    Retrieve a setting from a custom doctype.
    """
    try:
        setting = frappe.get_value(doctype, {'setting_name': setting_name}, 'value')
        return setting
    except Exception as e:
        frappe.log_error(f"Error retrieving custom setting {setting_name}: {e}")
        return None
    
    