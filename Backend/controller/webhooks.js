const Order = require("../models/orders");
const Product = require("../models/products");
const stripe = require("stripe")(process.env.STRIPE_SECRETE_KEY);
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");

// Create SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const generateOrderEmailHTML = (order) => {
    const productRows = order.products
        .map(
            (item) => `
      <tr>
        <td style="padding: 20px 0; border-bottom: 2px solid #000000;">
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 4px;">${
              item.name
          }</div>
          <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.05em;">SIZE: ${
              item.size || "OS"
          } // QTY: ${item.quantity}</div>
        </td>
        <td style="padding: 20px 0; border-bottom: 2px solid #000000; text-align: right; vertical-align: top;">
          <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 14px; font-weight: 600; color: #000000;">₦${item.price.toFixed(
              2,
          )}</div>
        </td>
      </tr>
    `,
        )
        .join("");

    // Calculate subtotal (products only)
    const subtotal = order.products.reduce((sum, item) => sum + item.price, 0);

    // Calculate total shipping fee
    const shippingTotal =
        order.shipping && order.shipping.length > 0
            ? order.shipping.reduce((sum, s) => sum + (s.fee || 0), 0)
            : 0;

    // Get shipping method name(s)
    const shippingMethodName =
        order.shipping && order.shipping.length > 0
            ? order.shipping.map((s) => s.name).join(", ")
            : "Standard Dispatch";

    // Generate shipping rows for the receipt
    const shippingRows =
        order.shipping && order.shipping.length > 0
            ? order.shipping
                  .map(
                      (s) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #CCCCCC;">
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: -0.01em;">${
                s.name || "Shipping"
            }</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #CCCCCC; text-align: right; vertical-align: top;">
            <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 13px; font-weight: 500; color: #666666;">₦${(
                s.fee || 0
            ).toFixed(2)}</div>
          </td>
        </tr>
      `,
                  )
                  .join("")
            : "";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CAINS STORE | ACQUISITION CONFIRMED</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFFFF; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF;">
        <tr>
          <td align="center" style="padding: 60px 20px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left; border: 4px solid #000000; padding: 40px;">
              
              <tr>
                <td style="padding-bottom: 60px;">
                  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 900; letter-spacing: -0.05em; color: #000000; text-transform: uppercase;">
                    CAINS STORE<span style="color: #FF0000;">.</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom: 40px;">
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 12px;">// STATUS: SECURED</div>
                  <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 42px; line-height: 1.0; font-weight: 800; letter-spacing: -0.04em; color: #000000; margin: 0; text-transform: uppercase;">
                    THE PIECES <br>ARE YOURS.
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom: 48px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <span style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 11px; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.1em;">Order Ref:</span>
                        <span style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 11px; font-weight: 600; color: #FFFFFF; margin-left: 8px;">#${
                            order._id
                        }</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <thead>
                      <tr>
                        <th align="left" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; padding-bottom: 8px;">Archive Item</th>
                        <th align="right" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; padding-bottom: 8px;">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productRows}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Shipping Details Section -->
              <tr>
                <td style="padding-top: 8px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tbody>
                      ${shippingRows}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Totals Breakdown Section -->
              <tr>
                <td style="padding-top: 24px; padding-bottom: 60px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; font-weight: 500; color: #666666; text-transform: uppercase; padding-bottom: 8px;">Subtotal</td>
                      <td align="right" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 14px; font-weight: 500; color: #666666; padding-bottom: 8px;">₦${subtotal.toFixed(
                          2,
                      )}</td>
                    </tr>
                    <tr>
                      <td style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; font-weight: 500; color: #666666; text-transform: uppercase; padding-bottom: 16px;">Shipping</td>
                      <td align="right" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 14px; font-weight: 500; color: #666666; padding-bottom: 16px;">₦${shippingTotal.toFixed(
                          2,
                      )}</td>
                    </tr>
                    <tr>
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; color: #000000; text-transform: uppercase; border-top: 2px solid #000000; padding-top: 16px;">Total Acquisition</td>
                      <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 800; color: #000000; border-top: 2px solid #000000; padding-top: 16px;">₦${order.totalPrice.toFixed(
                          2,
                      )}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="border-top: 2px solid #000000; padding-top: 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="50%" style="vertical-align: top; padding-right: 20px;">
                        <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #000000; margin-bottom: 12px;">[ DESTINATION ]</div>
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; text-transform: uppercase; font-weight: 500;">
                          ${order.firstName} ${order.lastName}<br>
                          ${order.address}<br>
                          ${order.city}, ${order.state} ${order.zip}
                        </div>
                      </td>
                      <td width="50%" style="vertical-align: top;">
                        <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #000000; margin-bottom: 12px;">[ METHOD ]</div>
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; text-transform: uppercase; font-weight: 500;">
                          ${shippingMethodName}<br>
                          Tracking to follow
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding-top: 40px; text-align: center;">
                  <a href="${process.env.CLIENT_ORIGIN_1}/complete?reference=${
        order._id
    }" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; padding: 18px 40px; border: 2px solid #000000; transition: all 0.2s ease;">
                    TRACK YOUR ORDER →
                  </a>
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px;">
                    Monitor your order status in real-time
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding-top: 60px; text-align: center;">
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 9px; color: #999999; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.8;">
                    This is an automated transmission from CAINS STORE.<br>
                    &copy; ${new Date().getFullYear()} ALL RIGHTS RESERVED. ARCHIVE NO. ${Math.floor(
        Math.random() * 100000,
    )}
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const generateOwnerOrderEmailHTML = (order) => {
    const productRows = order.products
        .map(
            (item) => `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB;">
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 2px;">${
              item.name
          }</div>
          <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">SIZE: ${
              item.size || "OS"
          } // QTY: ${item.quantity}</div>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; text-align: right; vertical-align: top;">
          <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 13px; font-weight: 600; color: #111827;">₦${item.price.toFixed(
              2,
          )}</div>
        </td>
      </tr>
    `,
        )
        .join("");

    const subtotal = order.products.reduce((sum, item) => sum + item.price, 0);
    const shippingTotal =
        order.shipping && order.shipping.length > 0
            ? order.shipping.reduce((sum, s) => sum + (s.fee || 0), 0)
            : 0;
    const shippingMethodName =
        order.shipping && order.shipping.length > 0
            ? order.shipping.map((s) => s.name).join(", ")
            : "Standard Dispatch";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEW ORDER | ACTION REQUIRED</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; text-align: left;">

              <!-- Urgent Header -->
              <tr>
                <td style="background-color: #000000; padding: 24px 32px; border-radius: 8px 8px 0 0;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 900; letter-spacing: -0.04em; color: #FFFFFF; text-transform: uppercase;">
                          CAINS STORE<span style="color: #FF0000;">.</span>
                        </div>
                      </td>
                      <td align="right">
                        <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 11px; font-weight: 700; color: #FCA5A5; text-transform: uppercase; letter-spacing: 0.1em;">⚡ NEW ORDER</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 32px; border-radius: 0 0 8px 8px;">

                  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; color: #111827; margin-bottom: 4px;">New Order Received</div>
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; color: #6B7280; margin-bottom: 28px;">Order #${
                      order._id
                  } — ${new Date().toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
    })}</div>

                  <!-- Customer Info -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6B7280; margin-bottom: 12px;">CUSTOMER DETAILS</div>
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.6;">
                          <strong>${order.firstName} ${
        order.lastName
    }</strong><br>
                          ${order.email}<br>
                          ${order.phone || "No phone provided"}
                        </div>
                      </td>
                      <td style="padding: 20px; vertical-align: top;">
                        <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6B7280; margin-bottom: 12px;">SHIPPING ADDRESS</div>
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.6;">
                          ${order.address}<br>
                          ${order.city}, ${order.state} ${order.zip}<br>
                          ${order.country || ""}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Items -->
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6B7280; margin-bottom: 8px;">ORDER ITEMS</div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                    <tbody>
                      ${productRows}
                    </tbody>
                  </table>

                  <!-- Totals -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #6B7280; padding-bottom: 6px;">Subtotal</td>
                            <td align="right" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 13px; color: #6B7280; padding-bottom: 6px;">₦${subtotal.toFixed(
                                2,
                            )}</td>
                          </tr>
                          <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #6B7280; padding-bottom: 12px;">Shipping (${shippingMethodName})</td>
                            <td align="right" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 13px; color: #6B7280; padding-bottom: 12px;">₦${shippingTotal.toFixed(
                                2,
                            )}</td>
                          </tr>
                          <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; color: #111827; border-top: 2px solid #E5E7EB; padding-top: 12px;">Total</td>
                            <td align="right" style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 18px; font-weight: 800; color: #111827; border-top: 2px solid #E5E7EB; padding-top: 12px;">₦${order.totalPrice.toFixed(
                                2,
                            )}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Action -->
                  <div style="text-align: center; padding: 8px 0 12px;">
                    <a href="https://admin.cainsstore.com/orders" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; padding: 16px 36px; border-radius: 6px;">
                      VIEW IN DASHBOARD →
                    </a>
                  </div>

                  <!-- Footer -->
                  <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
                    <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.8;">
                      This is an automated order notification from CAINS STORE.<br>
                      &copy; ${new Date().getFullYear()} CAINS STORE. All rights reserved.
                    </div>
                  </div>

                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send order confirmation email to customer using SMTP
const sendOrderConfirmationEmail = async (order) => {
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || "CAINS STORE"}" <${
            process.env.SMTP_FROM_EMAIL
        }>`,
        to: order.email,
        subject: `Order Confirmation - #${order._id}`,
        html: generateOrderEmailHTML(order),
        text: `Hi ${
            order.firstName
        }, Thank you for your order! Your Order ID is: ${
            order._id
        }. Total: ₦${order.totalPrice.toFixed(2)}`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Customer email sent successfully. Message ID:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending customer email:", error);
        throw error;
    }
};

