# PRD — UNI STORE

- **Versão:** 2.1
- **Data:** 19 de julho de 2026
- **Status:** Rascunho para Aprovação
- **Proprietário:** Admin

> **Nota para implementação (Claude Code):** este documento é a fonte de verdade do projeto. Siga o roadmap por fases (Seção 13). Não implemente nada listado na Seção 8 ("O Que NÃO Será Feito"). Em caso de ambiguidade, pergunte antes de assumir.

---

## O que mudou

**v2.1** (melhorias de produto):
- **Custo e Lucro** — custo unitário por lote de entrada; cálculo automático de lucro por venda, margem por produto e lucro por evento.
- **Lotes de Produção** — registro de cada encomenda à fábrica (quantidade, custo, evento vinculado) com indicador Produzido × Vendido × Sobrou.
- **Cadastro estruturado de Setores, Congregações e Líderes** — campos de seleção em vez de texto livre, garantindo relatórios confiáveis.
- **Página de Resultados** — visão simplificada, mobile-first, com os números que importam (camisa mais vendida, evento que mais vendeu, lucro).
- **Mobile/PWA** — acesso pelo celular via site com login de administrador; instalável como app; tela de venda otimizada para o dia do evento; registro offline com sincronização (Fase 4).
- **Fechamento de Caixa por evento** — totais por forma de pagamento para conferência.
- **Utilidades** — código de reserva, prazo de corte para reservas/pedidos, lista de separação por congregação, preenchimento automático de cliente recorrente por CPF, duplicar evento.

**v2.0**:
- Novo **Módulo de Eventos** (vigília, conferência, Copa, "Dois Suas Férias"), com vendas vinculadas ao evento.
- Novo **Módulo de Reservas** — link público por evento; baixa de estoque na retirada.
- **Pedidos em Grande Escala reformulado** — link por evento, login Google ou cadastro manual, controle de pagamento e validação de retirada (substitui Google Forms + Excel).
- **Bloco de congregação** — Setor da Congregação, Nome da Congregação e Nome do Líder de Jovens em todos os formulários.

---

## 1. Visão Geral do Produto

O UNI STORE é um sistema simplificado de gestão de estoque, vendas, eventos, reservas, pedidos e resultados para uma loja de vestuário ligada ao **UNI Movimento** (movimento de jovens organizado por **regiões → setores → congregações**). Diferentemente de ERPs complexos, o sistema automatiza o que hoje é feito manualmente em Excel e Google Forms, mantendo simplicidade e praticidade como princípios fundamentais.

O ciclo de negócio é: **encomendar produção à fábrica → receber e estocar → vender em eventos e no dia a dia → medir resultado e lucro**. O sistema cobre os cinco fluxos:

1. **Vendas pontuais** no dia a dia, com desconto automático de estoque.
2. **Vendas dentro de eventos**, vinculadas ao evento.
3. **Reservas** via link público, retiradas presencialmente no evento (baixa de estoque na retirada).
4. **Pedidos em grande escala** de líderes, via link por evento, para dimensionar a produção e evitar sobra de estoque.
5. **Resultados** — lucro, produtos e eventos que mais vendem, apresentados de forma visualmente simples.

**Acesso:** aplicação web responsiva (desktop, tablet e celular), com página de **login de administrador**. Instalável no celular como **PWA**.

## 2. Objetivos Principais

- **Automatizar o registro de vendas** — eliminar o Excel; capturar cliente (nome, CPF, congregação), produto (modelo, cor, tamanho), forma de pagamento e valor em interface intuitiva.
- **Descontar automaticamente do estoque** — na venda e na retirada de reserva, em tempo real.
- **Gerenciar eventos** — lançar eventos e concentrar neles as vendas, reservas e pedidos.
- **Controlar reservas** — link de reserva por evento; localizar a reserva por nome, telefone ou código na retirada.
- **Centralizar pedidos em grande escala** — substituir Google Forms; login Google ou cadastro manual; consolidação para produção.
- **Medir lucro de verdade** — registrar custo de produção e mostrar margem por produto e lucro por evento.
- **Reduzir sobra de estoque** — dimensionar produção pela demanda (pedidos) e pelo histórico (Produzido × Vendido × Sobrou).
- **Organizar o controle de estoque** — visão por SKU com histórico de entradas e saídas.
- **Apresentar resultados de forma simples** — página de resultados legível no celular em segundos.

## 3. Público-Alvo

