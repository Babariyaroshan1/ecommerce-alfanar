import './ContactFormSkeleton.css';

export default function ContactFormSkeleton() {
  return (
    <div className="contact-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>

      <div className="skeleton-form">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-form-group">
            <div className="skeleton-label"></div>
            <div className="skeleton-input"></div>
          </div>
        ))}

        <div className="skeleton-form-group">
          <div className="skeleton-label"></div>
          <div className="skeleton-textarea"></div>
        </div>

        <div className="skeleton-button"></div>
      </div>
    </div>
  );
}
