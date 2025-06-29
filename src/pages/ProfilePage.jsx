import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Header from "../components/Header";
import '../styles/ProfilePage.css'; // Создайте этот файл для стилей

const ProfilePage = () => {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        createdAt: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/account');
                setUserData(response.data);
                setTempName(response.data.name);
                localStorage.setItem("user", response.data.name);
            } catch (err) {
                setError('Ошибка загрузки данных профиля');
            }
        };

        fetchUserData();
    }, []);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = async () => {
        try {
            const response = await api.put('/account/edit', { name: tempName });
            setUserData({ ...userData, name: tempName });
            setIsEditing(false);
            setSuccessMessage('Имя успешно изменено!');
            setTimeout(() => setSuccessMessage(''), 3000);
            localStorage.setItem("user", tempName);
        } catch (err) {
            setError('Ошибка при сохранении изменений');
        }
    };

    const handleCancelClick = () => {
        setTempName(userData.name);
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

    return (
        <div className="profile-container">
            <Header />
            <div className="profile-content">
                <h1 className="profile-title">Мой профиль</h1>
                
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="profile-card">
                    <div className="profile-info">
                        <div className="info-row">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{userData.email}</span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">Имя:</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="name-input"
                                />
                            ) : (
                                <span className="info-value">{userData.name}</span>
                            )}
                        </div>
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={handleSaveClick}
                                    className="save-button"
                                >
                                    Сохранить
                                </button>
                                <button 
                                    onClick={handleCancelClick}
                                    className="cancel-button"
                                >
                                    Отмена
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={handleEditClick}
                                className="edit-button"
                            >
                                Изменить имя
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;