from collections.abc import Iterable
from datetime import timedelta

import frappe
from frappe import _
import json

from frappe.utils import today, getdate, nowdate
from datetime import datetime

import erpnext
from erpnext.accounts.doctype.pricing_rule.utils import validate_coupon_code
from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_pos_reserved_qty

from frappe.utils.data import sha256_hash

from frappe.utils.password import check_password, get_decrypted_password


from cpherbalist.frappe_helpers import get_settings, get_specific_setting, get_current_pos




'''
=========================================
'''
@frappe.whitelist(allow_guest=True)
def get_invoices_for_template(parent_invoice):
    # Call the get_child_invoices method
    child_invoices = get_child_invoices(parent_invoice)
    
    # Render your template with the result
    return frappe.render_template('templates/pages/pos_invoice/render_child_invoices_template.html', {
        'child_invoices': child_invoices
    })
    
    
    
    
    
'''
=========================================
'''
@frappe.whitelist()
def get_related_invoices(filters) : 
    try:
        python_object = json.loads(filters)
        
        result = frappe.db.sql(f"""SELECT name FROM `tabPOS Invoice` WHERE name = %(invoice_name)s OR custom_parent_invoice = %(invoice_name)s AND docstatus = 1;""",
                            dict(invoice_name = python_object.get("invoice_name")),
                            as_dict=True)

        if result:
            return result  
        else:
            return None  

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"Error while fetch related invoices: {str(e)}")
        return None
'''
=========================================
'''
@frappe.whitelist()
def get_child_invoices(filters):
    try:

        python_object = json.loads(filters)
        results = frappe.db.sql(f"""SELECT name FROM `tabPOS Invoice` WHERE name = %(parent_invoice)s OR custom_parent_invoice = %(parent_invoice)s AND docstatus = 1;""",
                                dict(
                                    parent_invoice=python_object.get("parent_invoice")
                                    ),
                                as_dict=True); 
        
        return results

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"Error while fetch related invoices: {str(e)}")
        return None
'''
=========================================
'''
@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_seller_profile_users(doctype, txt, searchfield, start, page_len, filters, as_dict=False):
    try:
        doctype="User"
        # python_object = json.loads(filters)
        
        return frappe.db.sql("""SELECT uhr.parent, u.first_name, u.last_name FROM `tabUser` u INNER JOIN `tabHas Role` uhr ON u.email = uhr.parent WHERE uhr.role = 'Seller Profile' AND u.enabled = 1;"""); 
        
    except Exception as e:
        # Log the error with detailed information
        frappe.log_error(frappe.get_traceback(), f"Error while creating sales invoice and payment: {str(e)}")
        return []

@frappe.whitelist()
def validate_pin(filters, as_dict=True): 
    try:
        python_object = json.loads(filters)
        
        s_username = python_object.get("seller_profile")
        s_pin = python_object.get("pin")


        results = frappe.db.sql(f"""SELECT uhr.parent, u.first_name, u.last_name FROM `tabUser` u INNER JOIN `tabHas Role` uhr ON u.email = uhr.parent WHERE uhr.role = 'Seller Profile' AND u.enabled = 1;""",
                                dict(
                                    username=s_username,
                                    pin=s_pin
                                ),
                                as_dict=as_dict) 
        return results
    except Exception as e:
        # Log the error with detailed information
        frappe.log_error(frappe.get_traceback(), f"Error while creating sales invoice and payment: {str(e)}")
        return []

def get_auth_data_for_user(s_email):
    # Query the __Auth table using frappe's ORM system
    result = frappe.db.sql(f"""SELECT * FROM `__Auth` 
                           where doctype='User' 
                           and fieldname='password' 
                           and encrypted=0 
                           and name=%(email)s;""",
                           dict(
                               email=s_email
                            ),
                           as_list=True)
    

    if result:
        return result  # Return matching records
    else:
        return None  # No matching records found

@frappe.whitelist()
def validate_user_pin(user_email, pin):
    """check password"""
    try:
        # Step 1: Get the record for the given user from `tabUsers PIN`
        result = frappe.get_all('Users PIN', filters={'user': user_email}, fields=['name', 'pin'])

        if result[0]:
            stored_pin_hash = result[0]['pin']

            if pin == stored_pin_hash:
                return True  
            else:
                return False 
        else:
            return False  
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"{str(e)}")
        frappe.throw("Incorrect User PIN")
    
