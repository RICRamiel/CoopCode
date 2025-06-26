// noinspection t

import React, {useState, useEffect, useRef} from 'react';
import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python'
import {diff_match_patch} from 'diff-match-patch';
import _ from "lodash";

const dmp = new diff_match_patch();
dmp.Diff_Timeout = 0;

const getUserColor = (userId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const index = Math.abs(hashCode(userId)) % colors.length;
    return colors[index];
};

const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

const transformCursorPosition = (position, patches) => {
    let newPosition = position;

    // Сортируем патчи по позиции (от начала к концу)
    const sortedPatches = [...patches].sort((a, b) => a.start1 - b.start1);

    for (const patch of sortedPatches) {
        const start = patch.start1;
        const end1 = start + patch.length1;
        const diff = patch.length2 - patch.length1;

        if (newPosition > end1) {
            // Курсор после изменяемой области
            newPosition += diff;
        } else if (newPosition > start) {
            // Курсор внутри изменяемой области
            const offset = newPosition - start;
            const ratio = offset / patch.length1;
            newPosition = start + Math.round(patch.length2 * ratio);
        }
    }

    return newPosition;
};
const CodeEditor = ({roomId, userId}) => {
    const [code, setCode] = useState('');
    const lastSync = useRef("")
    const ws = useRef(null);
    const ignoreChanges = useRef(false);

    const [remoteCursors, setRemoteCursors] = useState({});
    const editorRef = useRef(null);
    const userColor = getUserColor(userId);
    const textareaRef = useRef(null);

    const sendCursorPosition = (position) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'CURSOR_UPDATE', roomId, userId, position, color: userColor
            }));
        }
    };

    useEffect(() => {
        if (typeof roomId !== 'string' || typeof userId !== 'string') return "Bad property";
        const params = new URLSearchParams({room: roomId, user: userId});
        const wsUrl = `ws://192.168.0.114:8080/ws/code?${params.toString()}`;
        console.log("Connecting to WebSocket:", wsUrl);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            ws.current.send(JSON.stringify({
                type: 'REQUEST_STATE', roomId, userId
            }));
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'INITIAL_STATE':
                    setCode(message.content)
                    lastSync.current = message.content
                    break

                case 'PATCH':
                    if (message.userId === userId) return;

                    const patches = dmp.patch_fromText(message.patch);
                    const transformedCursors = {};
                    Object.entries(remoteCursors).forEach(([id, cursor]) => {
                        if (id === message.userId) {
                            // Для автора патча оставляем позицию без изменений
                            transformedCursors[id] = cursor;
                        } else {
                            // Для остальных трансформируем позицию
                            transformedCursors[id] = {
                                ...cursor, position: transformCursorPosition(cursor.position, patches)
                            };
                        }
                    });

                    const [newText, results] = dmp.patch_apply(patches, lastSync.current);
                    if (results.every(success => success)) {
                        ignoreChanges.current = true;
                        setCode(newText);
                        setRemoteCursors(transformedCursors);
                        lastSync.current = newText;
                        ignoreChanges.current = false;
                    } else {
                        console.error('Patch application failed, requesting full state');
                        ws.current.send(JSON.stringify({
                            type: 'REQUEST_STATE', roomId, userId
                        }));
                    }
                    break;
                case 'ERROR':
                    console.error("Error:", message.reason);
                    break;
                case 'REMOTE_CURSOR':
                    if (message.userId !== userId) {
                        setRemoteCursors(prev => ({
                            ...prev, [message.userId]: {
                                position: message.position,
                                color: message.color,
                                name: message.userId,
                                timestamp: Date.now()
                            }
                        }));
                    }
                    console.log(remoteCursors)
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

    useEffect(() => {
        if (!editorRef.current) return;

        // Получаем textarea из DOM
        const textarea = editorRef.current.querySelector('textarea');
        if (!textarea) return;

        textareaRef.current = textarea;

        const handleCursorMove = () => {
            const position = textarea.selectionStart;
            sendCursorPosition(position);
        };

        const throttledHandleCursorMove = _.throttle(handleCursorMove, 100);

        textarea.addEventListener('click', throttledHandleCursorMove);
        textarea.addEventListener('keyup', throttledHandleCursorMove);
        textarea.addEventListener('mousemove', throttledHandleCursorMove);

        return () => {
            textarea.removeEventListener('click', throttledHandleCursorMove);
            textarea.removeEventListener('keyup', throttledHandleCursorMove);
            textarea.removeEventListener('mousemove', throttledHandleCursorMove);
        };
    }, [code]);
    const CursorOverlay = () => {
        if (!editorRef.current) return null;

        return Object.entries(remoteCursors).map(([id, cursor]) => {
            if (id === userId) return null;

            // Вычисляем позицию курсора
            const lines = code.substring(0, cursor.position).split('\n');
            const lineNumber = lines.length;
            const column = lines[lines.length - 1].length;

            return (<div
                key={id}
                className="remote-cursor"
                style={{
                    position: 'absolute',
                    top: `${(lineNumber) * 19 - 3}px`,
                    left: `${column * 8.79 + 15}px`,
                    height: '18px',
                    borderLeft: `2px solid ${cursor.color}`,
                    pointerEvents: 'none',
                    zIndex: 10
                }}
            >
                <div className="cursor-label" style={{
                    backgroundColor: cursor.color,
                }}>
                    {cursor.name}
                </div>
            </div>);
        });
    };

    const handleCodeChange = (newCode) => {
        if (ignoreChanges.current) return;

        setCode(newCode);
        const patches = dmp.patch_make(lastSync.current, newCode);

        if (patches.length > 0) {
            const patchText = dmp.patch_toText(patches);

            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'APPLY_PATCH', roomId, userId, patch: patchText
                }));
                lastSync.current = newCode;
            }
        }
    };

    return (<div className="editor-container">
        <div className="status-bar">
            Room: {roomId} | User: {userId}
        </div>
        <div style={{position: 'relative'}} ref={editorRef}>
            <Editor
                value={code}
                onValueChange={handleCodeChange}
                highlight={code => highlight(code, languages.js, 'javascript')}
                padding={15}
                style={{
                    fontFamily: '"Fira Code", "Consolas", monospace',
                    fontSize: 16,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    minHeight: '300px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}
            />
            <CursorOverlay/>
        </div>
    </div>);
};

export default CodeEditor;
