window.user_warehouse = undefined;
frappe.provide("erpnext.accounts.dimensions");
erpnext.buying.setup_buying_controller();

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}

function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}




function isUrlEncoded(str) {
    try {
        // Try decoding the string
        let decoded = decodeURIComponent(str);

        // If the string is already decoded, it should match after encoding it again
        return encodeURIComponent(decoded) !== str;
    } catch (e) {
        // If an error occurs during decoding, it's likely URL-encoded
        return true;
    }
}

function set_source_warehouse_items(frm) {
    frm.fields_dict["items"].grid.get_field("item_code").get_query = function (doc, cdt, cdn) {
        return {
            query: "cpherbalist.material_request_custom.get_warehouse_items",
            filters: {
                warehouse: frm.doc.set_from_warehouse
            },
        };
    };
}

frappe.ui.form.on('Material Request', {
    after_save(frm) {
        console.log(":: after_save :: ", frm)
    },
    before_submit(frm) {
        console.log(":: before_submit :: ", frm)
    },
    on_submit(frm) {

        console.log('Notification ... ')
        // frappe.db.get_doc('CP Settings').then((mdgs) => {

        //     console.log('Notification ... ')

        //     if (mdgs.auto_create_material_transfer) {
        //         // frappe.dom.freeze()
        //         // document.querySelector('.freeze-message').innerHTML = 'Please Wait ... 🔃'
        //         frm.events.auto_in_transit_stock_entry(frm, mdgs);

        //         frappe.call({
        //             method: "cpherbalist.material_request_custom.post_notification",
        //             type: "POST",
        //             args: { from_warehouse: cur_frm.doc.set_warehouse, to_warehouse: cur_frm.doc.set_from_warehouse, material_request_doc: frm.doc.name },
        //             success: function (r) { },
        //             error: function (r) { console.error(r) },
        //             always: function (r) { }
        //         });
        //     }
        // })



    },
    onload_post_render: async function (frm) {
        //console.log(":: onload_post_render ::" + (frm.is_new() === 1 && (getCookie('set_warehouse') != null)));







        return; 

        console.log('🔃 ' + decodeURI(getCookie('set_from_warehouse')))
        console.log('🔃 ' + decodeURI(getCookie('set_warehouse')))
        console.log('🔃 ' + decodeURI(getCookie('the_item')))

        window.user_warehouse = decodeURI(getCookie('set_warehouse'));
        
        if (frm.is_new() === 1 && (getCookie('set_warehouse') != null)) {

            let requested_items = decodeURI(getCookie('the_item'));

            frm.set_value('set_from_warehouse', decodeURI(getCookie('set_from_warehouse')))
            frm.set_value('set_warehouse', decodeURI(getCookie('set_warehouse')))

            cur_frm.add_child('items', { 'item_code': `${requested_items}`, 'schedule_date': frappe.datetime.get_today(), 'qty': 1, 'warehouse': `${decodeURI(getCookie('set_from_warehouse'))}` });




        }
        else if (cur_frm.doc.status === '') {

            frappe.db.get_doc('User', frappe.session.user_email).then((result) => {
                let selected_warehouse = result.warehouse ?? frappe.user_defaults['default_warehouse'];
                frm.set_value('set_warehouse', selected_warehouse)
                // frm.set_value('set_from_warehouse', frappe.user_defaults['default_warehouse'])

                //frm.set_df_property('set_warehouse', 'read_only', 1);

                //set_source_warehouse_items(frm);


            }).catch((err) => {


                frm.set_value('set_warehouse', "Central - Ithomis - CP")

                frm.set_df_property('set_warehouse', 'read_only', 0);
                frm.set_value('set_from_warehouse', '')


            });

            document.querySelector("div[data-fieldname='set_from_warehouse']").classList.remove("hide-control")
        }
    },
    onload: async function (frm) {


        frm.doc.items = [];


        setTimeout(() => {
            cur_frm.set_value('material_request_type', 'Material Transfer');
        
            set_from_warehouse = decodeURI(getCookie('set_from_warehouse'))
            set_warehouse = decodeURI(getCookie('set_warehouse'))
            
            frm.set_value('set_from_warehouse', set_warehouse)
            frm.set_value('set_warehouse', set_from_warehouse )


            let requested_items = decodeURI(getCookie('the_item'));
            let new_row = frm.add_child('items');  
        
            new_row.item_code = requested_items;  
            new_row.qty = 1;               
            new_row.s_warehouse = set_from_warehouse;  
            new_row.t_warehouse = set_warehouse;  
            new_row.schedule_date = frappe.datetime.get_today()
        
        
            //cur_frm.add_child('items', { 'item_code': `${requested_items}`, 'schedule_date': frappe.datetime.get_today(), 'qty': 1, 'warehouse': `${decodeURI(getCookie('set_from_warehouse'))}` });
        
            frm.refresh_field('items');
        
        }, 1);

        return;
        if (frm.is_new() === 1 && (getCookie('set_warehouse') != null)) {

            if (getCookie('set_warehouse')) {
                frappe.dom.freeze()
                document.querySelector('.freeze-message').innerHTML = 'Please Wait ... 🔃'
            }

            console.log('Material Request loaded');


            frm.set_df_property('material_request_type', 'read_only', 1);
            frm.set_df_property('company', 'read_only', 1);
            frm.set_df_property('naming_series', 'read_only', 1);

            get_user_warehouse()
                .then((for_value) => {

                    console.log("Warehouse for user:", for_value);

                    frappe.db.get_doc('User', frappe.session.user)
                        .then(response => {

                            console.log("[user] response:", response.warehouse);




                            window.user_warehouse = response.warehouse;

                            if (window.user_warehouse) {
                                frm.set_value('set_warehouse', window.user_warehouse)

                                frm.set_df_property('set_warehouse', 'read_only', 1);
                            } else {
                                frm.set_df_property('set_warehouse', 'read_only', 0);
                            }

                            frm.set_df_property('schedule_date', 'read_only', 1);
                        })
                        .catch(error => {
                            console.error("Error fetching warehouse profile:", error);

                            // Introduce a delay if needed (e.g., wait for 2 seconds)
                            setTimeout(() => {
                                get_warehouse_per_profile(for_value)
                                    .then(response => {
                                        console.log("Warehouse Profile Data:", response);


                                        // set_from_warehouse
                                        frm.set_value('set_warehouse', response.message.warehouse)
                                        frm.set_df_property('set_warehouse', 'read_only', 1);
                                        frm.set_df_property('schedule_date', 'read_only', 1);
                                    })
                                    .catch(error => {
                                        console.error("Error fetching warehouse profile:", error);
                                    });
                            }, 1500);
                        });
                })
                .catch((error) => {
                    console.error("An error occurred:", error);
                });
        }

    },
    refresh: function (frm) {
        frm.events.make_custom_buttons(frm);
        frm.toggle_reqd("customer", frm.doc.material_request_type == "Customer Provided");



    },
    set_from_warehouse: function (frm) {

        if (cur_frm.doc.status === '') {
            document.querySelector("div[data-fieldname='set_from_warehouse']").classList.remove("hide-control")
        }
    },
    make_custom_buttons: function (frm) {
        // if (frm.doc.docstatus == 0) {
        //     frm.add_custom_button(
        //         __("Bill of Materials"),
        //         () => frm.events.get_items_from_bom(frm),
        //         __("Get Items From")
        //     );
        // }

        if (frm.doc.docstatus == 1 && frm.doc.status != "Stopped") {
            let precision = frappe.defaults.get_default("float_precision");

            // if (flt(frm.doc.per_received, precision) < 100) {
            //     frm.add_custom_button(__("Stop"), () => frm.events.update_status(frm, "Stopped"));
            // }

            if (flt(frm.doc.per_ordered, precision) < 100) {

                let add_create_pick_list_button = () => {
                    frm.add_custom_button(
                        __("Pick List"),
                        () => frm.events.create_pick_list(frm),
                        __("Create")
                    );
                };


                try {
                    frappe.call('cpherbalist.material_request_custom.get_stock_entries_per_material_request', {
                        material_request: cur_frm.doc.name
                    }).then(r => {
    
                        if (r.message.length === 0) {
                            if (frm.doc.material_request_type === "Material Transfer") {
    
                                frm.add_custom_button(
                                    __("Material Transfer (In Transit)"),
                                    () => frm.events.make_in_transit_stock_entry(frm),
                                ).addClass("primary-action btn-warning").removeClass('btn-default');
                            }
    
                        } else {
                            if (!(cur_frm.doc.owner === frappe.session.logged_in_user)) {
                                if (frm.doc.material_request_type === "Material Transfer") {
    
                                    frm.add_custom_button(
                                        __("Approve Transfer"),
                                        () => frm.events.approve_transfer(frm),
                                    ).addClass("primary-action btn-warning").removeClass('btn-default');
    
                                }
    
                                document.querySelector('.standard-actions span.page-icon-group').remove()
                                document.querySelector('.standard-actions div.menu-btn-group').remove()
                                document.querySelector('button[data-label="Cancel"]').remove()
    
                            }
    
                        }
                    })
                } catch (error) {
                    
                }

                if (frm.doc.material_request_type === "Material Transfer") {

                    //frm.page.set_inner_btn_group_as_primary(__("Create"));
                }


                if (frm.doc.material_request_type === "Material Issue") {
                    frm.add_custom_button(
                        __("Issue Material"),
                        () => frm.events.make_stock_entry(frm),
                        __("Create")
                    );
                }

                if (frm.doc.material_request_type === "Customer Provided") {
                    frm.add_custom_button(
                        __("Material Receipt"),
                        () => frm.events.make_stock_entry(frm),
                        __("Create")
                    );
                }

                if (frm.doc.material_request_type === "Purchase") {
                    frm.add_custom_button(
                        __("Purchase Order"),
                        () => frm.events.make_purchase_order(frm),
                        __("Create")
                    );
                }

                if (frm.doc.material_request_type === "Purchase") {
                    frm.add_custom_button(
                        __("Request for Quotation"),
                        () => frm.events.make_request_for_quotation(frm),
                        __("Create")
                    );
                }

                if (frm.doc.material_request_type === "Purchase") {
                    frm.add_custom_button(
                        __("Supplier Quotation"),
                        () => frm.events.make_supplier_quotation(frm),
                        __("Create")
                    );
                }

                if (frm.doc.material_request_type === "Manufacture") {
                    frm.add_custom_button(
                        __("Work Order"),
                        () => frm.events.raise_work_orders(frm),
                        __("Create")
                    );
                }
            }
        }

        if (frm.doc.docstatus === 0) {
            frm.add_custom_button(
                __("Sales Order"),
                () => frm.events.get_items_from_sales_order(frm),
                __("Get Items From")
            );
        }

        if (frm.doc.docstatus == 1 && frm.doc.status == "Stopped") {
            frm.add_custom_button(__("Re-open"), () => frm.events.update_status(frm, "Submitted"));
        }
    },
    approve_transfer(frm) {
        frappe.call('cpherbalist.material_request_custom.get_stock_entries_per_material_request', {
            material_request: cur_frm.doc.name
        }).then(r => {

            if (r.message.length >= 1) {
                let stock_entries = r.message;
                stock_entries.forEach(se => {

                    console.log('❇️ Proceed with Approval', se)

                    if ((se.docstatus === 0) && (se.purpose === "Material Transfer")) {

                        frappe.db.get_doc("Stock Entry", se.name).then(r => {
                            frappe.call({
                                method: "frappe.client.submit",
                                args: {
                                    doc: r
                                },
                                callback: function (submit_response) {
                                    console.log("Stock Entry Submitted:", submit_response);
                                    frappe.dom.unfreeze()
                                    frappe.msgprint({
                                        title: __('Notification'),
                                        indicator: 'green',
                                        message: __('✅ Transfer Approved')
                                    });
                                }
                            })
                        })

                    }

                });

            }
        })
    },
    auto_in_transit_stock_entry(frm, settings) {

        frm.doc.material_transfer_created = 1;

        frappe.call({
            method: "erpnext.stock.doctype.material_request.material_request.make_stock_entry",
            args: {
                source_name: frm.doc.name,
                //in_transit_warehouse: 'Goods In Transit - MDG',
            },
            callback: function (r) {
                if (r.message) {
                    let _doc = frappe.model.sync(r.message);

                    console.log(":: _doc[0] ::", _doc[0]);
                    console.log(":: frm ::", frm.doc);
                    console.log(" :: DOCUMENT NAME ::", frm.doc.name)


                    frappe.call({
                        method: "frappe.client.insert",
                        args: {
                            doc: _doc[0]
                        },
                        callback: function (response) {
                            if (response.message) {
                                let stock_entry = response.message;


                                console.log("Stock Entry Created:", stock_entry);

                                // frappe.call({
                                //     method: "frappe.client.set_value",
                                //     args: {
                                //         doctype: "Material Request",
                                //         name: frm.doc.name,
                                //         fieldname: "material_transfer_created",
                                //         value: 1,
                                //     },
                                //     callback: function (r) {},
                                // });


                                if (settings.auto_submit_stock_entry === 1) {

                                    frappe.db.get_doc("Stock Entry", stock_entry.name).then(r => {
                                        frappe.call({
                                            method: "frappe.client.submit",
                                            args: {
                                                doc: r
                                            },
                                            callback: function (submit_response) {
                                                console.log("Stock Entry Submitted:", submit_response);
                                                frappe.dom.unfreeze()
                                                frappe.msgprint({
                                                    title: __('Notification'),
                                                    indicator: 'green',
                                                    message: __('Document updated successfully')
                                                });
                                            }
                                        })
                                    })
                                }
                            }
                        }
                    });


                    //frappe.set_route("Form", doc[0].doctype, doc[0].name);
                }
            },
        }).then(u => { });
    },
    make_in_transit_stock_entry(frm) {
        frappe.prompt(
            [
                {
                    label: __("In Transit Warehouse"),
                    fieldname: "in_transit_warehouse",
                    fieldtype: "Link",
                    options: "Warehouse",
                    reqd: 1,
                    default: function () {
                        return 'Goods In Transit - CP';
                    },
                    get_query: () => {
                        return {
                            filters: {
                                company: frm.doc.company,
                                is_group: 0,
                                warehouse_type: "Transit",
                            },
                        };
                    },
                },
            ],
            (values) => {
                frappe.call({
                    method: "erpnext.stock.doctype.material_request.material_request.make_in_transit_stock_entry",
                    args: {
                        source_name: frm.doc.name,
                        in_transit_warehouse: values.in_transit_warehouse,
                    },
                    callback: function (r) {
                        if (r.message) {
                            let doc = frappe.model.sync(r.message);
                            frappe.set_route("Form", doc[0].doctype, doc[0].name);
                        }
                    },
                });
            },
            __("In Transit Transfer"),
            __("Create Stock Entry")
        );
    },
})