'''
=========================================
'''

@frappe.whitelist()
def create_stock_entry_against_parent_invoice_reserved_items(filters):
    python_object = json.loads(filters)
    
    
    
    results = frappe.db.sql(f"""SELECT pdi.item, pdi.item_name, pdi.qty, pdi.total_amount FROM `tabPOS Invoice` pi INNER JOIN `tabPOS Deposit Item List` pdi ON pi.name = pdi.parent WHERE pi.name = %(parent_invoice)s AND pi.docstatus = 1;""",
                            parent_invoice=python_object.get("parent_invoice"),
                            as_dict=True); 
    
    s_warehouse = 'Reserved - MDG'
    
    # Loop through each item in the result
    for item in results:
        # Create a new Stock Entry of type 'Material Issue'
        stock_entry = frappe.get_doc({
            "doctype": "Stock Entry",
            "stock_entry_type": "Material Issue",
            "items": [
                {
                    "item_code": item["item"],
                    "item_name": item["item_name"],
                    "qty": item["qty"],
                    # "t_warehouse": "Your Warehouse", 
                    "s_warehouse": s_warehouse  
                }
            ]
        })
        
        # Save the Stock Entry
        stock_entry.insert(ignore_permissions=True)
        stock_entry.submit()  # Submit if needed, or use stock_entry.save() if not needed
    
    return results

'''
=========================================
'''
@frappe.whitelist()
def get_parent_invoice_reserved_items(filters):
    python_object = json.loads(filters)
    results = frappe.db.sql(f"""SELECT pdi.item, pdi.item_name, pdi.qty, pdi.total_amount FROM `tabPOS Invoice` pi INNER JOIN `tabPOS Deposit Item List` pdi ON pi.name = pdi.parent WHERE pi.name = %(parent_invoice)s AND pi.docstatus = 1;""",
                            dict(
                                parent_invoice=python_object.get("parent_invoice")
                                ),
                            as_dict=True); 
       
    return results

'''
=========================================
'''
@frappe.whitelist()
def create_settlement_sales_invoice(filters) :
    python_object = json.loads(filters)
    result = []
    
    related_invoices = frappe.db.sql(f"""SELECT name FROM `tabPOS Invoice` WHERE name = %(parent_invoice)s OR custom_parent_invoice = %(parent_invoice)s AND docstatus = 1;""",
                        dict(
                            parent_invoice=python_object.get("parent_invoice")
                            ),
                        as_dict=True); 
    
    
    if related_invoices: 
        
        total = len(related_invoices)
        
        result = frappe._dict({
            "related_invoices": related_invoices, 
            "parent_invoice": python_object.get("parent_invoice"),
            "invoice_count": total,
            "success": True
        })
    else: 
        result = frappe._dict({
                "related_invoices": [], 
                "parent_invoice": python_object.get("parent_invoice"),
                "invoice_count": 0,
                "success": False

            })
            
    return result

