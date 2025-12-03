const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const image = req.file ? req.file.filename : null;

    const product = await Product.create({ name, description, price, image, stock, category });
    res.status(201).json({ message: 'Produk berhasil ditambahkan.', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, active } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (active === 'true') filters.isActive = true;

    const products = await Product.findAll(filters);
    res.json({ products });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getActiveProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filters = { isActive: true };
    
    if (category) filters.category = category;
    if (search) filters.search = search;

    const products = await Product.findAll(filters);
    res.json({ products });
  } catch (error) {
    console.error('Get active products error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }
    res.json({ product });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, is_active } = req.body;
    
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    let image = null;
    if (req.file) {
      image = req.file.filename;
      if (existingProduct.image) {
        const oldImagePath = path.join(__dirname, '../uploads/products', existingProduct.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const product = await Product.update(id, { 
      name, 
      description, 
      price, 
      image, 
      stock, 
      category,
      is_active: is_active === 'true' || is_active === true
    });
    
    res.json({ message: 'Produk berhasil diperbarui.', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    if (product.image) {
      const imagePath = path.join(__dirname, '../uploads/products', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.delete(id);
    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
