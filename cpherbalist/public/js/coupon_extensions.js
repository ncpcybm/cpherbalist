frappe.ui.form.on("Coupon Code", {
    after_save(frm) {
        // write setup code

        console.log(frm);

        if (frm.doc.custom_sync_with_woocommerce) {
            // Percentage discount
            // Fixed basket discount
            // Fixed product discount


            // valid_upto
            // customer_email
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


            frappe.call({
                method: "cpherbalist.wc_extensions.wc_create_coupon",
                args: dd,
                callback: function(response) {
                    // Handle response
                    console.log(response.message);
                }
            }).then((result) => {
                alert('WooCommerce Coupon created !!')
            }).catch((err) => {
                
            });
            
        }


        // frappe.call({
        //     method: "cpherbalist.wc_extensions.wc_create_coupon",
        //     args: {
        
        //     },
        //     callback: function(response) {
        //         // Handle response
        //         console.log(response.message);
        //     }
        // });

    }
});