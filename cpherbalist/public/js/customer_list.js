frappe.listview_settings["Customer"] = {
	add_fields: ["customer_name", "territory", "customer_group", "customer_type", "image"],
    hide_name_column: false,

	onload(listview) {

		alert('5')
		console.log("🔧 Hooks from cpherbalist loaded")

	}
};
