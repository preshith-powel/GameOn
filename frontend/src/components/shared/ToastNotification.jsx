import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';

const ToastContext = createContext();

// Custom hook for consumers to use the toast
export const useToast = () => useContext(ToastContext);

// Toast Notification Component
const Toast = ({ message, type, id, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    // Auto-hide after 3 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Allow some time for fade-out animation before removal
            setTimeout(() => onClose(id), 500);
        }, 3000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const toastStyles = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: 'bold',
        zIndex: 9999,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    };

    const typeStyles = {
        success: { backgroundColor: '#006400' }, // Darker green for success
        error: { backgroundColor: '#ff6b6b' },
        info: { backgroundColor: '#00bfff' },
    };

    const emoji = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
    };

    return ReactDOM.createPortal(
        <div 
            style={{ ...toastStyles, ...typeStyles[type] }}
            onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 500);
            }}
        >
            <span>{emoji[type]}</span>
            {message}
        </div>,
        document.body
    );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    const showToast = useCallback((message, type = 'info') => {
        const id = nextId.current++;
        setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </ToastContext.Provider>
    );
};
