# OficinaOS V601.10 — 7 Abas com IndexedDB

## Abas

1. Orçamento
2. Financeiro
3. Agenda
4. Clientes
5. Metas
6. Relatórios
7. IA

## Persistência

A persistência central foi transferida para IndexedDB:

- banco: `OficinaOSDB`
- object store: `kv`
- chave principal: `state`

Os módulos não chamam mais `localStorage` diretamente. Para preservar os motores visuais antigos sem reescrever cada tela, eles usam memória temporária interna e enviam as alterações ao CORE central.

## Importação e exportação

O JSON agora é importado diretamente para IndexedDB.

Antes da importação, o sistema baixa automaticamente um JSON de segurança com o estado atual.

## Vantagem

IndexedDB aceita volumes muito maiores que os cerca de 5 MB típicos do localStorage, sendo mais adequado para fotos em Base64 e histórico operacional.

## Limite real

IndexedDB ainda depende da quota concedida pelo navegador/dispositivo. O sistema solicita armazenamento persistente e mostra no título do indicador a quota estimada.
