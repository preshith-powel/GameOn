import React from 'react';

const ProgressBar = ({ label, value, max, color }) => {
    const percentage = max === 0 ? 0 : (value / max) * 100;

    const containerStyles = {
        width: '100%',
        backgroundColor: '#333',
        borderRadius: '5px',
        height: '10px',
        overflow: 'hidden',
        marginBottom: '5px',
    };

    const fillStyles = {
        height: '100%',
        width: `${percentage}%`,
        backgroundColor: color || '#00ffaa', 
        borderRadius: '5px',
        transition: 'width 0.5s ease-in-out',
    };

    return (
        <div style={{width: '60%', margin: '0 auto', marginBottom: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85em', color: '#e0e0e0'}}>
                <span>{label}</span>
                <span>{value} / {max}</span>
            </div>
            <div style={containerStyles}>
                <div style={fillStyles}></div>
            </div>
        </div>
    );
};

export default ProgressBar;
