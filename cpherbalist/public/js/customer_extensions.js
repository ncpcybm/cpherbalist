frappe.listview_settings["Customer"] = {

    onload: function (listview) { 

        listview.page.add_inner_button('🔄 Sync with WooCommerce', () => {
            frappe.call({
                method: 'your_app_path.api.sync_woocommerce_customers',
                callback: function(r) {
                    if (!r.exc) {
                        frappe.msgprint(__('Sync completed successfully.'));
                        listview.refresh();
                    }
                }
            });
        });

    }

}