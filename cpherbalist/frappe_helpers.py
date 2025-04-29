import frappe



# A helper function to fetch settings
def get_settings(doc_type='Michalis Diamond Gallery Settings'):
    """Retrieve settings of a specific DocType."""
    try:
        settings = frappe.get_single(doc_type)
        return settings
    except Exception as e:
        frappe.log_error(f"Error retrieving settings for {doc_type}: {str(e)}")
        return None

# A helper function to fetch a specific setting by its fieldname
def get_specific_setting(doc_type='Michalis Diamond Gallery Settings', fieldname='setting_name'):
    """Retrieve a specific setting value from a single doc."""
    try:
        settings = get_settings(doc_type)
        if settings:
            return getattr(settings, fieldname, None)
        else:
            return None
    except Exception as e:
        frappe.log_error(f"Error retrieving specific setting {fieldname}: {str(e)}")
        return None

# A helper function to get the current position (or whatever "current_pos" represents)
def get_current_pos(doc_type='Position Settings'):
    """Retrieve current position or other relevant info from a custom doc."""
    try:
        current_pos = frappe.get_all(doc_type, filters={'status': 'Active'}, fields=['position'])
        if current_pos:
            return current_pos[0].get('position')
        else:
            return None
    except Exception as e:
        frappe.log_error(f"Error retrieving current position: {str(e)}")
        return None

# Example of wrapping more complex logic (could be anything specific to your system)
def get_user_info(user_email):
    """Retrieve user details based on email."""
    try:
        user = frappe.get_all('User', filters={'email': user_email}, fields=['name', 'email', 'full_name'])
        if user:
            return user[0]
        else:
            return None
    except Exception as e:
        frappe.log_error(f"Error retrieving user info for {user_email}: {str(e)}")
        return None
