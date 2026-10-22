const express = require("express");
const router = express.Router();
const { generarRespuesta } = require("../services/huggingface");

router.post("/", async (req, res) => {
    try {
        const { messages } = req.body;

        const answer = await generarRespuesta(messages);

        res.json({
            answer
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;