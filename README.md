# API Balatro PT-BR 🃏

Uma API completa com todos os 150 curingas do jogo Balatro traduzidos para Português do Brasil.

## 🚀 Deploy

Esta API está hospedada no Vercel e pode ser acessada através dos seguintes endpoints:

### Endpoints Principais:

- **Base URL**: `api-balatro.vercel.app`
- **Todos os curingas**: `/curingas` (retorna todos os 150 por padrão)
- **Curinga específico**: `/curingas/:id`
- **Curinga aleatório**: `/curingas/aleatorio`
- **Filtros por raridade**: `/curingas?raridade=Raro`
- **Busca por nome**: `/curingas?nome=Ganancioso`
- **Paginação**: `/curingas?limit=10&page=2` (para limitar resultados)

## 📊 Estrutura dos Dados

Cada curinga contém:
- `id`: Identificador único
- `nome`: Nome em português
- `raridade`: Comum, Incomum, Raro, Lendário
- `custo`: Preço na loja
- `efeito`: Descrição do efeito
- `tipo`: Categoria do efeito
- `ativacao`: Quando o efeito ativa
- `imagem_url`: Link para a imagem oficial

## 🛡️ Recursos de Segurança

- Rate limiting (100 req/15min)
- CORS habilitado
- Headers de segurança
- Validação de dados

## 📈 Status

- ✅ 150 curingas completos
- ✅ Imagens atualizadas da wiki oficial
- ✅ API REST completa
- ✅ Documentação interativa

---

## 👨‍💻 Autor

**[@Danitskkj](https://github.com/Danitskkj)**

- 🔗 **GitHub:** [API_Balatro](https://github.com/Danitskkj/API_Balatro)
- 🎮 **Projeto:** API de Curingas do Balatro em PT-BR
