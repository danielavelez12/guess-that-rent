import React from 'react';
import './LocationModal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  address
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="location-modal-backdrop" onClick={handleBackdropClick}>
      <div className="location-modal">
        <div className="modal-header">
          <h3 className="modal-title">LOCATION DATA</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          <div className="address-info">
            <p className="address-text">{address}</p>
          </div>
          
          <div className="map-container">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                address
              )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${address}`}
              className="map-iframe"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;