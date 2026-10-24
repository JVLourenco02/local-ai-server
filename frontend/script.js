
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages");
const sendButton = document.getElementById("send-button");

function addMessage(text, sender) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return message;
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    addMessage(message, "user");
    messageInput.value = "";
    sendButton.disabled = true;

    const responseMessage = addMessage("", "assistant");

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error("Não foi possível obter uma resposta da IA.");
        }

        if (!response.body) {
            throw new Error("O navegador não conseguiu receber o streaming.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                if (data.error) {
                    throw new Error(data.error);
                }

                if (data.token) {
                    fullResponse += data.token;
                    responseMessage.textContent = fullResponse;
                    messagesContainer.scrollTop =
                        messagesContainer.scrollHeight;
                }
            }
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
            const data = JSON.parse(buffer);

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.token) {
                fullResponse += data.token;
                responseMessage.textContent = fullResponse;
            }
        }

        if (!fullResponse) {
            responseMessage.textContent = "A IA não retornou uma resposta.";
        }
    } catch (error) {
        responseMessage.textContent = `Erro: ${error.message}`;
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
});
