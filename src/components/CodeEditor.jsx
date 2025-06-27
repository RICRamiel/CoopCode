// noinspection t

// import React, {useState, useEffect, useRef} from 'react';
// import Editor from 'react-simple-code-editor';
// import {highlight, languages} from 'prismjs';
// import 'prismjs/components/prism-javascript';
// import 'prismjs/themes/prism.css';
// import 'prismjs/components/prism-python';
// import {diff_match_patch} from 'diff-match-patch';
// import _ from 'lodash';
//
// const dmp = new diff_match_patch();
// dmp.Diff_Timeout = 0;
//
// const getUserColor = (userId) => {
//     const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
//     const index = Math.abs(hashCode(userId)) % colors.length;
//     return colors[index];
// };
//
// const hashCode = (str) => {
//     let hash = 0;
//     for (let i = 0; i < str.length; i++) {
//         hash = ((hash << 5) - hash) + str.charCodeAt(i);
//         hash |= 0;
//     }
//     return hash;
// }
//
// const transformCursorPosition = (position, patches) => {
//     let newPosition = position;
//     const sortedPatches = [...patches].sort((a, b) => a.start1 - b.start1);
//
//     for (const patch of sortedPatches) {
//         const start = patch.start1;
//         const end = start + patch.length1;
//         const diff = patch.length2 - patch.length1;
//
//         if (newPosition <= start) {
//             continue;
//         }
//
//         if (newPosition <= end) {
//             if (patch.length1 === 0) {
//                 newPosition = start + patch.length2;
//             } else {
//                 const offset = newPosition - start;
//                 const ratio = offset / patch.length1;
//                 newPosition = start + Math.round(patch.length2 * ratio);
//             }
//         } else {
//             newPosition += diff;
//         }
//     }
//
//     return newPosition;
// };
//
// const CodeEditor = ({roomId, userId}) => {
//     const [code, setCode] = useState('');
//     const lastSync = useRef("");
//     const ws = useRef(null);
//     const ignoreChanges = useRef(false);
//     const [remoteCursors, setRemoteCursors] = useState({});
//     const editorRef = useRef(null);
//     const userColor = getUserColor(userId);
//     const textareaRef = useRef(null);
//     const [editorDimensions, setEditorDimensions] = useState({lineHeight: 19, charWidth: 8.79});
//     const isMountedRef = useRef(false);
//     const pendingCursorUpdates = useRef({});
//
//     // Функция для установки курсора в нужную позицию
//     const setTextCursorPosition = (position) => {
//         if (!textareaRef.current) return;
//
//         textareaRef.current.selectionStart = position;
//         textareaRef.current.selectionEnd = position;
//
//         // Сообщаем серверу о новом положении курсора
//         sendCursorPosition(position);
//     };
//
//     const sendCursorPosition = (position) => {
//         if (ws.current?.readyState === WebSocket.OPEN) {
//             ws.current.send(JSON.stringify({
//                 type: 'CURSOR_UPDATE', roomId, userId, position, color: userColor
//             }));
//         }
//     };
//
//     useEffect(() => {
//         isMountedRef.current = true;
//
//         return () => {
//             isMountedRef.current = false;
//         };
//     }, []);
//
//     useEffect(() => {
//         if (!isMountedRef.current) return;
//         if (typeof roomId !== 'string' || typeof userId !== 'string') return;
//
//         const params = new URLSearchParams({room: roomId, user: userId});
//         const wsUrl = `ws://192.168.0.114:8080/ws/code?${params.toString()}`;
//         ws.current = new WebSocket(wsUrl);
//
//         ws.current.onopen = () => {
//             ws.current.send(JSON.stringify({
//                 type: 'REQUEST_STATE', roomId, userId
//             }));
//         };
//
//         ws.current.onmessage = (event) => {
//             const message = JSON.parse(event.data);
//
//             switch (message.type) {
//                 case 'INITIAL_STATE':
//                     setCode(message.content);
//                     lastSync.current = message.content;
//                     setTextCursorPosition(0);
//                     break;
//
//                 case 'PATCH':
//                     if (message.userId === userId) return;
//
//                     const patches = dmp.patch_fromText(message.patch);
//                     const [newText, results] = dmp.patch_apply(patches, lastSync.current);
//
//                     if (results.every(success => success)) {
//                         ignoreChanges.current = true;
//
//                         // Сохраняем текущую позицию курсора
//                         const currentCursorPos = textareaRef.current?.selectionStart || 0;
//
//                         // Обновляем код
//                         setCode(newText);
//                         lastSync.current = newText;
//
//                         // Обновляем курсоры
//                         setRemoteCursors(prevCursors => {
//                             const transformed = {};
//                             const now = Date.now();
//
//                             Object.entries(prevCursors).forEach(([id, cursor]) => {
//                                 if (now - cursor.timestamp < 5000) {
//                                     if (id === message.userId) {
//                                         transformed[id] = {
//                                             ...cursor, position: message.position, timestamp: now
//                                         };
//                                     } else {
//                                         const newPosition = transformCursorPosition(cursor.position, patches);
//                                         transformed[id] = {
//                                             ...cursor, position: Math.min(newPosition, newText.length), timestamp: now
//                                         };
//                                     }
//                                 }
//                             });
//                             return transformed;
//                         });
//
//                         // Восстанавливаем позицию курсора текущего пользователя
//                         setTimeout(() => {
//                             if (textareaRef.current) {
//                                 const transformedPos = transformCursorPosition(currentCursorPos, patches);
//                                 setTextCursorPosition(transformedPos);
//                             }
//                         }, 10);
//
//                         ignoreChanges.current = false;
//                     } else {
//                         ws.current.send(JSON.stringify({
//                             type: 'REQUEST_STATE', roomId, userId
//                         }));
//                     }
//                     break;
//
//                 case 'REMOTE_CURSOR':
//                     if (message.userId !== userId) {
//                         pendingCursorUpdates.current[message.userId] = {
//                             position: message.position,
//                             color: message.color,
//                             name: message.userId,
//                             timestamp: Date.now()
//                         };
//                     }
//                     break;
//
//                 case 'ERROR':
//                     console.error("Error:", message.reason);
//                     break;
//             }
//         };
//
//         ws.current.onerror = (error) => {
//             console.error("WebSocket error:", error);
//         };
//
//         return () => {
//             if (ws.current) ws.current.close();
//         };
//     }, [roomId, userId]);
//
//     // Эффект для применения обновлений курсоров
//     useEffect(() => {
//         if (Object.keys(pendingCursorUpdates.current).length > 0) {
//             setRemoteCursors(prev => {
//                 const updated = {...prev};
//                 for (const [userId, cursor] of Object.entries(pendingCursorUpdates.current)) {
//                     updated[userId] = cursor;
//                 }
//                 pendingCursorUpdates.current = {};
//                 return updated;
//             });
//         }
//     }, [code]);
//
//     // Эффект для очистки устаревших курсоров
//     useEffect(() => {
//         const interval = setInterval(() => {
//             const now = Date.now();
//             setRemoteCursors(cursors => Object.fromEntries(Object.entries(cursors).filter(([_, c]) => now - c.timestamp < 5000)));
//         }, 1000);
//
//         return () => clearInterval(interval);
//     }, []);
//
//     // Эффект для измерения размеров редактора
//     useEffect(() => {
//         if (!editorRef.current) return;
//
//         const editorElement = editorRef.current;
//         const testSpan = document.createElement('span');
//         testSpan.textContent = 'X';
//         testSpan.style.fontFamily = '"Fira Code", "Consolas", monospace';
//         testSpan.style.fontSize = '16px';
//         testSpan.style.visibility = 'hidden';
//         editorElement.appendChild(testSpan);
//
//         const charWidth = testSpan.getBoundingClientRect().width;
//         const lineHeight = testSpan.getBoundingClientRect().height || 19;
//         editorElement.removeChild(testSpan);
//
//         setEditorDimensions({lineHeight, charWidth});
//     }, [code]);
//
//     // Эффект для отслеживания перемещения курсора
//     useEffect(() => {
//         if (!editorRef.current) return;
//
//         const textarea = editorRef.current.querySelector('textarea');
//         if (!textarea) return;
//
//         textareaRef.current = textarea;
//
//         const handleCursorMove = () => {
//             if (ignoreChanges.current) return;
//             const position = textarea.selectionStart;
//             sendCursorPosition(position);
//         };
//
//         const throttledHandleCursorMove = _.throttle(handleCursorMove, 100);
//
//         textarea.addEventListener('click', throttledHandleCursorMove);
//         textarea.addEventListener('keyup', throttledHandleCursorMove);
//         textarea.addEventListener('mousemove', throttledHandleCursorMove);
//
//         return () => {
//             textarea.removeEventListener('click', throttledHandleCursorMove);
//             textarea.removeEventListener('keyup', throttledHandleCursorMove);
//             textarea.removeEventListener('mousemove', throttledHandleCursorMove);
//         };
//     }, [code]);
//
//     const CursorOverlay = () => {
//         if (!editorRef.current) return null;
//
//         return Object.entries(remoteCursors).map(([id, cursor]) => {
//             if (id === userId || Date.now() - cursor.timestamp > 5000) return null;
//
//             const safePosition = Math.min(cursor.position, code.length);
//             const textBeforeCursor = code.substring(0, safePosition);
//             const lines = textBeforeCursor.split('\n');
//             const lineNumber = lines.length - 1;
//             const column = lines[lines.length - 1].length;
//
//             return (<div
//                     key={id}
//                     className="remote-cursor"
//                     style={{
//                         position: 'absolute',
//                         top: `${lineNumber * editorDimensions.lineHeight}px`,
//                         left: `${column * editorDimensions.charWidth + 15}px`,
//                         height: `${editorDimensions.lineHeight}px`,
//                         borderLeft: `2px solid ${cursor.color}`,
//                         pointerEvents: 'none',
//                         zIndex: 10
//                     }}
//                 >
//                     <div className="cursor-label" style={{
//                         position: 'absolute',
//                         top: '-20px',
//                         left: '-2px',
//                         backgroundColor: cursor.color,
//                         color: 'white',
//                         fontSize: '12px',
//                         padding: '2px 4px',
//                         whiteSpace: 'nowrap'
//                     }}>
//                         {cursor.name}
//                     </div>
//                 </div>);
//         });
//     };
//
//     const handleCodeChange = (newCode) => {
//         if (ignoreChanges.current) return;
//
//         const cursorPosition = textareaRef.current?.selectionStart || 0;
//         setCode(newCode);
//
//         const patches = dmp.patch_make(lastSync.current, newCode);
//         if (patches.length > 0) {
//             const patchText = dmp.patch_toText(patches);
//
//             if (ws.current?.readyState === WebSocket.OPEN) {
//                 ws.current.send(JSON.stringify({
//                     type: 'APPLY_PATCH', roomId, userId, patch: patchText, position: cursorPosition
//                 }));
//
//                 lastSync.current = newCode;
//             }
//         }
//     };
//
//     return (<div className="editor-container">
//             <div className="status-bar">
//                 Room: {roomId} | User: {userId}
//             </div>
//             <div style={{position: 'relative'}} ref={editorRef}>
//                 <Editor
//                     value={code}
//                     onValueChange={handleCodeChange}
//                     highlight={code => highlight(code, languages.js, 'javascript')}
//                     padding={15}
//                     style={{
//                         fontFamily: '"Fira Code", "Consolas", monospace',
//                         fontSize: 16,
//                         backgroundColor: '#f5f5f5',
//                         borderRadius: '4px',
//                         minHeight: '300px',
//                         boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
//                         position: 'relative'
//                     }}
//                 />
//                 <CursorOverlay/>
//             </div>
//
//             <div style={{background: '#eee', padding: 10, marginTop: 10}}>
//                 <h4>Debug Info:</h4>
//                 <pre>Current code length: {code.length}</pre>
//                 <pre>Remote cursors: {JSON.stringify(remoteCursors, null, 2)}</pre>
//                 <pre>Dimensions: {JSON.stringify(editorDimensions)}</pre>
//             </div>
//         </div>);
// };
//
// export default CodeEditor;


