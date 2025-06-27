import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python';
import { diff_match_patch } from 'diff-match-patch';
import _ from 'lodash';

class OperationTransformer {
    static transform(incomingOperation, missingOperation) {
        const transformed = {
            ...incomingOperation,
            length: this.getNewLength(incomingOperation, missingOperation),
            pos: this.getNewPos(incomingOperation, missingOperation)
        };
        return transformed;
    }

    static getNewPos(incomingOperation, missingOperation) {
        let newPos = incomingOperation.pos;

        if (missingOperation.type === "insert") {
            if (missingOperation.pos <= incomingOperation.pos) {
                newPos += missingOperation.text.length;
            }
        } else if (missingOperation.type === "delete") {
            if (missingOperation.pos < incomingOperation.pos) {
                newPos = Math.max(missingOperation.pos, newPos - missingOperation.length);
            }
        }
        return newPos;
    }

    static getNewLength(incomingOperation, missingOperation) {
        // Case 1: Both operations are insert, or missing is delete and incoming is insert
        if ((missingOperation.type === "insert" && incomingOperation.type === "insert") ||
            (missingOperation.type === "delete" && incomingOperation.type === "insert")) {
            return incomingOperation.length;
        }

        // Case 2: Missing is insert and incoming is delete
        if (missingOperation.type === "insert" && incomingOperation.type === "delete") {
            if (missingOperation.pos > incomingOperation.pos &&
                missingOperation.pos < incomingOperation.pos + incomingOperation.length) {
                return incomingOperation.length + missingOperation.text.length;
            }
        }

        // Case 3: Both operations are delete
        if (missingOperation.type === "delete" && incomingOperation.type === "delete") {
            return incomingOperation.length - this.getOverlappingLength(
                incomingOperation.pos,
                incomingOperation.length,
                missingOperation.pos,
                missingOperation.length
            );
        }

        return incomingOperation.length;
    }
    
    // Обратная трансформация (новая)
    static transformReverse(incomingOperation, missingOperation) {
        const transformed = {
            ...incomingOperation,
            length: this.getNewLengthReverse(incomingOperation, missingOperation),
            pos: this.getNewPosReverse(incomingOperation, missingOperation)
        };
        return transformed;
    }

    // Обратная трансформация позиции
    static getNewPosReverse(incomingOperation, missingOperation) {
        let newPos = incomingOperation.pos;

        if (missingOperation.type === "insert") {
            if (missingOperation.pos <= incomingOperation.pos) {
                newPos -= missingOperation.text.length; // Обратное действие
            }
        } else if (missingOperation.type === "delete") {
            if (missingOperation.pos < incomingOperation.pos) {
                newPos = Math.max(missingOperation.pos, newPos + missingOperation.length); // Обратное действие
            }
        }
        return newPos;
    }

    // Обратная трансформация длины
    static getNewLengthReverse(incomingOperation, missingOperation) {
        // Case 1: Обе операции - insert, или missing - delete, а incoming - insert
        if ((missingOperation.type === "insert" && incomingOperation.type === "insert") ||
            (missingOperation.type === "delete" && incomingOperation.type === "insert")) {
            return incomingOperation.length;
        }

        // Case 2: Missing - insert, incoming - delete
        if (missingOperation.type === "insert" && incomingOperation.type === "delete") {
            if (missingOperation.pos > incomingOperation.pos &&
                missingOperation.pos < incomingOperation.pos + incomingOperation.length) {
                return incomingOperation.length - missingOperation.text.length; // Обратное действие
            }
        }

        // Case 3: Обе операции - delete
        if (missingOperation.type === "delete" && incomingOperation.type === "delete") {
            return incomingOperation.length + this.getOverlappingLength( // Обратное действие
                incomingOperation.pos,
                incomingOperation.length,
                missingOperation.pos,
                missingOperation.length
            );
        }

        return incomingOperation.length;
    }

    static getOverlappingLength(pos1, len1, pos2, len2) {
        const end1 = pos1 + len1;
        const end2 = pos2 + len2;

        if (pos1 >= end2 || pos2 >= end1) {
            return 0;
        } else {
            const overlapStart = Math.max(pos1, pos2);
            const overlapEnd = Math.min(end1, end2);
            return overlapEnd - overlapStart;
        }
    }
}

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

function transformCursorPosition(cursorPos, operations) {
    let newPos = cursorPos;
    
    operations.forEach(op => {
        if (op.type === 'insert') {
            // Если вставка произошла перед курсором - сдвигаем курсор вперед
            if (op.pos <= newPos) {
                newPos += op.text.length;
            }
        } else if (op.type === 'delete') {
            // Если удаление пересекается с позицией курсора
            if (op.pos < newPos) {
                // Если курсор был внутри удаленного фрагмента
                if (newPos <= op.pos + op.length) {
                    newPos = op.pos; // Перемещаем в начало удаленного фрагмента
                } else {
                    // Иначе просто сдвигаем назад на длину удаления
                    newPos -= op.length;
                }
            }
        }
    });
    
    return newPos;
}

