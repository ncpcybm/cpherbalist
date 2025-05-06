var totalDiscountAmount = 0;
var currency = 'EUR';
var select2Element = undefined;
var checkoutFlag = false;
var isDeposit = false;
var loaded = 0;

window.required_foreign_amount = false;
window.related_invoices = [];

var itemsToReserved = [];
// item_code 
// item_name
// qty 
// rate

var baseAmount = 0;
var outstandingAmount = 0;

validate_discount_not_exceed_total_amount = (total, discount_amount) => {
    let difference = 0;

    if (discount_amount > total) {
        difference = discount_amount - total;
    }

    return difference;
};



apply_coupon = async (e) => {
    let t = await frappe.call({
        method: "cpherbalist.pos.apply_coupon_code",
        args: {
            applied_code: cur_frm.doc.custom_coupon_code,
            applied_amount: cur_frm.doc.discount_amount,
            transaction_id: cur_frm.doc.name
        }
    })
};

custom_remove_coupon = async (e) => {
    let apply_discount_button = document.querySelector('button[data-fieldname="custom_apply_coupon"]');
    let remove_discount_button = document.querySelector('button[data-fieldname="custom_remove_coupon"]');

    remove_discount_button.remove()

    apply_discount_button.disabled = false;

    // remove discount amount
    cur_frm.set_value('discount_amount', 0);
    readjustPaymentMethod(0)
    remove_remarks();
    $(`.mode-of-payment[data-mode="cash"]`)[0].click()

    let credit_forward_amount_element = document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]');
    credit_forward_amount_element.value = 0;
    frm.doc.custom_credit_forward_amount_ = 0;

    //console.log(cur_frm);
};

show_remove_coupons_button = () => {
    // add remove coupon button.
    let apply_discount_button = document.querySelector('button[data-fieldname="custom_apply_coupon"]');
    apply_discount_button.disabled = true;
    let _parent = apply_discount_button.parentElement;
    let remove_coupon_btn = document.createElement('button');
    remove_coupon_btn.innerHTML = 'Remove Coupon';
    remove_coupon_btn.classList.add('btn')
    remove_coupon_btn.classList.add('btn-default');
    remove_coupon_btn.classList.add('btn-primary');
    remove_coupon_btn.classList.add('ml-2')
    remove_coupon_btn.setAttribute("data-fieldname", "custom_remove_coupon");
    remove_coupon_btn.addEventListener('click', (e) => {
        this.custom_remove_coupon(e);
    });
    _parent.appendChild(remove_coupon_btn);


}

set_credit_forward_amount = (amount, frm = Object) => {
    let credit_forward_amount_element = document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]');
    credit_forward_amount_element.value = amount;

    frm.doc.custom_credit_forward_amount_ = amount;


    document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]').readOnly = true;
};

toggle_credit_forward_amount = () => {
    const tryToDisable = () => {
        const inputElement = document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]');

        if (inputElement) {
            inputElement.readOnly = true;
        } else {
            setTimeout(tryToDisable, 3000);
        }
    };

    tryToDisable(); // Start the first check
};

add_remark = (value) => {
    let remark_element = document.querySelector('textarea[data-fieldname="custom_remarks"]');
    remark_element.value += value + '\n';
    cur_frm.doc.custom_remarks = remark_element.value;
}

get_remarks = () => {
    let remark_element = document.querySelector('textarea[data-fieldname="custom_remarks"]');
    return remark_element.value;
}

remove_remarks = () => {
    let remark_element = document.querySelector('textarea[data-fieldname="custom_remarks"]');
    remark_element.value = '';
    cur_frm.doc.custom_remarks = '';
}

