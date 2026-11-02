import './CheckoutProgress.css';

export default function CheckoutProgress({ active = 'bag' }) {
  const steps = [
    { id: 'bag', label: 'MY BAG' },
    { id: 'address', label: 'ADDRESS' },
    { id: 'payment', label: 'PAYMENT' },
  ];

  return (
    <nav className="checkout-progress" aria-label="Checkout progress">
      {steps.map((step, index) => (
        <div className="checkout-progress-step" key={step.id}>
          <span className={active === step.id ? 'is-active' : ''} aria-current={active === step.id ? 'step' : undefined}>
            {step.label}
          </span>
          {index < steps.length - 1 && <i aria-hidden="true" />}
        </div>
      ))}
    </nav>
  );
}
