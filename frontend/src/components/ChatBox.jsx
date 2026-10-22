import { useEffect, useRef, useState } from "react";
import { enviarMensaje } from "../services/chatService";
import "../styles/chat.css";

export default function ChatBox() {

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem("chat_biblioteca");
        return saved
            ? JSON.parse(saved)
            : [
                {
                    role: "assistant",
                    content:
                        "¡Hola!, Soy Bibliot 🦉 .\n\nPuedo ayudarte con:\n\n• Recomendaciones de libros universitarios.\n• Normas APA e IEEE.\n• Técnicas de estudio.\n• Investigación.\n• Funcionamiento del sistema de reservas."
                }
            ];
    });

    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {

        localStorage.setItem(
            "chat_biblioteca",
            JSON.stringify(messages)
        );

        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);

    async function enviar() {
        if (!prompt.trim()) return;
        const userMessage = {
            role: "user",
            content: prompt
        };
        const history = [...messages, userMessage];
        setMessages(history);
        setPrompt("");
        setLoading(true);
        try {
            const answer = await enviarMensaje(history);
            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: answer
                }

            ]);

        } catch (error) {

            setMessages(prev => [...prev,
                {
                    role: "assistant",
                    content: "Error: " + error.message
                }
            ]);

        }

        setLoading(false);

    }

    function limpiarChat() {
        const inicio = [
            {
                role: "assistant", content: "¡Hola! Soy Bibliot 🦉 \n\n¿En qué puedo ayudarte hoy?"
            }
        ];
        setMessages(inicio);
        localStorage.removeItem("chat_biblioteca");

    }

    function enter(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            enviar();

        }
    }

    return (
        <div className="chat-container">
            <h2> Asistente Bibliotecario IA</h2>
            <div className="chat-messages">
                {
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.role}`}
                        >
                            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                {msg.content}
                            </p>
                        </div>
                    ))
                }
                {

                    loading && (
                        <div className="message assistant">
                            Pensando...
                        </div>

                    )

                }

                <div ref={bottomRef}></div>

            </div>

            <div className="chat-input">
                <textarea
                    value={prompt}
                    placeholder="Escribe tu pregunta..."
                    onChange={(e) =>
                        setPrompt(e.target.value)
                    }
                    onKeyDown={enter}

                />
                <button onClick={enviar} disabled={loading}>
                    Enviar
                </button>

            </div>

            <button
                className="clear-chat"
                onClick={limpiarChat}
            >
                Limpiar conversación
            </button>
        </div>
    );
}