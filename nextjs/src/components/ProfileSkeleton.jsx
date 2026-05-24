import './ProfileSkeleton.css';

export default function ProfileSkeleton() {
  return (
    <div className="profile-skeleton">
      <div className="skeleton-profile-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-profile-info">
          <div className="skeleton-line skeleton-name"></div>
          <div className="skeleton-line skeleton-email"></div>
        </div>
      </div>

      <div className="skeleton-tabs">
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
      </div>

      <div className="skeleton-form">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-form-group">
            <div className="skeleton-label"></div>
            <div className="skeleton-input"></div>
          </div>
        ))}
        <div className="skeleton-button"></div>
      </div>
    </div>
  );
}
