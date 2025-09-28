import React from 'react';
import './PropertyDetailsModal.css';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: string;
  bedrooms: number;
  bathrooms: number;
  propertyName: string;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  isOpen,
  onClose,
  details,
  bedrooms,
  bathrooms,
  propertyName
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="property-details-modal-backdrop" onClick={handleBackdropClick}>
      <div className="property-details-modal">
        <div className="modal-header">
          <h3 className="modal-title">PROPERTY INTEL</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          <div className="property-overview">
            <h4>{propertyName}</h4>
            <div className="property-specs">
              <div className="spec-item">
                <span className="spec-label">BEDROOMS:</span>
                <span className="spec-value">{bedrooms}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">BATHROOMS:</span>
                <span className="spec-value">{bathrooms}</span>
              </div>
            </div>
          </div>
          
          {details && (
            <div className="property-details">
              <h5>Details</h5>
              <p className="details-text">{details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;