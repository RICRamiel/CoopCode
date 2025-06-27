import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python';
import { diff_match_patch } from 'diff-match-patch';

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

const CodeEditor = ({ roomId, userId }) => {
    const [code, setCode] = useState('');
    const lastServerState = useRef({ text: '', version: 0 });
    const pendingChanges = useRef([]);
    const lastId = useRef(-1);
    const ws = useRef(null);
    const isApplyingRemoteChange = useRef(false);

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

        console.log(ops)
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
            console.log(pendingChanges.current.length)
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'INITIAL_STATE':
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
                    break;
            
                case 'ERROR':
                    console.error("Server error:", message.reason);
                    ws.current.send(JSON.stringify({
                        type: 'REQUEST_STATE',
                        roomId,
                        userId
                    }));
                    break;
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [roomId, userId]);

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