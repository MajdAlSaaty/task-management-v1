import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'جاري التحميل...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;