- **Usuário Primário:** Admin (proprietário), responsável por toda a gestão, entrada de dados e análise. Acessa pelo computador e pelo celular (site/PWA) com login de administrador.
- **Usuários Secundários:** líderes de setores/congregações (pedidos em grande escala) e clientes finais (reservas). Acessam apenas links/formulários públicos, sem acesso ao sistema interno.
- **Contexto:** a loja opera em eventos (vigília, conferência, Copa etc.) e com vendas pontuais. Reservas e pedidos concentram-se nos períodos de mobilização pré-evento. Locais de evento podem ter internet ruim (ver requisito offline, Fase 4).

## 4. Estrutura Organizacional (Cadastros Base)

O UNI Movimento é segmentado por região, setor e congregação. Para garantir dados consistentes e relatórios confiáveis, o sistema possui cadastros administrativos estruturados. **Nos formulários públicos e internos, setor e congregação são campos de seleção, nunca texto livre.**

### 4.1 Cadastro de Setores
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Nome do Setor | Texto | Sim | Ex: "Setor Centro", "Setor Leste" |
| Região | Texto | Não | Agrupador opcional |
| Ativo | Sim/Não | Sim | Setores inativos não aparecem nos formulários |

### 4.2 Cadastro de Congregações
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Nome da Congregação | Texto | Sim | Única dentro do setor |
| Setor | Seleção | Sim | Vínculo com o cadastro de setores |
| Nome do Líder de Jovens | Texto | Sim | Líder responsável pela congregação |
| Ativo | Sim/Não | Sim | — |

### 4.3 Bloco padrão "Identificação da Congregação"
Reutilizado em vendas, reservas (opcional) e pedidos:
- **Setor da Congregação** — seleção (obrigatório)
- **Nome da Congregação** — seleção filtrada pelo setor (obrigatório)
- **Nome do Líder de Jovens** — preenchido automaticamente a partir da congregação selecionada; editável (obrigatório)

### 4.4 Cadastro de Clientes (implícito)
O sistema mantém um registro de clientes a partir das vendas. **Ao digitar um CPF já conhecido, nome e congregação são preenchidos automaticamente** (cliente recorrente), acelerando a venda no evento.

## 5. Escopo Funcional

### 5.1 Módulo de Gestão de Produtos

Cadastro e gestão dos produtos (SKUs). Cada produto é identificado unicamente por **modelo + cor + tamanho**.

**Funcionalidades:**
- **Cadastro de Produto** — nome/modelo, cor, tamanho, preço de venda, custo de referência (opcional) e descrição.
- **Listagem de Produtos** — tabela com filtros por modelo, cor e tamanho.
- **Edição de Produto** — atualizar preço, custo de referência, descrição.
- **Exclusão de Produto** — com validação para impedir exclusão de produto com estoque ativo.

**Dados Capturados:**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Modelo | Texto | Sim | Ex: "Camiseta", "Moletom", "Blusa" |
| Cor | Texto | Sim | Ex: "Bordô", "Verde", "Azul", "Preta" |
| Tamanho | Seleção | Sim | P, M, G, GG etc. |
| Preço de Venda | Moeda (R$) | Sim | Formato brasileiro |
| Custo de Referência | Moeda (R$) | Não | Usado quando o lote não informa custo |
| Descrição | Texto longo | Não | Detalhes adicionais |

### 5.2 Módulo de Gestão de Estoque e Produção

Visualização do estoque e registro de entradas — agora com **custo por lote** e vínculo com **lotes de produção**.

**Funcionalidades:**
- **Visualizar Estoque** — tabela com produtos, quantidade atual, entradas e saídas; filtros por modelo, cor e tamanho.
- **Registrar Entrada** — quantidade recebida da fábrica, com **custo unitário do lote**, data, lote de produção (opcional) e observações.
- **Lotes de Produção** — registrar cada encomenda à fábrica: itens e quantidades encomendadas, custo total, fornecedor, data prevista/efetiva de chegada e **evento vinculado** (opcional). Ao receber, gera as entradas de estoque correspondentes.
- **Indicador Produzido × Vendido × Sobrou** — por lote e por evento, o sistema mostra quanto foi produzido, quanto foi vendido e quanto sobrou, orientando o dimensionamento das próximas produções.
- **Histórico de Movimentação** — todas as entradas e saídas (venda, retirada de reserva, entrega de pedido, ajuste) com data, tipo e responsável.
- **Alertas de Estoque Baixo** — produtos abaixo de limite configurável (Fase 3).

