(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj2, key, value) => key in obj2 ? __defProp(obj2, key, { enumerable: true, configurable: true, writable: true, value }) : obj2[key] = value;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __publicField = (obj2, key, value) => {
    __defNormalProp(obj2, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // ../cpherbalist/cpherbalist/public/js/pos_invoice_coupon.js
  var require_pos_invoice_coupon = __commonJS({
    "../cpherbalist/cpherbalist/public/js/pos_invoice_coupon.js"(exports) {
      var totalDiscountAmount = 0;
      var currency = "EUR";
      var select2Element = void 0;
      var checkoutFlag = false;
      var isDeposit = false;
      window.required_foreign_amount = false;
      window.related_invoices = [];
      var itemsToReserved = [];
      var baseAmount = 0;
      validate_discount_not_exceed_total_amount = (total2, discount_amount) => {
        let difference = 0;
        if (discount_amount > total2) {
          difference = discount_amount - total2;
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
        });
      };
      custom_remove_coupon = async (e) => {
        let apply_discount_button = document.querySelector('button[data-fieldname="custom_apply_coupon"]');
        let remove_discount_button = document.querySelector('button[data-fieldname="custom_remove_coupon"]');
        remove_discount_button.remove();
        apply_discount_button.disabled = false;
        cur_frm.set_value("discount_amount", 0);
        readjustPaymentMethod(0);
        remove_remarks();
        $(`.mode-of-payment[data-mode="cash"]`)[0].click();
        let credit_forward_amount_element = document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]');
        credit_forward_amount_element.value = 0;
        cur_frm.doc.custom_credit_forward_amount_ = 0;
      };
      show_autosuggest_for_testers = () => {
      };
      show_remove_coupons_button = () => {
        let apply_discount_button = document.querySelector('button[data-fieldname="custom_apply_coupon"]');
        apply_discount_button.disabled = true;
        let _parent = apply_discount_button.parentElement;
        let remove_coupon_btn = document.createElement("button");
        remove_coupon_btn.innerHTML = "Remove Coupon";
        remove_coupon_btn.classList.add("btn");
        remove_coupon_btn.classList.add("btn-default");
        remove_coupon_btn.classList.add("btn-primary");
        remove_coupon_btn.classList.add("ml-2");
        remove_coupon_btn.setAttribute("data-fieldname", "custom_remove_coupon");
        remove_coupon_btn.addEventListener("click", (e) => {
          exports.custom_remove_coupon(e);
        });
        _parent.appendChild(remove_coupon_btn);
      };
      set_credit_forward_amount = (amount, frm = Object) => {
        let credit_forward_amount_element = document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]');
        credit_forward_amount_element.value = amount;
        frm.doc.custom_credit_forward_amount_ = amount.toFixed(2);
        document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]').readOnly = true;
      };
      toggle_credit_forward_amount = () => {
        const tryToDisable = () => {
          const inputElement = document.querySelector('input[data-fieldname="custom_credit_forward_amount_"]');
          if (inputElement) {
            inputElement.readOnly = true;
          } else {
            setTimeout(tryToDisable, 3e3);
          }
        };
        tryToDisable();
      };
      add_remark = (value) => {
        let remark_element = document.querySelector('textarea[data-fieldname="custom_remarks"]');
        remark_element.value += value + "\n";
        cur_frm.doc.custom_remarks = remark_element.value;
      };
      get_remarks = () => {
        let remark_element = document.querySelector('textarea[data-fieldname="custom_remarks"]');
        return remark_element.value;
      };
      remove_remarks = () => {
        let remark_element = document.querySelector('textarea[data-fieldname="custom_remarks"]');
        remark_element.value = "";
        cur_frm.doc.custom_remarks = "";
      };
      apply_discount = (frm, amount, couponCode) => {
        let difference_amount = 0;
        let netTotalAmount = cur_frm.doc.net_total;
        switch (frm.doc.apply_discount_on) {
          case "Grand Total":
            difference_amount = validate_discount_not_exceed_total_amount(cur_frm.doc.grand_total, amount);
            break;
          case "Net Total":
            difference_amount = validate_discount_not_exceed_total_amount(cur_frm.doc.net_total, amount);
            break;
        }
        console.log("Difference Amount", difference_amount);
        if (difference_amount > 0) {
          let applied_coupons = get_applied_coupons();
          console.log("applied_coupons ", applied_coupons);
          if (applied_coupons.length >= 2) {
            couponCode = applied_coupons[applied_coupons.length - 1];
            const _credited_amount = __("Amount of {0} {1} will be credited for coupon {2}.", [currency, difference_amount, couponCode]);
            add_remark(_credited_amount);
          }
          const credited_amount = __("Amount of <b>{0} {1}</b> will be credited for coupon <b>{2}</b>.", [currency, difference_amount, couponCode]);
          frappe.msgprint({
            title: __("Credit Amount"),
            indicator: "green,",
            message: credited_amount
          });
          let codes = applied_coupons[applied_coupons.length - 1];
          console.log("concatenatedString [apply_discount]", codes);
          frm.set_value("discount_amount", netTotalAmount);
          if (applied_coupons.length >= 2) {
            frm.set_value("custom_credit_forward_amount_", parseFloat(difference_amount).toFixed(2));
            set_credit_forward_amount(parseFloat(difference_amount));
          } else {
            frm.set_value("custom_credit_forward_amount_", parseFloat(difference_amount).toFixed(2));
            set_credit_forward_amount(parseFloat(difference_amount));
          }
        } else {
          frm.set_value("discount_amount", amount);
        }
        const coupon_applied_msg = __("Coupon with code <b>{0}</b> has been applied for the amount of <b>{1} {2}</b>.", [
          couponCode,
          currency,
          amount
        ]);
        frappe.msgprint({
          title: __("Coupon Applied"),
          indicator: "green,",
          message: coupon_applied_msg
        });
      };
      get_applied_coupons = () => {
        let lines = document.querySelector('input[data-fieldname="custom_coupon_code"]').value.replace(".", " ").split(" ").filter((line) => line.trim() !== "");
        return lines;
      };
      multiple_coupons_applied = () => {
        return get_applied_coupons.length >= 2;
      };
      get_select2_data = (element2) => {
        return $(element2).select2("data");
      };
      init_select2_events = () => {
        element = select2Element;
        $(element).on("select2:select", function(e) {
          console.log("Select ...");
        });
        $(element).on("select2:unselect", function(e) {
          console.log("unselect ...");
        });
        $(element).on("select2:clear", function(e) {
          remove_remarks();
          console.log("clear ...");
        });
        $(element).on("select2:close", function(e) {
          remove_remarks();
          let selected_items = get_select2_data(element);
          baseAmount = 0;
          itemsToReserved = [];
          let remarks = "";
          if (selected_items.length === 0) {
            let em = document.querySelector(".submit-order-btn");
            em.style.display = "none";
            return;
          } else {
            let em = document.querySelector(".submit-order-btn");
            em.style.display = "flex";
          }
          for (let index = 0; index < selected_items.length; index++) {
            const element2 = selected_items[index];
            let split = element2.text.split("\u2022");
            console.log(`:: ${index} selected items ::`, element2.text.split("\u2022"));
            console.log(`:: ${index} amount ::`, split[split.length - 1].split(" ")[1]);
            let itemAmount = parseFloat(split[split.length - 1].split(" ")[1]);
            itemsToReserved.push({
              "item": split[1].trim(),
              "item_name": split[2].trim(),
              "qty": 1,
              "rate": itemAmount,
              "total_amount": itemAmount
            });
            baseAmount += itemAmount;
            remarks += `(x1) of ${split[1].trim()} ${split[2].trim()} with reference amount of ${split[3].trim()} 
`;
          }
          add_remark(remarks);
        });
      };
      formatData = (data) => {
        if (!data)
          return;
        console.log(" :: \u{1FA84} format data ::");
        var baseUrl = "https://raw.githubusercontent.com/lipis/flag-icons/refs/heads/main/flags/4x3/cy.svg";
        var $_ = $(
          `<span><img src="${baseUrl}" class="img-pos-prod" /> ${data} </span>`
        );
        return $_;
      };
      frappe.ui.form.on("POS Invoice", {
        onload_post_render: function(frm) {
          if (frappe.user.has_role("Disable Desk")) {
          }
          if (frm.is_new() === void 0) {
            frm.toggle_display("custom_apply_coupon", 0);
          }
          if (frm.is_new()) {
            let makeid2 = function(length) {
              var result = "";
              var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              var charactersLength = characters.length;
              for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
              }
              return result;
            };
            var makeid = makeid2;
            cur_frm.set_value("custom_survey_reference_code", makeid2(8), "", null);
            frappe.db.get_doc("CP Settings").then((x2) => {
              console.log(x2.pos_invoice_questionersurvey);
              let randomiseFactor = void 0;
              if (x2.pos_invoice_questionersurvey.filter((iqs) => iqs.active === 1).length >= 1) {
                if (x2.pos_invoice_questionersurvey.filter((iqs) => iqs.active === 1)[0].randomise_sample) {
                  randomiseFactor = x2.pos_invoice_questionersurvey.filter((iqs) => iqs.active === 1)[0].randomise_factor;
                  console.log("randomiseFactor", randomiseFactor.split("/"));
                  cur_frm.set_value("custom_randomise_factor", randomBool(parseFloat(randomiseFactor.split("/")[0]) / 100), "", null);
                } else {
                  cur_frm.set_value("custom_randomise_factor", 1, "", null);
                }
              }
              function randomBool50_50() {
                return Math.random() < 0.5;
              }
              function randomBool(probabilityTrue = 0.6) {
                return Math.random() < probabilityTrue;
              }
            });
          }
          if (frm.doc.is_return) {
            console.log("Reset Coupon");
            frm.toggle_display("custom_apply_coupon", 1);
          }
        },
        validate(frm) {
          frm.doc.items.forEach(function(item) {
            if (item.rate == 0) {
              console.log(`Zero-rated item: ${item.item_name}`);
            }
          });
          if (!checkoutFlag) {
            if (cur_frm.doc.items.some((i) => i.item_name === "DEPOSIT")) {
              isDeposit = true;
            }
            frappe.validated = true;
            return;
          }
          checkoutFlag = true;
        },
        custom_item_reserved_status: function(frm) {
        },
        before_submit: function(frm) {
        },
        on_submit: function(frm) {
          console.log(":: on submit ::");
          console.log(" ++ DOCUMENT IS SUBMITTED NOW ++", frm.doc);
          if (frm.doc.is_return) {
          } else {
            let custom_credit_forward_amount_ = frm.doc.custom_credit_forward_amount_;
            let _couponCode = get_applied_coupons();
            let last_coupon = _couponCode[_couponCode.length - 1];
            if (_couponCode.length >= 1) {
              if (custom_credit_forward_amount_ > 0 && _couponCode.length >= 2) {
                _couponCode.forEach((c) => {
                  frappe.call({
                    method: "cpherbalist.pos.redeem_coupon",
                    args: {
                      coupon_code: c
                    }
                  }).then((result) => {
                    frappe.call({
                      method: "cpherbalist.pos.update_coupon_balance",
                      args: {
                        coupon_code: c,
                        balance: 0
                      }
                    }).then((result2) => {
                      if (c === last_coupon) {
                        frappe.call({
                          method: "cpherbalist.pos.reactivate_coupon",
                          args: {
                            coupon_code: last_coupon,
                            balance: custom_credit_forward_amount_
                          }
                        }).then((result3) => {
                        }).catch((err) => {
                        });
                      }
                    }).catch((err) => {
                    });
                  }).catch((err) => {
                  });
                });
              } else {
                if (custom_credit_forward_amount_ > 0) {
                  frappe.call({
                    method: "cpherbalist.pos.get_coupon_name_by_code",
                    args: { code: _couponCode[0] },
                    callback: function(r2) {
                      if (r2.message) {
                        console.log("Coupon Name:", r2.message[0].coupon_code);
                        frappe.call({
                          method: "cpherbalist.pos.update_coupon_balance",
                          args: {
                            coupon_code: _couponCode[0],
                            balance: custom_credit_forward_amount_
                          }
                        }).then((result) => {
                        }).catch((err) => {
                        });
                      } else {
                        console.log("Coupon not found.");
                      }
                    }
                  });
                } else {
                  frappe.call({
                    method: "cpherbalist.pos.redeem_coupon",
                    args: {
                      coupon_code: _couponCode[0]
                    }
                  }).then((result) => {
                    frappe.call({
                      method: "cpherbalist.pos.update_coupon_balance",
                      args: {
                        coupon_code: _couponCode[0],
                        balance: custom_credit_forward_amount_
                      }
                    }).then((result2) => {
                    }).catch((err) => {
                    });
                  }).catch((err) => {
                  });
                }
              }
            }
            if (isDeposit) {
              let paidCreditedInvoice = cur_frm.doc.custom_reference_invoice != "";
              let custom_reference_invoice_exist = cur_frm.custom_reference_invoice != null || cur_frm.custom_reference_invoice != "" || cur_frm.custom_reference_invoice != void 0;
              if (paidCreditedInvoice && itemsToReserved.length > 1) {
                frappe.validated = false;
                frappe.throw(__("You can not create transaction contain reference invoice and product."));
                return false;
              } else if (!paidCreditedInvoice && itemsToReserved.length === 0) {
                frappe.validated = false;
                frappe.throw(__("Please select either a product or reference invoice."));
                return false;
              } else if (itemsToReserved.length >= 1 && (cur_frm.doc.custom_item_reserved_status === null || cur_frm.doc.custom_item_reserved_status == "" || cur_frm.doc.custom_item_reserved_status === void 0) && (cur_frm.custom_reference_invoice != null || cur_frm.custom_reference_invoice != "" || cur_frm.custom_reference_invoice != void 0)) {
                cur_frm.toggle_reqd("custom_item_reserved_status", 0);
                frappe.validated = false;
                frappe.throw(__("Please select a reservation status."));
                return false;
              } else if (itemsToReserved.length == 0 && custom_reference_invoice_exist) {
                cur_frm.toggle_reqd("custom_item_reserved_status", 0);
              }
              if (cur_frm.doc.custom_reference_invoice != "") {
                frappe.db.get_doc("POS Invoice", cur_frm.doc.custom_reference_invoice).then((r2) => {
                  console.log(":: POS INVOICE ::", r2);
                  if (r2.custom_parent_invoice != null) {
                    cur_frm.doc.custom_parent_invoice = r2.custom_parent_invoice;
                  } else {
                    cur_frm.doc.custom_parent_invoice = cur_frm.doc.custom_reference_invoice;
                  }
                  cur_frm.doc.custom_is_deposit = r2.custom_is_deposit;
                  cur_frm.doc.custom_base_amount = r2.custom_base_amount;
                  let newOutstandingAmount = r2.custom_invoices_outstanding_amount_ - cur_frm.doc.total * -1;
                  cur_frm.doc.custom_invoices_outstanding_amount_ = newOutstandingAmount;
                  if (newOutstandingAmount === 0) {
                    frappe.db.get_doc("Michalis Diamond Gallery Settings").then((res) => {
                      cur_frm.doc.custom_is_settlement_invoice = 1;
                      msgprint("Create sales invoice for that product.");
                      let customer = cur_frm.doc.customer;
                      let items_to_update_stock = [];
                      let related_invoices = [];
                      console.log("Create Sales invoice ...");
                      console.log("\u2699\uFE0F default_reservation_warehouse ", res["default_reservation_warehouse"]);
                      frappe.call({
                        method: "cpherbalist.pos.get_child_invoices",
                        args: {
                          filters: { parent_invoice: `${cur_frm.doc.custom_parent_invoice}` }
                        },
                        success: function(r3) {
                        },
                        error: function(r3) {
                        },
                        callback: function(r3) {
                          console.log(" -- [callback] RELATED INVOICES --", r3.message);
                          window.related_invoices = r3.message;
                          if (window.related_invoices.length >= 1) {
                            get_parent_invoice_obj(cur_frm.doc.custom_parent_invoice).then((pobj) => {
                              if (r3 != null) {
                                let items = get_items_from_parent_invoice(pobj);
                                console.log("    PARENT INVOICE ", pobj);
                                console.log("       INVOICE OBJECT ", items);
                                frappe.call({
                                  method: "cpherbalist.pos.create_stock_entry_against_parent_invoice_reserved_items",
                                  args: {
                                    filters: {
                                      parent_invoice: pobj.name
                                    }
                                  },
                                  callback: function(r4) {
                                    console.log(r4);
                                  }
                                });
                              }
                            });
                          }
                        }
                      });
                    });
                  }
                });
              } else {
                console.log(" -- ITEMS TO RESERVED -- ", itemsToReserved);
                itemsToReserved.forEach(function(item) {
                  var row = cur_frm.add_child("custom_items_to_deposit");
                  row.item = item.item;
                  row.item_name = item.item_name;
                  row.qty = item.qty;
                  row.rate = item.rate;
                  row.total_amount = item.qty * item.rate;
                  cur_frm.refresh_field("custom_items_to_deposit");
                  frappe.db.get_value("User", frappe.session.user, "warehouse").then((response) => {
                    console.log(" ^^ POS PROFILE ^^", response.message.warehouse);
                    _from_warehouse = response.message.warehouse;
                  });
                  get_settings("default_reservation_warehouse").then((settingValue) => {
                    let _from_warehouse2 = settingValue;
                    let _to_warehouse = void 0;
                    console.log(settingValue);
                    get_pos_profile_warehouse(cur_pos.pos_profile).then((ppw) => {
                      _to_warehouse = ppw;
                      if ((_from_warehouse2 != "" || _from_warehouse2 != void 0 || _from_warehouse2 === null) && (_to_warehouse != "" || _to_warehouse != void 0 || _to_warehouse === null)) {
                        let _custom_item_given = 0;
                        let _custom_item_hold = 1;
                        let _custom_item_reserved_status = cur_frm.doc.custom_item_reserved_status;
                        try {
                          if (_custom_item_reserved_status != null) {
                            if (_custom_item_reserved_status.includes("Hold") || _custom_item_reserved_status.includes("Undelivered")) {
                            }
                            if (_custom_item_reserved_status.includes("Given") || _custom_item_reserved_status.includes("Released") || _custom_item_reserved_status.includes("Delivered")) {
                              _custom_item_given = 1;
                              _custom_item_hold = 0;
                            }
                          } else {
                            return;
                          }
                        } catch (error) {
                        }
                        frappe.call({
                          method: "cpherbalist.mdg_stock_entry_utils.make_stock_entry",
                          args: {
                            item_code: row.item,
                            qty: 1,
                            from_warehouse: _to_warehouse,
                            to_warehouse: _from_warehouse2,
                            company: frappe.defaults.get_user_defaults("Company")[0],
                            custom_item_given: _custom_item_given,
                            custom_item_hold: _custom_item_hold
                          },
                          callback: (r2) => {
                          }
                        }).then((r2) => {
                          frm.refresh();
                        });
                      }
                    });
                  }).catch((error) => {
                    console.error("Error:", error);
                  });
                });
                cur_frm.doc.custom_is_deposit = 1;
                cur_frm.doc.custom_base_amount = baseAmount;
                let outstandingAmount2 = cur_frm.doc.custom_invoices_outstanding_amount_ - (baseAmount - cur_frm.doc.total);
                cur_frm.doc.custom_invoices_outstanding_amount_ = outstandingAmount2;
              }
            }
            let _sellerAccount = JSON.parse(localStorage.getItem("seller_profile")).value;
            if (_sellerAccount) {
              cur_frm.doc.custom_seller_account = _sellerAccount;
            }
          }
        },
        custom_reference_invoice: function(frm) {
          if (cur_frm.doc.items.some((i) => i.item_name === "DEPOSIT")) {
            if (cur_frm.doc.custom_reference_invoice === "" || cur_frm.doc.custom_reference_invoice === null || cur_frm.doc.custom_reference_invoice === void 0) {
              return;
            }
            let total_amount = 0;
            let iframeurl = `/printview?doctype=POS%20Invoice&name=${cur_frm.doc.custom_reference_invoice}&trigger_print=0&format=POS%20Invoice&no_letterhead=0&letterhead=MDG%20-%20POS%20Invoice&settings=%7B%7D&_lang=en`;
            Swal.fire({
              title: `Invoice ${cur_frm.doc.custom_reference_invoice}`,
              html: `<iframe src="${iframeurl}" class="iframe-popup" frameborder="0"></iframe>`,
              showDenyButton: true,
              denyButtonText: "Change Invoice",
              confirmButtonText: "Yes",
              showConfirmButton: true,
              focusConfirm: true,
              showCancelButton: false,
              customClass: {
                popup: "custom-popup"
              },
              width: "95%",
              heightAuto: false,
              didOpen: () => {
                try {
                  document.querySelector('input[data-fieldname="custom_reference_invoice"]').parentElement.parentElement.childNodes[3].children[1].remove();
                } catch (error) {
                }
              }
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.fire("Updated !", "", "success");
                let em = document.querySelector(".submit-order-btn");
                em.style.display = "flex";
              } else if (result.isDenied) {
                document.querySelector('input[data-fieldname="custom_reference_invoice"]').value = "";
                document.querySelector('textarea[data-fieldname="custom_remarks"]').value = "";
                document.querySelector('data-fieldname="custom_reference_invoice"').focus();
                Swal.fire("Reselect invoice to continue", "", "info");
              }
            });
            frappe.db.get_doc("POS Invoice", cur_frm.doc.custom_reference_invoice).then((r2) => {
              setTimeout(() => {
                console.log(":: POS INVOICE ::", r2);
                let newOutstandingAmount = r2.custom_invoices_outstanding_amount_ - cur_frm.doc.total * -1;
                _remark = `Amount of ${cur_frm.doc.total} received against the Invoice ${cur_frm.doc.custom_reference_invoice} (${r2.custom_invoices_outstanding_amount_}), with new outstanding balance of EUR ${newOutstandingAmount}.`;
                add_remark(_remark);
              }, 10);
            });
          }
        },
        custom_item_to_reserved: function(frm) {
          if (!isDeposit) {
            document.querySelector("div.invoice_detail_field.custom_item_to_reserved-field").remove();
            document.querySelector("div.invoice_detail_field.custom_reference_invoice-field").remove();
            document.querySelector("div.invoice_detail_field.custom_item_reserved_status-field").remove();
          } else {
            let em = document.querySelector(".submit-order-btn");
            em.style.display = "none";
            cur_frm.toggle_reqd("custom_item_reserved_status", 1);
          }
          if (cur_frm.doc.items.some((i) => i.item_name === "DEPOSIT")) {
            if (cur_frm.doc.custom_item_to_reserved === "") {
              return;
            }
            frappe.db.get_doc("Item", cur_frm.doc.custom_item_to_reserved).then((r2) => {
              total = 0;
              cur_frm.doc.payments.forEach((p) => {
                total += parseFloat(p.amount);
              });
              let _remark2 = `Amount EUR ${total} received as deposit.`;
              add_remark(_remark2);
              if (cur_frm.doc.custom_reference_invoice != "") {
                _remark2 = `Amount EUR ${total} against the item ${r2.item_name} (${r2.name}) for total amount of (EUR ${r2.standard_rate}).`;
                add_remark(_remark2);
              }
              cur_frm.doc.custom_is_deposit = 1;
              if (cur_frm.doc.custom_base_amount === 0 || cur_frm.doc.custom_base_amount === "") {
                cur_frm.doc.custom_base_amount = r2.standard_rate;
              }
              if (cur_frm.doc.custom_invoices_outstanding_amount_ === 0 || cur_frm.doc.custom_invoices_outstanding_amount_ === "") {
                cur_frm.doc.custom_invoices_outstanding_amount_ = r2.standard_rate - total;
              } else {
                cur_frm.doc.custom_invoices_outstanding_amount_ = r2.standard_rate - (cur_frm.doc.custom_invoices_outstanding_amount_ + total);
              }
            });
          } else {
          }
        },
        onload: function(frm) {
          console.log(window.location.href);
          console.log(":: \u2728 ON LOAD :: ");
          toggle_credit_forward_amount();
          const button = document.querySelector(".checkout-btn");
          button.addEventListener("click", (event) => {
            console.log(" :: \u{1F7E4} CLICK ON CHECKOUT ::");
            if (typeof $.fn.select2 !== "undefined") {
              console.log("Select2 is loaded");
            } else {
              setTimeout(() => {
                console.log("Select2 is not loaded");
                frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.all.min.js");
                frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.min.css");
              }, 0);
            }
            if (!cur_frm.doc.items.some((i) => i.item_name === "DEPOSIT")) {
              console.log(":: DEPOSIT ITEM ::");
            }
            if (cur_frm.doc.items.some((i) => i.item_name === "DEPOSIT")) {
              return;
              try {
                frappe.call({
                  method: "cpherbalist.material_request_custom.get_warehouse_items_select2",
                  args: {
                    filters: {
                      warehouse: cur_frm.doc.set_warehouse
                    }
                  }
                }).then((response) => {
                  if (response.message) {
                    console.log(response.message);
                    console.log(":: response.message.results ::", response.message.results);
                    var data1 = $.map(response.message.results, function(obj2) {
                      obj2.id = obj2.id || obj2.pk;
                      return obj2;
                    });
                    checkElementExistence('input[data-fieldname="custom_item_to_reserved"]', data1);
                  }
                });
              } catch (error) {
              }
            }
          });
        },
        custom_apply_coupon: function(frm) {
          let apply_pricing_rule = () => {
          };
          const today = new Date();
          let couponCode = get_applied_coupons();
          console.log("get_applied_coupons", couponCode);
          let concatenatedString = couponCode.map((line) => line.trim()).join(",");
          console.log("coupons", concatenatedString);
          let cc, prc, couponCodes;
          if (couponCode.length >= 2) {
            couponCodes = couponCode;
            console.log("couponCodes ", couponCodes);
            frappe.call({
              async: true,
              method: "cpherbalist.pos.get_subtotal_with_coupons",
              args: {
                coupon_codes: concatenatedString
              }
            }).then((result) => {
              console.log("result:", result);
              if (result.message) {
                var total_discount = result.message.total_discount;
                add_remark(result.message.message);
                console.log("Total amount from all coupons: ", total_discount);
                console.log("\u{1F9FE} POS: ", cur_pos);
                $(`.mode-of-payment[data-mode="voucher"]`)[0].click();
                document.querySelector('input[placeholder="Enter Voucher amount."]').disabled = false;
                cur_pos.payment.selected_mode.set_value(total_discount);
                document.querySelector('input[placeholder="Enter Voucher amount."]').disabled = true;
                show_remove_coupons_button();
                readjustPaymentMethod(total_discount);
              } else {
                console.log("No response or error in fetching the discount.");
              }
            }).catch((err) => {
            });
            console.log("totalDiscountAmount ", totalDiscountAmount);
            cur_frm.set_value("discount_amount", totalDiscountAmount);
          } else {
            frappe.call({
              method: "cpherbalist.pos.get_coupon",
              args: {
                coupon_code: couponCode[0],
                b_by_name: true
              }
            }).then((response) => {
              if (response.message) {
                cc = response.message;
                console.log("Coupon details:", cc);
                const dateObj = new Date(cc.valid_upto);
                if (dateObj < today) {
                  const error_msg = __("Coupon with code <b>{0}</b> is expired or is not valid.", [couponCode]);
                  frappe.throw(error_msg);
                  return;
                }
                if (cc.used >= 1) {
                  const coupon_used_msg = __("Coupon with code <b>{0}</b> has already been used.", [couponCode]);
                  frappe.throw(coupon_used_msg);
                  return;
                }
                if (cc.pricing_rule != null) {
                  let pricing_rule = cc.pricing_rule;
                  console.log("Pricing Rule:", pricing_rule);
                  frappe.call("cpherbalist.pos.get_pricing_rule", {
                    pricing_rule
                  }).then((r2) => {
                    prc = r2.message;
                    console.log("Pricing Rule Details:", prc);
                    cur_frm.set_value("discount_amount", prc.discount_amount);
                    const coupon_applied_msg = __("Coupon with code <b>{0}</b> has been applied for the amount of <b>{1} {2}</b>.", [
                      couponCode,
                      currency,
                      prc.discount_amount
                    ]);
                    frappe.msgprint({
                      title: __("Coupon Applied"),
                      indicator: "green,",
                      message: coupon_applied_msg
                    });
                    show_remove_coupons_button();
                    console.log("Discount Amount", prc);
                  }).catch((error) => {
                    frappe.throw(__("Coupon is not valid."));
                  });
                } else {
                  let applicableAmount = cc.custom_amount;
                  console.log(applicableAmount);
                  show_remove_coupons_button();
                  console.log("\u{1F9FE} POS: ", cur_pos);
                  add_remark(`Coupon ${couponCode}: ${currency} ${applicableAmount}`);
                  let cash_amount = 0;
                  let coupon_amount = applicableAmount;
                  let total_amount = cur_frm.doc.grand_total;
                  try {
                    cash_amount = parseFloat(document.querySelector(`.mode-of-payment[data-mode="cash"] > .pay-amount`).innerText.split(" ")[1]);
                    if (cash_amount === NaN) {
                      cash_amount = 0;
                    }
                  } catch (e) {
                    card_amount = 0;
                  }
                  let remaining_amount = total_amount - coupon_amount;
                  $(`.mode-of-payment[data-mode="cash"]`)[0].click();
                  cur_pos.payment.selected_mode.set_value(remaining_amount);
                  $(`.mode-of-payment[data-mode="voucher"]`)[0].click();
                  cur_pos.payment.selected_mode.set_value(applicableAmount);
                  if (remaining_amount < 0) {
                    $(`.mode-of-payment[data-mode="cash"]`)[0].click();
                    cur_pos.payment.selected_mode.set_value(0);
                    $(`.mode-of-payment[data-mode="credit_card"]`)[0].click();
                    cur_pos.payment.selected_mode.set_value(0);
                    set_credit_forward_amount(Math.abs(remaining_amount), frm);
                    $(`.mode-of-payment[data-mode="voucher"]`)[0].click();
                    cur_pos.payment.selected_mode.set_value(total_amount);
                  }
                }
              } else {
                const error_msg = __("Coupon with code <b>{0}</b> is expired or is not valid.", [couponCode]);
                frappe.throw(error_msg);
              }
            }).catch((error) => {
              const error_msg = __("Coupon with code <b>{0}</b> is expired or is not valid.", [couponCode]);
              frappe.throw(error);
              console.error(error);
            });
          }
        },
        refresh: function(frm) {
        }
      });
      function readjustPaymentMethod(couponAmount) {
        let total_amount = cur_frm.doc.grand_total;
        $(`.mode-of-payment[data-mode="cash"]`)[0].click();
        cur_pos.payment.selected_mode.set_value(total_amount - couponAmount);
        $(`.mode-of-payment[data-mode="voucher"]`)[0].click();
        cur_pos.payment.selected_mode.set_value(couponAmount);
      }
      function checkElementExistence(s_element, a_data) {
        let retryCount = 0;
        const intervalId = setInterval(() => {
          const element2 = document.querySelector(s_element);
          if (element2) {
            console.log("Element found!");
            $('input[data-fieldname="custom_item_to_reserved"]')[0].setAttribute("multiple", "multiple");
            $('input[data-fieldname="custom_item_to_reserved"]')[0].setAttribute("name", "custom_item_to_reserved[]");
            select2Element = $('input[data-fieldname="custom_item_to_reserved"]').select2({
              placeholder: "Select items to reserve.",
              tags: true,
              tokenSeparators: [,],
              scrollAfterSelect: true,
              allowClear: true,
              data: a_data
            });
            clearInterval(intervalId);
          } else if (retryCount >= 5) {
            console.log("Retry limit reached. Element not found.");
            clearInterval(intervalId);
          } else {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of 5`);
          }
        }, 2e3);
      }
    }
  });

  // ../cpherbalist/cpherbalist/public/js/cpherbalist.js
  frappe.provide("erpnext");
  frappe.provide("erpnext.utils");
  frappe.provide("frappe.desk");
  frappe.provide("erpnext.PointOfSale");
  function onUrlChange() {
  }
  window.addEventListener("popstate", onUrlChange);
  (function() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function(state, title, url) {
      originalPushState.apply(history, arguments);
      onUrlChange();
    };
    history.replaceState = function(state, title, url) {
      originalReplaceState.apply(history, arguments);
      onUrlChange();
    };
  })();
  frappe.require("point-of-sale.bundle.js", function() {
    window.opening_pos_entry = void 0;
    window.opening_date = void 0;
    window.is_deposit = void 0;
    window.allow_change_deposit_rate = true;
    window.wrapper = void 0;
    erpnext.PointOfSale.Controller = class MyPosController extends erpnext.PointOfSale.Controller {
      constructor(wrapper2) {
        super(wrapper2);
        __publicField(this, "raise_pos_closing_alert", (frm) => {
          frappe.confirm(
            "The POS Closing Entry for this session does not exist. In order to proceed, a POS Closing Entry must be created. Please ensure that all required details are entered and confirm the closing entry before proceeding.",
            () => {
              this.close_pos();
            },
            () => {
              frappe.dom.freeze();
            }
          );
        });
        __publicField(this, "get_item", async (code) => {
          return await frappe.db.get_doc("Item", code);
        });
        __publicField(this, "raise_item_cp_alert", () => {
          frappe.dom.unfreeze();
          frappe.show_alert({
            message: __("You can not select this item."),
            indicator: "red"
          });
          frappe.utils.play_sound("error");
          return;
        });
        __publicField(this, "raise_item_deposit_alert", () => {
          frappe.dom.unfreeze();
          frappe.show_alert({
            message: __("You can not select this item."),
            indicator: "red"
          });
          frappe.utils.play_sound("error");
          return;
        });
        this.get_opening_entry().then((res) => {
          console.log("pos opening entry ", res.message[0]);
          window.opening_pos_entry = res.message[0].name;
          window.opening_date = res.message[0].period_start_date;
          var _ = this.force_close() >= 1;
          if (_) {
            this.raise_pos_closing_alert(cur_frm);
          }
          setTimeout(() => {
            frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.all.min.js");
            frappe.require("https://cdn.jsdelivr.net/npm/sweetalert2@11.17.2/dist/sweetalert2.min.css");
            frappe.require("https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.1.2/lazysizes.min.js");
          }, 0);
        });
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
              this.payment.render_loyalty_points_payment_mode();
              function deleteCookie(name, path = "/") {
                document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
              }
              function setCookie(name, value, days = 7, path = "/") {
                deleteCookie(name);
                const d = new Date();
                d.setTime(d.getTime() + days * 24 * 60 * 60 * 1e3);
                const expires = "expires=" + d.toUTCString();
                document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=${path}`;
              }
              setCookie("pos_customer", details.customer, 15);
              setCookie("pos_profile", cur_pos.pos_profile, 15);
            }
          }
        });
      }
      update_totals_section(doc) {
        if (!doc)
          doc = this.events.get_frm().doc;
        const paid_amount = doc.paid_amount;
        const grand_total = cint(frappe.sys_defaults.disable_rounded_total) ? doc.grand_total : doc.rounded_total;
        const remaining = grand_total - doc.paid_amount;
        const change = doc.change_amount || remaining <= 0 ? -1 * remaining : void 0;
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
        console.log(":: components_wrapper ::", this.$components_wrapper);
        setTimeout(() => {
          render_pos_action_btn();
          render_seller_profile();
          removeCustomStyle();
        }, 0);
      }
      force_close() {
        const givenDate = window.opening_date;
        const dGiven = new Date(givenDate);
        const dToday = new Date();
        dGiven.setHours(0, 0, 0, 0);
        dToday.setHours(0, 0, 0, 0);
        const diffMilliseconds = dToday - dGiven;
        const diffDays = diffMilliseconds / (1e3 * 60 * 60 * 24);
        return diffDays;
      }
      close_pos() {
        if (!this.$components_wrapper.is(":visible"))
          return;
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
          user: frappe.session.user
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
            reqd: 1
          },
          {
            fieldname: "opening_amount",
            fieldtype: "Currency",
            in_list_view: 1,
            label: __("Opening Amount"),
            options: "company:company_currency",
            change: function() {
              dialog2.fields_dict.balance_details.df.data.some((d) => {
                if (d.idx == this.doc.idx) {
                  d.opening_amount = this.value;
                  dialog2.fields_dict.balance_details.grid.refresh();
                  return true;
                }
              });
            }
          }
        ];
        const fetch_pos_payment_methods = () => {
          const pos_profile = dialog2.fields_dict.pos_profile.get_value();
          if (!pos_profile)
            return;
          frappe.db.get_doc("POS Profile", pos_profile).then(({ payments }) => {
            dialog2.fields_dict.balance_details.df.data = [];
            payments.forEach((pay) => {
              const { mode_of_payment } = pay;
              dialog2.fields_dict.balance_details.df.data.push({ mode_of_payment, opening_amount: "0" });
            });
            dialog2.fields_dict.balance_details.grid.refresh();
          });
        };
        const dialog2 = new frappe.ui.Dialog({
          title: __("\u{1F7E2} Create POS Opening Entry"),
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
              fields: table_fields
            }
          ],
          primary_action: async function({ company, pos_profile, balance_details }) {
            if (!balance_details.length) {
              frappe.show_alert({
                message: __("Please add Mode of payments and opening balance details."),
                indicator: "red"
              });
              return frappe.utils.play_sound("error");
            }
            balance_details = balance_details.filter((d) => d.mode_of_payment);
            const method = "erpnext.selling.page.point_of_sale.point_of_sale.create_opening_voucher";
            const res = await frappe.call({
              method,
              args: { pos_profile, company, balance_details },
              freeze: true
            });
            !res.exc && me.prepare_app_defaults(res.message);
            dialog2.hide();
          },
          primary_action_label: __("Submit")
        });
        frappe.call({
          method: "cpherbalist.pos_automated_actions.get_user_pos_profile",
          args: { "user": frappe.session.user },
          callback: function(response) {
            if (dialog2 && response.message) {
              dialog2.fields_dict["pos_profile"].set_value(response.message);
              setTimeout(() => {
                document.querySelector(".grid-add-row").remove();
              }, 800);
            }
          },
          error: function(error) {
            console.error(error);
          }
        });
        dialog2.show();
        const pos_profile_query = () => {
          return {
            query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
            filters: { company: dialog2.fields_dict.company.get_value() }
          };
        };
      }
      async on_cart_update(args) {
        frappe.dom.freeze();
        if (this.frm.doc.set_warehouse != this.settings.warehouse)
          this.frm.doc.set_warehouse = this.settings.warehouse;
        let item_row = void 0;
        try {
          let { field, value, item } = args;
          item_row = this.get_item_from_frm(item);
          const item_row_exists = !$.isEmptyObject(item_row);
          const from_selector = field === "qty" && value === "+1";
          if (from_selector)
            value = flt(item_row.qty) + flt(value);
          if (item_row_exists) {
            if (field === "qty")
              value = flt(value);
            if (["qty", "conversion_factor"].includes(field) && value > 0 && !this.allow_negative_stock) {
              const qty_needed = field === "qty" ? value * item_row.conversion_factor : item_row.qty * value;
              await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
            }
            if (this.is_current_item_being_edited(item_row) || from_selector) {
              await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
              if (item.serial_no && from_selector) {
                await frappe.model.set_value(
                  item_row.doctype,
                  item_row.name,
                  "serial_no",
                  item_row.serial_no + `
${item.serial_no}`
                );
              }
              this.update_cart_html(item_row);
            }
          } else {
            if (!this.frm.doc.customer)
              return this.raise_customer_selection_alert();
            const { item_code, batch_no, serial_no, rate, uom, stock_uom } = item;
            if (!item_code)
              return;
            if (rate == void 0 || rate == 0) {
              frappe.show_alert({
                message: __("Price is not set for the item."),
                indicator: "orange"
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
            if (field === "serial_no")
              new_item["qty"] = value.split(`
`).length || 0;
            item_row = this.frm.add_child("items", new_item);
            if (field === "qty" && value !== 0 && !this.allow_negative_stock) {
              const qty_needed = value * item_row.conversion_factor;
              await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
            }
            await this.trigger_new_item_events(item_row);
            this.update_cart_html(item_row);
            if (this.item_details.$component.is(":visible"))
              this.edit_item_details_of(item_row);
            if (this.check_serial_batch_selection_needed(item_row) && !this.item_details.$component.is(":visible"))
              this.edit_item_details_of(item_row);
          }
        } catch (error) {
          console.log(error);
        } finally {
          frappe.dom.unfreeze();
          return item_row;
        }
      }
      init_item_selector() {
        this.item_selector = new erpnext.PointOfSale.ItemSelector({
          wrapper: this.$components_wrapper,
          pos_profile: this.pos_profile,
          settings: this.settings,
          events: {
            item_selected: (args) => this.on_cart_update(args),
            get_frm: () => this.frm || {}
          }
        });
      }
      prepare_menu() {
        this.page.clear_menu();
        this.page.add_menu_item("Toggle Recent Orders", this.toggle_recent_order.bind(this), false, "Ctrl+O");
        this.page.add_menu_item("Save as Draft", this.save_draft_invoice.bind(this), false, "Ctrl+S");
        this.page.add_menu_item(__("Close the POS (Z)"), this.close_pos.bind(this), false, "Shift+Ctrl+C");
      }
      async check_stock_availability(item_row, qty_needed, warehouse) {
        const resp = (await this.get_available_stock(item_row.item_code, warehouse)).message;
        let _resp = await frappe.call({
          method: "cpherbalist.pos.get_available_qty_per_warehouse",
          args: {
            item_code: item_row.item_code
          }
        });
        let available_in_other_warehouse = _resp.message.length >= 1;
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
              bold_warehouse
            ]);
            let pos_profile_meta = frappe.get_doc("POS Profile", cur_pos.pos_profile);
            console.log(pos_profile_meta);
            if (available_in_other_warehouse) {
              let filteredData = _resp.message.filter((_warehouse) => _warehouse.actual_qty > 0).map((_warehouse) => `<a onclick="createMovement('${pos_profile_meta.warehouse}','${_warehouse.warehouse}','${item_row.item_code}')" style='margin-top: var(--margin-lg );'>${_warehouse.warehouse} (${_warehouse.actual_qty})</a><br>`).join("");
              popup_message = __("Item Code: {0} is not available under warehouse {1}.<br><div style='margin-top: var(--margin-lg ); margin-bottom: var(--margin-lg );'><b>Available Locations</b></div>{2}", [
                bold_item_code,
                bold_warehouse,
                filteredData
              ]);
            }
            frappe.throw({
              title: __("Item Not Available"),
              message: popup_message
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
            indicator: "orange"
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
    frappe.realtime.on("material_request", async (data) => {
      x = await frappe.db.get_doc("User", frappe.session.user_email).then((result) => {
        var _a;
        let selected_warehouse = (_a = result.default_warehouse) != null ? _a : frappe.user_defaults["default_warehouse"];
        if (data.to_warehouse === selected_warehouse) {
          frappe.utils.play_sound("custom-alert");
          var audio = new Audio("/assets/cpherbalist/sounds/mixkit-unlock-game-notification-253.wav");
          audio.loop = true;
          audio.play().catch((error) => console.error("Error playing audio:", error));
          setTimeout(() => {
            audio.pause();
          }, 600);
          frappe.msgprint({
            indicator: "green",
            title: __(
              "Incoming Transfer Request \u{1F514}"
            ),
            message: __(
              "Incoming Transfer Request from  " + data.from_warehouse + "."
            ),
            primary_action_label: "Open Request",
            primary_action: {
              action(values) {
                window.location = `/app/material-request/${data.material_request_doc}`;
              }
            }
          });
        }
      }).catch((err) => {
        console.error(err);
      });
    });
  };

  // ../cpherbalist/cpherbalist/public/js/utils.js
  var toMilliseconds = (hrs, min, sec) => (hrs * 60 * 60 + min * 60 + sec) * 1e3;
  window.default_expiration = toMilliseconds(0, 30, 0);
  window.lock = false;
  window.fail_count = 0;
  window.is_dialog_open = 0;
  window.render_exchange_rate_btn_retry_count = 3;
  window.is_cp = false;
  window.retryCount = 0;
  window.maxRetries = 5;
  clear_child_table = (frm, child_table_name, refresh = true) => {
    frm.clear_table("delivery_note_items");
    if (refresh) {
      frm.refresh_field("delivery_note_items");
    }
  };
  window.dialog = new frappe.ui.Dialog({
    title: "Sales Profile User",
    fields: [
      {
        label: "\u{1F464} User",
        fieldname: "user_link",
        fieldtype: "Link",
        options: "User",
        reqd: 1,
        get_query: () => {
          return {
            query: "cpherbalist.pos.get_seller_profile_users"
          };
        }
      }
    ],
    primary_action_label: "Set Seller Profile",
    primary_action: function() {
      var data = dialog.get_values();
      console.log(data);
      if (data) {
        frappe.call({
          method: "cpherbalist.api.get_user_info",
          args: {
            email: data.user_link
          },
          callback: function(r2) {
            if (r2.message) {
              localStorage.removeItem("seller_profile");
              localStorage.removeItem("seller_profile_name");
              setItemWithCustomExpiry("seller_profile", data.user_link, window.default_expiration);
              setItemWithCustomExpiry("seller_profile_name", r2.message.full_name, window.default_expiration);
              render_seller_profile2();
              dialog.hide();
            }
          }
        });
        if (false) {
          frappe.call({
            method: "cpherbalist.pos.validate_user_pin",
            args: {
              user_email: data.user_link,
              pin: data.password
            },
            freeze: true,
            callback: function(r2) {
              localStorage.removeItem("seller_profile");
              if (r2.message) {
                dialog.fields_dict.user_link.set_value("");
                dialog.fields_dict.password.set_value("");
                dialog.hide();
                setItemWithCustomExpiry("seller_profile", data.user_link, window.default_expiration);
                render_seller_profile2();
                frappe.call({
                  method: "cpherbalist.api.log_seller_profile",
                  args: {
                    s_user: data.user_link
                  },
                  callback: function(r3) {
                    if (r3.message) {
                    }
                  },
                  error: function(err) {
                    console.error(err);
                  }
                });
              } else {
                frappe.msgprint({
                  title: __("PIN is not valid"),
                  indicator: "red",
                  message: __("Provided PIN is not valid.")
                });
                dialog.fields_dict.password.set_value("");
                window.fail_count++;
                if (window.fail_count >= 3) {
                  frappe.throw(__("Please contact the administrator."));
                  location.reload();
                }
              }
            }
          });
        }
      }
    }
  });
  function request_pin() {
    if (true) {
      dialog.show();
      render_seller_profile2();
    }
  }
  var observer = new MutationObserver((entries) => {
    if (document.contains(document.querySelector(".password-strength-indicator"))) {
      document.querySelector(".password-strength-indicator").remove();
      observer.disconnect();
    }
  });
  observer.observe(document, {
    subtree: true,
    childList: true
  });
  function render_seller_profile2() {
    let value = void 0;
    value = getItemWithExpiry("seller_profile_name");
    if (value) {
      if (!document.querySelector(".seller-profile")) {
        const outerSpan = document.createElement("span");
        outerSpan.classList.add("seller-profile", "indicator-pill", "no-indicator-dot", "whitespace-nowrap", "red");
        outerSpan.style.textTransform = "uppercase";
        const innerSpan = document.createElement("span");
        innerSpan.style.fontWeight = "700";
        innerSpan.textContent = "\u{1F504} " + value;
        outerSpan.appendChild(innerSpan);
        parent = document.querySelector(".indicator-pill").parentElement;
        parent.appendChild(outerSpan);
        outerSpan.addEventListener("click", () => {
          request_pin();
        }, { once: false });
      } else {
        document.querySelector(".seller-profile").remove();
        render_seller_profile2();
      }
    }
  }
  render_action_btn = (frm, button_id, button_name, callback, group = void 0) => {
    if (!cur_frm.fields_dict[button_id]) {
      cur_frm.add_custom_button(__(button_name), callback, group);
    }
  };
  render_pos_action_btn = (frm) => {
    cur_pos.page.add_button("\u{1F4F1} Calculator", () => {
      try {
        window.open("Calculator:///");
      } catch (error) {
      }
    }, { btn_class: "" });
    cur_pos.page.add_button("\u{1F9FE} Recent Orders", () => {
      try {
        cur_pos.toggle_recent_order();
      } catch (error) {
      }
    }, { btn_class: "" });
    cur_pos.page.add_button("\u2795 Create Coupon", () => {
      try {
        window.open(
          "/app/coupon-code/new-coupon-code-ddd",
          "_blank"
        );
      } catch (error) {
      }
    }, { btn_class: "" });
    cur_pos.page.add_button("\u2795 New Order", () => {
      try {
        window.location.href = "/app/point-of-sale";
      } catch (error) {
      }
    }, { btn_class: "" });
    if (false) {
      const value = getItemWithExpiry("seller_profile");
      let buttonValue = "\u{1F464} Select Seller Profile";
      if (value) {
        buttonValue = "\u{1F504} Switch Seller Profile";
      } else {
        let allowProceedWithoutSellerProfile = false;
        buttonValue = "\u{1F464} Select Seller Profile";
      }
      cur_pos.page.add_button(buttonValue, () => {
        try {
          request_pin();
        } catch (error) {
        }
      });
    }
  };
  frappe.ui.form.on("Stock Entry", {
    onload: function(frm) {
      if (cur_frm.is_new()) {
        cur_frm.set_value("stock_entry_type", "Material Receipt");
        let default_source_warehouse = frappe.db.get_single_value("CP Settings", "default_source_warehouse").then((value) => {
          console.log("default_source_warehouse:", value);
        });
        let default_target_warehouse = frappe.db.get_single_value("CP Settings", "default_target_warehouse").then((value) => {
          console.log("default_target_warehouse:", value);
        });
      }
    }
  });
  frappe.ui.form.on("Sales Invoice", {
    onload: function(frm) {
      if (cur_frm.is_new()) {
        console.log("\u2699\uFE0F [Sales Invoice] ");
        let default_target_warehouse = frappe.db.get_single_value("CP Settings", "default_target_warehouse").then((value) => {
          console.log("default_target_warehouse:", value);
          cur_frm.set_value("set_warehouse", value);
        });
        cur_frm.set_value("update_stock", 1);
      }
    }
  });
  function setItemWithCustomExpiry(key, value, expirationTimeMs) {
    if (localStorage.getItem(key)) {
      console.log("This key already exists. Cannot overwrite it.");
      return;
    }
    const item = {
      value,
      expiry: new Date().getTime() + expirationTimeMs
    };
    localStorage.setItem(key, JSON.stringify(item));
    console.log("Item set successfully.");
  }
  function getItemWithExpiry(key) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) {
        request_pin();
      }
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();
      if (now > item.expiry) {
        localStorage.removeItem(key);
        console.log(`Item with key "${key}" has expired and been removed.`);
        request_pin();
        getItemWithExpiry(key);
      }
      return item.value;
    } catch (err) {
    }
  }

  // ../cpherbalist/cpherbalist/public/cpherbalist.bundle.js
  var import_pos_invoice_coupon = __toESM(require_pos_invoice_coupon());

  // ../cpherbalist/cpherbalist/public/js/coupon_extensions.js
  frappe.listview_settings["Coupon Code"] = {
    onload: function(listview) {
      listview.page.add_inner_button(__("\u{1F504} Sync with WooCommerce"), function() {
        let selected = listview.get_checked_items();
        var settings = {
          "url": "https://staging1.cpherbalist.com/wp-json/cp/v1/wc/coupon/recent",
          "method": "GET",
          "timeout": 0
        };
        $.ajax(settings).done(function(response) {
          console.log(response);
          const modal = document.createElement("div");
          modal.id = "couponModal";
          modal.style.display = "none";
          modal.style.position = "fixed";
          modal.style.top = "10%";
          modal.style.left = "50%";
          modal.style.transform = "translateX(-50%)";
          modal.style.background = "#fff";
          modal.style.border = "1px solid #ccc";
          modal.style.padding = "20px";
          modal.style.zIndex = "10000";
          modal.style.width = "80%";
          modal.style.maxHeight = "400px";
          modal.style.overflow = "auto";
          const heading = document.createElement("h3");
          heading.innerText = "Select Coupons to Sync FROM WooCommerce";
          modal.appendChild(heading);
          const selectAllButton = document.createElement("button");
          selectAllButton.innerText = "Select All Coupons";
          selectAllButton.classList = "btn btn-default btn-sm primary-action";
          selectAllButton.style = "margin-bottom: 1em;";
          selectAllButton.onclick = () => {
            toggleSelectionOnAllCheckedBoxes(true);
          };
          modal.appendChild(selectAllButton);
          const unselectAllButton = document.createElement("button");
          unselectAllButton.innerText = "Unselect All Coupons";
          unselectAllButton.classList = "btn btn-default btn-sm primary-action";
          unselectAllButton.style = "margin-bottom: 1em; margin-left: 1em;";
          unselectAllButton.onclick = () => {
            toggleSelectionOnAllCheckedBoxes(false);
          };
          modal.appendChild(unselectAllButton);
          const syncButton = document.createElement("button");
          syncButton.innerText = "\u{1F504} Sync with ERP";
          syncButton.classList = "btn btn-default btn-sm primary-action";
          syncButton.style = "margin-bottom: 1em; margin-left: 1em;";
          syncButton.onclick = () => {
            var checkedBoxes = getCheckedBoxes("wc_coupon");
            checkedBoxes.forEach((e) => {
              let couponCode = e.value;
              var settings2 = {
                "url": `https://staging1.com/wp-json/cp/v1/wc/coupon/meta?code=${couponCode}`,
                "method": "GET",
                "timeout": 0
              };
              $.ajax(settings2).done(function(response2) {
                var _a;
                if (response2.success) {
                  console.log("Sync With ERP ...");
                  let dd = {};
                  let _data = response2.data;
                  dd = {
                    s_coupon_code: e.value,
                    s_wc_coupon_code: e.value,
                    s_description: _data.description,
                    f_custom_amount: _data.amount,
                    s_for_user: (_a = _data.email_restrictions) != null ? _a : [],
                    s_valid_upto: _data.expiry_date
                  };
                  frappe.call({
                    method: "cpherbalist.wc_extensions.create_erp_coupon_from_wc",
                    args: dd,
                    callback: function(response3) {
                      console.log(response3.message);
                    }
                  }).then((result) => {
                    console.log("WooCommerce Coupon created in ERP !!");
                  }).catch((err) => {
                  });
                }
              });
            });
          };
          modal.appendChild(syncButton);
          const closeButton = document.createElement("button");
          closeButton.innerText = "Close";
          closeButton.classList = "btn btn-primary btn-sm primary-action";
          closeButton.style = "    margin-bottom: 1em; margin-left: 1em;";
          closeButton.onclick = () => {
            modal.style.display = "none";
          };
          modal.appendChild(closeButton);
          const table = document.createElement("table");
          table.id = "couponTable";
          table.border = "1";
          table.style.width = "100%";
          table.style.textAlign = "left";
          const thead = document.createElement("thead");
          const headerRow = document.createElement("tr");
          ["Code", "Amount", "Type", "Expiry", "Select"].forEach((text) => {
            const th = document.createElement("th");
            th.innerText = text;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement("tbody");
          table.appendChild(tbody);
          modal.appendChild(table);
          document.body.appendChild(modal);
          console.log(response);
          let selectCoupons = [];
          var tableBody = "";
          response.forEach(function(coupon, index) {
            tableBody += `
                            <tr>
                                <td>${coupon.code}</td>
                                <td>${coupon.amount}</td>
                                <td>${coupon.discount_type}</td>
                                <td>${coupon.expiry_date || "None"}</td>
                                <td><input class="select-coupon cc" type="checkbox" id="${coupon.code}" name="wc_coupon" value="${coupon.code}"></td>
                            </tr>`;
          });
          $("#couponTable tbody").html(tableBody);
          $("#couponModal").show();
          $(".select-coupon").on("click", function() {
            var selectedCode = $(this).data("code");
          });
        });
      });
    }
  };
  function getCheckedBoxes(chkboxName) {
    var checkboxes = document.getElementsByName(chkboxName);
    var checkboxesChecked = [];
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        checkboxesChecked.push(checkboxes[i]);
      }
    }
    return checkboxesChecked.length > 0 ? checkboxesChecked : null;
  }
  function toggleSelectionOnAllCheckedBoxes(select) {
    $(":checkbox.cc").each(function() {
      this.checked = select;
    });
  }
  frappe.ui.form.on("Coupon Code", {
    coupon_name: function(frm) {
    },
    refresh: function(frm) {
      if (!cur_frm.is_new()) {
        if (cur_frm.doc.custom_pos_invoice) {
          frm.add_custom_button(__("\u{1F6D2} Open POS"), function() {
            window.location = "/app/point-of-sale";
          });
        } else {
          frm.add_custom_button(__("\u2795 Create POS Invoice"), function() {
            let _customer = cur_frm.doc.customer;
            let _amount = cur_frm.doc.custom_amount;
            let _couponCode = cur_frm.doc.coupon_code;
            let _default_voucher_item = void 0;
            frappe.db.get_single_value("CP Settings", "default_voucher_product").then((value) => {
              _default_voucher_item = value;
              console.log("default_voucher_item:", value);
              frappe.call({
                method: "cpherbalist.api.create_pos_coupon_sales_order",
                args: {
                  item_code: _default_voucher_item != null ? _default_voucher_item : "CPEV",
                  value: _amount,
                  customer: _customer != null ? _customer : "Walkin Customer",
                  coupon_code: _couponCode
                },
                callback: function(r2) {
                  if (!r2.exc && r2.message.status === "success") {
                    frappe.msgprint("POS Invoice created: <a href=''>" + r2.message.invoice_name + "</a>");
                    frappe.call({
                      method: "frappe.client.set_value",
                      args: {
                        doctype: "Coupon Code",
                        name: cur_frm.doc.name,
                        fieldname: "custom_pos_invoice",
                        value: r2.message.invoice_name
                      },
                      callback: function(r3) {
                        frappe.msgprint('Coupon Code Updated <br/> <a href="/app/point-of-sale">Open POS</a>');
                      }
                    });
                  } else {
                    frappe.msgprint("Error: " + r2.message.message);
                  }
                }
              });
            });
          });
        }
      } else {
      }
    },
    onload_post_render: function(frm) {
      document.querySelector('input[data-fieldname="custom_amount"]').addEventListener("change", () => {
        document.querySelector('input[data-fieldname="custom_min_amount"]').value = document.querySelector('input[data-fieldname="custom_amount"]').value;
      });
      document.querySelector('input[data-fieldname="custom_recipient_email"]').addEventListener("change", () => {
        document.querySelector('input[data-fieldname="custom_allowed_emails"]').value = document.querySelector('input[data-fieldname="custom_recipient_email"]').value;
      });
    },
    onload: function(frm) {
      function generateCouponCode(options = {}) {
        const {
          prefix = "CPVN",
          length = 10,
          includeDate = false,
          incInitials = false,
          useTimestamp = true
        } = options;
        if (useTimestamp)
          return `${prefix}${Date.now()}`;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomPart = "";
        for (let i = 0; i < length; i++) {
          randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const datePart = includeDate ? new Date().toISOString().slice(0, 10).replace(/-/g, "") : "";
        const initialpart = incInitials ? getInitials(cur_frm.doc.customer) : "";
        return `${prefix}${datePart}${randomPart}`;
      }
      function getInitials(fullName) {
        if (fullName === void 0 || fullName === "")
          return "";
        const names = fullName.trim().split(/\s+/);
        if (names.length === 1) {
          return names[0].charAt(0).toUpperCase();
        }
        const firstInitial = names[0].charAt(0).toUpperCase();
        const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
        const middleInitial = names.length === 3 ? names[1].charAt(0).toUpperCase() : "";
        return firstInitial + middleInitial + lastInitial;
      }
      function setCouponName() {
        var coupon_name = generateCouponCode();
        frm.doc.coupon_code = coupon_name;
        frm.doc.coupon_name = coupon_name;
        frm.refresh_field("coupon_name");
        frm.refresh_field("coupon_code");
      }
      function setAutoWCSync() {
        cur_frm.doc.custom_sync_with_woocommerce = 1;
        cur_frm.refresh_field("custom_sync_with_woocommerce");
      }
      function addAutosuggestAmounts() {
        const style = document.createElement("style");
        style.textContent = `
            nav {
                width: fit-content;
                border: 1px solid #666;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
                flex-direction: row;
                flex-wrap: no-wrap;
            }
            nav input { display: none; }
            nav label {
                font-family: sans-serif;
                padding: 10px 16px;
                border-right: 1px solid #ccc;
                cursor: pointer;
                transition: all 0.3s;
            }
            nav label:last-of-type { border-right: 0; }
            nav label:hover { background: #eee; }
            nav input:checked + label { background: #becbff; }
            `;
        document.head.appendChild(style);
        const nav = document.createElement("nav");
        nav.style.marginTop = "10px";
        const choices = ["10", "25", "50", "100", "150", "200", "300", "400"];
        choices.forEach((choice, index) => {
          const id = `x${index + 1}`;
          const input = document.createElement("input");
          input.type = "radio";
          input.id = id;
          input.value = choice;
          input.name = "x";
          input.addEventListener("click", () => {
            console.log(`${choice} selected`);
            frm.doc.custom_amount = choice;
            frm.refresh_field("custom_amount");
          });
          const label = document.createElement("label");
          label.htmlFor = id;
          label.textContent = choice;
          label.style.marginBottom = "0px";
          nav.appendChild(input);
          nav.appendChild(label);
        });
        document.querySelector('[data-fieldname="custom_amount"]').appendChild(nav);
      }
      if (cur_frm.is_new()) {
        let getCookie2 = function(name) {
          const decodedCookie = decodeURIComponent(document.cookie);
          const cookies = decodedCookie.split("; ");
          for (let cookie of cookies) {
            const [key, value] = cookie.split("=");
            if (key === name) {
              return value;
            }
          }
          return null;
        };
        var getCookie = getCookie2;
        setCouponName();
        setAutoWCSync();
        const myValue = getCookie2("pos_customer");
        if (myValue !== null) {
          console.log("Cookie value:", myValue);
          const d = new Date();
          let month = d.getMonth();
          let year = d.getFullYear();
          let coupon_code = Math.random().toString(12).substring(2, 12).toUpperCase();
          let couponName = `${coupon_code}`;
          cur_frm.set_value("customer", myValue);
        } else {
          console.log("Cookie does not exist or is expired.");
        }
        const pos_profile = getCookie2("pos_profile");
        if (pos_profile !== null) {
          console.log("Cookie value:", pos_profile);
          cur_frm.set_value("custom_pos_profile", pos_profile);
        } else {
          console.log("Cookie does not exist or is expired.");
        }
        let today = frappe.datetime.get_today();
        let three_months_later = frappe.datetime.add_months(today, 3);
        cur_frm.set_value("valid_from", today);
        cur_frm.set_value("valid_upto", three_months_later);
      }
    },
    validate: function(frm) {
      if (frm.doc.custom_is_percent && frm.doc.custom_amount > 100) {
        frappe.msgprint(__("Amount can not be grader of 100."));
        frappe.validated = false;
      }
    },
    after_save(frm) {
      var _a, _b, _c;
      console.log("After Save");
      _valid_upto = new Date(cur_frm.doc.valid_upto);
      const yyyy = _valid_upto.getFullYear();
      const mm = String(_valid_upto.getMonth() + 1).padStart(2, "0");
      const dd = String(_valid_upto.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      if (frm.doc.custom_sync_with_woocommerce) {
        let dd2 = {};
        if (frm.doc.maximum_use >= 1) {
          dd2 = {
            s_coupon_code: frm.doc.coupon_code,
            s_discount_type: "fixed_cart",
            f_amount: `${frm.doc.custom_amount}`,
            f_minimum_amount: frm.doc.custom_min_amount,
            i_usage_limit: frm.doc.maximum_use,
            s_customer_email: (_a = frm.doc.custom_allowed_emails) != null ? _a : [],
            d_expiry_date: formattedDate
          };
        } else {
          dd2 = {
            s_coupon_code: frm.doc.coupon_code,
            s_discount_type: "fixed_cart",
            f_amount: `${frm.doc.custom_amount}`,
            f_minimum_amount: frm.doc.custom_min_amount,
            s_customer_email: (_b = frm.doc.custom_allowed_emails) != null ? _b : [],
            d_expiry_date: formattedDate
          };
        }
        if (frm.doc.custom_is_percent) {
          dd2.s_discount_type = "percent";
        } else {
          dd2.s_discount_type = "fixed_cart";
        }
        frappe.call({
          method: "cpherbalist.wc_extensions.wc_update_coupon",
          args: {
            s_coupon_code: frm.doc.coupon_code,
            f_amount: `${frm.doc.custom_amount}`,
            d_expiry_date: formattedDate,
            s_customer_email: (_c = frm.doc.custom_allowed_emails) != null ? _c : [],
            s_discount_type: frm.doc.custom_is_percent ? "percent" : "fixed_cart"
          },
          callback: function(response) {
            console.log("wc_update_coupon", response);
            return;
          }
        }).then((result) => {
        }).catch((err) => {
          console.log(err);
        });
      } else {
      }
    }
  });

  // ../cpherbalist/cpherbalist/public/js/manufacturing_extensions.js
  frappe.ui.form.on("Item", {
    refresh: function(frm) {
      frm.remove_custom_button("Open BOM");
      if (!frm.is_new()) {
        frm.add_custom_button("\u{1F4E6} Move Stock", function() {
          const $btn = $(this);
          actual_qty = document.querySelectorAll("[data-actual_qty]")[document.querySelectorAll("[data-actual_qty]").length - 1].dataset.actual_qty;
          s_stock_uom = cur_frm.doc.stock_uom;
          f_rate = document.querySelectorAll("[data-rate]")[0].dataset.rate;
          _move_item(cur_frm.doc.item_code, "Stores - CP", null, actual_qty, f_rate, s_stock_uom);
        });
        _move_item = function(item, source, target, actual_qty2, rate, stock_uom, callback) {
          var dialog2 = new frappe.ui.Dialog({
            title: target ? __("Add Item") : __("Move Item"),
            fields: [
              {
                fieldname: "item_code",
                label: __("Item"),
                fieldtype: "Link",
                options: "Item",
                read_only: 1
              },
              {
                fieldname: "source",
                label: __("Source Warehouse"),
                fieldtype: "Link",
                options: "Warehouse",
                read_only: 1
              },
              {
                fieldname: "target",
                label: __("Target Warehouse"),
                fieldtype: "Link",
                options: "Warehouse",
                reqd: 1,
                get_query() {
                  return {
                    filters: {
                      is_group: 0
                    }
                  };
                }
              },
              {
                fieldname: "qty",
                label: __("Quantity"),
                reqd: 1,
                fieldtype: "Float",
                description: __("Available {0}", [actual_qty2])
              },
              {
                fieldname: "rate",
                label: __("Rate"),
                fieldtype: "Currency",
                hidden: 1
              }
            ]
          });
          dialog2.show();
          dialog2.get_field("item_code").set_input(item);
          if (source) {
            dialog2.get_field("source").set_input(source);
          } else {
            dialog2.get_field("source").df.hidden = 1;
            dialog2.get_field("source").refresh();
          }
          if (rate) {
            dialog2.get_field("rate").set_value(rate);
            dialog2.get_field("rate").df.hidden = 0;
            dialog2.get_field("rate").refresh();
          }
          if (target) {
            dialog2.get_field("target").df.read_only = 1;
            dialog2.get_field("target").value = target;
            dialog2.get_field("target").refresh();
          }
          dialog2.set_primary_action(__("Create Stock Entry"), function() {
            if (source && (dialog2.get_value("qty") == 0 || dialog2.get_value("qty") > actual_qty2)) {
              frappe.msgprint(__("Quantity must be greater than zero, and less or equal to {0}", [actual_qty2]));
              return;
            }
            if (dialog2.get_value("source") === dialog2.get_value("target")) {
              frappe.msgprint(__("Source and target warehouse must be different"));
              return;
            }
            frappe.model.with_doctype("Stock Entry", function() {
              let doc = frappe.model.get_new_doc("Stock Entry");
              doc.from_warehouse = dialog2.get_value("source");
              doc.to_warehouse = dialog2.get_value("target");
              doc.stock_entry_type = doc.from_warehouse ? "Material Transfer" : "Material Receipt";
              let row = frappe.model.add_child(doc, "items");
              row.item_code = dialog2.get_value("item_code");
              row.s_warehouse = dialog2.get_value("source");
              row.stock_uom = stock_uom;
              row.uom = stock_uom;
              row.t_warehouse = dialog2.get_value("target");
              row.qty = dialog2.get_value("qty");
              row.conversion_factor = 1;
              row.transfer_qty = dialog2.get_value("qty");
              row.basic_rate = dialog2.get_value("rate");
              frappe.set_route("Form", doc.doctype, doc.name);
            });
          });
        };
        if (false) {
          frm.add_custom_button(__("Move Stock to Default Warehouse"), function() {
            frappe.confirm(
              "Move all stock for this item to its default warehouse?",
              function() {
                frappe.call({
                  method: "cpherbalist.stock_entry_extensions.move_stock_to_default_warehouse",
                  args: {
                    item_code: frm.doc.name
                  },
                  callback: function(r2) {
                    if (!r2.exc) {
                      frappe.msgprint(r2.message || "Stock moved successfully.");
                    }
                  }
                });
              }
            );
          });
        }
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
              frm.add_custom_button("Create Work Order", function() {
                let wo = frappe.model.get_new_doc("Work Order");
                wo.production_item = frm.doc.name, wo.qty = 1;
                frappe.set_route("Form", "Work Order", wo.name);
              });
            }
          }
        });
      }
    },
    onload_post_render: function(frm) {
    }
  });

  // ../cpherbalist/cpherbalist/public/js/customer_extensions.js
  frappe.listview_settings["Customer"] = {
    onload: function(listview) {
      listview.page.add_inner_button("\u{1F504} Sync with WooCommerce", () => {
        frappe.call({
          method: "your_app_path.api.sync_woocommerce_customers",
          callback: function(r2) {
            if (!r2.exc) {
              frappe.msgprint(__("Sync completed successfully."));
              listview.refresh();
            }
          }
        });
      });
    }
  };

  // ../cpherbalist/cpherbalist/public/js/customer_list.js
  frappe.listview_settings["Customer"] = {
    add_fields: ["customer_name", "territory", "customer_group", "customer_type", "image"],
    hide_name_column: false,
    onload(listview) {
      alert("5");
      console.log("\u{1F527} Hooks from cpherbalist loaded");
    }
  };

  // ../cpherbalist/cpherbalist/public/js/clear_pos_on_logout.js
  frappe.logout = function(originalLogout) {
    return function(...args) {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("pos") || key.includes("POS") || key.includes("frappe.pos")) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
      let request = indexedDB.deleteDatabase("frappe_pos");
      request.onsuccess = function() {
        console.log("POS IndexedDB cleared on logout \u2705");
      };
      return originalLogout.apply(this, args);
    };
  }(frappe.logout);
})();
//# sourceMappingURL=cpherbalist.bundle.7DYYAGN7.js.map