apply_discount = (frm, amount, couponCode) => {
    let difference_amount = 0; //validate_discount_not_exceed_total_amount(cur_frm.doc.net_total,amount);
    let netTotalAmount = cur_frm.doc.net_total;

    switch (frm.doc.apply_discount_on) {
        case 'Grand Total':
            difference_amount = validate_discount_not_exceed_total_amount(cur_frm.doc.grand_total, amount);
            break;
        case 'Net Total':
            difference_amount = validate_discount_not_exceed_total_amount(cur_frm.doc.net_total, amount);
            break;
    }


    console.log('Difference Amount', difference_amount)

    if (difference_amount > 0) {

        let applied_coupons = get_applied_coupons();
        console.log('applied_coupons ', applied_coupons)


        if (applied_coupons.length >= 2) {
            couponCode = applied_coupons[applied_coupons.length - 1];
            const _credited_amount = __("Amount of {0} {1} will be credited for coupon {2}.", [currency, difference_amount, couponCode]);
            add_remark(_credited_amount);
        }

        const credited_amount = __("Amount of <b>{0} {1}</b> will be credited for coupon <b>{2}</b>.", [currency, difference_amount, couponCode]);

        frappe.msgprint({
            title: __('Credit Amount'),
            indicator: 'green,',
            message: credited_amount
        });

        let codes = applied_coupons[applied_coupons.length - 1] //couponCode.split(/\r?\n/).filter(line => line.trim() !== '').map(line => line.trim()).join(",").split(',');
        console.log('concatenatedString [apply_discount]', codes)

        frm.set_value('discount_amount', netTotalAmount)

        if (applied_coupons.length >= 2) {
            frm.set_value('custom_credit_forward_amount_', parseFloat(difference_amount))
            set_credit_forward_amount(parseFloat(difference_amount));

        } else {
            frm.set_value('custom_credit_forward_amount_', parseFloat(difference_amount))
            set_credit_forward_amount(parseFloat(difference_amount));
        }

    } else {
        frm.set_value('discount_amount', amount)
    }

    const coupon_applied_msg = __("Coupon with code <b>{0}</b> has been applied for the amount of <b>{1} {2}</b>.", [
        couponCode,
        currency,
        amount
    ]);

    frappe.msgprint({
        title: __('Coupon Applied'),
        indicator: 'green,',
        message: coupon_applied_msg
    });

    //let msg = `Coupon ${couponCode} : ${currency} ${amount}`;
    //add_remark('Coupon with code ' + couponCode + ' has been applied for the amount of ' + currency + ' ' + amount + '.');
    //add_remark(msg);
}

get_applied_coupons = () => {
    let couponCode = document.querySelector('textarea[data-fieldname="custom_coupon_code"]').value.trim();
    let lines = couponCode.split(/\r?\n/).filter(line => line.trim() !== '');
    return lines;
}

multiple_coupons_applied = () => {
    return get_applied_coupons.length >= 2;
}

get_select2_data = (element) => {
    return $(element).select2('data')
}

init_select2_events = () => {

    element = select2Element;

    $(element).on('select2:select', function (e) {
        console.log('Select ...')
    });

    $(element).on('select2:unselect', function (e) {
        console.log('unselect ...')
    });

    $(element).on('select2:clear', function (e) {
        remove_remarks();
        console.log('clear ...')
    });

    $(element).on('select2:close', function (e) {
        remove_remarks();
        let selected_items = get_select2_data(element)

        baseAmount = 0;
        itemsToReserved = [];

        let remarks = '';

        if (selected_items.length === 0) {
            let em = document.querySelector(".submit-order-btn")
            em.style.display = 'none';
            return;
        } else {
            let em = document.querySelector(".submit-order-btn")
            em.style.display = 'flex';
        }

        for (let index = 0; index < selected_items.length; index++) {
            const element = selected_items[index];
            let split = element.text.split('•')


            // item['brand']
            // item['item_code']
            // item['name']} ({item['currency']
            // item['price_list_rate']

            console.log(`:: ${index} selected items ::`, element.text.split('•'))
            console.log(`:: ${index} amount ::`, split[split.length - 1].split(' ')[1])


            let itemAmount = parseFloat(split[split.length - 1].split(' ')[1]);

            itemsToReserved.push({
                "item": split[1].trim(),
                "item_name": split[2].trim(),
                "qty": 1,
                "rate": itemAmount,
                "total_amount": itemAmount

            })

            baseAmount += itemAmount



            remarks += `(x1) of ${split[1].trim()} ${split[2].trim()} with reference amount of ${split[3].trim()} \n`

        }


        add_remark(remarks);
    });

    // create_remarks_for_selected_items

}

formatData = (data) => {
    if (!data) return;

    console.log(" :: 🪄 format data ::")

    var baseUrl = "https://raw.githubusercontent.com/lipis/flag-icons/refs/heads/main/flags/4x3/cy.svg";
    var $_ = $(
        `<span><img src="${baseUrl}" class="img-pos-prod" /> ${data} </span>`
    );
    return $_;
};

