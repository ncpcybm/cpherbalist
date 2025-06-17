frappe.provide('erpnext.PointOfSale');

frappe.ui.form.on('POS Invoice', {
    onload_post_render: function (frm) {
        console.log('onload_post_render');
        //sort_items_by_quantity(frm);
    }
});

function sort_items_by_quantity(frm) {
    // Ensure the items array exists
    if (!frm.doc.items) return;

    // Separate 'General Item (19%)' from the rest of the items using item_code for comparison
    let generalItem = frm.doc.items.filter(item => item.item_code === 'General Item (19%)');
    let otherItems = frm.doc.items.filter(item => item.item_code !== 'General Item (19%)');

    // Sort other items by quantity in descending order
    otherItems.sort((a, b) => b.qty - a.qty);

    // Concatenate 'General Item (19%)' at the start of the sorted items
    frm.doc.items = [...generalItem, ...otherItems];

    console.log(frm.doc.items);

    // Refresh the POS order items grid to reflect the sorting
    frm.refresh_field('items');

    // Ensure the grid UI updates after the data is sorted
    frm.fields_dict.items.grid.refresh();
}




frappe.require('point-of-sale.bundle.js', function () {

    erpnext.PointOfSale.ItemCart = class CustomItemCart extends erpnext.PointOfSale.ItemCart {

        constructor({ wrapper, events, settings }) {
            super({ wrapper, events, settings });
            this.init_custom_components();
        }


	show_discount_control() {
		this.$add_discount_elem.css({ padding: "0px", border: "none" });
		this.$add_discount_elem.html(`<div class="add-discount-field"></div>`);
		const me = this;
		const frm = me.events.get_frm();
		let discount = frm.doc.additional_discount_percentage;
		let discount_type = localStorage.getItem('stored_discount_type') ?? "Fixed"; 
		let discount_placeholder = 'Enter discount amount';

		this.discount_type = frappe.ui.form.make_control({
			parent: this.$add_discount_elem.find(".add-discount-field"),
			 df: {
				label: 'Discount Type',
				fieldname: 'discount_type',
				fieldtype: 'Select',
				options: ['Fixed','Percentage']
			},
			render_input: true,


		})

		this.discount_type.toggle_label(true);
		this.discount_type.set_focus();
		this.discount_type.set_value(discount_type);

		this.discount_type.$input.on('change', (e) => {

			const selectedValue = e.target.value;  
			const discountInput = document.querySelector('#discount-input');


			if (selectedValue === 'Fixed') {
				discount_type = "Fixed";
				document.querySelector('#discount-input').placeholder = 'Enter discount amount (amount/EUR)';
			}
			else if (selectedValue === 'Percentage') {
				discount_type = "Percentage";
	            discountInput.placeholder = 'Enter discount percentage (%)';
			} else {
				console.warn('No input found with ID #discount-input');
			}

			localStorage.setItem('stored_discount_type', selectedValue);


			console.log('Selected Discount Type:', e.target.value);
			console.log(document.querySelector('#discount-input'));
			console.log('======================');

		});

		// ====================


		this.discount_field = frappe.ui.form.make_control({
			df: {
				label: __("Discount"),
				fieldtype: "Data",
				placeholder: discount ? discount : discount_placeholder,
				input_class: "input-xl",
				onchange: function () {


					console.log('🧮 discount_type : ', discount_type)

					localStorage.setItem('stored_discount_amount', flt(this.value));

					// d = discount 
					// a = base amount 

					// (d/a) / 100 (discount % of d)

					let field = 'discount_amount';

					if (discount_type === 'Fixed') {

					} else if (discount_type === 'Percentage') {
						field = 'additional_discount_percentage'
					}

					this.value = flt(this.value);
					frappe.model.set_value(
						frm.doc.doctype,
						frm.doc.name,
						field,
						flt(this.value)
					);

					me.hide_discount_control(this.value);
				},
			},
			parent: this.$add_discount_elem.find(".add-discount-field"),
			render_input: true,
		});

		this.discount_field.toggle_label(false);
		//this.discount_field.set_focus();

		this.discount_field.$wrapper.find('input').attr('id', 'discount-input');


	}

	hide_discount_control(discount) {
		if (!flt(discount)) {
			this.$add_discount_elem.css({
				border: "1px dashed var(--gray-500)",
				padding: "var(--padding-sm) var(--padding-md)",
			});
			this.$add_discount_elem.html(`${this.get_discount_icon()} ${__("Add Discount")}`);
			this.discount_field = undefined;
		} else {
			this.$add_discount_elem.css({
				border: "1px dashed var(--dark-green-500)",
				padding: "var(--padding-sm) var(--padding-md)",
			});

			let default_currency = frappe.boot.sysdefaults.currency;
			let discount_type = localStorage.getItem('stored_discount_type') ?? "Fixed"; 
			let discount_suffix = discount_type === "Fixed"  ? " " + default_currency : " %";

			this.$add_discount_elem.html(
				`<div class="edit-discount-btn">
					${this.get_discount_icon()} ${__("Additional")}&nbsp;${String(discount).bold()} ${discount_suffix} ${__("discount applied")}
				</div>`
			);
		}
	}










        init_custom_components() {
            console.log("Custom components ItemCart");

            if ('loading' in HTMLImageElement.prototype) {
                const images = document.querySelectorAll('img[loading="lazy"]');
                images.forEach(img => {
                    img.src = img.dataset.src;
                });
            } else {
                // // Dynamically import the LazySizes library
                // const script = document.createElement('script');
                // script.src =
                //   'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.1.2/lazysizes.min.js';
                // document.body.appendChild(script);
            }

        }

        update_item_html(item, remove_item) {

            var curr_item_is_cp = false;
            //console.log('⚠️ item', item);

            if (item) {
                // frappe.db.get_doc('Item', item.item_code).then((result) => {
                //     //do something with result
                //     console.log(result)
                //     add_to_card = check_item(result);
                //     console.log('   add to card', add_to_card);
                // }).catch(console.error)
            }

            // if (is_cp)
            // {
            //     return; 
            // }

            const $item = this.get_cart_item(item);

            if (remove_item) {
                $item && $item.next().remove() && $item.remove();
            } else {
                const item_row = this.get_item_from_frm(item);


                this.render_cart_item(item_row, $item);
            }

            const no_of_cart_items = this.$cart_items_wrapper.find(".cart-item-wrapper").length;
            this.highlight_checkout_btn(no_of_cart_items > 0);

            this.update_empty_cart_section(no_of_cart_items);
        }


        render_cart_item(item_data, $item_to_update) {

            // if (window.is_cp) {
            //     return;
            // }

            // console.log('item to render:', item_data);

            // console.log('item code ', item_data.item_code);

            // let theItem = frappe.db.get_doc('Item', item_data.item_code).then((result) => {

            //     if (result.custom_is_cp)
            //     {
            //         window.is_cp = true;
            //         return;
            //     }

            //     console.log('window.is_cp: ', window.is_cp);
            // })
            // .catch(console.error)


            const currency = this.events.get_frm().doc.currency;
            const me = this;

            if (!$item_to_update.length) {
                this.$cart_items_wrapper.append(
                    `<div class="cart-item-wrapper" data-row-name="${escape(item_data.name)}"></div>
                    <div class="seperator"></div>`
                );
                $item_to_update = this.get_cart_item(item_data);
            }

            $item_to_update.html(
                `${get_item_image_html()}
                <div class="item-name-desc">
                    <div class="item-name">
                        ${item_data.item_name}
                    </div>
                    ${get_description_html()}
                </div>
                ${get_rate_discount_html()}`
            );

            set_dynamic_rate_header_width();

            function set_dynamic_rate_header_width() {
                const rate_cols = Array.from(me.$cart_items_wrapper.find(".item-rate-amount"));
                me.$cart_header.find(".rate-amount-header").css("width", "");
                me.$cart_items_wrapper.find(".item-rate-amount").css("width", "");
                let max_width = rate_cols.reduce((max_width, elm) => {
                    if ($(elm).width() > max_width) max_width = $(elm).width();
                    return max_width;
                }, 0);

                max_width += 1;
                if (max_width == 1) max_width = "";

                me.$cart_header.find(".rate-amount-header").css("width", max_width);
                me.$cart_items_wrapper.find(".item-rate-amount").css("width", max_width);
            }

            function get_rate_discount_html() {
                if (item_data.rate && item_data.amount && item_data.rate !== item_data.amount) {
                    return `
                        <div class="item-qty-rate">
                            <div class="item-qty"><span>${item_data.qty || 0} ${item_data.uom}</span></div>
                            <div class="item-rate-amount">
                                <div class="item-rate">${format_currency(item_data.amount, currency)}</div>
                                <div class="item-amount">${format_currency(item_data.rate, currency)}</div>
                            </div>
                        </div>`;
                } else {
                    return `
                        <div class="item-qty-rate">
                            <div class="item-qty"><span>${item_data.qty || 0} ${item_data.uom}</span></div>
                            <div class="item-rate-amount">
                                <div class="item-rate">${format_currency(item_data.rate, currency)}</div>
                            </div>
                        </div>`;
                }
            }

            function get_description_html() {
                if (item_data.description) {
                    if (item_data.description.indexOf("<div>") != -1) {
                        try {
                            item_data.description = $(item_data.description).text();
                        } catch (error) {
                            item_data.description = item_data.description
                                .replace(/<div>/g, " ")
                                .replace(/<\/div>/g, " ")
                                .replace(/ +/g, " ");
                        }
                    }
                    
                    item_data.description = frappe.ellipsis(item_data.item_code, 100);
                    //return `<div class="item-desc">${item_data.description}</div>`;
                    // Display item code
                    return `<div class="item-desc">${item_data.item_code}</div>`;

                }
                return ``;
            }

            function get_item_image_html() {
                const { image, item_name } = item_data;
                if (!me.hide_images && image) {
                    return `
                        <div class="item-image">
                            <img
                                onerror="cur_pos.cart.handle_broken_image(this)"
                                src="${image}" alt="${frappe.get_abbr(item_name)}"">
                        </div>`;
                } else {
                    return `<div class="item-image item-abbr">${frappe.get_abbr(item_name)}</div>`;
                }
            }
        }
    }

    erpnext.PointOfSale.ItemSelector = class CustomItemSelector extends erpnext.PointOfSale.ItemSelector {
        constructor({ frm, wrapper, events, pos_profile, settings }) {
            super({ frm, wrapper, events, pos_profile, settings });
            this.init_custom_components();
        }

        onload() {
            const default_company = frappe.defaults.get_default("company");
        }

        get_items({ start = 0, page_length = 100, search_term = "" }) {
            const doc = this.events.get_frm().doc;
            const price_list = (doc && doc.selling_price_list) || this.price_list;
            let { item_group, pos_profile } = this;

            !item_group && (item_group = this.parent_item_group);

            return frappe.call({
                method: "cpherbalist.overrides.point_of_sale.get_items",
                //  "erpnext.selling.page.point_of_sale.point_of_sale.get_items",
                freeze: true,
                args: { start, page_length, price_list, item_group, search_term, pos_profile },
            });
        }

        init_custom_components() {
            console.log("Custom components initialized [ItemSelector]");
        }

        render_item_list(items) {
            this.$items_container.html("");
    
            items.forEach((item) => {
                const item_html = this.get_item_html(item);
                this.$items_container.append(item_html);
            });
        }
        
        /*
        render_item_list(items) {
            this.$items_container.html("");

            items.forEach((item) => {
                frappe.db.get_list('Bin', { filters: { item_code: item.item_code }, fields: ['*'] })
                    .then((result) => {
                        frappe.db.get_doc("POS Profile", cur_pos.pos_profile).then(pp => {
                            frappe.call({
                                method: 'cpherbalist.pos._get_pos_reserved_qty',
                                args: {
                                    item_code: item.item_code,
                                    warehouse: pp.warehouse
                                },
                            }).then(rsv => {
                                if (rsv.message.reserved_qty_for_pos > 0) {
                                    console.log(':: RSV ::', rsv.message)
                                }
                                const item_html = this._get_item_html(item, result.length > 0, rsv.message.reserved_qty_for_pos, rsv.message.is_product_bundle );
                                this.$items_container.append(item_html);
                            });
                        })
                    }).catch((err) => { console.error(err); });
            });

        }

        */

        handle_broken_image($img) {
            const item_abbr = $($img).attr("alt");
            $($img).parent().replaceWith(`<div style="font-size: x-small;background: #d6d6d6;color: #151313;font-weight: 600;" class="item-display abbr">IMAGE NOT AVAILABLE</div>`);

            //$($img).parent().replaceWith(`<div class="item-display abbr">${item_abbr}</div>`);
        }

        _get_item_html = (item, available_in_other_warehouse, reserved_qty, is_product_bundle = 0) => {
            const me = this;
            const { item_code, item_image, serial_no, batch_no, barcode, actual_qty, uom, price_list_rate } = item;
            const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
            let indicator_color = 'red';
            let qty_to_display = actual_qty;

            if (item.is_stock_item) {
                // indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";

                if (Math.round(qty_to_display) > 999) {
                    qty_to_display = Math.round(qty_to_display) / 1000;
                    qty_to_display = qty_to_display.toFixed(1) + "K";
                }
            } else {
                indicator_color = "";
                qty_to_display = "";
            }

            if (actual_qty <= 0) {
                indicator_color = "red";
            } else {
                indicator_color = "green";
            }


            function get_item_image_html() {
                return `<div class="item-qty-pill">
                            <span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display} (<b>R: ${reserved_qty}</b>)</span>
						</div>
						<div class="flex items-center justify-center h-32 border-b-grey text-6xl text-grey-100">
							<img
                                loading="lazy"
                                onerror="cur_pos.item_selector.handle_broken_image(this)"
								class="h-full item-img lazyload" 
                                data-src="${item_image}"
                                src="${item_image}"
								alt="${frappe.get_abbr(item.item_name)}"
							>
						</div>`;
            }

            return `<div class="item-wrapper"
				data-item-code="${escape(item.item_code)}" data-serial-no="${escape(serial_no)}"
				data-batch-no="${escape(batch_no)}" 
                data-uom="${escape(uom)}"
				data-rate="${escape(price_list_rate || 0)}"
                data-is-product-bundle="${is_product_bundle}"
				title="${item.item_name}">

				${get_item_image_html()}

				<div class="item-detail">
					<div class="item-name">

                    <span style="font-size: 9.5px">${is_product_bundle ? '🟠' : available_in_other_warehouse ? '🟢 ' : '🔴 '}</span>&nbsp;
                    ${frappe.ellipsis(item.item_name, 100)}

					</div>
                    <div class="item-name"><span style="">${frappe.ellipsis(item.item_code, 100)}</span></div>
					<div class="item-rate">${format_currency(price_list_rate, item.currency, precision) || 0} / ${uom}</div>
				</div>
			</div>`;
        }
    }
});