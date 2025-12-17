
export const getDeepSeekInsights = async (context: string, question: string, apiKey: string) => {
    if (!question.trim()) return null;

    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful financial advisor assistant. Provide clear, actionable advice based on the provided financial data. Be specific with numbers."
                    },
                    {
                        role: "user",
                        content: `Context:\n${context}\n\nUser Question: ${question}`
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek AI Error:", error);
        throw error;
    }
};
