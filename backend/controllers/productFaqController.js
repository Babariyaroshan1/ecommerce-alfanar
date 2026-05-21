import ProductFAQ from '../models/ProductFAQ.js';

const productFaqController = {
  // Get FAQs for a specific product (public)
  getProductFAQs: async (req, res) => {
    try {
      const { productId } = req.params;
      const faqs = await ProductFAQ.find({ productId, isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product FAQs', error: error.message });
    }
  },

  // Get all FAQs for a product (admin)
  getAllProductFAQs: async (req, res) => {
    try {
      const { productId } = req.params;
      const faqs = await ProductFAQ.find({ productId })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product FAQs', error: error.message });
    }
  },

  // Create FAQ for product
  createProductFAQ: async (req, res) => {
    try {
      const { productId } = req.params;
      const { question, answer, sortOrder } = req.body;

      if (!question || !answer) {
        return res.status(400).json({ message: 'Question and answer are required' });
      }

      const faq = new ProductFAQ({
        productId,
        question,
        answer,
        sortOrder: sortOrder || 0
      });

      await faq.save();
      res.status(201).json(faq);
    } catch (error) {
      res.status(500).json({ message: 'Error creating FAQ', error: error.message });
    }
  },

  // Update FAQ
  updateProductFAQ: async (req, res) => {
    try {
      const { id } = req.params;
      const { question, answer, sortOrder } = req.body;

      const faq = await ProductFAQ.findByIdAndUpdate(
        id,
        { question, answer, sortOrder },
        { new: true }
      );

      if (!faq) {
        return res.status(404).json({ message: 'FAQ not found' });
      }

      res.json(faq);
    } catch (error) {
      res.status(500).json({ message: 'Error updating FAQ', error: error.message });
    }
  },

  // Delete FAQ
  deleteProductFAQ: async (req, res) => {
    try {
      const { id } = req.params;
      await ProductFAQ.findByIdAndDelete(id);
      res.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
    }
  },

  // Toggle FAQ active status
  toggleProductFAQStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const faq = await ProductFAQ.findById(id);

      if (!faq) {
        return res.status(404).json({ message: 'FAQ not found' });
      }

      faq.isActive = !faq.isActive;
      await faq.save();
      res.json(faq);
    } catch (error) {
      res.status(500).json({ message: 'Error updating FAQ', error: error.message });
    }
  }
};

export default productFaqController;
