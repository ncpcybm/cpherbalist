
frappe.provide("erpnext");
frappe.provide("erpnext.utils");
frappe.provide("frappe.desk");
frappe.provide("erpnext.PointOfSale");

// --------------------------------

// Function to handle URL changes
function onUrlChange() {
    //console.log("The page URL changed to:", window.location.href);
}

// Listen for the popstate event
window.addEventListener('popstate', onUrlChange);

// Optionally, you may want to listen for manual URL changes like `pushState` or `replaceState`
(function () {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override the pushState method
    history.pushState = function (state, title, url) {
        originalPushState.apply(history, arguments);
        onUrlChange();  // Call the handler
    };

    // Override the replaceState method 
    history.replaceState = function (state, title, url) {
        originalReplaceState.apply(history, arguments);
        onUrlChange();  // Call the handler
    };
})();

// --------------------------------

// $(document).ready( ()=> {
// setTimeout(() => {

//     console.log('💥')


//         const params = new URLSearchParams(window.location.search);
//         const coupon = params.get("evoucher");
    
//         // Map coupon codes to item codes
//         const couponToItemMap = {
//             "SUMMER50": "DISCOUNT-SUMMER50",
//             "WELCOME10": "DISCOUNT-WELCOME10"
//         };
    
    
//         if (window.location.pathname.includes("/point-of-sale") && coupon) {
    
//             frappe.call({
//                 method: "cpherbalist.api.get_coupon_data",  // Adjust this to your app path
//                 args: {
//                     coupon_code: coupon
//                 },
//                 callback: function (r) {

//                     console.log(`Coupon "${coupon}`);
//                     console.log('💥')

//                     if (!r.exc && r.message) {
//                         const coupon = r.message;
//                         console.log("Coupon Data:", coupon);
                        
//                         // e.g., add item to POS:
//                         window.pos.app.$store.dispatch("pos/add_item_to_cart", {
//                             item_code: coupon.item_code,
//                             qty: 1
//                         });
//                     } else {
//                         frappe.msgprint("Invalid coupon code");
//                     }
//                 }
//             });
//         }
// }, 3500);
// } )


