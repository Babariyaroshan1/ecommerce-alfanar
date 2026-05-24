import './OrderDetailSkeleton.css';

export default function OrderDetailSkeleton() {
  return (
    <div className="order-detail-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-status-badge"></div>
      </div>

      <div className="skeleton-section">
        <div className="skeleton-section-title"></div>
        <div className="skeleton-info-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-info-item">
              <div className="skeleton-label"></div>
              <div className="skeleton-value"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="skeleton-section">
        <div className="skeleton-section-title"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-order-item">
            <div className="skeleton-item-image"></div>
            <div className="skeleton-item-details">
              <div className="skeleton-line"></div>
              <div className="skeleton-line skeleton-short"></div>
            </div>
            <div className="skeleton-item-price"></div>
          </div>
        ))}
      </div>

      <div className="skeleton-section">
        <div className="skeleton-section-title"></div>
        <div className="skeleton-price-breakdown">
          <div className="skeleton-price-row">
            <div className="skeleton-label"></div>
            <div className="skeleton-value"></div>
          </div>
          <div className="skeleton-price-row">
            <div className="skeleton-label"></div>
            <div className="skeleton-value"></div>
          </div>
          <div className="skeleton-price-row skeleton-total">
            <div className="skeleton-label"></div>
            <div className="skeleton-value"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
