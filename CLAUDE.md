# Contexto do Projeto — App de Controle de Estoque de Pátio

## Visão geral

Aplicação web para controle de estoque de pátio via cargas identificadas por Nota Fiscal, com itens rastreados individualmente por QR code. Três funções principais: **Adicionar Carga**, **Remoção de Carga**, **Visualizar Estoque**.

## Regras de negócio (da proposta original)

### Adicionar Carga
- Cria um objeto `carga` com: Nota Fiscal, Data de Entrada, Peso da Nota Fiscal, Material, Quantidade de Itens.
- A partir da Quantidade de Itens, gera N campos para peso individual de cada item (tipicamente 15–18, máximo recomendado 20).
- Os demais parâmetros (NF, data, material) são compartilhados por todos os itens da carga; só o peso varia por item.
- Soma dos pesos individuais gera `Peso Restante` (não precisa bater com o Peso da Nota Fiscal).
- Ao final, gera um QR code por item, contendo: identificador (ex. "Item 1 - NF"), material, peso do item. QR codes devem poder ser impressos em lote, ordenados numa única página.

### Remoção de Carga
- Início da função: input manual de Data de Saída e Motorista (fixos para todos os itens removidos nessa ação).
- Leitura de QR code adiciona o item à remoção.
- Remoção de um item: decrementa `Quantidade de Itens` da carga correspondente e subtrai o peso do item de `Peso Restante` da carga.
- Uma mesma ação de remoção pode ler múltiplos QR codes de **cargas diferentes** (Notas Fiscais diferentes).
- Ao final, calcula `Peso Total Removido` = soma dos pesos de todos os itens removidos na ação.

### Estoque (visualização)
- Tabela 1: visão geral do estoque, cargas ordenadas por última modificação (mais recente no topo). Colunas: NF, Data de Entrada, Peso da NF, Material (fixos) + Quantidade de Itens, Peso Restante (variáveis). Quando ambos chegam a zero, exibir em verde (carga finalizada).
- Tabela 2: registro de remoções, ordenadas por última modificação (mais recente no topo). Colunas: Data de Saída, Motorista, Peso Total Removido, NFs envolvidas na remoção.
- Ambas as tabelas são somente leitura.

## Decisões de arquitetura

- **Frontend/Fullstack**: Next.js (App Router), obrigatório.
- **API**: sem backend separado. Server Actions para mutações do fluxo principal (adicionar carga, remover item); Route Handlers REST (`app/api/...`) apenas para endpoints que precisem ser consumidos externamente no futuro.
- **Banco de dados**: Postgres via Supabase (banco relacional — a remoção de itens é uma transação ACID multi-tabela que cruza cargas diferentes; NoSQL foi descartado por essa razão).
- **Auth**: Supabase Auth + Row Level Security no Postgres.
- **Auditoria**: tabela `audit_log` populada por triggers Postgres (AFTER INSERT/UPDATE/DELETE) nas tabelas de carga, item e remoção.
- **ORM**: Drizzle (ou Prisma).
- **QR codes**: geração com lib `qrcode` (UUID por item), leitura via `html5-qrcode` ou `@zxing/browser` direto no navegador (sem app nativo). Impressão em lote via rota dedicada com CSS `@media print`.
- **Validação**: Zod nas Server Actions.
- **UI**: shadcn/ui + TanStack Table para as tabelas de estoque e remoções.
- **Deploy**: Vercel (Hobby para dev/homologação; Pro necessário em produção por ser uso comercial — alternativa: VPS com Coolify para reduzir custo).

## Modelo de dados (esboço)

- `cargas`: id, nota_fiscal, data_entrada, peso_nota_fiscal, material, quantidade_itens, peso_restante, criado_em, atualizado_em
- `itens`: id, carga_id (FK), peso_individual, status (em_estoque/removido), qr_token, criado_em
- `remocoes`: id, data_saida, motorista, peso_total_removido, criado_em
- `remocao_itens`: remocao_id (FK), item_id (FK) — tabela de junção N:M
- `usuarios`: gerenciado pelo Supabase Auth
- `audit_log`: id, tabela, registro_id, acao, usuario_id, dados_anteriores, dados_novos, criado_em

## Volume esperado

Mais de 100 operações/dia — baixo volume, dentro de qualquer free tier moderno. A escolha de stack prioriza corretude do modelo de dados e custo de infra, não capacidade de escala.

---

## Instrução para o Claude Code

Use este documento como referência de domínio e arquitetura. Ao criar o board de tasks, organize por área (Setup/Infra, Banco de Dados, Auth, Adicionar Carga, Remoção de Carga, Visualização de Estoque, QR Code, Auditoria, Deploy) e quebre cada função em tasks pequenas e testáveis, seguindo as regras de negócio acima como fonte da verdade.