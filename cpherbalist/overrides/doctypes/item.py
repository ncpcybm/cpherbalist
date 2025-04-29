

from __future__ import unicode_literals
import frappe 
import erpnext
import json

from frappe import log, _
from frappe.utils import (
	add_months,
	cint,
	flt,
	get_last_day,
	get_link_to_form,
	getdate,
	is_last_day_of_the_month,
	nowdate,
	today,
    nowtime,
    parse_json
)
from frappe.utils.user import get_users_with_role


from erpnext.stock.doctype.item.item import Item
from erpnext.stock.doctype.item_default.item_default import ItemDefault



class ItemExtensions(Item):
    
    def set_opening_stock(self):
        if self:
            frappe.log_error(frappe.get_traceback(), self.custom_default_warehouse)
        
        """set opening stock"""
        if not self.is_stock_item or self.has_serial_no or self.has_batch_no:
            return
        
        if not self.valuation_rate and not self.standard_rate and not self.is_customer_provided_item:
            frappe.throw(_("Valuation Rate is mandatory if Opening Stock entered"))
            
        from erpnext.stock.doctype.stock_entry.stock_entry_utils import make_stock_entry
        
        # default warehouse, or Stores
        for default in self.item_defaults or [
			frappe._dict({"company": frappe.defaults.get_defaults().company})
		]:
            default_warehouse = default.default_warehouse or frappe.db.get_single_value(
				"Stock Settings", "default_warehouse"
			)
            
            if default_warehouse:
                warehouse_company = frappe.db.get_value("Warehouse", default_warehouse, "company")

            if not default_warehouse or warehouse_company != default.company:
                default_warehouse = frappe.db.get_value(
					"Warehouse", {"warehouse_name": _("Stores"), "company": default.company}
				)

            if self.custom_default_warehouse:
                default_warehouse = self.custom_default_warehouse
                
            if default_warehouse:
                stock_entry = make_stock_entry(
					item_code=self.name,
					target=default_warehouse,
					qty=self.opening_stock,
					rate=self.valuation_rate or self.standard_rate,
					company=default.company,
					posting_date=getdate(),
					posting_time=nowtime(),
				)

            
            stock_entry.add_comment("Comment", _("Opening Stock for <b>{0}</b> with <b>QTY:{1}</b> @ <b/>Warehouse:{2}</b>.").format(self.name,self.opening_stock,default_warehouse))
            
    def update_item_price(self):
        
        frappe.log_error(f"Pricing Rule for {self.name} updated successfully.")
        frappe.log_error(f"New Price: {self.standard_rate}")

        
        item_code = self.item_name  
        new_price = self.standard_rate

        # price_list_name = frappe.db.get_value("Item Price", {"item_code": item_code}, "price_list")


        # item_price = frappe.get_doc("Item Price", {"item_code": item_code, "price_list": price_list_name})

        # if item_price:
        #     # Update the price in the record
        #     item_price.price_list_rate = new_price
        #     item_price.save()
        #     frappe.db.commit()  # Commit the changes to the database
        #     frappe.log_error(f"Price for item {item_code} in price list {price_list_name} updated to {new_price}.")
        # else:
        #     frappe.log_error(f"Item Price record not found for item {item_code} and price list {price_list_name}.")
    

        frappe.db.sql(
            """
            UPDATE `tabItem Price`
            SET
                item_name=%(item_name)s,
                item_description=%(item_description)s,
                brand=%(brand)s,
                price_list_rate=%(standard_rate)s
            WHERE item_code=%(item_code)s
            """,
        dict(
            item_name=self.item_name,
            item_description=self.description,
            brand=self.brand,
            item_code=self.name,
            standard_rate=new_price
        )        
    )