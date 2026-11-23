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

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function validarMusica(musica) {
    if (!musica || typeof musica !== "object") {
        return false;
    }

    const camposTexto = ["titulo", "artista", "genero"];
    const textosValidos = camposTexto.every(
        (campo) => typeof musica[campo] === "string" && musica[campo].trim() !== "",
    );

    return (
        textosValidos &&
        Number.isInteger(Number(musica.ano)) &&
        Number(musica.ano) > 0 &&
        Number.isInteger(Number(musica.duracao)) &&
        Number(musica.duracao) > 0
    );
}

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

app.post("/cadastrar", async (request, response) => {
    const { titulo, artista, genero, ano, duracao } = request.body;
    if (!validarMusica(request.body)) {
        return response.status(400).json({ mensagem: "Preencha os campos corretamente." });
    }

    try {
        await sql.execute(
            `INSERT INTO \`${tabelaMusicas}\` (titulo, artista, genero, ano, duracao)
             VALUES (?, ?, ?, ?, ?)`,
            [titulo.trim(), artista.trim(), genero.trim(), Number(ano), Number(duracao)],
        );
        response.status(201).json({ mensagem: "Música cadastrada com sucesso!" });
    } catch (error) {
        responderErro(response, error);
    }
});

app.get("/musica/:id", async (request, response) => {
    const { id } = request.params;
    if (!validarId(id)) {
        return response.status(400).json({ mensagem: "ID inválido." });
    }

    try {
        const [musicas] = await sql.execute(
            `SELECT * FROM \`${tabelaMusicas}\` WHERE id = ?`,
            [id],
        );
        if (musicas.length === 0) {
            return response.status(404).json({ mensagem: "Música não encontrada." });
        }
        response.json(musicas[0]);
    } catch (error) {
        responderErro(response, error);
    }
});

app.delete("/apagar/:id", async (request, response) => {
    const { id } = request.params;
    if (!validarId(id)) {
        return response.status(400).json({ mensagem: "ID inválido." });
    }

    try {
        const [resultado] = await sql.execute(
            `DELETE FROM \`${tabelaMusicas}\` WHERE id = ?`,
            [id],
        );
        if (resultado.affectedRows === 0) {
            return response.status(404).json({ mensagem: "Música não encontrada." });
        }
        response.json({ mensagem: "Música apagada com sucesso!" });
    } catch (error) {
        responderErro(response, error);
    }
});

app.put("/editar/:id", async (request, response) => {
    const { id } = request.params;
    const { titulo, artista, genero, ano, duracao } = request.body;
    if (!validarId(id)) {
        return response.status(400).json({ mensagem: "ID inválido." });
    }
    if (!validarMusica(request.body)) {
        return response.status(400).json({ mensagem: "Preencha os campos corretamente." });
    }

    try {
        const [resultado] = await sql.execute(
            `UPDATE \`${tabelaMusicas}\`
             SET titulo = ?, artista = ?, genero = ?, ano = ?, duracao = ?
             WHERE id = ?`,
            [titulo.trim(), artista.trim(), genero.trim(), Number(ano), Number(duracao), id],
        );
        if (resultado.affectedRows === 0) {
            const [musicas] = await sql.execute(
                `SELECT id FROM \`${tabelaMusicas}\` WHERE id = ?`,
                [id],
            );
            if (musicas.length === 0) {
                return response.status(404).json({ mensagem: "Música não encontrada." });
            }
        }
        response.json({ mensagem: "Música alterada com sucesso!" });
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
