import React, { useState } from 'react';

const Dialog = ({ isOpen, onClose, onSubmit }) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                padding: '20px',
                background: '#457575',
                borderRadius: '8px',
                minWidth: '300px',
            }}>
                <h2 style={{color:"white"}}>Введите название комнаты</h2>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        margin: '10px 0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing:"border-box"
                    }}
                    placeholder="Введите текст"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => {
                            onSubmit(inputValue);
                            onClose();
                        }}
                        style={{
                            padding: '8px 16px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dialog;
