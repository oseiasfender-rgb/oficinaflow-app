# Ofix V546.11.10 Render Fix Standalone

Correção focada no problema de tela branca: esta versão usa um `index.html` standalone, com CSS e JS embutidos, sem dependência de imports ES Modules ou cache de arquivos separados.

Fluxo validado no próprio arquivo:
- mount de todas as abas antes do render;
- Orçamento com resumo, histórico e PDF Premium;
- Aprovar orçamento cria recebível e agenda;
- Financeiro confirma recebível e só então entra no caixa;
- Contas pagas viram despesa;
- Clientes, Agenda, Metas, Relatórios e IA leem STATE consolidado.

Para resetar testes no navegador:
```js
OFIX.reset()
```