**Dados Capturados (Movimentação):**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Produto | Seleção | Sim | Modelo + Cor + Tamanho |
| Quantidade | Número | Sim | Inteiro positivo |
| Custo Unitário | Moeda (R$) | Não* | *Obrigatório em entradas de produção; usado no cálculo de lucro |
| Data | Data | Sim | Data da movimentação |
| Tipo | Seleção | Sim | Entrada, Saída, Ajuste |
| Lote de Produção | Seleção | Não | Vínculo com a encomenda |
| Observações | Texto | Não | Ex: "Chegou da Grace", "Ajuste manual" |

**Dados Capturados (Lote de Produção):**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Identificação do Lote | Texto/Auto | Sim | Ex: "Lote Conferência 2026" |
| Itens do Lote | Lista | Sim | Produto + quantidade encomendada + custo unitário |
| Custo Total | Moeda (R$) | Sim | Calculado a partir dos itens |
| Fornecedor | Texto | Não | Fábrica/fornecedor |
| Evento Vinculado | Seleção | Não | Para o indicador por evento |
| Data da Encomenda | Data | Sim | — |
| Data de Chegada | Data | Não | Preenchida no recebimento |
| Status | Seleção | Sim | Encomendado, Recebido Parcial, Recebido, Cancelado |

### 5.3 Módulo de Registro de Vendas (Dia a Dia e Evento)

Módulo mais crítico. A venda captura cliente e produto, registra a forma de pagamento e **desconta automaticamente do estoque**. Pode ocorrer avulsa (dia a dia) ou dentro de um evento.

**Funcionalidades:**
- **Registrar Venda** — cliente (nome, CPF, bloco de congregação), produto, quantidade, forma de pagamento e valor. Com CPF conhecido, preenche nome e congregação automaticamente.
- **Modo Evento (mobile)** — tela de venda rápida otimizada para toque no celular durante o evento: produto → quantidade → pagamento → confirmar.
- **Desconto Automático de Estoque** — na confirmação, em tempo real.
- **Lucro da Venda** — o sistema calcula lucro = (preço de venda − custo unitário) × quantidade, usando o custo do lote (ou o custo de referência do produto).
- **Listagem de Vendas** — filtros por data, cliente, evento, forma de pagamento e produto.
- **Edição de Venda** — corrigir erros; estoque ajustado automaticamente.
- **Exclusão de Venda** — devolve a quantidade ao estoque.
- **Relatório de Vendas** — resumo por período, forma de pagamento, receita e lucro.

**Dados Capturados:**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Nome Completo | Texto | Sim | Cliente |
| CPF | Texto | Sim | Formato XXX.XXX.XXX-XX (validação); autopreenche cliente recorrente |
| Setor da Congregação | Seleção | Sim | Bloco de congregação |
| Nome da Congregação | Seleção | Sim | Filtrada pelo setor |
| Nome do Líder de Jovens | Texto | Sim | Autopreenchido pela congregação |
| Produto | Seleção | Sim | Modelo + Cor + Tamanho |
| Quantidade | Número | Sim | Inteiro positivo |
| Forma de Pagamento | Seleção | Sim | Cartão, Pix, Dinheiro |
| Valor Unitário | Moeda (R$) | Sim | Preenchido automaticamente |
| Valor Total | Moeda (R$) | Sim | Quantidade × valor unitário |
| Evento | Seleção | Não | Vincula a venda a um evento |
| Data | Data/Hora | Sim | Timestamp automático |
| Observações | Texto | Não | Ex: "Evento - Vigília" |

### 5.4 Módulo de Pedidos em Grande Escala

Substitui por completo o Google Forms + Excel. Coleta a demanda **antes** de produzir, evitando o problema histórico de produzir muito e vender pouco. Cada evento tem seu link público de pedidos.

**Funcionalidades:**
- **Gerar Link de Pedidos por Evento** — link público vinculado ao evento.
- **Autenticação do Solicitante** — login com conta Google (captura nome e e-mail) **ou** cadastro manual (nome, telefone, CPF) para quem não tem conta Google.
- **Criar Pedido** — bloco de congregação, itens (produto, cor, tamanho, quantidade), forma de pagamento e observações.
- **Prazo de Corte** — data limite para envio de pedidos, configurada no evento; após o prazo, o link fecha automaticamente.
- **Listagem de Pedidos** — filtros por evento, data, solicitante, congregação e status.
- **Consolidação para Produção** — somatório por produto/cor/tamanho de tudo que foi pedido; pode gerar um Lote de Produção diretamente.
- **Lista de Separação** — pedidos agrupados por setor/congregação para separar as camisas de cada grupo antes da entrega.
- **Controle de Pagamento** — pago (sim/não), forma efetiva e data.
- **Validação de Retirada** — retirado (sim/não), com data/hora e responsável. Ao marcar como retirado, o sistema **desconta do estoque**.
- **Atualizar Status** — Pendente, Confirmado, Em Produção, Pronto, Pago, Retirado, Cancelado.
- **Relatório de Pedidos** — por período, evento, solicitante, status, pagamento e retirada.

