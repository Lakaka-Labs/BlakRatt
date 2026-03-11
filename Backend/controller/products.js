const fileUpload = require("express-fileupload");
require("dotenv").config();
const Product = require("../models/products");
const SpecialCategory = require("../models/specialCategory");
const SuperSpecialCategory = require("../models/superSpecialCategory");
const { uploadToS3, deleteFromS3 } = require("../s3/s3Storage");
const { BadRequestError, NotFoundError } = require("../errors");
const mongoose = require("mongoose");

const createProduct = async (req, res) => {
    // return res.json({a:req.body,b:req.files});

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded." });
    }

    const nameExist = await Product.findOne({ name: req.body.name });
    if (nameExist) {
        throw new BadRequestError("Product name already exist");
    }

    // Push Images to S3 Storage
    const imagePromises = req.files.map(async (image) => {
        // Get the file extension (assuming image files)
        const fileExtension = image.originalname.split(".").pop();
        const key = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExtension}`;

        await uploadToS3(image.buffer, key, image.mimetype);
        return key;
    });
    const images = await Promise.all(imagePromises);
    req.body.images = images;

    const product = await Product.create(req.body);

    res.status(201).json({
        message: "Product created successfully",
        product,
    });
};

const getProducts = async (req, res) => {
    // get name query from request
    let { name, category, specialCategories, gender, collaborations, sort } =
        req.query;

    // create a query object to filter result and for search attribute add admin to it
    const queryObject = {};

    // if name is provided in request query add to query object
    if (name) {
        queryObject.name = { $regex: name, $options: "i" };
    }
    // If category is provided in request query add to query object
    if (category) {
        queryObject.category = category;
    }
    // If specialCategories is provided in request query add to query object
    if (specialCategories) {
        queryObject.specialCategories = specialCategories;
    }
    // If gender is provided in request query add to query object
    if (gender) {
        queryObject.gender = gender;
    }
    // If collaborations is provided in request query add to query object
    if (collaborations) {
        queryObject.collaborations = collaborations;
    }

    // get products for admin
    let result = Product.find(queryObject).select(
        "-admin -createdAt -updatedAt -__v",
    );

    if (sort) {
        const sortList = sort.split(",").join(" ");
        result = result.sort(sortList);
    } else {
        result = result.sort("-createdAt");
    }

    // #################################################################
    // Set up Pagination

    // set limit and page(from query) variable
    const limit = Number(req.query.limit) || 30;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // edit products based on limit and page
    result = result.skip(skip).limit(limit);

    // #################################################################
    // Send final products

    const products = await result;

    res.json({ nbHits: products.length, products });
};

const getRandomProducts = async (req, res) => {
    const randomProducts = await Product.aggregate([{ $sample: { size: 10 } }]);
    res.json(randomProducts);
};

const getProductById = async (req, res) => {
    // get product id from request params
    const { id } = req.params;

    // check if id is valid
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Invalid product id");
    }

    // get product by id
    const product = await Product.findById(id)
        .populate("specialCategories")
        .select("-admin -createdAt -updatedAt -__v");

    // if product not found throw error
    if (!product) {
        throw new NotFoundError("Product not found");
    }

    // send product
    res.set("Cache-Control", "private, no-store");
    res.json(product);
};

const deleteProduct = async (req, res) => {
    // get product id from request params
    const { id } = req.params;

    // check if id is valid
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Invalid product id");
    }

    // find product by id and delete
    const product = await Product.findById(id);

    // if product not found throw error
    if (!product) {
        throw new NotFoundError("Product not found");
    }

    // Delete images from S3 storage
    const imagePromises = product.images.map(async (imageName) => {
        await deleteFromS3(imageName);
    });

    await Promise.all(imagePromises);

    await Product.findByIdAndDelete(id);
    // send success message
    res.json({ message: "Product deleted successfully" });
};

const deleteProductImage = async (req, res) => {
    // get product id and image id from request params
    const { productId } = req.params;

    // get image name from request body
    const { imageNames } = req.body;

    // check if product id is valid
    if (!mongoose.isValidObjectId(productId)) {
        throw new BadRequestError("Invalid product id");
    }

    // get product by id
    const product = await Product.findById(productId);

    // if product not found throw error
    if (!product) {
        throw new NotFoundError("Product not found");
    }

    const imagePromises = imageNames.map(async (imageName) => {
        // check if image exists in product images
        if (!product.images.includes(imageName)) {
            throw new NotFoundError("Image not found in product images");
        }
        try {
            // Delete image from S3 storage
            await deleteFromS3(imageName);
            const images = product.images.filter(
                (image) => image !== imageName,
            );
            product.images = images;
        } catch (error) {
            console.log(error);
            throw new BadRequestError("Error deleting image");
        }
    });

    await Promise.all(imagePromises);
    console.log(product.images);
    // imagesToDelete.forEach((imageName) => {
    //     const images = product.images.filter((image) => image !== imageName);
    //     product.images = images;
    // });
    // save product
    await product.save();

    // send success message
    res.json({ message: "Image deleted successfully" });
};

const addProductImage = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded." });
    }
    // get product id and image id from request params
    const { productId, imageName } = req.params;

    // check if product id is valid
    if (!mongoose.isValidObjectId(productId)) {
        throw new BadRequestError("Invalid product id");
    }

    // get product by id
    const product = await Product.findById(productId);

    // if product not found throw error
    if (!product) {
        throw new NotFoundError("Product not found");
    }

    // Push Images to S3 Storage
    const imagePromises = req.files.map(async (image) => {
        // Get the file extension (assuming image files)
        const fileExtension = image.originalname.split(".").pop();
        const key = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExtension}`;

        await uploadToS3(image.buffer, key, image.mimetype);
        return key;
    });
    const images = await Promise.all(imagePromises);
    product.images = [...product.images, ...images];

    // save product
    await product.save();

    // send success message
    res.json({ message: "Image added successfully", images });
};

const updateProduct = async (req, res) => {
    // get product id from request params
    const { id } = req.params;

    if (req.body.images) {
        throw new BadRequestError("Images cannot be updated from this route");
    }

    // check if id is valid
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Invalid product id");
    }

    // find product by id and delete
    const product = await Product.findById(id);

    // if product not found throw error
    if (!product) {
        throw new NotFoundError("Product not found");
    }

    if (req.body.name) {
        const nameExist = await Product.findOne({
            name: req.body.name,
        });

        if (nameExist?._id?.toString() !== id && nameExist) {
            throw new BadRequestError("Name already exists");
        }
    }

    const newProductInfo = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        message: "Product updated successfully",
        product: newProductInfo,
    });
};

const createSpecialCategory = async (req, res) => {
    if (!req.body.name) {
        throw new BadRequestError("Name is required");
    }
    const nameExist = await SpecialCategory.findOne({
        name: req.body.name,
    });

    if (nameExist) {
        throw new BadRequestError("Name already exists");
    }

    const specialCategory = await SpecialCategory.create(req.body);

    res.status(201).json({
        message: "Special category created successfully",
        specialCategory,
    });
};

const createSuperSpecialCategory = async (req, res) => {
    if (!req.body.name) {
        throw new BadRequestError("Name is required");
    }
    const nameExist = await SuperSpecialCategory.findOne({
        name: req.body.name,
    });

    if (nameExist) {
        throw new BadRequestError("Name already exists");
    }

    const superSpecialCategory = await SuperSpecialCategory.create(req.body);

    res.status(201).json({
        message: "Special category created successfully",
        superSpecialCategory,
    });
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    addProductImage,
    createSpecialCategory,
    createSuperSpecialCategory,
    getRandomProducts,
};