@frappe.whitelist()
def t_create_payment_entry(filters) :
    try:
        
        python_object = json.loads(filters)
 
        sales_invoice_name = python_object.get("parent_invoice")

        
        sales_invoice = frappe.get_doc('Sales Invoice', sales_invoice_name)
        
        if not sales_invoice:
            frappe.throw(f"Sales Invoice {sales_invoice_name} not found.")
        
        payment_amount = 0.01
        payment_method = "Cash"
        customer_name = "Walkin Customer"
        
        
        payment_account = 'Cash - MDG'
        payment_tax_template = "Cyprus Tax - MDG"
        
        # Create a new Payment Entry Document
        payment_entry = frappe.new_doc('Payment Entry')
        
        # Set the payment entry details
        payment_entry.payment_type = 'Receive'  # 'Receive' for payment, 'Pay' for outgoing
        payment_entry.party_type = 'Customer'  # 'Customer' for receiving from a customer
        payment_entry.party = customer_name  # The customer making the payment
        # payment_entry.paid_from = 'Bank'  # You can specify the bank or payment method here
        payment_entry.mode_of_payment = payment_method
        payment_entry.paid_to = "Cash - MDG" # payment_method  # Specify the payment method
        payment_entry.paid_amount = payment_amount  # The amount being paid
        payment_entry.received_amount = payment_amount
        
        payment_entry.paid_to_account_currency = "EUR"
        
        
        payment_entry.target_exchange_rate = 1
        payment_entry.source_exchange_rate = 1
        payment_entry.base_paid_amount = 0.01
        
        # Add the reference to the Sales Invoice
        payment_entry.append('references', {
            'reference_doctype': 'Sales Invoice',
            'reference_name': sales_invoice_name,
            'total_amount': sales_invoice.outstanding_amount,  # Outstanding amount in Sales Invoice
            'outstanding_amount': sales_invoice.outstanding_amount,
            'allocated_amount': payment_amount  # Amount allocated to the invoice
        })
        
        # Save and submit the payment entry
        payment_entry.insert(
            ignore_permissions=True, # ignore write permissions during insert
            ignore_mandatory=True # insert even if mandatory fields are not set
        )
        frappe.db.commit()  # Commit changes to the database

        payment_entry.submit()

        return payment_entry.name  # Return the Payment Entry document name
        
    except Exception as e:
        # Log the error with detailed information
        frappe.log_error(frappe.get_traceback(), f"Error while creating sales invoice and payment: {str(e)}")


@frappe.whitelist()
def t_material_issue_for_settlement_sales_invoice_items(filters) :
    try:
        python_object = json.loads(filters)
 
        sales_invoice_name = python_object.get("parent_invoice")
        
        sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice_name)

        return sales_invoice
     
    except Exception as e:
        # Log the error with detailed information
        frappe.log_error(frappe.get_traceback(), f"Error while creating sales invoice and payment: {str(e)}")


@frappe.whitelist()
def t_submit_settlement_sales_invoice(filters) :
    try:
        python_object = json.loads(filters)
 
        sales_invoice_name = python_object.get("parent_invoice")
        
        sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice_name)

        sales_invoice.submit()


        return sales_invoice
     
    except Exception as e:
        # Log the error with detailed information
        frappe.log_error(frappe.get_traceback(), f"Error while creating sales invoice and payment: {str(e)}")


@frappe.whitelist()
def t_create_settlement_sales_invoice(filters) :
    try:
        
        python_object = json.loads(filters)
 
        taxes_and_charges = python_object.get("taxes_and_charges")
        customer = python_object.get("customer")
        
        
        
        # Create the Sales Invoice document
        invoice = frappe.get_doc({
            'doctype': 'Sales Invoice',
            'customer': customer,  # Replace with actual customer name or ID
            'posting_date': getdate(today()),  # Replace with actual posting date
            'due_date': getdate(today()),  # Replace with due date
            'custom_is_settlement_invoice': 1,
            'grand_total': 0.00,
            'update_stock': 1,
            'set_warehouse': 'Reserved - MDG',
            'ignore_pricing_rule': 1,
            'items': [
                {
                    'item_code': '200',  # Replace with actual item code
                    'qty': 1,  # Quantity
                    'rate': 0,  # Price per unit
                    'warehouse':'Reserved - MDG',
                },
                {
                    'item_code': 'Settlement',  # Replace with actual item code
                    'qty': 1,  # Quantity
                    'rate': 0,  # Price per unit
                    'warehouse':'Reserved - MDG',
                }
            ],
            'total_advance' : 0,
            'outstanding_amount': 0,
            'taxes_and_charges': taxes_and_charges
        })

        # Save the document
        invoice.insert(ignore_permissions=True, # ignore write permissions during insert
            ignore_mandatory=True # insert even if mandatory fields are not set)
        )
        
        frappe.db.commit()  # Commit changes to the database
        
        invoice.submit()

        
        # print(f'Sales Invoice {invoice.name} created and submitted successfully')
        return invoice
        # payment_entry = frappe.get_doc({
        #     'doctype': 'Payment Entry',
        #     'payment_type': 'Receive',  # Since it's a customer payment
        #     'party_type': 'Customer',
        #     'party': 'Walkin Customer',  # Replace with actual customer name or ID
        #     'paid_amount': invoice.grand_total,  # Set the payment amount as the total of the invoice
        #     'received_amount': invoice.grand_total,  # Set the received amount
        #     'payment_account': 'Write Off - MDG',  # Specify the payment account (can be 'Cash' or 'Bank')
        #     'reference_no': 'Payment Reference',  # You can add a reference number here
        #     'reference_date': '2025-03-12',  # Replace with the payment date
        #     'mode_of_payment': 'Cash',  # Mode of payment (e.g., 'Cash', 'Bank Transfer')
        #     'party_balance': 0,  # Set the balance to 0 if the full payment is received
        #     'advance_payment': 0,  # No advance payment in this case
        #     'received_amount_in_account_currency': invoice.grand_total,
        #     'source_exchange_rate': 1,
        #     'paid_to_account_currency':'EUR',
        #     'paid_from': 'Debtors - MDG',
        #     'paid_to': 'Bank Account - MDG',
        #     'references': [
        #         {
        #             'invoice': invoice.name,  # The sales invoice linked to the payment
        #             'invoice_type': 'Sales Invoice',  # The type of document being referenced
        #             'total_amount': invoice.grand_total,  # The total amount paid against the invoice
        #             'outstanding_amount': 0.00,  # The remaining amount after payment (set to 0.01 or a small value if fully paid)
        #             'allocated_amount': invoice.grand_total  # The allocated amount against the invoice
        #         }
        #     ]
        # })
            
        # payment_entry.insert()
        # # payment_entry.submit()

        # # Print confirmation message
        # print(f'Sales Invoice {invoice.name} created, submitted, and marked as paid via Payment Entry {payment_entry.name}')
        
        
    except Exception as e:
        # Log the error with detailed information
        frappe.log_error(frappe.get_traceback(), f"Error while creating sales invoice and payment: {str(e)}")