**Dados Capturados:**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Autenticação | Google / Manual | Sim | Google: nome + e-mail. Manual: nome, telefone, CPF |
| Nome Completo | Texto | Sim | Solicitante |
| E-mail | Texto | Condicional | Automático via Google |
| Telefone | Texto | Condicional | Obrigatório no cadastro manual |
| CPF | Texto | Condicional | Obrigatório no cadastro manual |
| Setor da Congregação | Seleção | Sim | Bloco de congregação |
| Nome da Congregação | Seleção | Sim | Filtrada pelo setor |
| Nome do Líder de Jovens | Texto | Sim | Autopreenchido |
| Itens do Pedido | Lista | Sim | Produto, cor, tamanho, quantidade |
| Forma de Pagamento | Seleção | Sim | Cartão, Pix, Dinheiro |
| Evento | Seleção | Sim | Evento/conferência vinculada |
| Data do Pedido | Data | Sim | Automática |
| Pago | Sim/Não + data | Sim | Controle de pagamento |
| Retirado | Sim/Não + data/hora | Sim | Validação de retirada; baixa de estoque |
| Status | Seleção | Sim | Pendente, Confirmado, Em Produção, Pronto, Pago, Retirado, Cancelado |
| Observações | Texto | Não | — |

### 5.5 Módulo de Eventos

Lançamento e gestão de eventos (vigília, conferência, Copa, "Dois Suas Férias"). O evento é o agrupador central: dentro dele acontecem vendas, reservas e pedidos, e os resultados são medidos por evento.

Cada evento oferece **três canais de aquisição**:
1. **Venda direta** no evento (fluxo tradicional presencial, baixa automática — 5.3).
2. **Reserva via link** — cliente reserva online e retira no evento (5.6).
3. **Pedido em grande escala via link** — coleta de demanda para produção (5.4).

**Funcionalidades:**
- **Criar Evento** — nome, descrição, datas de início/fim, local, prazos de corte (reserva e pedido) e status.
- **Duplicar Evento** — criar um novo evento copiando a estrutura de um anterior (ex: "Conferência 2027" a partir de "Conferência 2026").
- **Listagem de Eventos** — com status (Planejado, Ativo, Encerrado).
- **Painel do Evento** — tela dedicada: registrar vendas, ver reservas e pedidos, gerar/copiar links, acompanhar KPIs do evento (receita, lucro, itens vendidos, reservas pendentes, pedidos pendentes).
- **Fechamento de Caixa** — ao encerrar o evento: total em Dinheiro, total em Pix, total em Cartão, para conferência com o caixa físico.
- **Encerrar Evento** — consolida vendas, reservas, pedidos, receita, custo e lucro do evento.

**Dados Capturados:**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Nome do Evento | Texto | Sim | Ex: "Conferência 2026", "Evento da Copa" |
| Descrição | Texto longo | Sim | — |
| Data de Início | Data | Sim | — |
| Data de Término | Data | Não | — |
| Local | Texto | Não | — |
| Prazo de Corte — Reservas | Data | Não | Fecha o link de reservas |
| Prazo de Corte — Pedidos | Data | Não | Fecha o link de pedidos |
| Status | Seleção | Sim | Planejado, Ativo, Encerrado |

### 5.6 Módulo de Reservas

Cliente reserva produtos antecipadamente por link público do evento e retira presencialmente. **A baixa de estoque ocorre apenas na retirada/pagamento.**

**Funcionalidades:**
- **Link de Reserva por Evento** — público, sem login.
- **Criar Reserva (público)** — nome, telefone, produto, quantidade, forma de pagamento pretendida, observações. Gera um **código de reserva** curto (ex: R-0042) exibido na confirmação, com botão "compartilhar no WhatsApp" (link wa.me simples, sem integração).
- **Aba Reservas (admin)** — pesquisar por **nome, telefone ou código de reserva**.
- **Detalhes da Reserva** — produto, modelo, tamanho, quantidade, forma de pagamento e status.
- **Confirmar Retirada/Pagamento** — marca como "Retirada", registra a forma de pagamento efetiva e **desconta do estoque em tempo real**.
- **Histórico e Rastreabilidade** — separa quem reservou e retirou de quem comprou na hora.

