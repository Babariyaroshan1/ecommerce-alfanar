import './ProductDetailSkeleton.css';

export default function ProductDetailSkeleton() {
  return (
    <div className="product-detail-skeleton">
      <div className="skeleton-container">
        {/* Image Gallery */}
        <div className="skeleton-gallery">
          <div className="skeleton-main-image"></div>
          <div className="skeleton-thumbnails">
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-thumbnail"></div>
          </div>
        </div>

        {/* Product Info */}
        <div className="skeleton-info">
          {/* Title & Rating */}
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-rating"></div>
          
          {/* Price */}
          <div className="skeleton-price-group">
            <div className="skeleton-line skeleton-price"></div>
            <div className="skeleton-line skeleton-price"></div>
          </div>

          {/* Description */}
          <div className="skeleton-lines">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-short"></div>
          </div>

          {/* Colors & Sizes */}
          <div className="skeleton-selection">
            <div className="skeleton-label"></div>
            <div className="skeleton-options">
              <div className="skeleton-option"></div>
              <div className="skeleton-option"></div>
              <div className="skeleton-option"></div>
            </div>
          </div>

          <div className="skeleton-selection">
            <div className="skeleton-label"></div>
            <div className="skeleton-options">
              <div className="skeleton-option"></div>
              <div className="skeleton-option"></div>
              <div className="skeleton-option"></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="skeleton-buttons">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
