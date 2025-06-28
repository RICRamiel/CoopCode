import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import api from "../api/api";
import Dialog from "./Dialog";

const MainButtons = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [dialogResult, setDialogResult] = useState(null);

    const handleOpenDialog = () => {
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
    }

    const handleDialogSubmit = async (data) => {
        setDialogResult(data);
        setUserInput(data); // Сохраняем введенные данные
        // Здесь можно добавить дополнительную логику обработки данных

        try {
            const response = await api.post('/rooms/' + data)
            const roomId = response.data.id

            navigate(`/codeEditor/${roomId}`)
        } catch (err) {
            alert(err)
        }
    };

    const handleButtonClick = (buttonNumber) => {
        handleOpenDialog()
        // navigate("/codeEditor")
        // alert(`Нажата кнопка ${buttonNumber}`);
    };

    return (<div style={{
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
            <Dialog isOpen={isDialogOpen} onSubmit={handleDialogSubmit} onClose={handleCloseDialog}></Dialog>
        </div>);
};

export default MainButtons;