'''
=========================================
'''

@frappe.whitelist()
def get_deposit_invoice_per_profile(filters): 
    
       
    invoices = []
    python_object = json.loads(filters)
    results = frappe.db.sql(f"""SELECT `tabPOS Invoice`.`name`,`tabPOS Invoice`.`creation`,`tabPOS Invoice`.`idx`,`tabPOS Invoice`.`title`,`tabPOS Invoice`.`custom_item_to_reserved`,`tabPOS Invoice`.`pos_profile`,`tabPOS Invoice`.`total`,`tabPOS Invoice`.`net_total`,`tabPOS Invoice`.`total_taxes_and_charges`,`tabPOS Invoice`.`base_discount_amount`,`tabPOS Invoice`.`discount_amount`,`tabPOS Invoice`.`grand_total`,`tabPOS Invoice`.`rounding_adjustment`,`tabPOS Invoice`.`rounded_total`,`tabPOS Invoice`.`total_advance`,`tabPOS Invoice`.`outstanding_amount`,`tabPOS Invoice`.`paid_amount`,`tabPOS Invoice`.`change_amount`,`tabPOS Invoice`.`write_off_amount`,`tabPOS Invoice`.`is_discounted`,`tabPOS Invoice`.`status`,`tabPOS Invoice`.`customer`,`tabPOS Invoice`.`customer_name`,`tabPOS Invoice`.`base_grand_total`,`tabPOS Invoice`.`due_date`,`tabPOS Invoice`.`company`,`tabPOS Invoice`.`currency`,`tabPOS Invoice`.`is_return`,`tabPOS Invoice`.`modified` FROM `tabPOS Invoice` WHERE `pos_profile` = %(pos_profile)s AND `custom_is_deposit` = 1 ORDER BY `tabPOS Invoice`.`modified` desc""",
                            dict(
                                pos_profile=python_object.get("pos_profile"),
                                disabled=python_object.get("disabled", 0),
                                custom_is_deposit=python_object.get('custom_is_deposit',1),
                                ),
                            as_dict=True); 
    
    response = {
        "results": [{"id": item['name'], "text": f"{item['customer_name']} - {item['name']} @ {frappe.utils.get_datetime(item['creation'])} ({item['currency']} {item['base_grand_total']})"} for idx, item in enumerate(results)],
        "pagination": {
            "more": False  # Check if there are more results 
            }
        }
    
    return response

