// noinspection t

import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python'
const CodeEditor = ({ roomId, userId }) => {
    const [code, setCode] = useState('');
    const ws = useRef(null);
    const ignoreChanges = useRef(false);

    useEffect(() => {
        // Подключение к Spring Boot WebSocket
        ws.current = new WebSocket(`http://localhost:8080/ws/code?room=${roomId}&user=${userId}`);

        ws.current.onopen = () => {
            console.log("WebSocket connected to Spring Boot");
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            // Обработка разных типов сообщений от сервера
            switch(message.type) {
                case 'CODE_UPDATE':
                    if (message.userId !== userId) {
                        ignoreChanges.current = true;
                        setCode(message.content);
                        setTimeout(() => { ignoreChanges.current = false }, 100);
                    }
                    break;

                case 'INITIAL_STATE':
                    setCode(message.content);
                    break;

                case 'ERROR':
                    console.error("Server error:", message.reason);
                    break;
            }
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [roomId, userId]);

    const handleCodeChange = (newCode) => {
        if (ignoreChanges.current) return;

        setCode(newCode);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'CODE_UPDATE',
                roomId: roomId,
                userId: userId,
                content: newCode
            }));
        }
    };

    return (
        <div className="editor-container">
            <Editor
                value={code}
                onValueChange={handleCodeChange}
                highlight={code => highlight(code, languages.js, 'python')}
                padding={15}
                style={{
                    fontFamily: '"Fira Code", "Consolas", monospace',
                    fontSize: 16,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    minHeight: '300px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
            />
        </div>
    );
};

export default CodeEditor;
