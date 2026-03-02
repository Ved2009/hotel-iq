import React from 'react';
import { createRoot } from 'react-dom/client';
import HotelIQ from '../../hotel-iq-dashboard.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<HotelIQ />);
