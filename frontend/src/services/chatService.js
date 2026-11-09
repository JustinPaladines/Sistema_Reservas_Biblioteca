import api from "./api";

export async function enviarMensaje(messages) {
    const data = await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({
            messages
        })
    });

    return data.answer;
}