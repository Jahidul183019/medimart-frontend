// src/utils/wsClient.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function createWsClient(onConnected) {
    const client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
        reconnectDelay: 5000,
        debug: () => {
            // console.log(msg); // enable this if you want STOMP frame logs
        },
    });

    client.onConnect = (frame) => {
        console.log("[WS] Connected:", frame.command);
        if (onConnected) onConnected(client);
    };

    client.onStompError = (frame) => {
        console.error("[WS] STOMP error:", frame.headers["message"], frame.body);
    };

    client.onWebSocketError = (event) => {
        console.error("[WS] WebSocket error:", event);
    };

    client.onDisconnect = () => {
        console.log("[WS] Disconnected");
    };

    client.activate();
    return client;
}
