// 1. Importar os módulos necessários
const express = require('express');
const fs = require('fs');
const path = require('path'); // Para compatibilidade entre sistemas
const helmet = require('helmet'); // Módulo de segurança
const cors = require('cors'); // Módulo para gerenciar CORS
const rateLimit = require('express-rate-limit'); // Para limitar requisições

// 2. Inicializar o aplicativo Express
const app = express();
const port = process.env.PORT || 3000; // Usar porta do ambiente ou 3000

// Otimização para Vercel - Cache dos dados JSON
let jsonCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function getJsonData() {
    const now = Date.now();
    if (!jsonCache || (now - cacheTime) > CACHE_DURATION) {
        try {
            const dataPath = path.join(__dirname, 'curingas.json');
            const data = fs.readFileSync(dataPath, 'utf8');
            jsonCache = JSON.parse(data);
            cacheTime = now;
        } catch (err) {
            console.error("Erro ao recarregar dados:", err);
            return jsonCache || {}; // Retorna cache anterior se houver erro
        }
    }
    return jsonCache;
}

// 3. Carregar e validar os dados do arquivo JSON
let allData = {};
let curingas = [];
try {
    allData = getJsonData();

    // Valida e limpa os dados, removendo curingas sem 'id' ou 'nome'
    if (allData.curingas && Array.isArray(allData.curingas)) {
        const originalCount = allData.curingas.length;
        curingas = allData.curingas.filter(c => c.id && c.nome);
        const cleanCount = curingas.length;
        if (originalCount !== cleanCount) {
            console.warn(`Aviso: ${originalCount - cleanCount} curingas foram removidos por estarem incompletos.`);
        }
    } else {
        throw new Error("O arquivo JSON não contém um array 'curingas' válido.");
    }
} catch (err) {
    console.error("Erro crítico ao carregar 'curingas.json':", err);
    process.exit(1); // Encerra o servidor se os dados não puderem ser carregados
}

// 4. Middlewares de segurança e configuração
app.use(helmet()); // Adiciona cabeçalhos de segurança HTTP
app.use(cors());   // Habilita CORS para todas as origens
app.use(express.json()); // Permite que a API entenda requisições com corpo JSON

// Rate Limiter: Limita a 100 requisições por 15 minutos
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: "Muitas requisições foram feitas a partir deste IP, por favor, tente novamente após 15 minutos." }
});
app.use(limiter); // Aplica o limitador a todas as rotas

// 5. Definição das Rotas da API

// Rota Raiz (/) - Serve como documentação interativa da API
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        mensagem: 'Bem-vindo à API de Curingas do Balatro!',
        versao: allData.meta?.versao || '1.0',
        total_curingas: curingas.length,
        documentacao: {
            mensagem: "Para uma experiência interativa, use uma ferramenta como Postman ou Insomnia.",
            exemplos_de_links: {
                todos_os_curingas: `${baseUrl}/curingas`,
                curinga_especifico: `${baseUrl}/curingas/10`,
                curinga_aleatorio: `${baseUrl}/curingas/aleatorio`,
                listar_raridades: `${baseUrl}/raridades`,
                listar_tipos: `${baseUrl}/tipos`,
                busca_por_nome: `${baseUrl}/curingas?nome=Ganancioso`,
                filtrar_por_raridade: `${baseUrl}/curingas?raridade=Raro`,
                paginacao: `${baseUrl}/curingas?limit=5&page=2`
            }
        },
        endpoints: {
            'Listar Curingas': {
                metodo: 'GET',
                path: '/curingas',
                descricao: "Retorna uma lista de curingas com filtros e paginação.",
                parametros: [
                    { nome: 'nome', tipo: 'string', descricao: 'Filtra por parte do nome do curinga.' },
                    { nome: 'raridade', tipo: 'string', descricao: 'Filtra por raridade (Comum, Incomum, Raro, Lendário).' },
                    { nome: 'tipo', tipo: 'string', descricao: 'Filtra por tipo de efeito (+c, +m, Xm, etc.).' },
                    { nome: 'limit', tipo: 'integer', descricao: 'Número de resultados por página (padrão: 10).' },
                    { nome: 'page', tipo: 'integer', descricao: 'Número da página de resultados (padrão: 1).' }
                ]
            },
            'Obter Curinga por ID': {
                metodo: 'GET',
                path: '/curingas/:id',
                descricao: "Retorna um curinga específico pelo seu ID numérico.",
                parametros: [
                    { nome: 'id', tipo: 'integer', descricao: 'ID único do curinga.' }
                ]
            },
            'Obter Curinga Aleatório': {
                metodo: 'GET',
                path: '/curingas/aleatorio',
                descricao: "Retorna um curinga aleatório da lista."
            },
            'Listar Raridades': {
                metodo: 'GET',
                path: '/raridades',
                descricao: "Retorna uma lista de todas as raridades de curingas disponíveis e suas descrições."
            },
            'Listar Tipos': {
                metodo: 'GET',
                path: '/tipos',
                descricao: "Retorna uma lista de todos os tipos de curingas disponíveis e suas descrições."
            }
        }
    });
});

