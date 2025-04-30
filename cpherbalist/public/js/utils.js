const toMilliseconds = (hrs, min, sec) => (hrs * 60 * 60 + min * 60 + sec) * 1000;

window.default_expiration = toMilliseconds(1, 30, 0)
window.lock = false;
window.fail_count = 0;
window.is_dialog_open = 0;
window.render_exchange_rate_btn_retry_count = 3;
window.is_cp = false;
var curr_item_is_cp = false;
window.retryCount = 0;
window.maxRetries = 5;

let styleTag;  // Reference to the dynamically added style tag





function removeCustomStyle() {
    // If the style tag exists, remove it
    if (styleTag) {
        styleTag.remove();
        styleTag = null;  // Clear the reference
    }
}

function addCustomStyle() {
    // Create a new <style> element
    styleTag = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .payment-container {
            display: inline-table !important;
        }

        .point-of-sale-app > .payment-container > .fields-numpad-container > .number-pad {
            flex: none;
            display: inline;
        }

        .point-of-sale-app > .payment-container > .fields-numpad-container {
        
            height: auto !important;
        
        }

        .point-of-sale-app > .payment-container > .fields-numpad-container > .fields-section .invoice-fields {
        
            overflow-y: unset !important;

        
        }
    `;
    
    // Append the style tag to the head of the document
    document.head.appendChild(style);
}


function observeElementVisibility(element, callback, options = {}) {
    const defaultOptions = {
      root: null,          // observes the viewport
      rootMargin: '0px',   // margin around the root
      threshold: 0.1,      // trigger callback when 10% of the element is visible
    };
  
    const observerOptions = { ...defaultOptions, ...options };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target); // Element is visible
        } else {
          callback(entry.target, false); // Element is not visible
        }
      });
    }, observerOptions);
  
    observer.observe(element); // Start observing the element
  }

// ===================================================================

function getCookiesObject(cookies) {
    if (cookies === void 0) { cookies = document.cookie; }
    var cookiesObject = {};
    var decodedCookies = decodeURIComponent(cookies);
    decodedCookies.split("; ").forEach(function (cookie) {
        var cookiePair = cookie.split("=");
        if (cookiePair.length > 1) {
            cookiesObject[cookiePair[0]] = cookiePair[1];
        }
    });
    return cookiesObject;
}

function createCookie(name, value, days, domain, options) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    var cookie = name + "=" + (value + expires) + "; path=/";
    if (domain) {
        cookie = cookie + "; domain=" + domain;
    }
    if (options) {
        Object.keys(options).forEach(function (key) { return (cookie += "; " + key + "=" + options[key]); });
    }
    document.cookie = cookie;
    return cookie;
}

function readCookie(name) {
    var cookies = getCookiesObject(document.cookie);
    return name in cookies ? cookies[name] : null;
}

function deleteCookie(name) {
    createCookie(name, "", -1);
}


// ===================================================================

clear_child_table = (frm, child_table_name, refresh = true) => {

    frm.clear_table('delivery_note_items');

    if (refresh) {
        frm.refresh_field('delivery_note_items');
    }
}

// ===================================================================

window.dialog = new frappe.ui.Dialog({
    title: 'Sales Profile',
    fields: [{
        label: '👤 User',
        fieldname: 'user_link',
        fieldtype: 'Link',
        options: 'User', // The link will pull from the 'User' doctype
        reqd: 1,
        get_query: () => {
            return {
                query: "cpherbalist.pos.get_seller_profile_users",
            };
        }
    },
    {
        label: '🔑 PIN Code',
        fieldname: 'password',
        fieldtype: 'Password',
        reqd: 1
    }
    ],
    primary_action_label: 'Confirm',
    primary_action: function () {
        var data = dialog.get_values();
        if (data) {

            console.log(`👤 Selected User: ${data.user_link}, 🔑 Password: ${data.password}`)

            frappe.call({
                method: "cpherbalist.pos.validate_user_pin",
                args: {
                    user_email: data.user_link,
                    pin: data.password
                },
                freeze: true,
                callback: function (r) {
                    localStorage.removeItem('seller_profile');

                    if (r.message) {
                        dialog.fields_dict.user_link.set_value('');
                        dialog.fields_dict.password.set_value('');
                        dialog.hide();
                        setItemWithCustomExpiry('seller_profile', data.user_link, window.default_expiration);
                        render_seller_profile();

                    } else {


                        frappe.msgprint({
                            title: __('PIN is not valid'),
                            indicator: 'red',
                            message: __('Provided PIN is not valid.')

                        });


                        dialog.fields_dict.password.set_value('');
                        window.fail_count++

                        if (window.fail_count >= 3) {
                            frappe.throw(__('Please contact the administrator.'))
                            location.reload();
                        }
                    }
                }
            });

        }
    }
});

function request_pin() {
    dialog.show();
    render_seller_profile()
}

const observer = new MutationObserver((entries) => {
    if (document.contains((document.querySelector(".password-strength-indicator")))) {
        document.querySelector('.password-strength-indicator').remove()
        observer.disconnect();
    }
});

observer.observe(document, {
    subtree: true,
    childList: true,
});

// ===================================================================

function render_pricing_rule() {

    const img = document.createElement('img');
    img.src = '/assets/cpherbalist/img/discount-balloons.png'; // replace with your image URL
    img.style.maxWidth = '10%';
    img.style.marginLeft = "10px";

    parent = document.querySelector('.indicator-pill').parentElement
    parent.appendChild(img);



}


function render_seller_profile() {
    const value = getItemWithExpiry('seller_profile');

    if (value) {
        if (!document.querySelector('.seller-profile')) {

            const outerSpan = document.createElement('span');
            outerSpan.classList.add('seller-profile', 'indicator-pill', 'no-indicator-dot', 'whitespace-nowrap', 'red');
            outerSpan.style.textTransform = "uppercase";

            const innerSpan = document.createElement('span');
            innerSpan.textContent = value;

            outerSpan.appendChild(innerSpan);

            parent = document.querySelector('.indicator-pill').parentElement
            parent.appendChild(outerSpan);


            outerSpan.addEventListener('click', () => {
                request_pin()

            }, { once: false })


            // outerSpan.onclick = function(){ 
            //     request_pin()
            // };
        } else {

            document.querySelector('.seller-profile').remove()
            render_seller_profile()


        }
    }
}

// ===================================================================

render_action_btn = (frm, button_id, button_name, callback, group = undefined) => {


    if (!cur_frm.fields_dict[button_id]) {
        cur_frm.add_custom_button(__(button_name), callback , group);  
    }


}

// ===================================================================

render_pos_action_btn = (frm) => {

    // cur_pos.page.add_button("💱 Currency Exchange Rate", ()=> { 
    //     let url = 'https://data.ecb.europa.eu/currency-converter'
    //     window.open(url, "_blank");  
    // })


    cur_pos.page.add_button("➕ Create Coupon", ()=> { 
        try {
            window.location.href = '/app/coupon-code/new-coupon-code-ddd' 
        } catch (error) { }
    }, { btn_class: "" })

    const value = getItemWithExpiry('seller_profile');
    let buttonValue = 'Select Seller Profile'; 

    if (value) {
        buttonValue = '🔄 Switch Seller Profile';
    } else {
        buttonValue = 'Select Seller Profile';
    }

    cur_pos.page.add_button(buttonValue, ()=> { 
        try {
            request_pin();
        } catch (error) { }
    })

    // cur_pos.page.add_button("☑️ Accept Transfers", ()=> { 
    //     try {
    //         window.location.href = 'material-request'
    //     } catch (error) { }
    // }, { btn_class: "" })


}

// ===================================================================

frappe.ui.form.on('Stock Entry', {
    onload: function(frm) {
        if (cur_frm.is_new()) {






            let default_source_warehouse = frappe.db.get_single_value('CP Settings', 'default_source_warehouse')
                .then(value => {
                    console.log('default_source_warehouse:', value);
                });

            let default_target_warehouse = frappe.db.get_single_value('CP Settings', 'default_target_warehouse')
                .then(value => {
                    console.log('default_target_warehouse:', value);
                });

        }


    }



})
// ===================================================================



function disable_copying() {
    // Disable right-click
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
    });

    // Disable text selection
    document.addEventListener('mousedown', event => {
        event.preventDefault();
    });

    document.addEventListener('selectstart', event => {
        event.preventDefault();
    });

    // Disable keyboard shortcuts for copying
    document.addEventListener('keydown', event => {
        // Prevent Ctrl+C, Ctrl+X, Ctrl+U, and other common copying shortcuts
        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C' || event.key === 'x' || event.key === 'X')) {
            event.preventDefault();
        }
    });
}

function detectDevTools() {
    const width = window.outerWidth - window.innerWidth;
    const height = window.outerHeight - window.innerHeight;

    if (width > threshold || height > threshold) {
        devtoolsOpen = true;
        alert('F*** you ... Get out of here !! You cannot access this page.');
        // Redirect or take other actions if needed
        window.location.href = 'https://google.com/blocked';
    } else {
        devtoolsOpen = false;
    }
}

function disable_right_click() {
    // Disable right-click (context menu)
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
    });

    // Disable key combinations (e.g., Ctrl+C, Ctrl+V, F12, F11, etc.)
    document.addEventListener('keydown', event => {
        // Disable common keys for browsers: Ctrl + U, Ctrl + Shift + I (Developer Tools)
        if (
            (event.ctrlKey && (event.key === 'u' || event.key === 'U' || event.key === 'i' || event.key === 'I')) ||
            (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'i')) ||
            (event.key === 'F12') ||
            (event.key === 'F11') ||
            (event.key === 'F5') ||
            (event.metaKey && event.key === 'i') || // For macOS: Command + i (Dev Tools)
            (event.metaKey && event.key === 'u') || // For macOS: Command + u (View Source)
            (event.metaKey && event.key === 'F12') // For macOS: Command + F12 (Dev Tools)
        ) {
            event.preventDefault();
        }

        // Block the default behavior of specific keys (like 'Inspect', 'View Source', etc.)
        // Disable the 'F12' key (developer tools open)
        if (event.key === 'F12' || event.key === 'F11' || event.key === 'F5') {
            event.preventDefault();
        }
    });

    // Disable pointer events on elements with class 'disabled'
    document.querySelectorAll('.disabled').forEach(element => {
        element.style.pointerEvents = 'none';
    });
}

// ===================================================================

function setItemWithCustomExpiry(key, value, expirationTimeMs) {

    if (localStorage.getItem(key)) {
        console.log('This key already exists. Cannot overwrite it.');
        return; // Exit the function without setting the item
    }

    const item = {
        value: value,
        expiry: new Date().getTime() + expirationTimeMs
    };

    localStorage.setItem(key, JSON.stringify(item));
    console.log('Item set successfully.');

}

function getItemWithExpiry(key) {
    try {
        const itemStr = localStorage.getItem(key);

        if (!itemStr) {
            request_pin()
        }

        const item = JSON.parse(itemStr);
        const now = new Date().getTime();

        if (now > item.expiry) {
            localStorage.removeItem(key);
            console.log(`Item with key "${key}" has expired and been removed.`);
            request_pin()
            getItemWithExpiry(key);
        }

        return item.value;
    }
    catch (err) { }
}

// ===================================================================

function check_item(e) {
    let item_count = cur_frm._items.length;

    console.log('passed item', e)

    if (item_count === 0) {
        return e.custom_is_cp;
    }

    if (item_count >= 1) {
        curr_item_is_cp = e.custom_is_cp;

        if (!(curr_item_is_cp) && is_cp) {
            return false;
        }
    }

    return false;


}

function _customClick(e) {

    if (is_cp) return;

    const $item = e;
    const item_code = decodeURIComponent($item.dataset.itemCode);


    console.log('bind_custom_events');
    console.log(item_code);

    frappe.db.get_doc('Item', item_code).then((result) => {
        //do something with result
        console.log(result)
        is_cp = result.custom_is_cp ?? false;

        if (is_cp) {
            console.log('Product is cp');
        }

    })
        .catch(console.error)

}

// function get_settings(attr = undefined) {

//     if (attr === undefined) return null;

//     frappe.db.get_doc('Michalis Diamond Gallery Settings').then(res => {
//         return res[attr]
//     })
// }

async function get_settings(attr = undefined) {
    if (attr === undefined) return null;

    try {
        const res = await frappe.db.get_doc('Michalis Diamond Gallery Settings');
        return res[attr];
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

async function get_related_invoices(parent_invoice) {

    try {
        frappe.call({
            method: "cpherbalist.pos.get_child_invoices", //dotted path to server method
            args: {
                filters: { parent_invoice: `'{parent_invoice}'` }
            },
            success: function (r) { },
            error: function (r) { },
            callback: function (r) {

            }
        }).then(res => {
            if (res.message.length >= 1) {
                window.related_invoices = r.message;
                return true;
            }

            return false;
        });

        console.log('💡 Check ....', obj)
    } catch (error) {
        return false;
    }
}

function get_parent_invoice_obj(invoice_name = undefined) {
    if (invoice_name === undefined) return;

    try {
        const res = frappe.db.get_doc('POS Invoice', cur_frm.doc.custom_parent_invoice)
        return res;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

function get_items_from_parent_invoice(parent_invoice_object = undefined) {
    if (parent_invoice_object === undefined) return;

    try {
        return parent_invoice_object.custom_items_to_deposit
    } catch (error) {
        return []
    }
}

async function get_pos_profile_warehouse(pos_profile) {

    if (pos_profile === '') return;

    try {
        const res = await frappe.db.get_doc('POS Profile', pos_profile);
        return res.warehouse;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}