// Send order notification email to store owner using SMTP
const sendOwnerOrderNotificationEmail = async (order) => {
    const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_FROM_EMAIL;

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || "CAINS STORE"}" <${
            process.env.SMTP_FROM_EMAIL
        }>`,
        to: ownerEmail,
        subject: `⚡ New Order #${order._id} — ₦${order.totalPrice.toFixed(2)} from ${order.firstName} ${order.lastName}`,
        html: generateOwnerOrderEmailHTML(order),
        text: `New order received! Order #${order._id} from ${order.firstName} ${order.lastName} (${order.email}). Total: ₦${order.totalPrice.toFixed(2)}. Items: ${order.products.map((p) => p.name).join(", ")}. Ship to: ${order.address}, ${order.city}, ${order.state} ${order.zip}.`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Owner notification email sent successfully. Message ID:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending owner notification email:", error);
        throw error;
    }
};

// Reduce product stock quantities after successful payment
const reduceProductStock = async (order) => {
    const updatePromises = order.products.map((item) =>
        Product.findOneAndUpdate(
            { _id: item.product, "countInStock.size": item.size },
            { $inc: { "countInStock.$.quantity": -item.quantity } }
        )
    );
    await Promise.all(updatePromises);
};

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRETE,
        );
    } catch (err) {
        console.log(err);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    const client_secrete = event.data.object.client_secret;
    if (!client_secrete) return res.status(200).send("No client_secrete found");

    const order = await Order.findOne({ clientSecret: client_secrete });
    if (!order) {
        return res.status(200).send();
    }

    switch (event.type) {
        case "payment_intent.canceled":
            order.paymentStatus = "canceled";
            break;
        case "payment_intent.payment_failed":
            order.paymentStatus = "failed";
            break;
        case "payment_intent.processing":
            order.paymentStatus = "processing";
            break;
        case "payment_intent.succeeded":
            order.paymentStatus = "successful";
            await order.save();
            try {
                await Promise.allSettled([
                    sendOrderConfirmationEmail(order),
                    sendOwnerOrderNotificationEmail(order),
                    reduceProductStock(order),
                ]);
            } catch (emailError) {
                console.error("Failed to send order emails or reduce stock:", emailError);
            }
            return res.status(200).send();
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    await order.save();
    res.status(200).send();
};

const paystackWebhook = async (req, res) => {
    const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRETE_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(200).send();
    }

    if (req.body.event === "charge.success") {
        const { reference } = req.body.data;
        try {
            const order = await Order.findOne({ clientSecret: reference });
            if (!order) {
                return res.status(200).send();
            }
            order.paymentStatus = "successful";
            await order.save();

            try {
                await Promise.allSettled([
                    sendOrderConfirmationEmail(order),
                    sendOwnerOrderNotificationEmail(order),
                    reduceProductStock(order),
                ]);
            } catch (emailError) {
                console.error("Failed to send order emails or reduce stock:", emailError);
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send();
        }
    }

    if (req.body.event === "charge.failed") {
        const { reference } = req.body.data;
        try {
            const order = await Order.findOne({ clientSecret: reference });
            if (!order) {
                return res.status(200).send();
            }
            order.paymentStatus = "failed";
            await order.save();
        } catch (error) {
            console.log(error);
            return res.status(200).send();
        }
    }
    return res.status(200).send();
};

module.exports = {
    stripeWebhook,
    paystackWebhook,
};