'''
=========================================
'''

def is_product_bundle(item_code):
    return frappe.db.exists("Product Bundle", {"new_item_code": item_code}) is not None

def get_bundle_items(bundle_item_code):
    bundle = frappe.get_doc("Product Bundle", {"new_item_code": bundle_item_code})
    return [
        {
            "name": item.name,
            "item_code": item.item_code,
            "qty": item.qty,
            "rate": item.rate
        }
        for item in bundle.items
    ] 

@frappe.whitelist()
def get_reserved_product_bundle_packing_slips():
    results = []

    # 1. Fetch POS Invoices with product bundles
    pos_items = frappe.get_all(
        "POS Invoice Item",
        filters={"docstatus": 1},  # submitted invoices only
        fields=["parent", "item_code"]
    )

    for item in pos_items:
        # Check if this item is a product bundle
        is_bundle = frappe.db.exists("Product Bundle", {"new_item_code": item.item_code})
        if not is_bundle:
            continue

        # 2. Get items in the bundle
        bundle_items = frappe.get_all(
            "Product Bundle Item",
            filters={"parent": item.item_code},
            fields=["item_code", "qty"]
        )

        # 3. Find Delivery Notes linked to this POS Invoice
        delivery_notes = frappe.db.sql("""
            SELECT dn.name 
            FROM `tabDelivery Note` dn 
            JOIN `tabDelivery Note Item` dni ON dn.name = dni.parent
            WHERE dni.against_sales_invoice = %s AND dn.docstatus = 1
        """, item.parent, as_dict=True)

        for dn in delivery_notes:
            # 4. Get packing slips for this Delivery Note
            packing_slips = frappe.get_all(
                "Packing Slip",
                filters={"delivery_note": dn.name},
                fields=["name"]
            )

            results.append({
                "pos_invoice": item.parent,
                "bundle_item": item.item_code,
                "bundle_components": bundle_items,
                "delivery_note": dn.name,
                "packing_slips": [ps.name for ps in packing_slips]
            })

    return results

@frappe.whitelist()
def _get_pos_reserved_qty(item_code, warehouse):
    
    warehouses = []
    warehouses_per_qty = []
    
    if (warehouse == 'all'):
        warehouses = frappe.get_all(
            "Warehouse",
            fields=["name", "parent_warehouse", "is_group", "disabled"],
            filters={"disabled": 0},
            order_by="lft",
        )
    
        for x in warehouses:
            reserved_qty_for_pos = get_pos_reserved_qty(item_code, x.name)
            warehouses_per_qty.append({"warehouse": x.name, "qty": reserved_qty_for_pos})
    else:
        reserved_qty_for_pos = get_pos_reserved_qty(item_code, warehouse)
    
    b_is_product_bundle = is_product_bundle(item_code)
    
    res = frappe._dict({
        "warehouse": warehouse, 
        "item_code": item_code,
        "reserved_qty_for_pos": reserved_qty_for_pos,
        "reserved_qty_for_pos_per_product_bundle": 0,
        "is_product_bundle" : b_is_product_bundle,
        "items_in_bundle" : get_bundle_items(item_code) if b_is_product_bundle else [],
        "warehouses": warehouses,
        "warehouses_per_qty": warehouses_per_qty
    })
    
    return res


@frappe.whitelist(allow_guest=True)
def apply_coupon_code(applied_code, applied_amount, transaction_id):
    the_coupon = validate_coupon_code(applied_code)
    return the_coupon


@frappe.whitelist()
def get_coupon(coupon_code):
    
    coupon = frappe.get_all(
        'Coupon Code',
        filters={'coupon_code': coupon_code},
        fields=['*']
    )
    
    coupon = coupon[0]

    if coupon:
        return coupon
    else:
        return None  # Return None if no record is found 


@frappe.whitelist()
def get_pricing_rule(pricing_rule):
    
    pricing_rule = frappe.get_all(
        'Pricing Rule',
        filters={'name': pricing_rule},
        fields=['*']
    )
    
    pricing_rule = pricing_rule[0]
    return pricing_rule

