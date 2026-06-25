# OficinaOS V546.41 — CLIENTES HOTFIX

Gerado em 2026-06-25 14:38.

Correções:
- Exclusão de cliente por ID real.
- Remoção dos veículos vinculados ao cliente excluído.
- Desvinculação segura em Orçamentos, Agenda/OS e Financeiro.
- Persistência reforçada nas chaves principais do STATE.
- Edição preservando ID real.
- Busca normalizada.

Teste:
1. Abrir `clientes.html`.
2. Cadastrar cliente.
3. Adicionar veículo.
4. Editar cliente.
5. Excluir cliente.
6. Recarregar a página.
7. Confirmar que o cliente excluído não voltou.
