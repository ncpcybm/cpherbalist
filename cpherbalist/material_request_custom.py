import json

import frappe
import random
import string
from frappe.model.document import Document
from frappe.utils import add_user_info, cint, format_duration, nowdate
from frappe.model.naming import getseries

from frappe.model.base_document import get_controller
from frappe.model.db_query import DatabaseQuery
from frappe.utils import pretty_date, now, add_to_date


@frappe.whitelist()
def post_notification(from_warehouse, to_warehouse,material_request_doc):
    frappe.publish_realtime("material_request", {"from_warehouse": from_warehouse, "to_warehouse": to_warehouse, "material_request_doc": material_request_doc})


@frappe.whitelist()
def get_pos_profile_by_owner(owner):
    pos_profiles = frappe.get_all('POS Profile', filters={'owner': owner}, fields=["*"])
    return pos_profiles

@frappe.whitelist()
def get_pos_access_for_user(user_email):
    # Fetch all user permissions where the user has access to 'POS Profile'
    user_permissions = frappe.get_all(
        'User Permission',
        filters={'allow': 'POS Profile', 'user': user_email},
        fields=['*']
    )

    return user_permissions

@frappe.whitelist()
def get_pos_profile_by_id(profile_id):

    pos_profile = frappe.get_all(
        'POS Profile', 
        filters={'name':profile_id}, 
        fields=['*']
    )

    # Check if a record was found and return the first item, otherwise return None
    if pos_profile:
        return pos_profile[0]  # Return the first result if found
    else:
        return None  # Return None if no record is found

def filter_items_based_on_warehouse(source_warehouse):
    source_warehouse = source_warehouse

    stock = frappe.db.get_all('Bin', filters={'warehouse': source_warehouse}, fields=['item_code', 'actual_qty'])
    items_in_stock = [item['item_code'] for item in stock if item['actual_qty'] > 0]

    return items_in_stock  # Optional: return filtered items, if needed


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_warehouse_items(doctype, txt, searchfield, start, page_len, filters) -> list:
    
    table = frappe.qb.DocType('Item')

    # if filters:
    #     for field, value in filters.items():
    #         query = query.where(table[field] == value)

    # if txt:
    #     txt += "%"
    #     query = query.where(
    #         ((table.idx.like(txt.replace("#", ""))) | (table.item_code.like(txt))) | (table.name.like(txt))
    #     )
    
    return frappe.db.sql(
		"""
        select
			tabItem.name,
			tabBin.warehouse
		from tabItem
		INNER JOIN tabBin ON tabItem.name = tabBin.item_code
		WHERE tabItem.docstatus < 2
			and tabItem.disabled=0
			and tabItem.has_variants=0
			and tabBin.warehouse = %(warehouse)s
		order by
			tabItem.name, item_name""", 
        filters,
		as_dict=False,
	)

def execute(doctype, *args, **kwargs):
	return DatabaseQuery(doctype).execute(*args, **kwargs)

def parse_json(data):
	if (filters := data.get("filters")) and isinstance(filters, str):
		data["filters"] = json.loads(filters)
	if (applied_filters := data.get("applied_filters")) and isinstance(applied_filters, str):
		data["applied_filters"] = json.loads(applied_filters)
	if (or_filters := data.get("or_filters")) and isinstance(or_filters, str):
		data["or_filters"] = json.loads(or_filters)
	if (fields := data.get("fields")) and isinstance(fields, str):
		data["fields"] = ["*"] if fields == "*" else json.loads(fields)
	if isinstance(data.get("docstatus"), str):
		data["docstatus"] = json.loads(data["docstatus"])
	if isinstance(data.get("save_user_settings"), str):
		data["save_user_settings"] = json.loads(data["save_user_settings"])
	else:
		data["save_user_settings"] = True
	if isinstance(data.get("start"), str):
		data["start"] = cint(data.get("start"))
	if isinstance(data.get("page_length"), str):
		data["page_length"] = cint(data.get("page_length"))

def clean_params(data):
	for param in ("cmd", "data", "ignore_permissions", "view", "user", "csrf_token", "join"):
		data.pop(param, None)

def validate_args(data):
	parse_json(data)

	data.strict = None

	return data

def get_form_params():
	"""parse GET request parameters."""
	data = frappe._dict(frappe.local.form_dict)
	clean_params(data)
	validate_args(data)
	return data

@frappe.whitelist()
def get_warehouse_items_select2():   
    try:
        
        args = get_form_params()

        # return args["filters"]["warehouse"]
    
        items = frappe.db.sql(
            """
            SELECT
                tabItem.name,
                tabItem.item_name,
                tabItem.item_code,    
                tabItem.brand,
                tabItem.image,
                tabBin.warehouse,
                tabBin.actual_qty,
                `tabItem Price`.currency,
                `tabItem Price`.price_list_rate
            FROM tabItem
            INNER JOIN tabBin ON tabItem.name = tabBin.item_code
            INNER JOIN `tabItem Price` ON tabItem.item_code = `tabItem Price`.item_code
            WHERE tabItem.docstatus < 2
                AND tabItem.disabled = 0
                AND tabItem.has_variants = 0
                AND tabBin.warehouse = %s
            ORDER BY tabItem.name
            """, 
            args["filters"]["warehouse"],
            as_dict=True  # Get results as a list of dictionaries
        )
        
        response = {
            "results": [{"id": idx + 1, "text": f"{item['brand']}•{item['item_code']}•{item['item_name']}•{item['currency']} {item['price_list_rate']}"} for idx, item in enumerate(items)],
            "pagination": {
                "more": False  # Check if there are more results
            }
        }


        return response

        
    except Exception as e:
        return e    
    

@frappe.whitelist()
def get_stock_entries_per_material_request(material_request, docstatus = 0):
    try:
        return frappe.db.get_list('Stock Entry', fields=['*'], filters= {"material_request_no": material_request, "docstatus": docstatus })
    except:
        return []

class MaterialRequest(Document):
    def autoname(self):
        # Custom autoname format: {prefix}-{month}-{year}-{nextnumber 8 digits}-{random 6 digits}
        
        # Define the static parts
        prefix = "MAT-MR-"
        month = nowdate().split('-')[1]  # Get current month (01, 02, ..., 12)
        year = nowdate().split('-')[0]  # Get current year (2025)
        
        # Generate next sequential number with 8 digits
        next_number = self.get_next_number(month, year)
        
        # Generate random 6-digit number
        random_digits = ''.join(random.choices(string.digits, k=6))

        prefix = 'MAT-MR'
        self.name = f"{prefix}-{month}-{year}-{next_number}-{random_digits}"

    def get_next_number(self, month, year):
        """
        This method calculates the next sequential number for the format:
        {prefix}-{month}-{year}-{nextnumber}.
        
        It checks for the highest number already in the system for the given month and year.
        """
        # Query to get the highest next number for this year and month
        last_number = frappe.db.sql("""
            SELECT MAX(CAST(SUBSTRING(name, 9, 8) AS UNSIGNED)) 
            FROM `tabMaterial Request` 
            WHERE name LIKE %s
        """, (f"MR-{month}-{year}-%"))

        # If no records found, start from 1
        next_number = 1 if not last_number[0][0] else last_number[0][0] + 1
        # Return next number as a zero-padded 8-digit number
        return str(next_number).zfill(8)