frappe.ui.form.on('POS Invoice', {
    onload_post_render: function (frm) {
        if (frappe.user.has_role("Disable Desk")) { }

        // cur_pos.payment.selected_mode.set_value(1)
        // $pm = cur_pos.payment.$payment_modes;

        if (frm.is_new() === undefined) {
            frm.toggle_display('custom_apply_coupon', 0)
        }

        if (frm.doc.is_return) {
            console.log('Reset Coupon')
            frm.toggle_display('custom_apply_coupon', 1)
        }
    },

    validate(frm) {

        if (!checkoutFlag) {
            if (cur_frm.doc.items.some(i => i.item_name === "DEPOSIT")) {
                isDeposit = true;
            }
            frappe.validated = true;
            return;
        }


        checkoutFlag = true;
    },
    custom_item_reserved_status: function (frm) {


    },


    on_submit: function (frm) {
        console.log(":: on submit ::")
        console.log(" ++ DOCUMENT IS SUBMITTED NOW ++", frm.doc);
    },

    custom_reference_invoice: function (frm) {

        if (cur_frm.doc.items.some(i => i.item_name === "DEPOSIT")) {

            if (cur_frm.doc.custom_reference_invoice === '' || cur_frm.doc.custom_reference_invoice === null || cur_frm.doc.custom_reference_invoice === undefined) {
                return
            }



            let total_amount = 0;
            let iframeurl = `/printview?doctype=POS%20Invoice&name=${cur_frm.doc.custom_reference_invoice}&trigger_print=0&format=POS%20Invoice&no_letterhead=0&letterhead=MDG%20-%20POS%20Invoice&settings=%7B%7D&_lang=en`;

            Swal.fire({
                title: `Invoice ${cur_frm.doc.custom_reference_invoice}`,
                html: `<iframe src="${iframeurl}" class="iframe-popup" frameborder="0"></iframe>`,
                showDenyButton: true,
                denyButtonText: 'Change Invoice',


                confirmButtonText: 'Yes',
                showConfirmButton: true,
                focusConfirm: true,

                showCancelButton: false,


                customClass: {
                    popup: 'custom-popup'
                },
                width: '95%',
                heightAuto: false,
                didOpen: () => {

                    try {
                        document.querySelector('input[data-fieldname="custom_reference_invoice"]').parentElement.parentElement.childNodes[3].children[1].remove()
                        //document.querySelector('input[data-fieldname="custom_reference_invoice"]').parentElement.parentElement.childNodes[3].children[0].children[0].remove()

                        // // Adding click event listeners for the buttons after the modal opens
                        // document.getElementById('.swal2-cancel ').addEventListener('click', () => {
                        //   Swal.close(); // Close the current SweetAlert
                        //   // Add logic for "Change Invoice" here (e.g., navigate to a new page, show another dialog, etc.)
                        //   alert("Redirecting to change invoice.");

                        //   document.querySelector('input[data-fieldname="custom_reference_invoice"]').value = ''; 
                        //   document.querySelector('textarea[data-fieldname="custom_remarks"]').value = ''

                        // });

                        // document.getElementById('.acceptContinueBtn').addEventListener('click', () => {
                        //   Swal.close(); // Close the current SweetAlert
                        //   // Add logic for "Accept and Continue" here (e.g., submit form, proceed to next step, etc.)
                        //   alert("Proceeding with the invoice.");

                        // });

                    } catch (error) { }


                }
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('Updated !', '', 'success')
                    let em = document.querySelector(".submit-order-btn")
                    em.style.display = 'flex';
                } else if (result.isDenied) {

                    document.querySelector('input[data-fieldname="custom_reference_invoice"]').value = '';
                    document.querySelector('textarea[data-fieldname="custom_remarks"]').value = ''
                    document.querySelector('data-fieldname="custom_reference_invoice"').focus()
                    Swal.fire('Reselect invoice to continue', '', 'info')
                }
            });


            frappe.db.get_doc('POS Invoice', cur_frm.doc.custom_reference_invoice).then(r => {
                setTimeout(() => {
                    console.log(":: POS INVOICE ::", r)
                    let newOutstandingAmount = r.custom_invoices_outstanding_amount_ - (cur_frm.doc.total * -1)
                    _remark = `Amount of ${cur_frm.doc.total} received against the Invoice ${cur_frm.doc.custom_reference_invoice} (${r.custom_invoices_outstanding_amount_}), with new outstanding balance of EUR ${newOutstandingAmount}.`
                    add_remark(_remark)
                }, 10);
            })
        }
    },

    custom_item_to_reserved: function (frm) {

        if (!isDeposit) {
            document.querySelector('div.invoice_detail_field.custom_item_to_reserved-field').remove()
            document.querySelector('div.invoice_detail_field.custom_reference_invoice-field').remove()
            document.querySelector('div.invoice_detail_field.custom_item_reserved_status-field').remove()
        } else {
            let em = document.querySelector(".submit-order-btn")
            em.style.display = 'none';
            cur_frm.toggle_reqd('custom_item_reserved_status', 1)
        }

        if (cur_frm.doc.items.some(i => i.item_name === "DEPOSIT")) {

            // $('input[data-fieldname="custom_item_to_reserved"]').select2();


            if (cur_frm.doc.custom_item_to_reserved === '') { return; }

            frappe.db.get_doc('Item', cur_frm.doc.custom_item_to_reserved).then(r => {

                total = 0;
                cur_frm.doc.payments.forEach(p => {
                    total += parseFloat(p.amount)
                })

                let _remark = `Amount EUR ${total} received as deposit.`
                add_remark(_remark)


                if (cur_frm.doc.custom_reference_invoice != '') {
                    _remark = `Amount EUR ${total} against the item ${r.item_name} (${r.name}) for total amount of (EUR ${r.standard_rate}).`
                    add_remark(_remark)
                }

                cur_frm.doc.custom_is_deposit = 1;

                if (cur_frm.doc.custom_base_amount === 0 || cur_frm.doc.custom_base_amount === '') {
                    cur_frm.doc.custom_base_amount = r.standard_rate;
                }


                if (cur_frm.doc.custom_invoices_outstanding_amount_ === 0 || cur_frm.doc.custom_invoices_outstanding_amount_ === '') {

                    cur_frm.doc.custom_invoices_outstanding_amount_ = r.standard_rate - total;
                } else {
                    cur_frm.doc.custom_invoices_outstanding_amount_ = r.standard_rate - (cur_frm.doc.custom_invoices_outstanding_amount_ + total);
                }

            })

        } else {
            // document.querySelector('div.invoice_detail_field.custom_item_to_reserved-field').remove()
            // document.querySelector('div.invoice_detail_field.custom_reference_invoice-field').remove()

        }

    },

    before_submit: function (frm) {

        let custom_credit_forward_amount_ = frm.doc.custom_credit_forward_amount_;
        let _couponCode = get_applied_coupons();
        let last_coupon = _couponCode[_couponCode.length - 1];

        if (_couponCode.length >= 1) {

            if (custom_credit_forward_amount_ > 0 && _couponCode.length >= 2) {

                _couponCode.forEach((c) => {

                    frappe.call({
                        method: "cpherbalist.pos.redeem_coupon",
                        args: {
                            coupon_code: c,
                        }
                    }).then((result) => {

                        frappe.call({
                            method: "cpherbalist.pos.update_coupon_balance",
                            args: {
                                coupon_code: c,
                                balance: 0
                            }
                        })
                            .then((result) => {

                                if (c === last_coupon) {
                                    frappe.call({
                                        // reactivate_coupon
                                        // update_coupon_balance
                                        method: "cpherbalist.pos.reactivate_coupon",
                                        args: {
                                            coupon_code: last_coupon,
                                            balance: custom_credit_forward_amount_
                                        }
                                    })
                                        .then((result) => { })
                                        .catch((err) => { });
                                }
                            })
                            .catch((err) => { });

                    }).catch((err) => { });
                })
            } else {
                if (custom_credit_forward_amount_ > 0) {
                    frappe.call({
                        method: "cpherbalist.pos.update_coupon_balance",
                        args: {
                            coupon_code: _couponCode[0],
                            balance: custom_credit_forward_amount_
                        }
                    })
                        .then((result) => { })
                        .catch((err) => { });

                } else {
                    frappe.call({
                        method: "cpherbalist.pos.redeem_coupon",
                        args: {
                            coupon_code: _couponCode[0],
                        }
                    }).then((result) => {

                        frappe.call({
                            method: "cpherbalist.pos.update_coupon_balance",
                            args: {
                                coupon_code: _couponCode[0],
                                balance: custom_credit_forward_amount_
                            }
                        })
                            .then((result) => { })
                            .catch((err) => { });

                    }).catch((err) => { });

                }
            }
        }

        if (isDeposit) {
            let paidCreditedInvoice = cur_frm.doc.custom_reference_invoice != '';
            let custom_reference_invoice_exist = cur_frm.custom_reference_invoice != null || cur_frm.custom_reference_invoice != '' || cur_frm.custom_reference_invoice != undefined;


            if (paidCreditedInvoice && (itemsToReserved.length > 1)) {
                frappe.validated = false;
                frappe.throw(__("You can not create transaction contain reference invoice and product."))
                return false;
            } else if (!paidCreditedInvoice && (itemsToReserved.length === 0)) {
                frappe.validated = false;
                frappe.throw(__("Please select either a product or reference invoice."))
                return false;
            } else if (itemsToReserved.length >= 1 && (cur_frm.doc.custom_item_reserved_status === null || cur_frm.doc.custom_item_reserved_status == '' || cur_frm.doc.custom_item_reserved_status === undefined)
                && (cur_frm.custom_reference_invoice != null || cur_frm.custom_reference_invoice != '' || cur_frm.custom_reference_invoice != undefined)) {
                cur_frm.toggle_reqd('custom_item_reserved_status', 0)
                frappe.validated = false;
                frappe.throw(__("Please select a reservation status."))
                return false;
            } else if (itemsToReserved.length == 0 && custom_reference_invoice_exist) {

                cur_frm.toggle_reqd('custom_item_reserved_status', 0)



            }

            // if (itemsToReserved.length === 0) {
            //     $('input[data-fieldname="custom_item_to_reserved"]').focus()
            //     msgprint("Item to reserve is required !");
            //     frappe.validated = false;
            //     frappe.throw(__("Not Saved"))
            //     return false; 
            // } 

            // check if we have to link invoice 

            if (cur_frm.doc.custom_reference_invoice != '') {

                frappe.db.get_doc('POS Invoice', cur_frm.doc.custom_reference_invoice).then(r => {


                    console.log(":: POS INVOICE ::", r)

                    if (r.custom_parent_invoice != null) {
                        cur_frm.doc.custom_parent_invoice = r.custom_parent_invoice
                    } else {
                        cur_frm.doc.custom_parent_invoice = cur_frm.doc.custom_reference_invoice
                    }

                    cur_frm.doc.custom_is_deposit = r.custom_is_deposit;
                    cur_frm.doc.custom_base_amount = r.custom_base_amount;
                    let newOutstandingAmount = r.custom_invoices_outstanding_amount_ - (cur_frm.doc.total * -1)
                    cur_frm.doc.custom_invoices_outstanding_amount_ = newOutstandingAmount
                    //_remark = `Amount of ${cur_frm.doc.total} received against the Invoice ${cur_frm.doc.custom_reference_invoice} (${r.custom_invoices_outstanding_amount_}), with new outstanding balance of EUR ${newOutstandingAmount}.`

                    if (newOutstandingAmount === 0) {


                        frappe.db.get_doc('Michalis Diamond Gallery Settings').then(res => {
                            cur_frm.doc.custom_is_settlement_invoice = 1;

                            msgprint('Create sales invoice for that product.')

                            let customer = cur_frm.doc.customer;
                            let items_to_update_stock = [];
                            let related_invoices = [];
                            console.log('Create Sales invoice ...')
                            console.log('⚙️ default_reservation_warehouse ', res['default_reservation_warehouse'])

                            frappe.call({
                                method: "cpherbalist.pos.get_child_invoices", //dotted path to server method
                                args: {
                                    filters: { parent_invoice: `${cur_frm.doc.custom_parent_invoice}` }
                                },
                                success: function (r) { },
                                error: function (r) { },
                                callback: function (r) {
                                    console.log(' -- [callback] RELATED INVOICES --', r.message)
                                    window.related_invoices = r.message

                                    if (window.related_invoices.length >= 1) {


                                        get_parent_invoice_obj(cur_frm.doc.custom_parent_invoice).then(pobj => {

                                            if (r != null) {

                                                let items = get_items_from_parent_invoice(pobj)

                                                console.log('    PARENT INVOICE ', pobj)
                                                console.log('       INVOICE OBJECT ', items)



                                                frappe.call({
                                                    method: "cpherbalist.pos.create_stock_entry_against_parent_invoice_reserved_items",
                                                    args: {
                                                        filters: {
                                                            parent_invoice: pobj.name
                                                        }
                                                    },
                                                    callback: function (r) {
                                                        console.log(r)
                                                    }
                                                });
                                            }
                                        })
                                    }
                                }
                            })
                        });
                    }
                    //msgprint(`Deposit against the amount: ${baseAmount}\nOutstanding amount: ${outstandingAmount}`);
                })
            }
            else // in case that we do not have any item selected ...
            {
                // set custom_items_to_deposit

                // item
                // item_name
                // qty 
                // rate

                console.log(" -- ITEMS TO RESERVED -- ", itemsToReserved)

                // Loop through the items and add them to the child table
                itemsToReserved.forEach(function (item) {
                    var row = cur_frm.add_child('custom_items_to_deposit');
                    row.item = item.item;
                    row.item_name = item.item_name;
                    row.qty = item.qty;
                    row.rate = item.rate;
                    row.total_amount = item.qty * item.rate


                    // Refresh the form to reflect the changes
                    cur_frm.refresh_field('custom_items_to_deposit');

                    frappe.db.get_value("User", frappe.session.user, "warehouse").then(response => {

                        console.log(' ^^ POS PROFILE ^^', response.message.warehouse);
                        _from_warehouse = response.message.warehouse;

                    })


                    get_settings('default_reservation_warehouse').then(settingValue => {

                        let _from_warehouse = settingValue;
                        let _to_warehouse = undefined;

                        console.log(settingValue);

                        get_pos_profile_warehouse(cur_pos.pos_profile).then(ppw => {

                            _to_warehouse = ppw;

                            if ((_from_warehouse != '' || _from_warehouse != undefined || _from_warehouse === null) &&
                                ((_to_warehouse != '' || _to_warehouse != undefined || _to_warehouse === null))) {

                                let _custom_item_given = 0;
                                let _custom_item_hold = 1;
                                let _custom_item_reserved_status = cur_frm.doc.custom_item_reserved_status

                                try {
                                    if (_custom_item_reserved_status != null) {

                                        if (_custom_item_reserved_status.includes('Hold') || _custom_item_reserved_status.includes('Undelivered')) { }

                                        if (_custom_item_reserved_status.includes('Given') || _custom_item_reserved_status.includes('Released') || _custom_item_reserved_status.includes('Delivered')) {
                                            _custom_item_given = 1;
                                            _custom_item_hold = 0;
                                        }

                                    } else {
                                        return;

                                    }
                                } catch (error) {

                                }





                                // move items out 
                                frappe.call({
                                    // method: "erpnext.stock.doctype.stock_entry.stock_entry_utils.make_stock_entry",
                                    method: "cpherbalist.mdg_stock_entry_utils.make_stock_entry",

                                    args: {
                                        item_code: row.item,
                                        qty: 1, //qty_to_move,
                                        from_warehouse: _to_warehouse,
                                        to_warehouse: _from_warehouse,
                                        company: frappe.defaults.get_user_defaults("Company")[0],
                                        custom_item_given: _custom_item_given,
                                        custom_item_hold: _custom_item_hold,
                                    },
                                    callback: (r) => {

                                    },
                                }).then(r => {
                                    frm.refresh();
                                });
                            }

                        })
                    }).catch(error => {
                        console.error('Error:', error);
                    });
                });


                // cur_frm.doc.custom_item_reserved_status
                // // create sales invoice against the reserved warehouse 

                cur_frm.doc.custom_is_deposit = 1;
                cur_frm.doc.custom_base_amount = baseAmount;
                let outstandingAmount = cur_frm.doc.custom_invoices_outstanding_amount_ - (baseAmount - cur_frm.doc.total)
                cur_frm.doc.custom_invoices_outstanding_amount_ = outstandingAmount
            }

        }


        // check for seller account 
        let _sellerAccount = JSON.parse(localStorage.getItem('seller_profile')).value

        if (_sellerAccount) {
            cur_frm.doc.custom_seller_account = _sellerAccount
        }

    },

    onload: function (frm) {

        console.log(window.location.href)
        console.log(':: ✨ ON LOAD :: ');

        toggle_credit_forward_amount();
        const button = document.querySelector(".checkout-btn");

        button.addEventListener("click", (event) => {
            console.log(" :: 🟤 CLICK ON CHECKOUT ::")

            addCustomStyle()

            if (typeof $.fn.select2 !== 'undefined') {
                console.log('Select2 is loaded');
            } else {
                setTimeout(() => {
                    console.log('Select2 is not loaded');
                    frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.all.min.js")
                    frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.min.css")

                    frappe.require("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css")
                    frappe.require("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js")
                }, 0);


            }

            if (!cur_frm.doc.items.some(i => i.item_name === "DEPOSIT")) {
                console.log(':: DEPOSIT ITEM ::');
            }

            if (cur_frm.doc.items.some(i => i.item_name === "DEPOSIT")) {

                return; 
                try {
                    frappe.call({
                        method: 'cpherbalist.material_request_custom.get_warehouse_items_select2',
                        args: {
                            filters: {
                                warehouse: cur_frm.doc.set_warehouse
                            }
                        },
                    }).then(response => {

                        if (response.message) {
                            // Handle the response (e.g., display items)
                            console.log(response.message);  // This will log the list of items returned from the server
                            console.log(":: response.message.results ::", response.message.results);

                            var data1 = $.map(response.message.results, function (obj) {
                                obj.id = obj.id || obj.pk; // replace pk with your identifier
                                return obj;
                            });

                            checkElementExistence('input[data-fieldname="custom_item_to_reserved"]', data1);
                        }
                    });
                } catch (error) {

                }

            }


        });
    },

    custom_apply_coupon: function (frm) {

        // custom_coupon_code
        let couponCode = document.querySelector('textarea[data-fieldname="custom_coupon_code"]').value
        const lines = couponCode.split(/\r?\n/).filter(line => line.trim() !== '');
        //var concatenatedString = lines.join(",");

        couponCode = get_applied_coupons();
        console.log('get_applied_coupons', couponCode);

        let concatenatedString = couponCode.map(line => line.trim()).join(",");
        console.log('coupons', concatenatedString);
        let cc, prc, couponCodes;


        if (couponCode.length >= 2) // we have to call apply coupons more than one's
        {
            couponCodes = couponCode
            console.log('couponCodes ', couponCodes);

            frappe.call({
                async: true,
                method: "cpherbalist.pos.get_subtotal_with_coupons",
                args: {
                    coupon_codes: concatenatedString
                }
            }).then((result) => {

                console.log('result:', result);

                if (result.message) {
                    var total_discount = result.message.total_discount;

                    add_remark(result.message.message);

                    console.log("Total amount from all coupons: ", total_discount);

                    console.log('🧾 POS: ', cur_pos);

                    $(`.mode-of-payment[data-mode="voucher"]`)[0].click()
                    cur_pos.payment.selected_mode.set_value(total_discount)

                    //apply_discount(cur_frm, total_discount, couponCode);
                    show_remove_coupons_button();

                    readjustPaymentMethod(total_discount);


                } else {
                    console.log("No response or error in fetching the discount.");
                }

            }).catch((err) => { });

            console.log('totalDiscountAmount ', totalDiscountAmount);
            cur_frm.set_value('discount_amount', totalDiscountAmount)

        } else {
            frappe.call({
                method: "cpherbalist.pos.get_coupon",
                args: {
                    coupon_code: couponCode[0]
                }
            }).then(response => {

                if (response.message) {

                    cc = response.message;
                    console.log("Coupon details:", cc);

                    const coupon_used_msg = __("Coupon with code <b>{0}</b> has already been used.", [couponCode]);
                    if (cc.used >= 1) {
                        frappe.throw(coupon_used_msg)
                        return;
                    }


                    if (cc.pricing_rule != null) {

                        let pricing_rule = cc.pricing_rule;
                        console.log('Pricing Rule:', pricing_rule);
                        frappe.call('cpherbalist.pos.get_pricing_rule', {
                            pricing_rule: pricing_rule
                        }).then(r => {

                            prc = r.message;
                            console.log('Pricing Rule Details:', prc);
                            cur_frm.set_value('discount_amount', prc.discount_amount)

                            const coupon_applied_msg = __("Coupon with code <b>{0}</b> has been applied for the amount of <b>{1} {2}</b>.", [
                                couponCode,
                                currency,
                                prc.discount_amount

                            ]);

                            frappe.msgprint({
                                title: __('Coupon Applied'),
                                indicator: 'green,',
                                message: coupon_applied_msg
                            });

                            show_remove_coupons_button();
                            console.log('Discount Amount', prc);

                        }).catch(error => {
                            frappe.throw(__('Coupon is not valid.'))

                        })
                    }

                    else {
                        // in case that we do not have a price rule



                        let applicableAmount = cc.custom_amount;
                        console.log(applicableAmount);
                        show_remove_coupons_button();
                        //apply_discount(cur_frm, applicableAmount, couponCode);

                        console.log('🧾 POS: ', cur_pos);
                        add_remark(`Coupon ${couponCode}: ${currency} ${applicableAmount}`);

                        // update values
                        let cash_amount = 0;
                        let coupon_amount = applicableAmount;
                        let total_amount = cur_frm.doc.grand_total;

                        try {
                            cash_amount = parseFloat(document.querySelector(`.mode-of-payment[data-mode="cash"] > .pay-amount`).innerText.split(' ')[1]);

                            if (cash_amount === NaN) {
                                cash_amount = 0;
                            }
                        } catch (e) {
                            card_amount = 0;
                            console.log(e); // Logs the error
                        }


                        let remaining_amount = total_amount - coupon_amount;






                        $(`.mode-of-payment[data-mode="cash"]`)[0].click()
                        cur_pos.payment.selected_mode.set_value(remaining_amount)

                        $(`.mode-of-payment[data-mode="voucher"]`)[0].click()
                        cur_pos.payment.selected_mode.set_value(applicableAmount)

                        if (remaining_amount < 0) {
                            $(`.mode-of-payment[data-mode="cash"]`)[0].click()
                            cur_pos.payment.selected_mode.set_value(0)

                            $(`.mode-of-payment[data-mode="credit_card"]`)[0].click()
                            cur_pos.payment.selected_mode.set_value(0)

                            // $(`.mode-of-payment[data-mode="deposit"]`)[0].click()
                            // cur_pos.payment.selected_mode.set_value(0)

                            set_credit_forward_amount(Math.abs(remaining_amount), frm)

                            $(`.mode-of-payment[data-mode="voucher"]`)[0].click()
                            cur_pos.payment.selected_mode.set_value(total_amount)

                        }

                    }



                } else {
                    const error_msg = __("Coupon with code <b>{0}</b> is expired or is not valid.", [
                        couponCode,
                    ]);
                    frappe.throw(error_msg)
                }
            }).catch(error => {
                const error_msg = __("Coupon with code <b>{0}</b> is expired or is not valid.", [
                    couponCode,
                ]);
                frappe.throw(error)
                console.error(error)
            });

        }

    },

    refresh: function (frm) {
    //     try {
    //         console.log(' :: RELOAD ::')
            
    //         frappe.call({
    //             method: 'cpherbalist.material_request_custom.get_warehouse_items_select2',
    //             args: {
    //                 filters: {
    //                     warehouse: cur_frm.doc.set_warehouse
    //                 }
    //             },
    //         }).then(response => {

    //             if (response.message) {
    //                 // Handle the response (e.g., display items)
    //                 console.log(response.message);  // This will log the list of items returned from the server
    //                 console.log(":: response.message.results ::", response.message.results);

    //                 var data1 = $.map(response.message.results, function (obj) {
    //                     obj.id = obj.id || obj.pk; // replace pk with your identifier
    //                     return obj;
    //                 });
    //                 checkElementExistence('input[data-fieldname="custom_item_to_reserved"]', data1);
    //             }
    //         });
    //     } catch (error) {

    //     }
    // }
    }
});