**Dados Capturados:**
| Campo | Tipo | Obrigatório | Observações |
|---|---|---|---|
| Código de Reserva | Auto | Sim | Ex: R-0042; usado na busca |
| Nome Completo | Texto | Sim | Cliente |
| Telefone | Texto | Sim | Usado para localizar a reserva |
| CPF | Texto | Não | Opcional na reserva |
| Congregação | Bloco | Não | Opcional na reserva |
| Produto | Seleção | Sim | Modelo + Cor + Tamanho |
| Quantidade | Número | Sim | Inteiro positivo |
| Forma de Pagamento | Seleção | Sim | Pretendida; efetiva registrada na retirada |
| Evento | Seleção | Sim | — |
| Status | Seleção | Sim | Reservada, Retirada (Paga), Cancelada |
| Data da Reserva | Data | Sim | Automática |
| Data da Retirada | Data/Hora | Não | Registrada na retirada |
| Observações | Texto | Não | — |

### 5.7 Módulo de Resultados e Relatórios

Duas camadas: a **Página de Resultados** (simples, visual, mobile-first) e os **relatórios detalhados**.

**Página de Resultados** — cards grandes e diretos, legíveis no celular em segundos:
- Camisa (produto) mais vendida — geral e por evento
- Evento que mais vendeu (receita e unidades)
- **Lucro** do último evento e do período
- Receita do dia / semana / mês
- Comparação entre eventos (receita, unidades, lucro, sobra)
- Ranking de congregações que mais compram/pedem
- Estoque crítico, reservas pendentes, pedidos pendentes

**Relatórios detalhados:**
- **Vendas** — por período, forma de pagamento, produto, evento; receita e lucro.
- **Estoque e Produção** — movimentação por período; Produzido × Vendido × Sobrou por lote e por evento.
- **Reservas** — por evento; retiradas × pendentes; taxa de conversão.
- **Pedidos** — por período, evento, status; pago × não pago; retirado × não retirado; consolidação de produção.
- **Fechamento de Caixa** — por evento, totais por forma de pagamento.

## 6. Fluxos de Negócio

### 6.1 Entrada de Estoque / Produção
**Ator:** Admin · **Gatilho:** encomenda ou chegada de produtos da fábrica
1. Admin registra o **Lote de Produção** (itens, quantidades, custo, evento vinculado) — ou pode gerá-lo a partir da consolidação de pedidos.
2. Quando os produtos chegam, faz a contagem manual.
3. Marca o lote como Recebido (ou registra entrada avulsa), informando o custo unitário.
4. O sistema adiciona as quantidades ao estoque com o custo do lote.

**Resultado:** estoque atualizado com custo registrado, pronto para calcular lucro.

### 6.2 Venda Diária
**Ator:** Admin (ou vendedor) · **Gatilho:** cliente chega para comprar
1. Acessa Registro de Vendas → "Registrar Venda" (ou o modo evento no celular).
2. Digita o CPF; se cliente recorrente, nome e congregação preenchem sozinhos; senão, preenche nome + bloco de congregação.
3. Seleciona produto, quantidade e forma de pagamento.
4. Confirma; sistema desconta do estoque, calcula lucro e registra timestamp.

**Resultado:** venda registrada, estoque e lucro atualizados.

### 6.3 Evento
**Ator:** Admin · **Gatilho:** novo evento
1. Cria o evento (ou duplica um anterior), define datas e prazos de corte.
2. No painel do evento, gera os links de reserva e/ou pedidos e compartilha.
3. Vincula (opcional) o lote de produção ao evento.
4. Durante o evento, registra vendas diretas pelo celular e atende retiradas de reservas e pedidos.
5. Ao final, faz o fechamento de caixa e encerra o evento; o sistema consolida receita, custo, lucro e sobra.

**Resultado:** evento medido de ponta a ponta.

### 6.4 Reserva
**Ator:** cliente (externo) e Admin (interno)
1. Cliente acessa o link, preenche nome, telefone, produto, quantidade e pagamento pretendido.
2. Recebe o código de reserva (ex: R-0042) e pode compartilhar/salvar via WhatsApp.
3. No evento, informa o código, nome ou telefone; Admin localiza na aba Reservas.
4. Cliente paga e retira; Admin confirma; sistema desconta do estoque e marca Retirada.

