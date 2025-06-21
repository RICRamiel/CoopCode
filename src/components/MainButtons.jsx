import React from 'react';
import {useNavigate} from "react-router-dom";

const MainButtons = () => {
    const navigate = useNavigate();
    const handleButtonClick = (buttonNumber) => {
        navigate("/codeEditor")
        alert(`Нажата кнопка ${buttonNumber}`);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            gap: '20px'
        }}>
            <button
                onClick={() => handleButtonClick(1)}
                style={{
                    padding: '15px 30px',
                    fontSize: '18px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                + Создать локально
            </button>
            <button
                onClick={() => handleButtonClick(2)}
                style={{
                    padding: '15px 30px',
                    fontSize: '18px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                +
                Создать онлайн
            </button>
        </div>
    );
};

export default MainButtons;
