// Import required modules
require("dotenv").config();
require("express-async-errors");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// const multer = require("multer");
// const upload = multer({ dest: "uploads/" });

// Import Express
const express = require("express");
const app = express();

// Import Database connection function
const connectToMongodb = require("./mongoDb");

// ######################################################################################################
// ######################################################################################################
// Middleware

// CORS MIDDLEWARE
// Set up cors options and middleware
// const corsOptions = {
//     origin: [process.env.CLIENT_ORIGIN_1, process.env.CLIENT_ORIGIN_2],
//     credentials: true,
// };
const corsOptions = {
    origin: [
        process.env.CLIENT_ORIGIN_1,
        process.env.CLIENT_ORIGIN_2,
        process.env.CLIENT_ORIGIN_3,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "ngrok-skip-browser-warning", // Important for ngrok
    ],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight for all routes

app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    res.set("Surrogate-Control", "no-store");
    res.set("CDN-Cache-Control", "no-store"); // Vercel-specific override
    next();
});

// COOKIE PARSER MIDDLEWARE
app.use(cookieParser(process.env.COOKIE_SECRET));

// HANDLE JSON REQUESTS MIDDLEWARE
// app.use(express.raw({ type: "*/*" }));
app.use((req, res, next) => {
    if (req.originalUrl === "/webhook/stripe") {
        express.raw({ type: "application/json" })(req, res, next);
    } else {
        express.json()(req, res, next);
    }
});
// app.use(express.json());

// MORGAN SETUP
app.use(morgan("dev"));

// ######################################################################################################
// ######################################################################################################
// Routes

// HOME ROUTE
app.get(
    "/",
    // upload.array("photos"),
    (req, res) => {
        console.log({ files: req.files, body: req.body });
        res.json({ msg: "Welcome To Asis" });
    },
);

// AUTHENTICATION ROUTES
const authenticationRoutes = require("./routes/authentications");
app.use("/api/auth", authenticationRoutes);

// CUSTOMER ROUTES
const customerRoutes = require("./routes/customers");
app.use("/api/customers", customerRoutes);

// HOME ROUTES
const homeRoutes = require("./routes/home");
app.use("/api/home", homeRoutes);

// PRODUCT ROUTES
const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

// PRODUCT ROUTES
const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// CART ROUTES
const cartRoutes = require("./routes/carts");
app.use("/api/carts", cartRoutes);

// SHIPPING ROUTES
const shippingRoutes = require("./routes/shippings");
app.use("/api/shippings", shippingRoutes);

// ORDER ROUTES
const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

// IS LOGGED IN ROUTES
const isLoggedInRoutes = require("./routes/loggedIn");
app.use("/api/isLoggedIn", isLoggedInRoutes);

// WEBHOOK ROUTES
const webhookRoutes = require("./routes/webhooks");
app.use("/webhook", webhookRoutes);

// ######################################################################################################
// ######################################################################################################
// Handler Middleware

// ROUTE NOT FOUND HANDLER MIDDLEWARE
const routeNotFound = require("./middleware/routeNotFoundMiddleware");
app.use(routeNotFound);

// ERROR HANDLER MIDDLEWARE
const errorHandler = require("./middleware/errorHandlerMiddleware");
app.use(errorHandler);

// ######################################################################################################
// ######################################################################################################
// CREATE SERVER
const port = process.env.PORT || 5000;
const serverApp = async () => {
    try {
        await connectToMongodb();
        app.listen(port, () => console.log(`Server listening on port ${port}`));
        // await webSocketHandler(wss)
    } catch (error) {
        console.log(error);
    }
};
serverApp();
