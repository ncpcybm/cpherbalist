import http.client
import json

from typing import TYPE_CHECKING, overload

import frappe
from frappe import _, _dict

from frappe.utils import (
	cstr,
	flt,
	formatdate,
	get_link_to_form,
	now_datetime,
	strip,
	strip_html,
	get_datetime, 
	now
)

import requests

# Global variables
consumer_key = frappe.db.get_single_value("CP Settings", "wp_consumer_key") # 'ck_59bc701926376bf624fe8d343816f69b0286d198'
consumer_secret = frappe.db.get_single_value("CP Settings", "wp_consumer_secret") # 'cs_bf66f522851721f946ea6cfc3b7ce3615d6506df'
endpoint_uri = frappe.db.get_single_value("CP Settings", "wp_endpoint_url") # 'staging1.cpherbalist.com'

# Endpoint: cpherbalist.wc_extensions.xxx

# NOT USED SHALL BE REMOVED
@frappe.whitelist()
def wc_retrieve_coupon(s_coupon_code): 
    conn = http.client.HTTPSConnection(endpoint_uri)
    
    payload = json.dumps({
    "code": s_coupon_code,
    "discount_type": "percent",
    "amount": "10",
    "individual_use": True,
    "exclude_sale_items": True,
    "minimum_amount": "100.00",
    "usage_limit": 0,
    "usage_limit_per_user": 0
    })

    headers = {
        'Content-Type': 'application/json'
    }

    conn.request("GET", f"/wp-json/wc/v3/coupons/{s_coupon_code}?consumer_key={consumer_key}&consumer_secret={consumer_secret}", payload, headers)
    res = conn.getresponse()
    data = res.read()

    return frappe._dict(data = data.decode("utf-8"))

@frappe.whitelist()
def sync_wc_coupons(): 
    conn = http.client.HTTPSConnection(endpoint_uri)
    
    payload = ''
    
    headers = {
        'Accept': 'application/json'
    }
    
    # conn.request("GET", "/wp-json/wc/v3/coupons?consumer_key=ck_dda38cb5d37ebeb33dd5ad00e32d872095d2ec96&consumer_secret=cs_61a70c593f50a5c76fe8ad2e42b6e58035895f0f&per_page=150", payload, headers)
    conn.request("GET", f"/wp-json/wc/v3/coupons?consumer_key={consumer_key}&consumer_secret={consumer_secret}&per_page=150", payload, headers)

    res = conn.getresponse()
    data = res.read()

    coupons = data.decode("utf-8")
    couponsJSON = json.loads(coupons)
    
    # frappe.log_error(f"⚠️ ",type(json.loads(coupons)))
    
    for coupon in couponsJSON:
        frappe.log_error(f"⚠️ [sync_wc_coupons] Coupon", coupon['id'])
        
        code = coupon['code']
        id = coupon['id']
        minAmount = coupon['minimum_amount']
        amount = coupon['amount']
        
        customer = "Walkin Customer" 
        
        if False:
            if coupon['email_restrictions'] == [] or coupon['email_restrictions'] == "" or coupon['email_restrictions'] == None:
                customer = coupon['email_restrictions']

        create_erp_coupon_from_wc(code,id,amount,customer)


@frappe.whitelist()       
def create_erp_coupon_from_wc(s_coupon_code, s_description, s_wc_coupon_code, f_custom_amount, s_for_user, s_valid_upto):    
    """create_erp_coupon_from_wc

    Args:
        s_coupon_code (_type_): _description_
        s_description (_type_): _description_
        s_wc_coupon_code (_type_): _description_
        f_custom_amount (_type_): _description_
        s_for_user (_type_): _description_
        s_valid_upto (_type_): _description_
    """    
    
    frappe.log_error(f"⚠️ [create_erp_coupon_from_wc] s_coupon_code", s_coupon_code)
    frappe.log_error(f"⚠️ [create_erp_coupon_from_wc] s_coupon_code", s_coupon_code)
    frappe.log_error(f"⚠️ [create_erp_coupon_from_wc] s_wc_coupon_code", s_wc_coupon_code)

    frappe.log_error(f"⚠️ [create_erp_coupon_from_wc] f_custom_amount", f_custom_amount)
    frappe.log_error(f"⚠️ [create_erp_coupon_from_wc] s_for_user", s_for_user)
    frappe.log_error(f"⚠️ [create_erp_coupon_from_wc] s_valid_upto", s_valid_upto)

    if not frappe.db.exists("Coupon Code", s_coupon_code):
        coupon_code = frappe.get_doc(
			{
				"doctype": "Coupon Code",
				"coupon_name": s_coupon_code,
				"coupon_code": s_coupon_code,
                "description": s_description,
				"maximum_use": 1,
				"used": 0,
                "custom_amount" : f_custom_amount,
                "custom_min_amount" : f_custom_amount,
                "custom_woocommerce_coupon": s_wc_coupon_code,
                "customer": "Walkin Customer",
                "coupon_type": "Gift Card",
                "valid_upto": s_valid_upto

			})
        coupon_code.insert()

@frappe.whitelist()
def erp_create_coupon(s_coupon_code, s_wc_coupon_code): 
    if not frappe.db.exists("Coupon Code", s_coupon_code):
        coupon_code = frappe.get_doc(
			{
				"doctype": "Coupon Code",
				"coupon_name": s_coupon_code,
				"coupon_code": s_coupon_code,
                "coupon_type": "Gift Card",
				"maximum_use": 1,
				"used": 0,
                "custom_woocommerce_coupon": s_coupon_code,
                "customer": "Walkin Customer"
			})
        coupon_code.insert()


