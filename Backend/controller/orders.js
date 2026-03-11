require("dotenv").config();
const mongoose = require("mongoose");
const { BadRequestError } = require("../errors");
const Cart = require("../models/carts");
const Customer = require("../models/customer");
const Order = require("../models/orders");
const Shipping = require("../models/shippings");
const { Paystack } = require("paystack-sdk");
const Product = require("../models/products");
const stripe = require("stripe")(process.env.STRIPE_SECRETE_KEY);
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

// Status display configuration
const getStatusConfig = (status) => {
    const configs = {
        pending: {
            headline: "ORDER RECEIVED",
            subheadline: "We're preparing your items.",
            statusLabel: "PENDING",
            statusColor: "#FF9500",
        },
        processing: {
            headline: "ORDER PROCESSING",
            subheadline: "Your items are being prepared for dispatch.",
            statusLabel: "PROCESSING",
            statusColor: "#007AFF",
        },
        shipped: {
            headline: "ORDER SHIPPED",
            subheadline: "Your items are on their way to you.",
            statusLabel: "SHIPPED",
            statusColor: "#34C759",
        },
        delivered: {
            headline: "ORDER DELIVERED",
            subheadline: "Your items have arrived at their destination.",
            statusLabel: "DELIVERED",
            statusColor: "#00C853",
        },
        cancelled: {
            headline: "ORDER CANCELLED",
            subheadline: "Your order has been cancelled.",
            statusLabel: "CANCELLED",
            statusColor: "#FF3B30",
        },
    };
    return configs[status] || configs.pending;
};

const generateStatusUpdateEmailHTML = (order) => {
    const statusConfig = getStatusConfig(order.status);

    const productRows = order.products
        .map(
            (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5;">
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 4px;">${
              item.name
          }</div>
          <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.05em;">SIZE: ${
              item.size || "OS"
          } // QTY: ${item.quantity}</div>
        </td>
        <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5; text-align: right; vertical-align: top;">
          <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 13px; font-weight: 600; color: #000000;">₦${item.price.toFixed(
              2,
          )}</div>
        </td>
      </tr>
    `,
        )
        .join("");

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CAINS STORE | ORDER STATUS UPDATE</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFFFF; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF;">
        <tr>
          <td align="center" style="padding: 60px 20px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left; border: 4px solid #000000; padding: 40px;">
              
              <tr>
                <td style="padding-bottom: 50px;">
                  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 900; letter-spacing: -0.05em; color: #000000; text-transform: uppercase;">
                    CAINS STORE<span style="color: #FF0000;">.</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom: 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${
                      statusConfig.statusColor
                  };">
                    <tr>
                      <td style="padding: 12px 20px;">
                        <span style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 11px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.15em;">STATUS: ${
                            statusConfig.statusLabel
                        }</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom: 35px;">
                  <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 36px; line-height: 1.1; font-weight: 800; letter-spacing: -0.04em; color: #000000; margin: 0; text-transform: uppercase;">
                    ${statusConfig.headline}
                  </h1>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #666666; margin: 12px 0 0 0; line-height: 1.5;">
                    ${statusConfig.subheadline}
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom: 30px;">
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
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #000000; padding-bottom: 8px;">[ ORDER ITEMS ]</div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tbody>
                      ${productRows}
                    </tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding-top: 24px; padding-bottom: 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; color: #000000; text-transform: uppercase; border-top: 2px solid #000000; padding-top: 16px;">Total</td>
                      <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #000000; border-top: 2px solid #000000; padding-top: 16px;">₦${order.totalPrice.toFixed(
                          2,
                      )}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="border-top: 2px solid #000000; padding-top: 25px;">
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #000000; margin-bottom: 12px;">[ SHIPPING TO ]</div>
                  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #000000; text-transform: uppercase; font-weight: 500;">
                    ${order.firstName} ${order.lastName}<br>
                    ${order.address}<br>
                    ${order.city}, ${order.state} ${order.zip}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding-top: 35px; text-align: center;">
                  <a href="${process.env.CLIENT_ORIGIN_1}/complete?reference=${
        order._id
    }" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; padding: 18px 40px; border: 2px solid #000000;">
                    VIEW ORDER STATUS →
                  </a>
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px;">
                    Track your order in real-time
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding-top: 50px; text-align: center;">
                  <div style="font-family: 'SF Mono', 'Menlo', 'Courier', monospace; font-size: 9px; color: #999999; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.8;">
                    This is an automated transmission from CAINS STORE.<br>
                    &copy; ${new Date().getFullYear()} ALL RIGHTS RESERVED.
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

// Send order status update email using SMTP
const sendOrderStatusUpdateEmail = async (order) => {
    const statusConfig = getStatusConfig(order.status);

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || "CAINS STORE"}" <${
            process.env.SMTP_FROM_EMAIL
        }>`,
        to: order.email,
        subject: `Order Update: ${statusConfig.statusLabel} - #${order._id}`,
        html: generateStatusUpdateEmailHTML(order),
        text: `Hi ${order.firstName}, Your order #${order._id} status has been updated to: ${statusConfig.statusLabel}. ${statusConfig.subheadline}`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(
            "Status update email sent successfully. Message ID:",
            info.messageId,
        );
        return info;
    } catch (error) {
        console.error("Error sending status update email:", error);
        throw error;
    }
};

