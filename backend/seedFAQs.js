import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api'; // Set in backend/.env for development and production
const ADMIN_TOKEN = 'your-admin-token-here'; // You'll need to get this from the admin login

const defaultFAQs = [
    {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for all our products. Items must be in their original condition with tags attached. Return shipping costs are the responsibility of the customer unless the item is defective.',
        sortOrder: 1
    },
    {
        question: 'How long does shipping take?',
        answer: 'Standard shipping typically takes 3-7 business days within Kuwait. Express shipping is available for 1-2 business days. International shipping may take 7-14 business days depending on the destination.',
        sortOrder: 2
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and cash on delivery (COD) for local orders. All payments are processed securely.',
        sortOrder: 3
    }
];

const seedFAQs = async () => {
    try {
        console.log('🌱 Seeding default FAQs...');

        for (const faq of defaultFAQs) {
            try {
                const response = await axios.post(`${API_URL}/faqs`, faq, {
                    headers: {
                        'Authorization': `Bearer ${ADMIN_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`✅ Added FAQ: "${faq.question}"`);
            } catch (error) {
                console.log(`❌ Failed to add FAQ: "${faq.question}" - ${error.response?.data?.message || error.message}`);
            }
        }

        console.log('🎉 FAQ seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding FAQs:', error.message);
    }
};

seedFAQs();