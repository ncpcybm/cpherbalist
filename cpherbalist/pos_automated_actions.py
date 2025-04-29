
import frappe
from frappe.utils import nowdate, nowtime, today
from frappe import _

@frappe.whitelist()
def close_pos_profiles_and_send_email():
    # Fetch all open POS Profiles
    pos_profiles = frappe.get_all('POS Profile', filters={'status': 'Open'})
    
    # Close POS Profiles and create a closing entry
    for pos_profile in pos_profiles:
        pos_profile_doc = frappe.get_doc('POS Profile', pos_profile.name)
        pos_profile_doc.status = 'Closed'
        pos_profile_doc.save()
        
        # Generate Closing Entry (can be customized as per need)
        closing_entry = frappe.get_doc({
            'doctype': 'POS Closing Entry',
            'pos_profile': pos_profile.name,
            'date': nowdate(),
            'closing_time': nowtime()
        })
        closing_entry.insert()
        
        # Send Email with closing entry details
        #send_closing_email(pos_profile.name, closing_entry)

def send_closing_email(pos_profile_name, closing_entry):
    subject = f"POS Profile {pos_profile_name} Closing Entry"
    content = f"The POS Profile {pos_profile_name} has been closed. Here are the details:\n\n{closing_entry}"
    
    recipients = ['nicolas_ppelis@cybeem.com']  
    frappe.sendmail(
        recipients=recipients,
        subject=subject,
        message=content
    )

def bypass_permission_check():
    if 'MDG - POS User' in frappe.get_roles():
        # User has the 'System Manager' role, so ignore permissions
        ignore_permissions = True
    else:
        ignore_permissions = False

def get_pos_opening_entries(pos_profile):
    ignore_permissions = True
    # Query the "POS Opening Entry" doctype
    entries = frappe.get_all(
        'POS Opening Entry',  # Doctype name
        filters={
            'pos_profile': pos_profile,  # Specific POS profile
            'status': 'Open'  # Status should be "Open"
        },
        fields=['name', 'pos_profile', 'status', 'posting_date']  # Fields to fetch
    )
    return entries

@frappe.whitelist()
def get_user_pos_profile(user):
    pos_profile = frappe.get_value("User", user, "pos_profile")  # Modify the field name here
    return pos_profile