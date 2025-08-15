const axios = require("axios");
const productosModel = require("../models/productosModel");

class AIController {
    constructor() {
        this.anthropicAPI = "https://api.anthropic.com/v1/messages";
        this.apiKey = process.env.ANTHROPIC_API_KEY || ""; // Tu API key
        this.model = "claude-opus-4-20250514"; // Modelo activo recomendado
    }

    respondToQuery = async (req, res) => {
        const userQuery = req.body.query;

        productosModel.fetchProduct((products) => {
            if (!products) {
                console.error("Error: No se encontraron productos.");
                return res.status(500).json({ message: "Error al obtener los productos" });
            }

            const productDescriptions = products.map((p) =>
                `Producto: ${p.nombre}, Precio: ${p.precio}, Descripción: ${p.descripcion}`
            ).join("\n");

            const prompt = `Estos son los productos disponibles:\n${productDescriptions}\n\nPregunta: ${userQuery}`;

            axios.post(
                this.anthropicAPI,
                {
                    model: this.model,
                    max_tokens: 500,
                    messages: [{ role: "user", content: prompt }]
                },
                {
                    headers: {
                        "x-api-key": this.apiKey,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    }
                }
            )
            .then((response) => {
                const aiResponse = response.data?.content?.[0]?.text || "Lo siento, no puedo responder ahora.";
                res.status(200).json({ response: aiResponse });
            })
            .catch((error) => {
                console.error("Error al generar la respuesta con Claude:", error.response?.data || error.message);
                res.status(500).json({ message: "Error al generar la respuesta con Claude", error: error.message });
            });
        });
    };
}

module.exports = AIController;
