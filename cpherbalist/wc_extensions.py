import http.client
import json
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Tuple
from datetime import datetime


from typing import TYPE_CHECKING, overload

import erpnext


import frappe
from frappe import _, _dict

import random
import string

from frappe.utils import (
	cint,
	cstr,
	flt,
	formatdate,
	get_link_to_form,
	getdate,
	now_datetime,
	nowtime,
	strip,
	strip_html,
	get_datetime, 
	now
)

# Endpoint: cpherbalist.wc_extensions.xxx

@frappe.whitelist()
def wc_retrieve_coupon(s_coupon_code): 
    conn = http.client.HTTPSConnection("staging1.cpherbalist.com")
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
    conn.request("GET", "/wp-json/wc/v3/coupons/" + s_coupon_code + "?consumer_key=ck_0be380e1a5cd09c973cb18c391a1f09089284e20&consumer_secret=cs_19e23f95b129bbfd77f518900170744e777d2a65", payload, headers)
    res = conn.getresponse()
    data = res.read()

    return frappe._dict(data = data.decode("utf-8"))

@frappe.whitelist()
def sync_wc_coupons(): 
    conn = http.client.HTTPSConnection("staging1.cpherbalist.com")
    payload = ''
    headers = {
        'Accept': 'application/json'
    }
    conn.request("GET", "/wp-json/wc/v3/coupons?consumer_key=ck_0be380e1a5cd09c973cb18c391a1f09089284e20&consumer_secret=cs_19e23f95b129bbfd77f518900170744e777d2a65&per_page=100", payload, headers)
    
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
                "custom_woocommerce_coupon": s_wc_coupon_code,
                "customer": "Walkin Customer"
			})
        coupon_code.insert()



@frappe.whitelist()
def wc_update_coupon(coupon_code, amount):
    # Example logic
    coupon = frappe.get_doc('Coupon Code', coupon_code)
    coupon.amount = amount
    coupon.save()
    return {"status": "success"}

@frappe.whitelist()
def wc_create_coupon(
    s_coupon_code = None,
    s_discount_type = "percent",
    f_amount = 0,
    b_individual_use=  True,
    b_exclude_sale_items =True,
    f_minimum_amount = 100.00,
    i_usage_limit = -1,
    i_usage_limit_per_user = 1,
    d_expiry_date = None,
    s_customer_email = {})-> dict:
    
    timestamp = datetime.now()
    timestamp_str = timestamp.strftime("%Y%m%d%H%M%S")

    couponCode = frappe.generate_hash()[:12].upper()

    conn = http.client.HTTPSConnection("staging1.cpherbalist.com")
    
    
    if i_usage_limit == -1:
        payload = json.dumps({
            "code": "pos_" + s_coupon_code,
            "discount_type": s_discount_type,
            'description': 'Generated from POS - ' + s_coupon_code,
            "coupon_amount": f_amount,
            "individual_use": b_individual_use,
            "exclude_sale_items": b_exclude_sale_items,
            "minimum_amount": str(f_minimum_amount),
            "usage_limit_per_user": i_usage_limit_per_user,
            "expiry_date" : d_expiry_date,
            "email_restrictions": s_customer_email
            })
    else:
        payload = json.dumps({
            "code": "pos_" + s_coupon_code,
            "discount_type": s_discount_type,
            'description': 'Generated from POS - ' + s_coupon_code,
            "coupon_amount": f_amount,
            "individual_use": b_individual_use,
            "exclude_sale_items": b_exclude_sale_items,
            "minimum_amount": str(f_minimum_amount),
            "usage_limit": i_usage_limit,
            "usage_limit_per_user": i_usage_limit_per_user,
            "expiry_date" : d_expiry_date,
            "email_restrictions": s_customer_email
            })
    
    
    headers = {
    'Content-Type': 'application/json'
    }
    conn.request("POST", "/wp-json/wc/v3/coupons?consumer_key=ck_0be380e1a5cd09c973cb18c391a1f09089284e20&consumer_secret=cs_19e23f95b129bbfd77f518900170744e777d2a65", payload, headers)
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