function readjustPaymentMethod(couponAmount) {
    let total_amount = cur_frm.doc.grand_total;

    $(`.mode-of-payment[data-mode="cash"]`)[0].click()
    cur_pos.payment.selected_mode.set_value(total_amount - couponAmount)

    $(`.mode-of-payment[data-mode="voucher"]`)[0].click()
    cur_pos.payment.selected_mode.set_value(couponAmount)
}

function checkElementExistence(s_element, a_data) {

    let retryCount = 0; // Initialize retry count

    const intervalId = setInterval(() => {
        const element = document.querySelector(s_element);
        if (element) {
            console.log('Element found!');

            $('input[data-fieldname="custom_item_to_reserved"]')[0].setAttribute("multiple", "multiple");
            $('input[data-fieldname="custom_item_to_reserved"]')[0].setAttribute("name", "custom_item_to_reserved[]");

            select2Element = $('input[data-fieldname="custom_item_to_reserved"]').select2({
                placeholder: 'Select items to reserve.',
                tags: true,
                tokenSeparators: [,],
                scrollAfterSelect: true,
                allowClear: true,
                data: a_data,
            });

            init_select2_events();

            clearInterval(intervalId);
        } else if (retryCount >= 5) {
            console.log('Retry limit reached. Element not found.');
            clearInterval(intervalId);
        } else {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of 5`);
        }

    }, 2000);
}