frappe.require('point-of-sale.bundle.js', function () {

    window.opening_pos_entry = undefined;
    window.opening_date = undefined;
    window.is_deposit = undefined;
    window.allow_change_deposit_rate = true;
    window.wrapper = undefined

    erpnext.PointOfSale.Controller = class MyPosController extends erpnext.PointOfSale.Controller {
        constructor(wrapper) {
            
            super(wrapper);

            this.get_opening_entry().then((res) => {

                console.log('pos opening entry ', res.message[0]);
                window.opening_pos_entry = res.message[0].name;
                window.opening_date = res.message[0].period_start_date;

                var _ = this.force_close() >= 1;


                if (_) {
                    this.raise_pos_closing_alert(cur_frm);
                }

                setTimeout(() => {
                    frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.all.min.js")
                    frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.min.css")

                    // frappe.require("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css")
                    // frappe.require("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js")

                    frappe.require("https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.1.2/lazysizes.min.js")

                }, 0);

            });

            // cur_frm.doc.pos_profile
        }

        init_item_cart() {
            this.cart = new erpnext.PointOfSale.ItemCart({
                wrapper: this.$components_wrapper,
                settings: this.settings,
                events: {
                    get_frm: () => this.frm,
    
                    cart_item_clicked: (item) => {
                        const item_row = this.get_item_from_frm(item);
                        this.item_details.toggle_item_details_section(item_row);
                    },
    
                    numpad_event: (value, action) => this.update_item_field(value, action),
    
                    checkout: () => this.save_and_checkout(),
    
                    edit_cart: () => this.payment.edit_cart(),
    
                    customer_details_updated: (details) => {
                        this.item_selector.load_items_data();
                        this.customer_details = details;
                        // will add/remove LP payment method
                        this.payment.render_loyalty_points_payment_mode();


                        function deleteCookie(name, path = "/") {
                            document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
                        }

                        function setCookie(name, value, days = 7, path = "/") {
                            deleteCookie(name);


                            const d = new Date();
                            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
                            const expires = "expires=" + d.toUTCString();
                            document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=${path}`;
                        }

                        setCookie("pos_customer", details.customer, 15);
                        setCookie("pos_profile", cur_pos.pos_profile, 15);



                    },
                },
            });
        }

        update_totals_section(doc) {
            if (!doc) doc = this.events.get_frm().doc;
            const paid_amount = doc.paid_amount;
            const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
                ? doc.grand_total
                : doc.rounded_total;
            const remaining = grand_total - doc.paid_amount;
            const change = doc.change_amount || remaining <= 0 ? -1 * remaining : undefined;
            const currency = doc.currency;
            const label = __("Change Amount");
    
            this.$totals.html(
                `<div class="col">
                    <div class="total-label">${__("Grand Total")}</div>
                    <div class="value">${format_currency(grand_total, currency)}</div>
                </div>
                <div class="seperator-y"></div>
                <div class="col">
                    <div class="total-label">${__("Paid Amount")}</div>
                    <div class="value">${format_currency(paid_amount, currency)}</div>
                </div>
                <div class="seperator-y"></div>
                <div class="col">
                    <div class="total-label">${label}</div>
                    <div class="value">${format_currency(change || remaining, currency)}</div>
                </div>`
            );


        }

        prepare_dom() {

            this.wrapper.append(`<div class="point-of-sale-app"></div>`);

            this.$components_wrapper = this.wrapper.find(".point-of-sale-app");

            console.log(':: components_wrapper ::', this.$components_wrapper)

            setTimeout(() => {
                render_pos_action_btn()
                render_seller_profile()
                removeCustomStyle()

                //render_pricing_rule()
            }, 0);
        }

        force_close() {
            const givenDate = window.opening_date;
            const dGiven = new Date(givenDate);

            const dToday = new Date();

            dGiven.setHours(0, 0, 0, 0);
            dToday.setHours(0, 0, 0, 0);

            const diffMilliseconds = dToday - dGiven;
            const diffDays = diffMilliseconds / (1000 * 60 * 60 * 24);
            return diffDays;
        }

        raise_pos_closing_alert = (frm) => {

            frappe.confirm('The POS Closing Entry for this session does not exist. In order to proceed, a POS Closing Entry must be created. Please ensure that all required details are entered and confirm the closing entry before proceeding.',
                () => {
                    this.close_pos()
                }, () => {
                    frappe.dom.freeze();
                })
        }

        close_pos() {
            if (!this.$components_wrapper.is(":visible")) return;

            let voucher = frappe.model.get_new_doc("POS Closing Entry");
            voucher.pos_profile = this.frm.doc.pos_profile;
            voucher.user = frappe.session.user;
            voucher.company = this.frm.doc.company;
            voucher.pos_opening_entry = this.pos_opening;
            voucher.period_end_date = frappe.datetime.now_datetime();
            voucher.posting_date = frappe.datetime.now_date();
            voucher.posting_time = frappe.datetime.now_time();
            frappe.set_route("Form", "POS Closing Entry", voucher.name);
        }

        get_opening_entry() {
            return frappe.call("erpnext.selling.page.point_of_sale.point_of_sale.check_opening_entry", {
                user: frappe.session.user,
            });
        }

        create_opening_voucher() {

            const me = this;
            const table_fields = [
                {
                    fieldname: "mode_of_payment",
                    fieldtype: "Link",
                    in_list_view: 1,
                    label: __("Mode of Payment"),
                    options: "Mode of Payment",
                    reqd: 1,
                },
                {
                    fieldname: "opening_amount",
                    fieldtype: "Currency",
                    in_list_view: 1,
                    label: __("Opening Amount"),
                    options: "company:company_currency",
                    change: function () {
                        dialog.fields_dict.balance_details.df.data.some((d) => {
                            if (d.idx == this.doc.idx) {
                                d.opening_amount = this.value;
                                dialog.fields_dict.balance_details.grid.refresh();
                                return true;
                            }
                        });
                    },
                },
            ];
            const fetch_pos_payment_methods = () => {
                const pos_profile = dialog.fields_dict.pos_profile.get_value();
                if (!pos_profile) return;
                frappe.db.get_doc("POS Profile", pos_profile).then(({ payments }) => {
                    dialog.fields_dict.balance_details.df.data = [];
                    payments.forEach((pay) => {
                        const { mode_of_payment } = pay;
                        dialog.fields_dict.balance_details.df.data.push({ mode_of_payment, opening_amount: "0" });
                    });
                    dialog.fields_dict.balance_details.grid.refresh();
                });
            };


            const dialog = new frappe.ui.Dialog({
                title: __("🟢 Create POS Opening Entry"),
                static: true,
                fields: [
                    {
                        fieldtype: "Link",
                        label: __("Company"),
                        default: frappe.defaults.get_default("company"),
                        options: "Company",
                        fieldname: "company",
                        reqd: 1,
                        read_only: 1
                    },
                    {
                        fieldtype: "Link",
                        label: __("POS Profile"),
                        options: "POS Profile",
                        fieldname: "pos_profile",
                        reqd: 1,
                        //get_query: () => pos_profile_query(),
                        onchange: () => fetch_pos_payment_methods(),
                        read_only: 0
                    },
                    {
                        fieldname: "balance_details",
                        fieldtype: "Table",
                        label: __("Opening Balance Details"),
                        cannot_add_rows: true,
                        in_place_edit: true,
                        reqd: 1,
                        data: [],
                        fields: table_fields,
                    },
                ],

                primary_action: async function ({ company, pos_profile, balance_details }) {
                    if (!balance_details.length) {
                        frappe.show_alert({
                            message: __("Please add Mode of payments and opening balance details."),
                            indicator: "red",
                        });
                        return frappe.utils.play_sound("error");
                    }

                    // filter balance details for empty rows
                    balance_details = balance_details.filter((d) => d.mode_of_payment);

                    const method = "erpnext.selling.page.point_of_sale.point_of_sale.create_opening_voucher";
                    const res = await frappe.call({
                        method,
                        args: { pos_profile, company, balance_details },
                        freeze: true,
                    });
                    !res.exc && me.prepare_app_defaults(res.message);
                    dialog.hide();
                },
                primary_action_label: __("Submit"),
            });


            frappe.call({
                method: "cpherbalist.pos_automated_actions.get_user_pos_profile",
                args: { "user": frappe.session.user }, 
                callback: function (response) {

                    if (dialog && response.message) {
                        dialog.fields_dict['pos_profile'].set_value(response.message);

                        setTimeout(() => {
                            document.querySelector('.grid-add-row').remove()
                        }, 800);
                    }
                },
                error: function (error) {
                    console.error(error);
                }
            });

            dialog.show();
            const pos_profile_query = () => {
                return {
                    query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
                    filters: { company: dialog.fields_dict.company.get_value() },
                };
            };
        }

        get_item = async (code) => {
            return await frappe.db.get_doc('Item', code)
        }

        raise_item_cp_alert = () => {
            frappe.dom.unfreeze();
            frappe.show_alert({
                message: __("You can not select this item."),
                indicator: "red",
            });
            frappe.utils.play_sound("error");
            return;
        }

        raise_item_deposit_alert = () => {
            frappe.dom.unfreeze();
            frappe.show_alert({
                message: __("You can not select this item."),
                indicator: "red",
            });
            frappe.utils.play_sound("error");
            return;
        }

        async on_cart_update(args) {
            frappe.dom.freeze();
            if (this.frm.doc.set_warehouse != this.settings.warehouse)
                this.frm.doc.set_warehouse = this.settings.warehouse;
            let item_row = undefined;
            try {
                let { field, value, item } = args;
                item_row = this.get_item_from_frm(item);
                const item_row_exists = !$.isEmptyObject(item_row);
    
                const from_selector = field === "qty" && value === "+1";
                if (from_selector) value = flt(item_row.qty) + flt(value);
    
                if (item_row_exists) {
                    if (field === "qty") value = flt(value);
    
                    if (["qty", "conversion_factor"].includes(field) && value > 0 && !this.allow_negative_stock) {
                        const qty_needed =
                            field === "qty" ? value * item_row.conversion_factor : item_row.qty * value;
                        await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
                    }
    
                    if (this.is_current_item_being_edited(item_row) || from_selector) {
                        await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
                        if (item.serial_no && from_selector) {
                            await frappe.model.set_value(
                                item_row.doctype,
                                item_row.name,
                                "serial_no",
                                item_row.serial_no + `\n${item.serial_no}`
                            );
                        }
                        this.update_cart_html(item_row);
                    }
                } else {
                    if (!this.frm.doc.customer) return this.raise_customer_selection_alert();
    
                    const { item_code, batch_no, serial_no, rate, uom, stock_uom } = item;
    
                    if (!item_code) return;
    
                    if (rate == undefined || rate == 0) {
                        frappe.show_alert({
                            message: __("Price is not set for the item."),
                            indicator: "orange",
                        });
                        frappe.utils.play_sound("error");
                        return;
                    }
                    const new_item = { item_code, batch_no, rate, uom, [field]: value, stock_uom };
    
                    if (serial_no) {
                        await this.check_serial_no_availablilty(item_code, this.frm.doc.set_warehouse, serial_no);
                        new_item["serial_no"] = serial_no;
                    }
    
                    new_item["use_serial_batch_fields"] = 1;
                    if (field === "serial_no") new_item["qty"] = value.split(`\n`).length || 0;
    
                    item_row = this.frm.add_child("items", new_item);
    
                    if (field === "qty" && value !== 0 && !this.allow_negative_stock) {
                        const qty_needed = value * item_row.conversion_factor;
                        await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
                    }
    
                    await this.trigger_new_item_events(item_row);
    
                    this.update_cart_html(item_row);
    
                    if (this.item_details.$component.is(":visible")) this.edit_item_details_of(item_row);
    
                    if (
                        this.check_serial_batch_selection_needed(item_row) &&
                        !this.item_details.$component.is(":visible")
                    )
                        this.edit_item_details_of(item_row);
                }
            } catch (error) {
                console.log(error);
            } finally {
                frappe.dom.unfreeze();
                return item_row; // eslint-disable-line no-unsafe-finally
            }
        }


        // async on_cart_update(args) {

        //     frappe.dom.freeze();
        //     let __ = false;

        //     if (this.frm.doc.set_warehouse != this.settings.warehouse)
        //         this.frm.doc.set_warehouse = this.settings.warehouse;
        //     let item_row = undefined;

        //     try {
        //         let { field, value, item } = args;
        //         item_row = this.get_item_from_frm(item);
        //         const item_row_exists = !$.isEmptyObject(item_row);

        //         console.log('item_code [on_cart_update]', args.item.item_code)

        //         // let selected_item = this.get_item(args.item.item_code);

        //         let _ = await frappe.db.get_doc('Item', args.item.item_code).then((value) => {

        //             console.log('🟠 selected_item', value);



        //             if (value.custom_is_virtual && value.custom_autocheckout) {

        //                 setTimeout(() => {
        //                     document.querySelector('.checkout-btn').click()
        //                 }, 500);
        //             }


        //             if (cur_frm.doc.total_qty == 0) {

        //                 if (value.name === 'Deposit') {
        //                     window.is_deposit = true;
        //                     return true;
        //                 }

        //                 if (value.custom_is_cp) {
        //                     window.is_cp = true;
        //                     return true;
        //                 }
        //             }

        //             if (cur_frm.doc.total_qty === 1) {


        //                 if (window.is_cp) {

        //                     if (window.is_deposit) {
        //                         return false;
        //                     }

        //                     if (value.custom_is_cp) {
        //                         return true;
        //                     } else {
        //                         return false;
        //                     }
        //                 }

        //                 if (window.is_deposit) {

        //                     if (value.name != 'Deposit') {
        //                         return false;
        //                     }

        //                     if (value.name === 'Deposit') {

        //                         if (allow_change_deposit_rate && cur_frm.doc.total_qty === 1) {
        //                             return true;
        //                         } else {
        //                             return false;
        //                         }

        //                     }
        //                 }
        //             }
        //             return true;

        //             // ==========================================================================================
        //         })
        //             .catch((e) => {
        //                 console.error(e.message); // "Item alert raised, stopping further execution" or other errors
        //             })


        //         if (!_ && window.is_deposit) {
        //             return this.raise_item_deposit_alert()
        //         }

        //         //console.log(_)

        //         if (!_ && window.is_cp) {
        //             return this.raise_item_cp_alert();
        //         }


        //         const from_selector = field === "qty" && value === "+1";
        //         if (from_selector) value = flt(item_row.qty) + flt(value);

        //         if (item_row_exists) {
        //             if (field === "qty") value = flt(value);

        //             if (["qty", "conversion_factor"].includes(field) && value > 0 && !this.allow_negative_stock) {
        //                 const qty_needed =
        //                     field === "qty" ? value * item_row.conversion_factor : item_row.qty * value;
        //                 await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
        //             }

        //             if (this.is_current_item_being_edited(item_row) || from_selector) {
        //                 await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
        //                 this.update_cart_html(item_row);
        //             }
        //         } else {
        //             if (!this.frm.doc.customer) return this.raise_customer_selection_alert();

        //             const { item_code, batch_no, serial_no, rate, uom, stock_uom } = item;

        //             if (!item_code) return;

        //             if (rate == undefined || rate == 0) {
        //                 frappe.show_alert({
        //                     message: __("Price is not set for the item."),
        //                     indicator: "orange",
        //                 });
        //                 frappe.utils.play_sound("error");
        //                 return;
        //             }
        //             const new_item = { item_code, batch_no, rate, uom, [field]: value, stock_uom };

        //             if (serial_no) {
        //                 await this.check_serial_no_availablilty(item_code, this.frm.doc.set_warehouse, serial_no);
        //                 new_item["serial_no"] = serial_no;
        //             }

        //             new_item["use_serial_batch_fields"] = 1;
        //             if (field === "serial_no") new_item["qty"] = value.split(`\n`).length || 0;

        //             item_row = this.frm.add_child("items", new_item);

        //             if (field === "qty" && value !== 0 && !this.allow_negative_stock) {
        //                 const qty_needed = value * item_row.conversion_factor;
        //                 await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
        //             }

        //             await this.trigger_new_item_events(item_row);

        //             this.update_cart_html(item_row);

        //             if (this.item_details.$component.is(":visible")) this.edit_item_details_of(item_row);

        //             if (
        //                 this.check_serial_batch_selection_needed(item_row) &&
        //                 !this.item_details.$component.is(":visible")
        //             )
        //                 this.edit_item_details_of(item_row);
        //         }


        //     } catch (error) {
        //         console.log(error);
        //     } finally {
        //         frappe.dom.unfreeze();
        //         return item_row; // eslint-disable-line no-unsafe-finally
        //     }

        // }

        init_item_selector() {
            this.item_selector = new erpnext.PointOfSale.ItemSelector({
                wrapper: this.$components_wrapper,
                pos_profile: this.pos_profile,
                settings: this.settings,
                events: {
                    item_selected: (args) => this.on_cart_update(args),

                    get_frm: () => this.frm || {},
                },
            });
        }

        prepare_menu() {

            this.page.clear_menu();

            this.page.add_menu_item(("Toggle Recent Orders"), this.toggle_recent_order.bind(this), false, 'Ctrl+O');

            this.page.add_menu_item(("Save as Draft"), this.save_draft_invoice.bind(this), false, 'Ctrl+S');

            this.page.add_menu_item(__('Close the POS (Z)'), this.close_pos.bind(this), false, 'Shift+Ctrl+C');

            // this.page.add_menu_item(__('Transfers'), function () { window.location.href = 'material-request/new-material-request-' + generateRandomString(10) }, true, 'Shift+Ctrl+T');

            // this.page.add_menu_item(__('Accept Transfers'), function () { window.location.href = 'material-request' }, true, 'Shift+Ctrl+A');
        }

        async check_stock_availability(item_row, qty_needed, warehouse) {
            const resp = (await this.get_available_stock(item_row.item_code, warehouse)).message;

            let _resp = await frappe.call({
                method: "cpherbalist.pos.get_available_qty_per_warehouse",
                args: {
                    item_code: item_row.item_code,
                }
            })

            let available_in_other_warehouse = (_resp.message.length >= 1);
            //console.log(_resp.message.length)

            const available_qty = resp[0];
            const is_stock_item = resp[1];

            frappe.dom.unfreeze();
            const bold_uom = item_row.uom.bold();
            const bold_item_code = item_row.item_code.bold();
            const bold_warehouse = warehouse.bold();
            const bold_available_qty = available_qty.toString().bold();

            if (!(available_qty > 0)) {
                if (is_stock_item) {
                    frappe.model.clear_doc(item_row.doctype, item_row.name);

                    let popup_message = __("Item Code: {0} is not available under warehouse {1}.", [
                        bold_item_code,
                        bold_warehouse,
                    ]);

                    let pos_profile_meta = frappe.get_doc("POS Profile", cur_pos.pos_profile)
                    console.log(pos_profile_meta)
                    
                    if (available_in_other_warehouse) {

                        // let filteredData = _resp.message
                        //     .filter(_warehouse => _warehouse.actual_qty > 0) // Only include warehouses with actual_qty > 0
                        //     .map(_warehouse => `<a onclick="createMovement(${pos_profile_meta.warehouse},${_warehouse.warehouse},${item_row.item_code})" style='margin-top: var(--margin-lg );' target='_blank' href="/api/method/cpherbalist.api.redirect_to?_set_from_warehouse=${encodeURI(pos_profile_meta.warehouse)}&set_from_warehouse=${encodeURI(_warehouse.warehouse)}&set_warehouse=${encodeURI(_warehouse.warehouse)}&the_item=${encodeURI(item_row.item_code)}">${_warehouse.warehouse} (${_warehouse.actual_qty})</a><br>`)
                        //     .join("");

                        let filteredData = _resp.message
                            .filter(_warehouse => _warehouse.actual_qty > 0) // Only include warehouses with actual_qty > 0
                            .map(_warehouse => `<a onclick="createMovement('${pos_profile_meta.warehouse}','${_warehouse.warehouse}','${item_row.item_code}')" style='margin-top: var(--margin-lg );'>${_warehouse.warehouse} (${_warehouse.actual_qty})</a><br>`)
                            .join("");

                        //console.log("Available Warehouses:", availableWarehouses);

                        popup_message = __("Item Code: {0} is not available under warehouse {1}.<br><div style='margin-top: var(--margin-lg ); margin-bottom: var(--margin-lg );'><b>Available Locations</b></div>{2}", [
                            bold_item_code,
                            bold_warehouse,
                            filteredData
                        ]);
                    }
                    frappe.throw({
                        title: __("Item Not Available"),
                        message: popup_message,
                    });
                } else {
                    return;
                }
            } else if (is_stock_item && available_qty < qty_needed) {
                frappe.throw({
                    message: __(
                        "Stock quantity not enough for Item Code: {0} under warehouse {1}. Available quantity {2} {3}.",
                        [bold_item_code, bold_warehouse, bold_available_qty, bold_uom]
                    ),
                    indicator: "orange",
                });
                frappe.utils.play_sound("error");
            }
            frappe.dom.freeze();
        }
    };


    setTimeout(() => {
        try {
            window.wrapper.pos = new erpnext.PointOfSale.Controller(wrapper);
            window.cur_pos = wrapper.pos;
        } catch (error) {
            
        }
    }, 0);
});

register_realtime_events = () => {
    frappe.realtime.on('material_request', async (data) => {

        x = await frappe.db.get_doc('User', frappe.session.user_email).then((result) => {

                let selected_warehouse = result.default_warehouse ?? frappe.user_defaults['default_warehouse'];

                if (data.to_warehouse === selected_warehouse) { frappe.utils.play_sound("custom-alert");

                    var audio = new Audio('/assets/cpherbalist/sounds/mixkit-unlock-game-notification-253.wav'); // replace with the actual sound file path
                    audio.loop = true; // Set loop to true for continuous sound
                    audio.play().catch(error => console.error('Error playing audio:',error));

                    setTimeout(() => { audio.pause(); }, 600);

                    frappe.msgprint({
                        indicator: 'green',
                        title: __(
                            'Incoming Transfer Request 🔔'
                        ),
                        message: __(
                            'Incoming Transfer Request from  ' +
                            data
                                .from_warehouse +
                            '.'),
                        primary_action_label: 'Open Request',
                        primary_action: {
                            action(
                                values) {
                                window
                                    .location =
                                    `/app/material-request/${data.material_request_doc}`
                            }
                        }
                    });
                }
            }).catch((err) => {
                console.error(err);
            });

    })

}

// setTimeout(() => {
    
//     $(document).ready(() => {
//         register_realtime_events();

//     })

// }, 0);