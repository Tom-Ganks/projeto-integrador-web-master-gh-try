import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';


function GraduationCapIcon({ size = 24 }) {
  return <i className="bi bi-mortarboard" style={{ fontSize: size }} data-testid="graduation-cap-icon"></i>;
}

export default GraduationCapIcon;