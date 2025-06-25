// noinspection t

import React, {useState, useEffect, useRef} from 'react';
import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python'
import {diff_match_patch} from 'diff-match-patch';

const dmp = new diff_match_patch();
dmp.Diff_Timeout = 0;
const CodeEditor = ({roomId, userId}) => {
    const [code, setCode] = useState('');
    const lastSync = useRef("")
    const ws = useRef(null);
    const ignoreChanges = useRef(false);

    useEffect(() => {
        if (typeof roomId !== 'string' || typeof userId !== 'string') return "Bad property";
        const params = new URLSearchParams({room: roomId, user: userId});
        const wsUrl = `ws://localhost:8080/ws/code?${params.toString()}`;
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
                    const [newText, results] = dmp.patch_apply(patches, lastSync.current);
                    if (results.every(success => success)) {
                        ignoreChanges.current = true;
                        setCode(newText);
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
        const patches = dmp.patch_make(lastSync.current, newCode);

        if (patches.length > 0) {
            const patchText = dmp.patch_toText(patches);
            console.log('Sending patch to server:', patchText);

            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'APPLY_PATCH', roomId, userId, patch: patchText
                }));

                lastSync.current = newCode;
            }
        }
    };

    return (<div className="editor-container">
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
    </div>);
};

export default CodeEditor;