**Resultado:** reserva atendida com rastreabilidade completa.

### 6.5 Pedido em Grande Escala
**Ator:** líder/cliente (externo) e Admin (interno)
1. Admin gera o link de pedidos no painel do evento e compartilha.
2. Solicitante faz login com Google (nome + e-mail) ou cadastro manual (nome, telefone, CPF).
3. Preenche o bloco de congregação e os itens; envia (status Pendente).
4. Após o prazo de corte, Admin consolida a demanda e dimensiona o lote de produção.
5. Atualiza status (Confirmado → Em Produção → Pronto).
6. Usa a lista de separação por congregação para organizar a entrega.
7. No evento, registra pagamento e valida a retirada (baixa de estoque).

**Resultado:** produção dimensionada pela demanda real; pedidos pagos e retirados sem Google Forms ou Excel.

## 7. Regras de Negócio

### 7.1 Estoque e Produção
- Cada combinação **modelo + cor + tamanho é uma SKU única**.
- **Venda desconta estoque imediatamente**; reserva desconta **apenas na retirada**; pedido desconta **apenas quando marcado como retirado** (Admin decide).
- Reserva **não bloqueia** estoque (decisão de negócio; bloqueio antecipado é consideração futura).
- **Não permitir venda com estoque insuficiente** — o sistema avisa a quantidade disponível e bloqueia.
- Ajustes manuais (Entrada/Saída) permitidos com observação obrigatória.
- Toda movimentação registra data, tipo, responsável e, quando aplicável, custo.
- Custo unitário: usa o custo do lote da entrada; na ausência, o custo de referência do produto; na ausência de ambos, lucro é exibido como "não calculado".

### 7.2 Vendas
- CPF obrigatório (validação de formato) para rastreabilidade.
- Bloco de congregação obrigatório (setor e congregação por **seleção**; líder autopreenchido).
- Forma de pagamento obrigatória (Cartão, Pix, Dinheiro).
- Valor total = quantidade × preço unitário; lucro = (preço − custo) × quantidade.
- Edição/exclusão ajustam o estoque automaticamente. Timestamp automático.

### 7.3 Eventos e Reservas
- Vendas de evento, reservas e pedidos ficam vinculados ao evento correspondente.
- Links públicos respeitam os prazos de corte configurados no evento.
- Reserva pública não exige login; localização por nome, telefone ou código.
- A retirada registra a forma de pagamento **efetiva** (pode diferir da pretendida).

### 7.4 Pedidos em Grande Escala
- Autenticação flexível: Google (nome + e-mail) ou manual (nome, telefone, CPF).
- Bloco de congregação obrigatório.
- Consolidação de pedidos orienta a produção; pode gerar Lote de Produção.
- Cada pedido registra Pago e Retirado, com datas, obrigatoriamente antes de concluído.
- Status: Pendente, Confirmado, Em Produção, Pronto, Pago, Retirado, Cancelado.
- Histórico completo consultável.

### 7.5 Dados Sensíveis (LGPD)
- **CPF** — validação de formato; armazenamento seguro; uso restrito à identificação interna.
- **E-mail e telefone** — apenas identificação e contato; sem exposição pública.
- **Congregação/Setor/Líder** — organização interna; sem exposição pública.
- **Pagamentos** — apenas a forma; nunca dados de cartão ou conta.
- Coleta mínima necessária; dados não são compartilhados com terceiros.

## 8. O Que NÃO Será Feito

- **Emissão de Nota Fiscal** — controle interno apenas.
- **Integração com bancos** — apenas registro da forma de pagamento.
- **Gestão de múltiplas lojas** — sistema para uma única loja.
- **Permissões complexas** — Admin é o único usuário interno (admin). Login Google de solicitantes é só identificação externa.
- **Integração com WhatsApp ou SMS** — sem notificações automáticas (botão "compartilhar no WhatsApp" é apenas um link wa.me, sem API).
- **Cálculo de impostos** — sem ICMS, IPI etc.
- **Gestão de fornecedores avançada** — o Lote de Produção é registro manual; sem integração com fábrica.
- **Análise preditiva ou IA** — sem machine learning.
- **Pagamento online** — reservas e pedidos não cobram online; pagamento é presencial.

## 9. Identidade Visual

Segue a identidade do **UNI Movimento**: simplicidade, profundidade e clareza.

