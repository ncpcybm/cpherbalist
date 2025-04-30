
frappe.ui.form.on('Item', {
    onload_post_render: function(frm) {
        // Remove existing button (if any) to avoid duplicates
        frm.remove_custom_button('Open BOM');

        // Check if item has BOMs
        if (!frm.is_new()) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "BOM",
                    filters: {
                        item: frm.doc.name,
                        is_active: 1,
                        is_default: 1
                    },
                    limit_page_length: 1
                },
                callback: function(response) {
                    if (response.message.length > 0) {
                        // Add button if BOM exists
                        frm.add_custom_button('Create Work Order', function() {
                            frappe.new_doc('Work Order', {
                                production_item: frm.doc.name
                            });
                        });
                    }

                    frm.add_custom_button('Create Stock Entry', function() { 

                        // se = frappe.new_doc('Stock Entry', {
                        //     stock_entry_type: "Material Transfer"
                        // });

                        // se.append("items", {
                        //     "item_code": frm.doc.name,
                        //     "qty": 1,
                        //     "s_warehouse": "Stores - CP",   
                        //     "t_warehouse": "Finished Goods - CP",  
                        //     "basic_rate": 1
                        // })

                        let default_source_warehouse = await frappe.db.get_single_value('CP Settings', 'default_source_warehouse')
                        .then(value => {
                            console.log('default_source_warehouse:', value);
                        });

                        let default_target_warehouse = await frappe.db.get_single_value('CP Settings', 'default_target_warehouse')
                        .then(value => {
                            console.log('default_target_warehouse:', value);
                        });


                        frappe.model.with_doctype('Stock Entry', function() {
                            let se = frappe.model.get_new_doc('Stock Entry');
                            se.stock_entry_type = 'Material Receipt';
                    
                            se.items = [{
                                item_code: frm.doc.name,
                                qty: 1,
                                s_warehouse: default_source_warehouse ?? 'Factory - CP',
                                t_warehouse: default_target_warehouse ?? 'Finished Goods - CP',
                                basic_rate: 1
                            }];
                    
                            frappe.set_route('Form', 'Stock Entry', se.name);
                        });


                    });



                }
            });
        }
    }
});

frappe.ui.form.on('Work Order', {
    setup: function (frm) {

    },
    onload: function (frm) {


        setTimeout(() => {

            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'CP Settings',
                },
                callback: function (response) {

                    if (response.message) {



                        let warehouse = response.message.default_warehouse;

                        console.log(response)

                        if (frm.is_new() === 1) {
                            frm.set_value('skip_transfer', 1); // 1 = checked (true)
                        }

                        frm.set_value('fg_warehouse', warehouse);

                        cur_frm.set_value('fg_warehouse', warehouse);
                        cur_frm.set_value('wip_warehouse', warehouse);
                        cur_frm.set_value('source_warehouse', warehouse);


                        setTimeout(() => {
                            frm.doc.required_items.forEach(item => {
                                item.source_warehouse = warehouse;
                            });
                            frm.refresh_field('required_items');
                        }, 500);
                    }

                }
            }).then((res) => {

            });


            frm.add_custom_button('Set Source Warehouse', () => {
                frappe.prompt({
                    label: 'New Source Warehouse',
                    fieldname: 'new_warehouse',
                    fieldtype: 'Link',
                    options: 'Warehouse',
                    reqd: 1
                }, function (values) {
                    frm.doc.required_items.forEach(item => {
                        item.source_warehouse = values.new_warehouse;
                    });
                    frm.refresh_field('required_items');
                });
            });







        }, 0);

        console.log("onload")

    },
    refresh: function (frm) {

    },
    validate: function (frm) {
        //check_tot_ref_qty(frm);
    }
});