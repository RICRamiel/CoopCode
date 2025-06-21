import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '20px',
            backgroundColor: '#f0f0f0'
        }}>
            <button
                onClick={() => navigate('/login')}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Вход
            </button>
            <button
                onClick={() => navigate('/registration')}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Регистрация
            </button>
        </header>
    );
};

export default Header;