const createOrderStripe = async (req, res) => {
    const cartId = req.cart;
    if (!cartId) {
        throw new BadRequestError("No item in cart");
    }

    const cart = await Cart.findById(cartId).populate("products.product");

    for await (const item of cart.products) {
        const product = await Product.findById(item.product.id);
        if (!product) {
            throw new BadRequestError("Product doesn't exist");
        }
        console.log({ product });

        const sizeExist = product.countInStock.find(
            (ii) => ii.size === item.size && ii.quantity >= item.quantity,
        );
        if (!sizeExist) {
            throw new BadRequestError(
                `Stock size ${size} is less than ${quantity}`,
            );
        }
    }

    const products = cart.products.map((item) => {
        return {
            // product: item.product,
            // name: item.product.name,
            // measurements: item.measurements,
            // quantity: item.quantity,
            // price: item.price,
            product: item.product,
            name: item.product.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
        };
    });

    const orderExist = await Order.findOne({ cart });
    if (orderExist) {
        throw new BadRequestError("Order has been placed");
    } else {
        req.body.cart = cart;
    }

    req.body.products = products;
    // req.body.totalPrice = cart.totalPrice;

    if (req.customer) {
        const { id: customerId } = req.customer;

        if (customerId) {
            const customer = await Customer.findById(customerId);
            req.body.customer = customer;
        }
    }

    if (!mongoose.isValidObjectId(req.body.shipping)) {
        throw new BadRequestError("Shipping Id is invalid");
    }
    const shippingDetails = await Shipping.findById(req.body.shipping);
    if (!shippingDetails) {
        throw new BadRequestError("Shipping details doesn't exist");
    }
    if (shippingDetails.currency !== "NGN") {
        throw new BadRequestError(
            "Invalid Shipping details, use a naira shipping info",
        );
    }
    req.body.shipping = [
        {
            shipping: shippingDetails._id,
            name: shippingDetails.name,
            fee: shippingDetails.fee,
        },
    ];
    req.body.totalPrice = cart.totalPrice + shippingDetails.fee;
    const order = await Order.create(req.body);

    // const paymentIntent = await stripe.paymentIntents.create({
    //     amount: req.body.totalPrice * 100,
    //     currency: "NGN",
    //     automatic_payment_methods: {
    //         enabled: true,
    //     },
    // });
    // req.body.clientSecret = paymentIntent.client_secret;
    let paystackClient = new Paystack(process.env.PAYSTACK_SECRETE_KEY);
    const transactionInitializer = {
        amount: (req.body.totalPrice * 100).toString(),
        email: req.body.email,
        callback_url: `${process.env.CLIENT_ORIGIN_1}/complete?reference=${order._id}`,
    };

    const response = await paystackClient.transaction
        .initialize(transactionInitializer)
        .catch((error) => {
            throw new BadRequestError("failed to process deposit");
        });

    if (!response.data?.reference || !response.data.access_code) {
        throw new BadRequestError("Failed to Process transaction");
    }
    req.body.clientSecret = response.data.reference;

    // const o = await Order.findById(order._id);
    order.clientSecret = response.data.reference;
    await order.save();

    await Cart.findByIdAndDelete(cart._id);

    res.status(201)
        .cookie("cart", "", {
            expires: new Date(Date.now() + 1000),
        })
        .json({
            msg: "Order created",
            paymentUrl: response.data.authorization_url,
            order,
        });
};

