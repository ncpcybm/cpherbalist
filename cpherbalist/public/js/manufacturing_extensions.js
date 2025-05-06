
frappe.ui.form.on('Item', {
    refresh: function(frm) {
        // Remove existing button (if any) to avoid duplicates
        frm.remove_custom_button('Open BOM');

        // Check if item has BOMs
        if (!frm.is_new()) {




            frm.add_custom_button(__('Move Stock to Default Warehouse'), function() {
                frappe.confirm(
                    'Move all stock for this item to its default warehouse?',
                    function() {
                        frappe.call({
                            method: 'cpherbalist.stock_entry_extensions.move_stock_to_default_warehouse',
                            args: {
                                item_code: frm.doc.name
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    frappe.msgprint(r.message || 'Stock moved successfully.');
                                }
                            }
                        });
                    }
                );
            });


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




                            let wo = frappe.model.get_new_doc('Work Order');
                            wo.production_item = frm.doc.name,
                            wo.qty = 1; 

                            frappe.set_route('Form', 'Work Order', wo.name);


                            // frappe.new_doc('Work Order', {
                            //     production_item: frm.doc.name,
                            //     qty: 1
                            // });
                        });
                    }

                    frm.add_custom_button('Create Stock Entry (TEST)', function() {

                        frappe.call({
                            method: "cpherbalist.api.auto_create_stock_entry",  // Adjust this
                            args: {
                                item_code: cur_frm.doc.name
                            },
                            callback: function(r) {
                                if (r.message) {
                                    frappe.msgprint("✅ Stock Entry created: " + r.message);
                                } else {
                                    frappe.msgprint("❌ Failed to create stock entry.");
                                }
                            }
                        });

                    });



                    frm.add_custom_button('Create Stock Entry', function() { 

                        let default_source_warehouse = undefined; 
                        let default_target_warehouse = undefined; 
                        

                        default_source_warehouse = frappe.db.get_single_value('CP Settings', 'default_source_warehouse')
                            .then(value => {
                                default_source_warehouse = value
                                console.log('default_source_warehouse:', value);
                            });
        
                        default_target_warehouse = frappe.db.get_single_value('CP Settings', 'default_target_warehouse')
                            .then(value => {
                                default_target_warehouse = value
                                console.log('default_target_warehouse:', value);
                            });


                        frappe.model.with_doctype('Stock Entry', function() {

                            let se = frappe.model.get_new_doc('Stock Entry');
                            se.stock_entry_type = 'Material Receipt';
                            
                            document.cookie = `material_receipt_item_code=${frm.doc.name}; path=/; max-age=86400`; 

                    
                            se.items = [{
                                item_code: frm.doc.name,
                                qty: 1,
                                // s_warehouse: default_source_warehouse ?? 'Factory - CP',
                                // t_warehouse: default_target_warehouse ?? 'Finished Goods - CP',
                                basic_rate: 1
                            }];
                    
                            frappe.set_route('Form', 'Stock Entry', se.name);
                        });


                    });



                }
            });
        }
    },

    onload_post_render: function(frm) {

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



                        let warehouse = response.message.default_target_warehouse;

                        console.log(response)

                        if (frm.is_new() === 1) {
                            frm.set_value('skip_transfer', 1); // 1 = checked (true)
                        }

                        frm.set_value('fg_warehouse', warehouse);

                        cur_frm.set_value('fg_warehouse', warehouse);
                        cur_frm.set_value('wip_warehouse', warehouse);
                        cur_frm.set_value('source_warehouse', warehouse);

                        let default_company = undefined; 
                            
                        frappe.db.get_single_value('Global Defaults', 'default_company')
                            .then(value => {
                                default_company = value
                                cur_frm.set_value('company', default_company);



                                console.log('default_company:', value);
                            });

                            cur_frm.set_value('planned_start_date', frappe.datetime.now_datetime());

                            

                        setTimeout(() => {
                            frm.doc.required_items.forEach(item => {
                                item.source_warehouse = warehouse;
                            });
                            frm.refresh_field('required_items');
                        }, 500);


                        frappe.call({
                            method: "run_doc_method",
                            args: {
                                docs: {
                                    "name": "Document Naming Settings",
                                    "owner": "Administrator",
                                    "modified": "2025-04-29 11:38:26.876874",
                                    "modified_by": "Administrator",
                                    "docstatus": 0,
                                    "idx": "0",
                                    "user_must_always_select": 0,
                                    "current_value": 0,
                                    "default_amend_naming": "Amend Counter",
                                    "doctype": "Document Naming Settings",
                                    "amend_naming_override": [],
                                    "transaction_type": "Work Order",
                                    "__unsaved": 1
                                },
                                method: "get_options"
                            },
                            callback: function(response) {
                                cur_frm.set_value('naming_series', response.message);

                            }
                        });




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


        }, 10);

        console.log("onload")

    },
    refresh: function (frm) {

    },
    validate: function (frm) {
        //check_tot_ref_qty(frm);
    }
});