function get_user_warehouse() {

    return new Promise((resolve, reject) => {
        resolve(null);

        var current_user = frappe.session.user_email;
        console.log('username', current_user);

        frappe.call({
            async: true,
            method: "cpherbalist.material_request_custom.get_pos_access_for_user",
            args: {
                user_email: current_user
            },
            callback: function (response) {
                if (response.message) {
                    //console.log("User Permissions:", response.message);
                    resolve(response.message[0].for_value);  // Resolve the promise with the required value
                } else {
                    resolve(null);  // Resolve with null if no data is returned
                }
            },
            error: function (error) {
                console.error("Error calling the method:", error);
                reject(error);  // Reject the promise if there's an error
            }
        });
    });
}

function get_warehouse_per_profile(profile_id) {
    return new Promise((resolve, reject) => {
        frappe.call({
            async: false,
            method: "cpherbalist.material_request_custom.get_pos_profile_by_id",
            args: {
                profile_id: profile_id
            },
            callback: function (response) {
                if (response) {
                    resolve(response);  // Resolve with the response data
                } else {
                    resolve(null);  // Resolve with null if no data is returned
                }
            },
            error: function (error) {
                console.error("Error in frappe call:", error);
                reject(error);  // Reject the promise if an error occurs
            }
        });
    });
}