# TODO: UPDATE 26052025
@frappe.whitelist(allow_guest=True)
def wc_update_coupon(s_coupon_code, f_amount, s_discount_type = "fixed_cart", d_expiry_date = None, s_customer_email = {}, i_usage_limit = -1, i_usage_limit_per_user = 1):

    # fixed_cart, percent, fixed_product and percent_product
    coupon = frappe.get_doc('Coupon Code', s_coupon_code)
    coupon.amount = f_amount
    coupon.valid_upto = d_expiry_date
    coupon.save()

    get_url = f"https://{endpoint_uri}/wp-json/cp/v1/wc/coupon/meta?code={s_coupon_code}"
    frappe.log_error(f"⚠️ url ", get_url)

    response = requests.get(get_url)
    
    frappe.log_error(f"⚠️ response ", response)

    if response.status_code == 200:
        try:
            metadata = response.json()
        except requests.exceptions.JSONDecodeError:
            frappe.log_error(f"⚠️ Error decoding JSON: {response.text}")
            return {"error": "Invalid JSON response", "response": response.text}
    else:
        frappe.log_error(f"⚠️ Failed request with status: {response.status_code}", response.text)
        return {"error": "Request failed", "status_code": response.status_code, "response": response.text}


    if metadata.get("success"):

        data = metadata["data"]
        coupon_id = data["id"]

        frappe.log_error(f"⚠️ [d_expiry_date] d_expiry_date", d_expiry_date)
        frappe.log_error(f"⚠️ [coupon_id] coupon_id", coupon_id)
        frappe.log_error(f"⚠️ [s_customer_email] s_customer_email", s_customer_email)
        frappe.log_error(f"⚠️ [s_discount_type] s_discount_type", s_discount_type)

        update_url = f"https://{endpoint_uri}/wp-json/wc/v3/coupons/{coupon_id}?consumer_key={consumer_key}&consumer_secret={consumer_secret}"

        payload = json.dumps({
            "amount": f"{f_amount}",
            "minimum_amount": f"{f_amount}",
            "date_expires": f"{d_expiry_date}",
            "usage_limit": i_usage_limit,
            "usage_limit_per_user": i_usage_limit_per_user,
            "discount_type" : s_discount_type,
            "email_restrictions": s_customer_email
        })

        headers = {
            "Content-Type": "application/json"
        }

        put_response = requests.put(
            update_url,
            headers=headers,
            data=payload
        )

        # Print response
        frappe.log_error(f"⚠️ [wc_update_coupon] Response", put_response.content.decode())
        
        return {"PUT Response:":put_response}
        # print(put_response.json())
    else:
        return {"Failed to retrieve coupon metadata:" : metadata}

@frappe.whitelist(allow_guest=True)
def wc_create_coupon(
    s_coupon_code = None,
    s_discount_type = "fixed_cart",
    f_amount = 0.00,
    b_individual_use=  True,
    b_exclude_sale_items =True,
    f_minimum_amount = 0.00,
    i_usage_limit = -1,
    i_usage_limit_per_user = 1,
    d_expiry_date = None,
    s_customer_email = {})-> dict:
    
    # timestamp = datetime.now()
    # timestamp_str = timestamp.strftime("%Y%m%d%H%M%S")
    # couponCode = frappe.generate_hash()[:12].upper()

    conn = http.client.HTTPSConnection(endpoint_uri)
    
    if i_usage_limit == -1:
        payload = json.dumps({
            "code": s_coupon_code,
            "discount_type": s_discount_type,
            'description': 'Generated from POS - ' + s_coupon_code,
            "amount": str(f_amount),
            "individual_use": b_individual_use,
            "exclude_sale_items": b_exclude_sale_items,
            "minimum_amount": str(f_amount),
            "usage_limit_per_user": i_usage_limit_per_user,
            "expiry_date" : d_expiry_date,
            "email_restrictions": s_customer_email
            })
    else:
        payload = json.dumps({
            "code": s_coupon_code,
            "discount_type": s_discount_type,
            'description': 'Generated from POS - ' + s_coupon_code,
            "amount": str(f_amount),
            "individual_use": b_individual_use,
            "exclude_sale_items": b_exclude_sale_items,
            "minimum_amount": str(f_amount),
            "usage_limit": i_usage_limit,
            "usage_limit_per_user": i_usage_limit_per_user,
            "expiry_date" : d_expiry_date,
            "email_restrictions": s_customer_email
            })
    
    
    headers = {
        'Content-Type': 'application/json'
    }

    conn.request("POST", f"/wp-json/wc/v3/coupons?consumer_key={consumer_key}&consumer_secret={consumer_secret}", payload, headers)
    res = conn.getresponse()
    data = res.read()

    return frappe._dict(data = data.decode("utf-8"))

    # return frappe._dict(coupon_code = s_coupon_code,
    #                     discount_type = s_discount_type,
    #                     amount = f_amount,
    #                     individual_use = b_individual_use,
    #                     exclude_sale_items = b_exclude_sale_items,
    #                     minimum_amount = f_minimum_amount,
    #                     usage_limit = i_usage_limit,
    #                     usage_limit_per_user = i_usage_limit_per_user)