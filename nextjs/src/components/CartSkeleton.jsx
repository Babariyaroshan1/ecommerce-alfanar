import './CartSkeleton.css';

export default function CartSkeleton() {
  return (
    <div className="cart-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
      </div>

      <div className="skeleton-content">
        <div className="skeleton-items">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-cart-item">
              <div className="skeleton-item-image"></div>
              <div className="skeleton-item-info">
                <div className="skeleton-line"></div>
                <div className="skeleton-line skeleton-short"></div>
              </div>
              <div className="skeleton-quantity"></div>
              <div className="skeleton-price"></div>
            </div>
          ))}
        </div>

        <div className="skeleton-summary">
          <div className="skeleton-summary-title"></div>
          <div className="skeleton-summary-rows">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-summary-row">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
            ))}
          </div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
}
