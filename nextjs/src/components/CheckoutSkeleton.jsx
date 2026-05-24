import './CheckoutSkeleton.css';

export default function CheckoutSkeleton() {
  return (
    <div className="checkout-skeleton">
      <div className="skeleton-steps">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-step">
            <div className="skeleton-step-number"></div>
            <div className="skeleton-step-label"></div>
          </div>
        ))}
      </div>

      <div className="skeleton-content">
        <div className="skeleton-form-section">
          <div className="skeleton-section-title"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-form-group">
              <div className="skeleton-label"></div>
              <div className="skeleton-input"></div>
            </div>
          ))}
        </div>

        <div className="skeleton-form-section">
          <div className="skeleton-section-title"></div>
          {[1, 2].map(i => (
            <div key={i} className="skeleton-form-group">
              <div className="skeleton-label"></div>
              <div className="skeleton-input"></div>
            </div>
          ))}
        </div>

        <div className="skeleton-order-summary">
          <div className="skeleton-section-title"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-summary-row">
              <div className="skeleton-label"></div>
              <div className="skeleton-value"></div>
            </div>
          ))}
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
}