@frappe.whitelist()
def is_expired(coupon_code): 

    coupon = frappe.get_all(
        'Coupon Code',
        filters={'coupon_code': coupon_code},
        fields=['*']
    )
    
    coupon = coupon[0]

    if coupon:
        if coupon.get('valid_upto'):
            valid_upto_date = getdate(coupon['valid_upto'])  # Convert the expiration date to a date object
            current_date = getdate(today())  # Get the current date
            
            # Check if the coupon has expired
            if valid_upto_date < current_date:
                return None
                #{"message": "Coupon has expired."}


        return coupon  # Return the first result if found
    else:
        return None  # Return None if no record is found
    
'''
=========================================
'''
@frappe.whitelist()
def is_valid(coupon_code): 
    is_valid = False
    coupon = frappe.get_all(
        'Coupon Code',
        filters={'coupon_code': coupon_code},
        fields=['*']
        )
    
    coupon = coupon[0]
    
    if coupon:
        is_valid = coupon.used >= 1
    
    return is_valid
            

@frappe.whitelist()
def update_coupon_balance(coupon_code, balance):
    frappe.db.set_value('Coupon Code',coupon_code, {'custom_amount': balance})

@frappe.whitelist()
def redeem_coupon(coupon_code):
    from erpnext.accounts.doctype.pricing_rule.utils import update_coupon_code_count
    
    try:
        update_coupon_code_count(coupon_code, "used")
        return True
    except Exception as e:
        frappe.log_error(f"Failed to redeem coupon {coupon_code}: {str(e)}", "Coupon Redemption Error")
        return False  

@frappe.whitelist()
def reactivate_coupon(coupon_code, balance):
    from erpnext.accounts.doctype.pricing_rule.utils import update_coupon_code_count
    update_coupon_code_count(coupon_code, "cancelled")
    frappe.db.set_value('Coupon Code',coupon_code, {'custom_amount': balance})
    #frappe.db.set_value('Coupon Code',coupon_code, {'used', 1})

@frappe.whitelist()
def get_subtotal_with_coupons(coupon_codes): 
    currency = frappe.db.get_default("currency")
    input_str = coupon_codes
    _coupon_codes = [line.strip() for line in input_str.replace(',', '\n').splitlines() if line.strip()]
    total_discount = 0
    message = ""    

    for c in _coupon_codes:
        coupon = frappe.get_all(
            'Coupon Code',
            filters={'coupon_code': c},
            fields=['*']
        )
        
        if coupon:   
            coupon = coupon[0]
            frappe.msgprint(f"Coupon {coupon.name} : <b>{currency} {coupon.custom_amount}</b>") 
            message += f"Coupon {coupon.name}: {currency} {coupon.custom_amount}\n";
            total_discount += coupon.custom_amount
        else:
            frappe.msgprint(f"No coupon found for code: {c}")
            
    message += f"Total Voucher Amount: {currency} {total_discount}"

    #return total_discount
    return {
        "total_discount": total_discount,
        "message": message
    }
        
def get_pricing_rule_for_coupon(coupon_code):
    # Query the coupon code document to get the associated pricing rule
    coupon = frappe.get_all('Coupon Code', filters={'coupon_code': coupon_code}, fields=['name', 'pricing_rule'])
    
    if not coupon:
        return None
    
    # Extract the pricing rule from the coupon document
    pricing_rule = coupon[0].get('pricing_rule')
    
    if not pricing_rule:
        return None
    
    # Get details of the pricing rule
    pricing_rule_details = frappe.get_doc('Pricing Rule', pricing_rule)
    
    return pricing_rule_details

def calculate_discount(pricing_rule, total_amount):
    """
    Calculate the discount based on the pricing rule
    """
    if pricing_rule.discount_type == 'Percentage':
        discount = total_amount * (pricing_rule.discount_percentage / 100)
    elif pricing_rule.discount_type == 'Amount':
        discount = pricing_rule.discount_amount
    else:
        discount = 0

    # Make sure discount doesn't exceed the total amount
    discount = min(discount, total_amount)
    
    return discount

@frappe.whitelist()
def get_available_qty_per_warehouse(item_code): 
    bin_qty = frappe.db.sql("""select actual_qty,warehouse from `tabBin` where item_code = %s""", (item_code),as_dict=1)
    return bin_qty