### 9.1 Paleta de Cores
| Cor | Código | Uso |
|---|---|---|
| Vermelho Primário | `#FF3636` | Botões de ação, alertas, destaques |
| Laranja | `#FF8200` | Elementos secundários, acentos |
| Amarelo | `#FFD000` | Avisos, notificações |
| Preto | `#000000` | Texto principal, estrutura |
| Branco | `#FFFFFF` | Backgrounds, clareza |
| Cinza Claro | `#F5F5F5` | Backgrounds secundários |

### 9.2 Tipografia
- **Primária:** Barlow (Regular, SemiBold, Bold)
- **Secundária:** Acme Gothic (headlines)
- Corpo: 14px · Títulos: 28–32px

### 9.3 Componentes
- **Botões:** geométricos simples, bordas arredondadas (8px)
- **Cards:** branco com borda cinza claro, sombra suave
- **Inputs:** branco, borda cinza, foco com borda vermelha
- **Ícones:** Lucide Icons (24px padrão)

### 9.4 Princípios
Simplicidade · Profundidade · Clareza · Modernidade. Interface mobile-first nas telas de operação de evento.

## 10. Requisitos Não Funcionais

- **Acesso:** aplicação web responsiva; **login de administrador** para Admin; links públicos para reservas e pedidos.
- **PWA:** instalável na tela inicial do celular; ícone e splash com identidade UNI.
- **Offline (Fase 4):** registro de vendas offline no evento com sincronização automática ao reconectar; resolução de conflitos por timestamp.
- **Performance:** páginas em < 3s; listagens de até 1.000 registros sem lag; baixa de estoque em tempo real.
- **Segurança:** senha com hash; sessão segura; validação de CPF; confirmação para ações destrutivas; trilha de auditoria de todas as operações.
- **Backup:** rotina de backup do banco de dados.

## 11. Critérios de Aceite

### Funcionalidade
- [ ] Cadastro de produtos (modelo, cor, tamanho, preço, custo de referência)
- [ ] Cadastro de setores e congregações com líder de jovens; seleção nos formulários
- [ ] Estoque com filtros, entradas com custo por lote e histórico
- [ ] Lotes de produção com indicador Produzido × Vendido × Sobrou
- [ ] Venda com cliente, produto, pagamento, desconto automático de estoque e lucro calculado
- [ ] Autopreenchimento de cliente recorrente por CPF
- [ ] Edição/exclusão de vendas com ajuste automático de estoque
- [ ] Eventos: criar, duplicar, painel, links, fechamento de caixa, encerramento com consolidação
- [ ] Reservas: link por evento, código de reserva, busca por nome/telefone/código, retirada com baixa de estoque
- [ ] Pedidos: link por evento, login Google ou cadastro manual, prazo de corte, consolidação de produção, lista de separação, controle de pagamento e retirada
- [ ] Página de Resultados com os KPIs definidos em 5.7
- [ ] Relatórios de vendas, estoque/produção, reservas, pedidos e caixa

### Usabilidade
- [ ] Interface intuitiva, sem treinamento extenso
- [ ] Validação clara de erros nos formulários
- [ ] Confirmação em ações críticas
- [ ] Filtros e buscas funcionais
- [ ] Responsivo em desktop, tablet e mobile; venda rápida utilizável no celular

### Segurança
- [ ] Login de administrador
- [ ] Validação de CPF
- [ ] Login Google seguro (OAuth) para solicitantes
- [ ] Proteção contra exclusão acidental
- [ ] Auditoria de operações

### Performance
- [ ] Páginas < 3 segundos
- [ ] 1.000 registros sem lag
- [ ] Baixa de estoque em tempo real

### Identidade Visual
- [ ] Paleta UNI Movimento
- [ ] Tipografia Barlow / Acme Gothic
- [ ] Lucide Icons
- [ ] Design consistente

## 12. Casos de Uso Detalhados

### 12.1 Registrar Venda Diária
**Pré-condição:** produtos cadastrados, estoque disponível.
1. Admin abre "Nova Venda" e digita o CPF "123.456.789-00".
2. Cliente já conhecido → nome "João Silva" e congregação preenchem sozinhos.
3. Seleciona "Camiseta Bordô — P", quantidade 2; sistema mostra preço e total.
4. Pagamento "Pix"; confirma.
5. Sistema registra a venda, desconta o estoque e calcula o lucro.

**Alternativo — estoque insuficiente:** cliente quer 5, há 2 → aviso "Estoque insuficiente. Disponível: 2"; Admin vende 2 ou cancela.

