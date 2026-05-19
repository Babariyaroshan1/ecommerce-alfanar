import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            // Navigation
            "Home": "Home",
            "Products": "Products",
            "New Arrivals": "New Arrivals",
            "All Products": "All Products",
            "Cart": "Cart",
            "Login": "Login",
            "Register": "Register",
            "Profile": "Profile",
            "Orders": "Orders",
            "Logout": "Logout",

            // Auth
            "Create Account": "Create Account",
            "Full Name": "Full Name",
            "Email": "Email",
            "Password": "Password",
            "Phone Number": "Phone Number",
            "Address": "Address",
            "Creating Account...": "Creating Account...",
            "Don't have an account?": "Don't have an account?",
            "Already have an account?": "Already have an account?",
            "Forgot Password?": "Forgot Password?",
            "Forgot Password": "Forgot Password",
            "Enter your email": "Enter your email",
            "Send Reset Link": "Send Reset Link",
            "Sending...": "Sending...",
            "Reset Password": "Reset Password",
            "New Password": "New Password",
            "Confirm Password": "Confirm Password",
            "Enter new password": "Enter new password",
            "Confirm new password": "Confirm new password",
            "Resetting...": "Resetting...",
            "Back to Login": "Back to Login",

            // Common
            "English": "English",
            "Arabic": "العربية",
            "KWD": "KWD",

            // Home Page
            "Welcome to AL-FANAR": "Welcome to AL-FANAR",
            "Your trusted shopping destination": "Your trusted shopping destination",
            "Best selling": "Best selling",

            // Products
            "Add to Cart": "Add to Cart",
            "Buy Now": "Buy Now",
            "Out of Stock": "Out of Stock",

            // Cart
            "Your Cart": "Your Cart",
            "Total": "Total",
            "Checkout": "Checkout",
            "Remove": "Remove",

            // Checkout
            "Shipping Address": "Shipping Address",
            "Payment Method": "Payment Method",
            "Place Order": "Place Order",

            // Order Tracking
            "Order Status": "Order Status",
            "Order Details": "Order Details",
            "Track Order": "Track Order"
        }
    },
    ar: {
        translation: {
            // Navigation
            "Home": "الرئيسية",
            "Products": "المنتجات",
            "New Arrivals": "المنتجات الجديدة",
            "All Products": "جميع المنتجات",
            "Cart": "السلة",
            "Login": "تسجيل الدخول",
            "Register": "إنشاء حساب",
            "Profile": "الملف الشخصي",
            "Orders": "الطلبات",
            "Logout": "تسجيل الخروج",

            // Auth
            "Create Account": "إنشاء حساب",
            "Full Name": "الاسم الكامل",
            "Email": "البريد الإلكتروني",
            "Password": "كلمة المرور",
            "Phone Number": "رقم الهاتف",
            "Address": "العنوان",
            "Creating Account...": "جاري إنشاء الحساب...",
            "Don't have an account?": "ليس لديك حساب؟",
            "Already have an account?": "لديك حساب بالفعل؟",
            "Forgot Password?": "نسيت كلمة المرور؟",
            "Forgot Password": "نسيت كلمة المرور",
            "Enter your email": "أدخل بريدك الإلكتروني",
            "Send Reset Link": "إرسال رابط إعادة التعيين",
            "Sending...": "جاري الإرسال...",
            "Reset Password": "إعادة تعيين كلمة المرور",
            "New Password": "كلمة المرور الجديدة",
            "Confirm Password": "تأكيد كلمة المرور",
            "Enter new password": "أدخل كلمة المرور الجديدة",
            "Confirm new password": "أكد كلمة المرور الجديدة",
            "Resetting...": "جاري إعادة التعيين...",
            "Back to Login": "العودة إلى تسجيل الدخول",

            // Common
            "English": "English",
            "Arabic": "العربية",
            "KWD": "د.ك",

            // Home Page
            "Welcome to AL-FANAR": "مرحباً بك في الفنار",
            "Your trusted shopping destination": "وجهتك الموثوقة للتسوق",
            "Best selling": "الأكثر مبيعاً",

            // Products
            "Add to Cart": "أضف إلى السلة",
            "Buy Now": "اشترِ الآن",
            "Out of Stock": "غير متوفر",

            // Cart
            "Your Cart": "سلتك",
            "Total": "المجموع",
            "Checkout": "الدفع",
            "Remove": "إزالة",

            // Checkout
            "Shipping Address": "عنوان الشحن",
            "Payment Method": "طريقة الدفع",
            "Place Order": "تأكيد الطلب",

            // Order Tracking
            "Order Status": "حالة الطلب",
            "Order Details": "تفاصيل الطلب",
            "Track Order": "تتبع الطلب"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // default language
        fallbackLng: 'en',
        debug: false,

        interpolation: {
            escapeValue: false,
        },

        // detection: {
        //     order: ['localStorage', 'navigator'],
        //     caches: ['localStorage']
        // }
    });

export default i18n;    