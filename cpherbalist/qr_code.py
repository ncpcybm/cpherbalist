import qrcode
import base64
from io import BytesIO
import frappe

@frappe.whitelist(allow_guest=True)
def get_qr_jpg():
    """Return a QR code image in JPG format as HTTP response."""
    data = frappe.form_dict.get("data")
    size = frappe.form_dict.get("size", "150x150")

    if not data:
        frappe.throw(_("Missing 'data' parameter for QR code"))

    # Extract width and height
    try:
        width, height = map(int, size.lower().split("x"))
    except Exception:
        width = height = 150  # fallback default size

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=2
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white").resize((width, height))

    # Save image to BytesIO buffer as JPG
    buffer = BytesIO()
    img.convert("RGB").save(buffer, format="JPEG")
    buffer.seek(0)

    # Set response headers
    frappe.local.response.filename = "qr_code.jpg"
    frappe.local.response.filecontent = buffer.read()
    frappe.local.response.type = "download"
    frappe.local.response.headers["Content-Type"] = "image/jpeg"
    
@frappe.whitelist(allow_guest=True)
def get_qr_base64():
    """Return a base64-encoded QR code image from query params."""
    data = frappe.form_dict.get("data")
    size = frappe.form_dict.get("size", "150x150")

    if not data:
        frappe.throw("Missing 'data' parameter for QR code")

    # Extract width and height from size param
    try:
        width, height = map(int, size.lower().split("x"))
    except Exception:
        width = height = size  # fallback default

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=2
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white").resize((width, height))

    # Encode image to base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode("utf-8")

    return {
        "qr_code_base64": img_base64
    }
