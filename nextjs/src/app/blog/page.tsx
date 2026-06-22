import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Blog - Alfanar Store | Fashion Trends, Sustainable Clothing & Style Tips',
  description:
    'Discover styling advice, fashion trends, and clothing care tips from Alfanar Store. Read our blog to stay updated on the latest in modest clothing and premium fashion.',
  openGraph: {
    title: 'Blog - Alfanar Store | Fashion Trends, Sustainable Clothing & Style Tips',
    description:
      'Discover styling advice, fashion trends, and clothing care tips from Alfanar Store. Read our blog to stay updated on the latest in modest clothing and premium fashion.',
    url: 'https://alfanar.store/blog',
    siteName: 'Alfanar Store',
    type: 'website',
  },
};

const BlogPage = () => {
  return (
    <main className={styles.blogPage}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <p className={styles.badge}>Alfanar Store Blog</p>
          <h1>Fashion stories, styling tips, and clothing care for modern modest wear</h1>
          <p>
            Welcome to the Alfanar Store blog. Here you will find expert advice on choosing the
            perfect outfit, caring for your garments, and staying stylish with our latest clothing
            collections.
          </p>
          <div className={styles.heroLinks}>
            <Link href="/products" className={styles.heroLink}>Shop new arrivals</Link>
            <Link href="/kids" className={styles.heroLinkSecondary}>Explore kids fashion</Link>
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <article className={styles.blogArticle}>
          <h2>Why Alfanar Store is the top choice for modest clothing</h2>
          <p>
            Alfanar Store is built for customers who want stylish, comfortable, and culturally aware
            fashion. Our collections are carefully chosen to offer quality fabrics, thoughtful details,
            and easy-care clothing for everyday wear.
          </p>
          <ul>
            <li>Premium fabrics designed for long-lasting comfort</li>
            <li>Modern silhouettes with modest styling</li>
            <li>Seasonal pieces for all occasions</li>
            <li>Trusted customer service and fast delivery</li>
          </ul>
        </article>

        <article className={styles.blogArticle}>
          <h2>Styling tips for every occasion</h2>
          <p>
            Whether you are dressing for work, a family gathering, or a weekend outing, the right
            outfit can make all the difference. Our blog helps you mix and match pieces to create
            elegant looks with ease.
          </p>
          <div className={styles.tipGrid}>
            <div className={styles.tipCard}>
              <h3>1. Layer with confidence</h3>
              <p>
                Create more refined outfits by pairing long tops with lightweight outer layers.
                Choose neutral colors for a polished finish.
              </p>
            </div>
            <div className={styles.tipCard}>
              <h3>2. Choose fabrics wisely</h3>
              <p>
                Natural fabrics like cotton and linen keep you comfortable throughout the day while
                maintaining a premium appearance.
              </p>
            </div>
            <div className={styles.tipCard}>
              <h3>3. Accessorize simply</h3>
              <p>
                Add subtle details with scarves, belts, and jewelry to elevate a minimal outfit.
              </p>
            </div>
          </div>
        </article>

        <article className={styles.blogArticle}>
          <h2>Clothing care: keep your wardrobe looking new</h2>
          <p>
            Taking care of your garments ensures they last longer and retain their original shape.
            Follow these simple tips for the best results.
          </p>
          <ol>
            <li>Wash similar colors together using mild detergent.</li>
            <li>Avoid high heat when drying delicate pieces.</li>
            <li>Store garments folded or hung with enough space.</li>
          </ol>
        </article>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Ready to refresh your wardrobe?</h2>
          <p>
            Explore our latest clothing collections at Alfanar Store and discover styles created for
            comfort, modesty, and everyday elegance.
          </p>
          <Link href="/products" className={styles.ctaButton}>Browse Collections</Link>
        </div>
      </section>
    </main>
  );
};

export default BlogPage;
