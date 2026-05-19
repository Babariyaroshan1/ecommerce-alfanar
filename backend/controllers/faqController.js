import FAQ from '../models/FAQ.js';

// Get all active FAQs for public view
const getFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: -1 })
            .select('question answer sortOrder');

        res.json(faqs);
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ message: 'Failed to fetch FAQs', error: error.message });
    }
};

// Get all FAQs for admin
const getAllFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.find({})
            .sort({ sortOrder: 1, createdAt: -1 });

        res.json(faqs);
    } catch (error) {
        console.error('Error fetching all FAQs:', error);
        res.status(500).json({ message: 'Failed to fetch FAQs', error: error.message });
    }
};

// Create new FAQ
const createFAQ = async (req, res) => {
    try {
        const { question, answer, sortOrder } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ message: 'Question and answer are required' });
        }

        const faq = new FAQ({
            question: question.trim(),
            answer: answer.trim(),
            sortOrder: sortOrder || 0
        });

        await faq.save();
        res.status(201).json(faq);
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({ message: 'Failed to create FAQ', error: error.message });
    }
};

// Update FAQ
const updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, sortOrder, isActive } = req.body;

        const updateData = {};
        if (question !== undefined) updateData.question = question.trim();
        if (answer !== undefined) updateData.answer = answer.trim();
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (isActive !== undefined) updateData.isActive = isActive;

        const faq = await FAQ.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        res.json(faq);
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({ message: 'Failed to update FAQ', error: error.message });
    }
};

// Delete FAQ
const deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findByIdAndDelete(id);

        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        res.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({ message: 'Failed to delete FAQ', error: error.message });
    }
};

// Toggle FAQ status (active/inactive)
const toggleFAQStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findById(id);

        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        faq.isActive = !faq.isActive;
        await faq.save();

        res.json(faq);
    } catch (error) {
        console.error('Error toggling FAQ status:', error);
        res.status(500).json({ message: 'Failed to toggle FAQ status', error: error.message });
    }
};

export default {
    getFAQs,
    getAllFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    toggleFAQStatus
};