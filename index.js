import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import "dotenv/config";

const app = express();
const tabelaMusicas = "musicas_luizaa";

app.use(cors());
app.use(express.json());

const sql = mysql.createPool({
    host: process.env.HOST_BANCO,
    port: Number(process.env.PORTA_BANCO || 3306),
    user: process.env.USUARIO_BANCO,
    password: process.env.SENHA_BANCO,
    database: process.env.NOME_BANCO,
    waitForConnections: true,
    connectionLimit: 10,
});

function responderErro(response, error) {
    console.error(error);
    response.status(500).json({ mensagem: "Erro ao acessar o banco de dados." });
}

app.get("/", async (_request, response) => {
    try {
        const [musicas] = await sql.query(
            `SELECT * FROM \`${tabelaMusicas}\` ORDER BY id`,
        );
        response.json(musicas);
    } catch (error) {
        responderErro(response, error);
    }
});

if (!process.env.VERCEL) {
    const porta = Number(process.env.PORT || 3000);
    app.listen(porta, () => {
        console.log(`Servidor online na porta ${porta}`);
    });
}

export default app;
