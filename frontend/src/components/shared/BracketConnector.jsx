// frontend/src/components/shared/BracketConnector.jsx

import React from 'react';

const BracketConnector = ({ startX, startY, endX, endY }) => {
    // The control point (midpoint) defines the L-shape of the connector line.
    // The line should be horizontal until it reaches the x-coordinate of the end point, 
    // or halfway between the start and end. We'll use halfway for a standard aesthetic.
    const midX = (startX + endX) / 2;

    // Use a Polyline to draw the line segment:
    // 1. Start point
    // 2. Midpoint (Control point 1 - horizontal segment)
    // 3. End point (Control point 2 - vertical segment, if applicable)
    // 4. Final end point

    const points = `${startX},${startY} ${midX},${startY} ${midX},${endY} ${endX},${endY}`;

    // Note: The parent SVG must be styled to cover the entire bracket area.
    return (
        <polyline
            points={points}
            fill="none"
            stroke="#39ff14" // Your green highlight color
            strokeWidth="3"
            strokeLinejoin="round"
        />
    );
};

export default BracketConnector;