### 12.2 Reservar e Retirar no Evento
1. Ana acessa o link de reserva da "Conferência 2026".
2. Informa nome, telefone, "Moletom Verde — M", quantidade 1, pagamento pretendido "Pix".
3. Recebe o código **R-0042** e salva pelo botão de WhatsApp.
4. No evento, informa o código; Admin localiza na aba Reservas.
5. Ana paga e retira; Admin confirma; estoque baixa; status "Retirada".

### 12.3 Pedido em Grande Escala com Consolidação
1. Admin gera o link de pedidos do evento com prazo de corte 30 dias antes.
2. Líder Maria loga com Google; sistema captura nome e e-mail.
3. Seleciona setor "Leste" → congregação (lista filtrada) → líder autopreenchido.
4. Adiciona 20 "Moletom Verde — M" e 15 "Camiseta Preta — G"; envia.
5. Após o corte, Admin abre a consolidação: totais por produto/tamanho de todos os pedidos.
6. Gera o Lote de Produção a partir da consolidação e encomenda à fábrica.
7. Na entrega, usa a lista de separação por congregação; marca cada pedido como Pago e Retirado (baixa de estoque).

### 12.4 Ver Resultados
1. Admin abre a Página de Resultados no celular.
2. Vê: camisa mais vendida, evento que mais vendeu, lucro do último evento, comparação entre eventos e sobra por lote.
3. Decide a quantidade da próxima produção com base no Produzido × Vendido × Sobrou.

## 13. Roadmap de Desenvolvimento

### Fase 1 — MVP
- Login de administrador
- Cadastro de setores e congregações
- Gestão de Produtos (com custo de referência)
- Estoque: entradas com custo, movimentação, histórico
- Registro de Vendas com desconto automático, lucro e cliente recorrente
- Listagens de vendas e estoque

### Fase 2 — Eventos e Canais
- Módulo de Eventos (criar, duplicar, painel, links, fechamento de caixa)
- Módulo de Reservas (link, código, busca, retirada com baixa)
- Pedidos em Grande Escala (link por evento, login Google/manual, prazo de corte, pagamento, retirada)
- Lotes de Produção com Produzido × Vendido × Sobrou
- Página de Resultados + relatórios básicos

### Fase 3 — Melhorias
- Alertas de estoque baixo
- Consolidação de pedidos → geração de Lote de Produção
- Lista de separação por congregação
- Exportação de relatórios (PDF, Excel)
- Visualização de status pelo solicitante (reserva/pedido)
- Ranking de congregações

### Fase 4 — Futuro
- PWA com registro de vendas offline e sincronização
- Notificações por WhatsApp (integração real)
- Análise preditiva de estoque
- Múltiplos usuários com permissões
- App mobile nativo

## 14. Métricas de Sucesso

- **Tempo:** registro de venda de vários minutos (Excel) para ~1 minuto (~20s para cliente recorrente).
- **Acurácia:** estoque do sistema 100% alinhado ao físico.
- **Lucro visível:** margem por produto e lucro por evento disponíveis sem cálculo manual.
- **Sobra:** redução mensurável da sobra de estoque por evento (indicador Produzido × Vendido × Sobrou).
- **Pedidos:** 100% dos pedidos em grande escala no sistema, sem Google Forms/Excel.
- **Retirada:** 100% das reservas e pedidos com pagamento e retirada registrados.
- **Autonomia:** Admin opera o sistema, inclusive pelo celular, após 1 hora de treinamento.

## 15. Arquitetura de Alto Nível (Informativo)

A decisão final de stack será tomada no início do desenvolvimento. Diretrizes:
- **Backend:** API REST ou GraphQL; regras de estoque/lucro no servidor.
- **Frontend:** web responsiva, mobile-first nas telas de operação; PWA.
- **Banco:** relacional (PostgreSQL ou MySQL) pela integridade (SKUs, movimentações, lotes).
- **Autenticação:** login simples (admin Admin); OAuth Google para solicitantes de pedidos; links públicos sem login para reservas.
- **Hospedagem:** cloud (Vercel, AWS, Azure) ou equivalente.

## 16. Aprovação

Este PRD está pronto para revisão e aprovação por Admin. Após aprovação, definir a arquitetura técnica e iniciar a Fase 1.

Aprovado por: _________________________  Data: _____________

---

### Anexos
- **A.** Consolidação do Contexto Operacional — `consolidacao_contexto.md`
- **B.** Identidade Visual Detalhada — `identidade_visual.md`
- **C.** Referências visuais — logo UNIMVT, wallpapers "SIMPLICIDADE & PROFUNDIDADE", instruções da marca UNI Movimento, fonte Acme Gothic.
