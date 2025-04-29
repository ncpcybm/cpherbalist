frappe.ui.form.on('Stock Entry', {
    onload_post_render: function(frm) {

        
        cur_frm.set_value('stock_entry_type','Material Receipt');

    }



})