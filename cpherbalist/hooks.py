app_name = "cpherbalist"
app_title = "Cpherbalist"
app_publisher = "cybeem"
app_description = "CP Specific configurations"
app_email = "contact@cybeem.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "cpherbalist",
# 		"logo": "/assets/cpherbalist/logo.png",
# 		"title": "Cpherbalist",
# 		"route": "/cpherbalist",
# 		"has_permission": "cpherbalist.api.permission.has_app_permission"
# 	}
# ]

add_to_apps_screen = [
    {
        "name": "cpherbalist",
        "logo": " /assets/cpherbalist/img/cpherbalist-logo-black.png",
        "title": "POS",
        "route": "app/point-of-sale",
        "has_permission": "erpnext.check_app_permission",

    }
]


website_context = {
	"favicon": "/assets/erpnext/images/erpnext-favicon.svg",
	"splash_image": "http://91.107.236.18/files/cpherbalist-logo-black.png",
}

# Includes in <head>
# ------------------ 

# include js, css files in header of desk.html
app_include_css = "/assets/cpherbalist/css/cpherbalist.css"

# app_include_js = "cpherbalist.bundle.js"

app_include_js = ["/assets/cpherbalist/js/cpherbalist.js",
                  "/assets/cpherbalist/js/custom_item.js",
                  "/assets/cpherbalist/js/stock_entry.js",
                  "/assets/cpherbalist/js/utils.js",
                  "/assets/cpherbalist/js/pos_invoice_coupon.js",
                  "/assets/cpherbalist/js/coupon_extensions.js",
                  "/assets/cpherbalist/js/manufacturing_extensions.js", 
                  "/assets/cpherbalist/js/customer_extensions.js", 
                  "/assets/cpherbalist/js/customer_list.js",
                  "/assets/cpherbalist/js/clear_pos_on_logout.js",
                ]



# include js, css files in header of web template
web_include_css = "/assets/cpherbalist/css/cpherbalist.css"

# web_include_js = ["/assets/cpherbalist/js/cpherbalist.js", 
#                   "/assets/cpherbalist/js/utils.js", 
#                   "/assets/cpherbalist/js/autoapply_coupon_on_pos.js"
#                   ]

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "cpherbalist/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

page_js = {"point-of-sale" : [ 
    "public/js/custom_item.js", 
    "public/js/pos_item_selector_extension.js",
    "public/js/pos_custom.js"
    ]
    
    }

# include js in doctype views

# after_migrate = ["cpherbalist.stock_entry_extensions.enqueue_stock_transfer"]

doctype_js = {
	"Material Request" : "public/js/material_request_custom.js",
    # "Item Repairing": "public/js/item_repair.js",
    # "Delivery Note MDG" : "public/js/custom_delivery_notes.js"
}



# doctype_list_js = {
#     "Customer" : "public/js/customer_list.js"
# }

# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "cpherbalist/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "cpherbalist.utils.jinja_methods",
# 	"filters": "cpherbalist.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "cpherbalist.install.before_install"
# after_install = "cpherbalist.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "cpherbalist.uninstall.before_uninstall"
# after_uninstall = "cpherbalist.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "cpherbalist.utils.before_app_install"
# after_app_install = "cpherbalist.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "cpherbalist.utils.before_app_uninstall"
# after_app_uninstall = "cpherbalist.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "cpherbalist.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

override_doctype_class = {
    # "POS Invoice": "cpherbalist.overrides.pos_invoice.CustomPOSInvoice",
    "Item": "cpherbalist.overrides.doctypes.item.ItemExtensions"
}

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

doc_events = {
    "POS Invoice": {
        "on_submit" :"cpherbalist.overrides.pos_invoice.custom_on_submit",
        # "before_insert": "cpherbalist.pos_invoice_hooks.custom_autoname",
        # "on_submit": "cpherbalist.pos_invoice_hooks.rename_on_paid",

        # "before_submit": "cpherbalist.api.handle_pos_invoice_submit",
        # "validate": "your_app.api.validate_pos_invoice"
    },
    # "Work Order": {
    #     # "after_insert": "cpherbalist.api.submit_wo",
    #     # "on_submit": "cpherbalist.api.on_wo_submitted",
    #     # "valid1ate": "your_app.api.validate_pos_invoice"
    # },
    "Material Request": {
        # "after_insert": "cpherbalist.api.submit_matrial_request",
        # "valid1ate": "your_app.api.validate_pos_invoice"
    },
    "Coupon Code": {
        "after_insert": "cpherbalist.api.wc_coupon_sync"
    },
    "Customer": {
        "after_insert": "cpherbalist.overrides.customer.after_insert_customer"
    }
}



# Scheduled Tasks
# ---------------
scheduler_events = {
    "cron": {
        "0 2 * * *": [
            "cpherbalist.pos_writeoff.write_off_unpaid_pos_invoices"
        ]
    }
}
# scheduler_events = {
# 	"all": [
# 		"cpherbalist.tasks.all"
# 	],
# 	"daily": [
# 		"cpherbalist.tasks.daily"
# 	],
# 	"hourly": [
# 		"cpherbalist.tasks.hourly"
# 	],
# 	"weekly": [
# 		"cpherbalist.tasks.weekly"
# 	],
# 	"monthly": [
# 		"cpherbalist.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "cpherbalist.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "cpherbalist.event.get_events"
# }


override_whitelisted_methods = {
    'cpherbalsit.api.qr_code.get_qr_base64': 'cpherbalsit.qr_code.get_qr_base64',
    'cpherbalsit.api.qr_code.get_qr_jpg' : 'cpherbalsit.qr_code.get_qr_jpg'
}


#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "cpherbalist.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["cpherbalist.utils.before_request"]
# after_request = ["cpherbalist.utils.after_request"]

# Job Events
# ----------
# before_job = ["cpherbalist.utils.before_job"]
# after_job = ["cpherbalist.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"cpherbalist.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }


sounds = [
	{"name": "custom-alert", "src": "/assets/cpherbalist/sounds/mixkit-unlock-game-notification-253.wav"},
]


# fixtures = ["Users PIN", "Letter Head", "Report"]


fixtures = [
    {"dt": "Client Script"},
    {"dt": "Server Script"},
    {"dt": "Workspace"},

]