// Rota para obter um curinga aleatório
app.get('/curingas/aleatorio', (req, res) => {
    if (curingas.length === 0) {
        return res.status(503).json({ erro: "Não há curingas disponíveis no momento." });
    }
    const randomIndex = Math.floor(Math.random() * curingas.length);
    const curingaAleatorio = curingas[randomIndex];
    res.json(curingaAleatorio);
});

// Rota para listar todos os curingas com filtros e paginação
app.get('/curingas', (req, res) => {
    let resultados = [...curingas];
    const { nome, raridade, tipo, limit, page } = req.query;

    // Aplica os filtros
    if (nome) {
        resultados = resultados.filter(c => c.nome.toLowerCase().includes(nome.toLowerCase()));
    }
    if (raridade) {
        resultados = resultados.filter(c => c.raridade.toLowerCase() === raridade.toLowerCase());
    }
    if (tipo) {
        resultados = resultados.filter(c => c.tipo === decodeURIComponent(tipo));
    }

    const totalResultados = resultados.length;

    // Aplica a paginação
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedResults = resultados.slice(startIndex, startIndex + limitNum);

    res.json({
        total: totalResultados,
        pagina: pageNum,
        total_paginas: Math.ceil(totalResultados / limitNum),
        resultados: paginatedResults
    });
});

// Rota para obter um curinga específico por ID
app.get('/curingas/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ erro: 'O ID fornecido não é um número válido.' });
    }

    const curinga = curingas.find(c => c.id === id);

    if (!curinga) {
        return res.status(404).json({ erro: `Curinga com ID ${id} não encontrado.` });
    }

    res.json(curinga);
});

// Rota para listar todas as raridades
app.get('/raridades', (req, res) => {
    if (allData.raridades) {
        res.json(allData.raridades);
    } else {
        res.status(500).json({ erro: "Informações sobre raridades não estão disponíveis." });
    }
});

// Rota para listar todos os tipos
app.get('/tipos', (req, res) => {
    if (allData.tipos) {
        res.json(allData.tipos);
    } else {
        res.status(500).json({ erro: "Informações sobre tipos não estão disponíveis." });
    }
});

// Rota de Health Check
app.get('/health', (req, res) => {
    const status = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: allData.meta?.versao || '1.0',
        total_curingas: curingas.length,
        memory_usage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    };
    res.json(status);
});

// Rota de Status da API
app.get('/status', (req, res) => {
    const currentData = getJsonData();
    res.json({
        api_status: 'online',
        versao: currentData.meta?.versao || '1.0',
        ultima_atualizacao: currentData.meta?.data_atualizacao || 'N/A',
        total_curingas: currentData.curingas?.length || 0,
        endpoints_disponiveis: [
            'GET /',
            'GET /curingas',
            'GET /curingas/:id',
            'GET /curingas/aleatorio',
            'GET /raridades',
            'GET /tipos',
            'GET /health',
            'GET /status'
        ]
    });
});

// Middleware para tratar rotas não encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({ erro: 'Rota não encontrada. Consulte a documentação em /' });
});

// Middleware para tratamento de erros genéricos (pega qualquer erro não tratado)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
});

// 6. Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor da API Balatro rodando em http://localhost:${port}`);
    console.log(`Total de ${curingas.length} curingas válidos carregados.`);
});