const CodeEditor = ({ roomId, userId }) => {
    const [code, setCode] = useState('');
    const lastServerState = useRef({ text: '', version: 0 });
    const pendingChanges = useRef([]);
    const lastId = useRef(-1);
    const ws = useRef(null);
    const isApplyingRemoteChange = useRef(false);

    const [remoteCursors, setRemoteCursors] = useState({});
    const editorRef = useRef(null);
    const transformedAfterRemoteChangeCursorPosition = useRef(null)
    const lastSendCursorPosition = useRef(0)
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

    // Функция трансформации операций
    const transformOperation = (localPendingOperation, incomingRemoteOperations) => {
        let transformedOp = { ...localPendingOperation };
        
        incomingRemoteOperations.forEach(remoteOp => {
            transformedOp = OperationTransformer.transform(transformedOp, remoteOp)
        })
        
        return transformedOp;
    };

    const calculateOperations = (oldText, newText) => {
        if (oldText === newText) return [];
        
        const diffs = dmp.diff_main(oldText, newText);
        dmp.diff_cleanupSemantic(diffs);
        
        let ops = [];
        let pos = 0;

        lastId.current++
        diffs.forEach(([type, text]) => {
            switch(type) {
                case 1:
                    ops.push({
                        id: lastId.current,
                        type: 'insert',
                        pos: pos,
                        text: text
                    });
                    pos += text.length;
                    break;
                    
                case -1:
                    ops.push({
                        id: lastId.current,
                        type: 'delete',
                        pos: pos,
                        length: text.length
                    });
                    break;
                    
                case 0:
                    pos += text.length;
                    break;
            }
        });

        return ops;
    };

    const applyOperations = (text, ops) => {
        let result = text;
        ops.forEach(op => {
            if (op.type === 'insert') {
                result = result.slice(0, op.pos) + op.text + result.slice(op.pos);
            } else {
                result = result.slice(0, op.pos) + result.slice(op.pos + op.length);
            }
        });
        return result;
    };

    const sendOperations = (ops) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || ops.length === 0) return;
        
        const message = {
            type: 'APPLY_OPERATIONS',
            roomId,
            userId,
            operations: ops,
            baseVersion: lastServerState.current.version
        };
        
        ws.current.send(JSON.stringify(message));
        pendingChanges.current = pendingChanges.current.concat(ops);
    };

    const handleCodeChange = (newCode) => {
        if (isApplyingRemoteChange.current) return;
        
        setCode(newCode);
        const ops = calculateOperations(lastServerState.current.text, newCode);
        const transformedOps = [];
        
        ops.forEach(newOperation => {
            // Инициализируем transformed как копию исходной операции
            let transformed = {...newOperation};
            
            // Последовательно трансформируем относительно каждой pending-операции
            //pendingChanges.current.forEach(pendingOperation => {
            //    transformed = OperationTransformer.transformReverse(transformed, pendingOperation);
            //});
            
            transformedOps.push(transformed);
        });
        
        if (transformedOps.length > 0) {
            sendOperations(transformedOps);
            lastServerState.current.text = newCode;
        }
    };

    useEffect(() => {
        if (!isMountedRef.current) return;
        if (!roomId || !userId) return;

        const params = new URLSearchParams({ room: roomId, user: userId });
        const wsUrl = `ws://localhost:8080/ws/code?${params.toString()}`;
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
                    setTextCursorPosition(0);
                    isApplyingRemoteChange.current = true;
                    //pendingChanges.current = []
                    setCode(message.content);
                    lastServerState.current = {
                        text: message.content,
                        version: message.version
                    };
                    isApplyingRemoteChange.current = false;
                    break;

                case 'OPERATIONS_CONFIRMED':
                    pendingChanges.current = pendingChanges.current.filter(
                        op => !message.appliedOperationIds.includes(op.id)
                    );
                    lastServerState.current.version = message.newVersion;
                    break;

                case 'OPERATIONS_DECLINED':
                    console.error("Operations declined", message.reason);

                    pendingChanges.current = pendingChanges.current.filter(
                        op => !message.declinedOperationIds.includes(op.id)
                    );
                    lastServerState.current.version = message.newVersion;

                    ws.current.send(JSON.stringify({
                        type: 'REQUEST_STATE',
                        roomId,
                        userId
                    }));
                    break;
                    
                case 'REMOTE_OPERATIONS':
                    if (message.userId === userId) return;
                    
                    isApplyingRemoteChange.current = true;

                    // Трансформируем pending операции
                    pendingChanges.current = pendingChanges.current.map(op => 
                        transformOperation(op, message.operations)
                    );
                    
                    // Применяем серверные операции
                    const newText = applyOperations(lastServerState.current.text, message.operations);
                    setCode(newText);
                    lastServerState.current = {
                        text: newText,
                        version: message.newVersion
                    };
                    
                    isApplyingRemoteChange.current = false;

                    const currentCursorPos = textareaRef.current?.selectionStart || 0
                    transformedAfterRemoteChangeCursorPosition.current = transformCursorPosition(currentCursorPos, message.operations);

                    break;
            
                case 'ERROR':
                    console.error("Server error:", message.reason);
                    ws.current.send(JSON.stringify({
                        type: 'REQUEST_STATE',
                        roomId,
                        userId
                    }));
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
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [roomId, userId]);

    useLayoutEffect(() => {
        if (transformedAfterRemoteChangeCursorPosition.current != null) {
            setTextCursorPosition(transformedAfterRemoteChangeCursorPosition.current)
        }
        transformedAfterRemoteChangeCursorPosition.current = null
    }, [code]);

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
            if (isApplyingRemoteChange.current) return;
            const position = textarea.selectionStart;
            if (lastSendCursorPosition.current !== position){
                lastSendCursorPosition.current = position
                sendCursorPosition(position);
            }
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
                        top: `${(lineNumber + 1) * editorDimensions.lineHeight - 4}px`,
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