import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python';
import { diff_match_patch } from 'diff-match-patch';
import _ from 'lodash';

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
        hash |= 0;
    }
    return hash;
}

const transformCursorPosition = (position, patches) => {
    let newPosition = position;
    const sortedPatches = [...patches].sort((a, b) => a.start1 - b.start1);

    for (const patch of sortedPatches) {
        const start = patch.start1;
        const end = start + patch.length1;
        const diff = patch.length2 - patch.length1;

        if (newPosition <= start) {
            continue;
        }

        if (newPosition <= end) {
            if (patch.length1 === 0) {
                newPosition = start + patch.length2;
            } else {
                const offset = newPosition - start;
                const ratio = offset / patch.length1;
                newPosition = start + Math.round(patch.length2 * ratio);
            }
        } else {
            newPosition += diff;
        }
    }

    return newPosition;
};

const CodeEditor = ({ roomId, userId }) => {
    const [code, setCode] = useState('');
    const lastSync = useRef("");
    const ws = useRef(null);
    const ignoreChanges = useRef(false);
    const [remoteCursors, setRemoteCursors] = useState({});
    const editorRef = useRef(null);
    const userColor = getUserColor(userId);
    const textareaRef = useRef(null);
    const [editorDimensions, setEditorDimensions] = useState({ lineHeight: 19, charWidth: 8.79 });
    const isMountedRef = useRef(false);

    const setTextCursorPosition = (position) => {
        if (!textareaRef.current) return;

        textareaRef.current.selectionStart = position;
        textareaRef.current.selectionEnd = position;
        sendCursorPosition(position);
    };

    const sendCursorPosition = (position) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'CURSOR_UPDATE',
                roomId,
                userId,
                position,
                color: userColor
            }));
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!isMountedRef.current) return;
        if (typeof roomId !== 'string' || typeof userId !== 'string') return;

        const params = new URLSearchParams({ room: roomId, user: userId });
        const wsUrl = `ws://192.168.0.114:8080/ws/code?${params.toString()}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({
                type: 'REQUEST_STATE',
                roomId,
                userId
            }));
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'INITIAL_STATE':
                    setCode(message.content);
                    lastSync.current = message.content;
                    setTextCursorPosition(0);
                    break;

                case 'PATCH':
                    if (message.userId === userId) return;

                    const patches = dmp.patch_fromText(message.patch);
                    const [newText, results] = dmp.patch_apply(patches, lastSync.current);

                    if (results.every(success => success)) {
                        ignoreChanges.current = true;

                        const currentCursorPos = textareaRef.current?.selectionStart || 0;

                        setCode(newText);
                        lastSync.current = newText;

                        setRemoteCursors(prev => {
                            const updated = { ...prev };
                            const now = Date.now();

                            if (updated[message.userId]) {
                                updated[message.userId] = {
                                    ...updated[message.userId],
                                    position: message.position,
                                    timestamp: now
                                };
                            }

                            Object.keys(updated).forEach(id => {
                                if (id !== message.userId && id !== userId) {
                                    const newPos = transformCursorPosition(updated[id].position, patches);
                                    updated[id] = {
                                        ...updated[id],
                                        position: Math.min(newPos, newText.length),
                                        timestamp: now
                                    };
                                }
                            });

                            return updated;
                        });

                        setTimeout(() => {
                            if (textareaRef.current) {
                                const transformedPos = transformCursorPosition(currentCursorPos, patches);
                                setTextCursorPosition(transformedPos);
                            }
                        }, 10);

                        ignoreChanges.current = false;
                    } else {
                        ws.current.send(JSON.stringify({
                            type: 'REQUEST_STATE',
                            roomId,
                            userId
                        }));
                    }
                    break;

                case 'REMOTE_CURSOR':
                    if (message.userId !== userId) {
                        setRemoteCursors(prev => ({
                            ...prev,
                            [message.userId]: {
                                position: message.position,
                                color: message.color,
                                name: message.userId,
                                timestamp: Date.now()
                            }
                        }));
                    }
                    break;

                case 'ERROR':
                    console.error("Error:", message.reason);
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
        const interval = setInterval(() => {
            const now = Date.now();
            setRemoteCursors(prev =>
                Object.fromEntries(
                    Object.entries(prev).filter(
                        ([_, c]) => now - c.timestamp < 5000
                    )
                )
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!editorRef.current) return;

        const editorElement = editorRef.current;
        const testSpan = document.createElement('span');
        testSpan.textContent = 'X';
        testSpan.style.fontFamily = '"Fira Code", "Consolas", monospace';
        testSpan.style.fontSize = '16px';
        testSpan.style.visibility = 'hidden';
        editorElement.appendChild(testSpan);

        const charWidth = testSpan.getBoundingClientRect().width;
        const lineHeight = testSpan.getBoundingClientRect().height || 19;
        editorElement.removeChild(testSpan);

        setEditorDimensions({ lineHeight, charWidth });
    }, [code]);

    useEffect(() => {
        if (!editorRef.current) return;

        const textarea = editorRef.current.querySelector('textarea');
        if (!textarea) return;

        textareaRef.current = textarea;

        const handleCursorMove = () => {
            if (ignoreChanges.current) return;
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
            if (id === userId || Date.now() - cursor.timestamp > 5000) return null;

            const safePosition = Math.min(cursor.position, code.length);
            const textBeforeCursor = code.substring(0, safePosition);
            const lines = textBeforeCursor.split('\n');
            const lineNumber = lines.length - 1;
            const column = lines[lines.length - 1].length;

            return (
                <div
                    key={id}
                    className="remote-cursor"
                    style={{
                        position: 'absolute',
                        top: `${lineNumber * editorDimensions.lineHeight}px`,
                        left: `${column * editorDimensions.charWidth + 15}px`,
                        height: `${editorDimensions.lineHeight}px`,
                        borderLeft: `2px solid ${cursor.color}`,
                        pointerEvents: 'none',
                        zIndex: 10
                    }}
                >
                    <div className="cursor-label" style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '-2px',
                        backgroundColor: cursor.color,
                        color: 'white',
                        fontSize: '12px',
                        padding: '2px 4px',
                        whiteSpace: 'nowrap'
                    }}>
                        {cursor.name}
                    </div>
                </div>
            );
        });
    };

    const handleCodeChange = (newCode) => {
        if (ignoreChanges.current) return;

        const cursorPosition = textareaRef.current?.selectionStart || 0;
        setCode(newCode);

        const patches = dmp.patch_make(lastSync.current, newCode);
        if (patches.length > 0) {
            const patchText = dmp.patch_toText(patches);

            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'APPLY_PATCH',
                    roomId,
                    userId,
                    patch: patchText,
                    position: cursorPosition
                }));

                lastSync.current = newCode;
            }
        }
    };

    return (
        <div className="editor-container">
            <div className="status-bar">
                Room: {roomId} | User: {userId}
            </div>
            <div style={{ position: 'relative' }} ref={editorRef}>
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
                <CursorOverlay />
            </div>

            <div style={{ background: '#eee', padding: 10, marginTop: 10 }}>
                <h4>Debug Info:</h4>
                <pre>Current code length: {code.length}</pre>
                <pre>Remote cursors: {JSON.stringify(remoteCursors, null, 2)}</pre>
                <pre>Dimensions: {JSON.stringify(editorDimensions)}</pre>
            </div>
        </div>
    );
};

export default CodeEditor;
