import './OrderListSkeleton.css';

export default function OrderListSkeleton() {
  return (
    <div className="order-list-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
      </div>

      <div className="skeleton-filters">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-filter-button"></div>
        ))}
      </div>

      <div className="skeleton-list">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-item-header">
              <div className="skeleton-label"></div>
              <div className="skeleton-status-badge"></div>
            </div>
            <div className="skeleton-item-details">
              <div className="skeleton-detail-row">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
              <div className="skeleton-detail-row">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