const getOrders = async (req, res) => {
    if (!req.customer) {
        throw new BadRequestError("Please login to view your orders");
    }
    const { id: customerId } = req.customer;
    const customer = await Customer.findById(customerId);

    const queryObject = { customer };

    // get orders for admin
    let result = Order.find(queryObject).select(
        "-customer -createdAt -updatedAt -__v",
    );

    // #################################################################
    // Set up Pagination

    // set limit and page(from query) variable
    const limit = Number(req.query.limit) || 30;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // edit orders based on limit and page
    result = result.skip(skip).limit(limit);

    // #################################################################
    // Send final orders

    const orders = await result;

    res.json({ nbHits: orders.length, orders });
};

const getOrder = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Order Id is not valid");
    }

    const order = await Order.findById(id).select(
        "-customer -createdAt -updatedAt -__v -clientSecret",
    );

    if (!order) {
        throw new BadRequestError("Order doesn't exist");
    }

    res.json({ order });
};

const getOrderByClientSecrete = async (req, res) => {
    const { clientSecret } = req.body;

    const order = await Order.findOne({
        $or: [{ _id: clientSecret }, { clientSecret }],
    }).select("-customer -createdAt -updatedAt -__v -clientSecret");

    console.log(order);

    if (!order) {
        throw new BadRequestError("Order doesn't exist");
    }

    res.json({ order });
};

const getOrdersAdmin = async (req, res) => {
    const queryObject = {};

    if (req.query.status) {
        queryObject.status = req.query.status;
    }

    if (req.query.paymentStatus) {
        queryObject.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.orderId) {
        queryObject._id = req.query.orderId;
    }

    // get orders for admin
    let result = Order.find(queryObject)
        .select("-createdAt -updatedAt -__v")
        .sort({ createdAt: -1 })
        .populate("products.product")
        .populate("shipping.shipping");

    // #################################################################
    // Set up Pagination

    // set limit and page(from query) variable
    const limit = Number(req.query.limit) || 30;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // edit orders based on limit and page
    result = result.skip(skip).limit(limit);

    // #################################################################
    // Send final orders

    const orders = await result;

    res.json({ nbHits: orders.length, orders });
};

const updateOrder = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Order Id is not valid");
    }

    const { status } = req.body;
    if (!status) {
        throw new BadRequestError("Status is required");
    }

    const order = await Order.findById(id);

    if (!order) {
        throw new BadRequestError("Order doesn't exist");
    }

    if (order.status === "delivered") {
        throw new BadRequestError("Order is already delivered");
    }

    if (order.status === "cancelled") {
        throw new BadRequestError("Order is already cancelled");
    }

    const previousStatus = order.status;
    order.status = status;

    await order.save();

    // Send status update email if status has changed
    if (previousStatus !== status) {
        try {
            await sendOrderStatusUpdateEmail(order);
        } catch (emailError) {
            console.error("Failed to send status update email:", emailError);
            // Don't throw error - order update should still succeed even if email fails
        }
    }

    res.status(200).json({ msg: "Order updated", order });
};

const deleteOrder = async (req, res) => {
    // get order id from request params
    const { id } = req.params;

    // check if id is valid
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Invalid order id");
    }

    // find order by id and delete
    const order = await Order.findById(id);

    // if order not found throw error
    if (!order) {
        throw new NotFoundError("order not found");
    }

    await Order.findByIdAndDelete(id);
    // send success message
    res.json({ message: "order deleted successfully" });
};

module.exports = {
    createOrderStripe,
    getOrders,
    getOrdersAdmin,
    getOrder,
    getOrderByClientSecrete,
    updateOrder,
    deleteOrder,
};
