frappe.listview_settings['Coupon Code'] = {
    onload: function(listview) {

        listview.page.add_inner_button(__("🔄 Sync with WooCommerce"), function () {
            // Optional: get selected coupons (if needed)
            let selected = listview.get_checked_items();

            var settings = {
                "url": "https://staging1.cpherbalist.com/wp-json/cp/v1/wc/coupon/recent",
                "method": "GET",
                "timeout": 0,
            };
            
            $.ajax(settings).done(function (response) {
                console.log(response);

                // const newDiv = document.createElement("div");
                // newDiv.id = 'couponModal'
                // newDiv.style = 'display:none; position:fixed; top:10%; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #ccc; padding:20px; z-index:10000; width:80%; max-height:400px; overflow:auto;"'
                // document.querySelector('.custom-actions').appendChild(newDiv)

                    // Create the modal container
                    const modal = document.createElement('div');
                    modal.id = 'couponModal';
                    modal.style.display = 'none';
                    modal.style.position = 'fixed';
                    modal.style.top = '10%';
                    modal.style.left = '50%';
                    modal.style.transform = 'translateX(-50%)';
                    modal.style.background = '#fff';
                    modal.style.border = '1px solid #ccc';
                    modal.style.padding = '20px';
                    modal.style.zIndex = '10000';
                    modal.style.width = '80%';
                    modal.style.maxHeight = '400px';
                    modal.style.overflow = 'auto';

                    // Create heading
                    const heading = document.createElement('h3');
                    heading.innerText = 'Select Coupons to Sync FROM WooCommerce';
                    modal.appendChild(heading);


                    const selectAllButton = document.createElement('button');
                    selectAllButton.innerText = 'Select All Coupons';
                    selectAllButton.classList = "btn btn-default btn-sm primary-action";
                    selectAllButton.style = "margin-bottom: 1em;"
                    selectAllButton.onclick = () => {


                        toggleSelectionOnAllCheckedBoxes(true)


                    };
                    modal.appendChild(selectAllButton);


                    const unselectAllButton = document.createElement('button');
                    unselectAllButton.innerText = 'Unselect All Coupons';
                    unselectAllButton.classList = "btn btn-default btn-sm primary-action";
                    unselectAllButton.style = "margin-bottom: 1em; margin-left: 1em;"
                    unselectAllButton.onclick = () => {


                        toggleSelectionOnAllCheckedBoxes(false)


                    };
                    modal.appendChild(unselectAllButton);





                    // Create table
                    const table = document.createElement('table');
                    table.id = 'couponTable';
                    table.border = '1';
                    table.style.width = '100%';
                    table.style.textAlign = 'left';

                    // Create thead
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    ['Code', 'Amount', 'Type', 'Expiry', 'Select'].forEach(text => {
                        const th = document.createElement('th');
                        th.innerText = text;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Create tbody
                    const tbody = document.createElement('tbody');
                    table.appendChild(tbody);

                    // Append table to modal
                    modal.appendChild(table);

                    // Create Close button
                    const closeButton = document.createElement('button');
                    closeButton.innerText = 'Close';
                    closeButton.classList = "btn btn-primary btn-sm primary-action";
                    closeButton.style = "    margin-top: 1em;"
                    closeButton.onclick = () => {
                        modal.style.display = 'none';
                    };
                    modal.appendChild(closeButton);


                    // Create Sync Button 
                    const syncButton = document.createElement('button');
                    syncButton.innerText = '🔄 Sync with ERP';
                    syncButton.classList = "btn btn-default btn-sm primary-action";
                    syncButton.style = "margin-top: 1em;     margin-left: 1em;"
                    syncButton.onclick = () => {
                        // get all selected ...
                        var checkedBoxes = getCheckedBoxes("wc_coupon");

                        checkedBoxes.forEach(e => {

                            let couponCode = e.value; 


                            var settings = {
                                "url": `https://staging1.cpherbalist.com/wp-json/cp/v1/wc/coupon/meta?code=${couponCode}`,
                                "method": "GET",
                                "timeout": 0,
                              };
                              
                              $.ajax(settings).done(function (response) {

                                if (response.success) {

                                    console.log('Sync With ERP ...')

                                    let dd = { }


                                    let _data = response.data

                                    dd = {
                                        s_coupon_code: e.value,
                                        s_wc_coupon_code: e.value,
                                        s_description: _data.description,
                                        f_custom_amount :  _data.amount,
                                        s_for_user: _data.email_restrictions ?? [], 
                                        s_valid_upto: _data.expiry_date
                                    }



                                    frappe.call({
                                        method: "cpherbalist.wc_extensions.create_erp_coupon_from_wc",
                                        args: dd,
                                        callback: function(response) {
                                            // Handle response
                                            console.log(response.message);
                                        }
                                    }).then((result) => {
                                        console.log('WooCommerce Coupon created in ERP !!')
                                    }).catch((err) => {
                                        
                                    });





                                }

                              });




                        })
                    };
                    modal.appendChild(syncButton);




                    // Append modal to body
                    document.body.appendChild(modal);


                    console.log(response);
                    let selectCoupons = [];

                    // Fill the table
                    var tableBody = '';
                    response.forEach(function(coupon, index) {
                        tableBody += `
                            <tr>
                                <td>${coupon.code}</td>
                                <td>${coupon.amount}</td>
                                <td>${coupon.discount_type}</td>
                                <td>${coupon.expiry_date || 'None'}</td>
                                <td><input class="select-coupon" type="checkbox" id="${coupon.code}" name="wc_coupon" value="${coupon.code}"></td>
                            </tr>`;
                    });
                    $('#couponTable tbody').html(tableBody);
                
                    // Show the modal
                    $('#couponModal').show();
                
                    // Handle click
                    $('.select-coupon').on('click', function() {
                        var selectedCode = $(this).data('code');
                    });


            });



            // // Send selected (or all) to server
            // frappe.call({
            //     method: 'your_app.your_module.api.sync_multiple_coupons',
            //     args: {
            //         coupons: selected.map(c => c.name)
            //     },
            //     callback: function(r) {
            //         if (!r.exc) {
            //             frappe.msgprint(__('Coupons synced with WooCommerce!'));
            //         }
            //     }
            // });
        
        });

    }
};

function getCheckedBoxes(chkboxName) {
    var checkboxes = document.getElementsByName(chkboxName);
    var checkboxesChecked = [];
    // loop over them all
    for (var i = 0; i < checkboxes.length; i++) {
        // And stick the checked ones onto an array...
        if (checkboxes[i].checked) {
            checkboxesChecked.push(checkboxes[i]);
        }
    }
    // Return the array if it is non-empty, or null
    return checkboxesChecked.length > 0 ? checkboxesChecked : null;
}

function toggleSelectionOnAllCheckedBoxes(select) {
    $(':checkbox').each(function () {
        this.checked = select;
    });

}


frappe.ui.form.on("Coupon Code", {

refresh: function (frm) {
    if (!cur_frm.is_new()) {
        frm.add_custom_button(__('➕ Create POS Invoice'), function() {

            let _customer = cur_frm.doc.customer
            let _amount = cur_frm.doc.custom_amount
            let _couponCode = cur_frm.doc.coupon_code

            let _default_voucher_item = undefined; 
            
            
            frappe.db.get_single_value('CP Settings', 'default_voucher_product')
            .then(value => {
                _default_voucher_item = value
                console.log('default_voucher_item:', value);

                frappe.call({
                    method: "cpherbalist.api.create_pos_coupon_sales_order",
                    args: {
                        item_code: _default_voucher_item ?? "CPEV",
                        value: _amount,
                        customer: _customer ?? "Walkin Customer",
                        coupon_code: _couponCode
                    },
                    callback: function(r) {
                        if (!r.exc && r.message.status === "success") {
                            frappe.msgprint("POS Invoice created: " + r.message.invoice_name);

                            // update 
                            frappe.call({
                                method: "frappe.client.set_value",
                                args: {
                                    doctype: "Coupon Code",
                                    name: cur_frm.doc.name,
                                    fieldname: "custom_pos_invoice",
                                    value: r.message.invoice_name,
                                },
                                callback: function (r) {
                                    frappe.msgprint('Coupon Code Updated')
                                },
                            });





                        } else {
                            frappe.msgprint("Error: " + r.message.message);
                        }
                    }
                });

            });






            
        });
    }

},

onload_post_render: function (frm) {




},

    onload: function(frm) {
        // frm.add_custom_button(__('Re-Sync with WooCommerce'), function() {

        //  });

        if (cur_frm.is_new()) {

            function getCookie(name) {
                const decodedCookie = decodeURIComponent(document.cookie);
                const cookies = decodedCookie.split("; ");
                for (let cookie of cookies) {
                    const [key, value] = cookie.split("=");
                    if (key === name) {
                        return value;
                    }
                }
                return null; // Cookie not found or expired
            }



            const myValue = getCookie("pos_customer");
            if (myValue !== null) {
                console.log("Cookie value:", myValue);

                const d = new Date();
                let month = d.getMonth();
                let year = d.getFullYear();

                let couponName = `${myValue.toUpperCase()} ${month}${year}${(Math.random() * 9999).toFixed(0)}`

                cur_frm.set_value('customer', myValue);
                cur_frm.set_value('coupon_name', couponName);


            } else {
                console.log("Cookie does not exist or is expired.");
            }

            
            const pos_profile = getCookie("pos_profile");
            if (pos_profile !== null) {
                console.log("Cookie value:", pos_profile);
                cur_frm.set_value('custom_pos_profile', pos_profile);
            } else {
                console.log("Cookie does not exist or is expired.");
            }


            let today = frappe.datetime.get_today();
            let three_months_later = frappe.datetime.add_months(today, 3);

            cur_frm.set_value('valid_from', today);
            cur_frm.set_value('valid_upto', three_months_later);


        }


        

    },
    validate: function (frm) {

        if (frm.doc.custom_is_percent && frm.doc.custom_amount > 100) {
            frappe.msgprint(__('Amount can not be grader of 100.'));
            frappe.validated = false;
        }

    },
    after_save(frm) {
        // write setup code
        console.log(frm);

        if (frm.doc.custom_sync_with_woocommerce) {

            let dd = {}

            if (frm.doc.maximum_use >= 1) {
                dd = {
                    s_coupon_code: frm.doc.coupon_code,
                    s_discount_type  : "percent",
                    f_amount : frm.doc.custom_amount,
                    f_minimum_amount : frm.doc.custom_min_amount,
                    i_usage_limit: frm.doc.maximum_use,
                    s_customer_email: frm.doc.custom_allowed_emails ?? []
                }
            } else {

                dd = {
                    s_coupon_code: frm.doc.coupon_code,
                    s_discount_type  : "percent",
                    f_amount : frm.doc.custom_amount,
                    f_minimum_amount : frm.doc.custom_min_amount,
                    s_customer_email: frm.doc.custom_allowed_emails ?? []
                }
            }

            if (frm.doc.custom_is_percent) {
                dd.s_discount_type = "percent"
            } else {
                dd.s_discount_type = "fixed_cart"
            }

            frappe.call({
                method: "cpherbalist.wc_extensions.wc_create_coupon",
                args: dd,
                callback: function(response) {
                    // Handle response
                    let data = JSON.parse(response.message.data)
                    let wc_link = `https://staging1.cpherbalist.com/wp-admin/post.php?post=${data.id}&action=edit`;


                
                    if (data.data.status === 400) {

                        frappe.msgprint(__('Error: Please Contact the Administrator !'));

                        

                        if (data.code === 'woocommerce_rest_coupon_code_already_exists')
                        {

                        }


                        return;


                        // if (frm.doc.custom_woocommerce_coupon) {
                        //     dd.s_custom_woocommerce_coupon = frm.doc.custom_woocommerce_coupon
                        // } 

                        // console.log('update dd', dd)

                        // frappe.call({
                        //     method: "cpherbalist.wc_extensions.wc_update_coupon",
                        //     args: {
                        //         coupon_code: frm.doc.coupon_code, 
                        //         amount: 0
                        //     },
                        //     callback: function(response) {
                        //         frappe.msgprint(__('Coupons synced with WooCommerce!'));
                        //     }
                        // });

                        // console.log(":: ::")

                    }

                    console.log(JSON.parse(response.message.data));

                    frappe.db.set_value('Coupon Code', cur_frm.doc.name, 'custom_woocommerce_coupon', data.id)

                }
            }).then((result) => {
                // update current coupon 
            }).catch((err) => { });
            
        } else { }
    }
});