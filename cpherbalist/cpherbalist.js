
frappe.provide("erpnext");
frappe.provide("erpnext.utils");
frappe.provide("frappe.desk");

$(window).on('popstate', page_changed);
$(window).on('hashchange', page_changed);
$(window).on('load', page_changed);


window.addEventListener("popstate", (event) => {
    console.log(
      `location: ${document.location}, state: ${JSON.stringify(event.state)}`,
    );
  });


function __exist(route) {
    return route.includes('Form') || route.includes('query-report') || route.includes('List') || (route.includes("Tree") || route.includes("Warehouse") || route.includes("Supplier") || route.includes('Michalis Diamond Gallery Settings'))
}

function __allow_transfers(route) {
    return route.includes('Form') && route.includes('Material Request')
}

function __allow_workspace(route) {
    return route.includes('Workspaces') && route.includes('MDG Workspace')
}

function __in_app(route, app) {
    return route.includes(app)
}

function __not_in_workspace(route, workspace) {
    return route.includes(workspace)
}

function __is_in_role(role) {
    return frappe.user.has_role(role)
}

function __remove_element(selector) {
    const element = document.querySelector(selector);
    if (element) element.remove();
}


function __disable_tabs() {
    if (__in_role('Administrator')) return;

    const removeTabs = [
        "Accounting", "Build", "Assets", "Selling", "Buying", "Users", 
        "ERPNext Integrations", "ERPNext Settings", "Quality", "Integrations", 
        "Tools", "CRM", "Manufacturing", "HR", "Payroll", "Website", 
        "Support", "Projects", "Frappe Builder", "Home", "Stock"
    ];
    
    removeTabs.forEach(rt => __remove_element(`[item-name="${rt}"]`));
}

function __in_role(role) {
    return frappe.user.has_role(role)
}


function __check_for_page() {
    cur_frm.disable_form(1)
    cur_frm.disable_save(1)
}

function getRouteAsync() {
    return new Promise((resolve, reject) => {
        try {
            const route = frappe.get_route();
            resolve(route);
        } catch (error) {
            reject(error);
        }
    });
}


function page_changed(event) {

    if (__in_role('Administrator')) return;

    if (__in_role('POS User - MDG')) {

        setTimeout(() => {
            __disable_tabs();
          }, 0);
    }

    try {
        getRouteAsync()
            .then(route => {

                if (route.includes('Material Request')) return;

                
                if (route.includes('POS Closing Entry')) return;

                if (route.includes('Report') && route.includes("Monthly Z Report - v2")) {
                    window.location.href = "/app/mdg-workspace"
                }



                frappe.router.on('change', () => {

                    if (__in_role('Administrator')) return;

                    let posUserRole = 'POS User - MDG'

                    if (__in_role('POS User - MDG')) {

                        console.log('route', route);

                        let uri = window.location.pathname.split('/')

                        if (cur_frm) {
                            cur_frm.disable_form()
                            cur_frm.disable_save()
                        }

                        setTimeout(() => {
                            __disable_tabs();
                          }, 0);

                        if (!(route.includes('MDG Workspace')) || (!uri.includes('MDG Workspace'))) {

                            window.location.href = "/app/mdg-workspace"
                            //frappe.set_route(['Workspaces', 'MDG Workspace'])
                        }
                    }
                })
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    catch (error) {
        console.error(error);
    }

    const remove_sidebar_tab = (name) => {
        console.log(":: remove_sidebar_tab ::")
        document.querySelector(`[item-name="${name}"]`).remove()
    }

    const remove_per_area_label = (name) => {
        document.querySelector(`[aria-label="${name}"]`).remove()
    }

    const remove_from_user_actions = () => {
        document.querySelectorAll('.dropdown-item')[document
            .querySelectorAll('.dropdown-item').length - 1]
            .remove()
    }

    const remove_section = (name) => {
        document.querySelector(
            `[data-fieldname="${name}"]`
        ).remove()
    }

}

init_barcode = () => {
    var page_name = frappe.get_route();

    if (page_name[0] === "print" && page_name.includes(
        "Material Request")) {

        let material_request_id = frappe.get_route()[2].split(
            '-')[frappe.get_route()[2].split('-').length -
            1] ??
            '00000';

        const iframe = document.querySelector(
            ".print-format-container");
        const iframeDocument = iframe.contentWindow.document;
        const elementInsideIframe = iframeDocument.querySelector(
            "body > div > div > div:nth-child(5)")

        let scriptEle = iframeDocument.createElement("script");
        scriptEle.setAttribute("src",
            "//cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.js"
        );
        scriptEle.setAttribute('type', 'text/javascript');
        scriptEle.setAttribute('async', 'true');
        iframeDocument.head.appendChild(scriptEle);

        scriptEle.onload = () => console.log(
            `script loaded successfully.`);
        scriptEle.onerror = () => console.error(
            `Error loading script`);

        // Find the last .row .section-break div inside .print-format .page-break
        var lastSectionBreak = document.querySelector(
            ".print-format .page-break .row .section-break:last-child"
        );

        if (elementInsideIframe) {
            // Create the SVG element dynamically
            var svgNamespace =
                "http://www.w3.org/2000/svg"; // The namespace for SVG elements
            var barcodeSvg = document.createElementNS(
                svgNamespace, "svg"); // Create the <svg> element
            barcodeSvg.setAttribute("id",
                "barcode1"
            ); // Set the id for the barcode container
            barcodeSvg.setAttribute("width",
                "200"); // Set width (optional)
            barcodeSvg.setAttribute("height",
                "100"); // Set height (optional)

            // Append the SVG element to the last .row .section-break div
            elementInsideIframe.appendChild(barcodeSvg);

            // Generate the barcode after the SVG element is added

            //height: 10vh;

            JsBarcode(elementInsideIframe.querySelector(
                "#barcode"), material_request_id);

        }

    }

}

register_realtime_events = () => {
    frappe.realtime.on('material_request', async (data) => {
        console.log('material_request');
        x = await frappe.db.get_doc('User', frappe
            .session.user_email).then((
                result) => {

                    let selected_warehouse = result
                    .warehouse ?? frappe
                        .user_defaults[
                    'default_warehouse'];

                if (data.to_warehouse ===
                    selected_warehouse) {
                    frappe.utils.play_sound(
                        "urgent-tone");
                    var audio = new Audio(
                        '/assets/michalis_diamond_gallery/sounds/mixkit-urgent-simple-tone-loop-2976.mp3'
                    ); // replace with the actual sound file path
                    audio.loop =
                        true; // Set loop to true for continuous sound
                    audio.play().catch(error => console.error('Error playing audio:',error));

                    setTimeout(() => {audio.pause(); }, 1500);

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

setTimeout(() => {
    
    $(document).ready(() => {
        page_changed()
        register_realtime_events();
       setTimeout(() => {init_barcode()}, 1600);
    })

}, 1500);

