# OficinaOS V547.09 — REAL DATA ENGINE

Motor de conversão compatível com o backup real da oficina.

## Entrada reconhecida
- `ALL_TX`
- `contas`
- `jobs`
- `clientes`
- `metaPrincipal`
- `metasCat`
- `dasStatus`

## Saída V547
- `financeiro.lancamentos`
- `financeiro.contas`
- `agenda.os`
- `clientes`
- `veiculos`
- `metas`

## Uso
1. Suba todos os arquivos no GitHub Pages.
2. Abra o Painel.
3. Clique em Importar.
4. Selecione `OficinaOS-backup-2026-06-27.json`.
5. O alerta deve mostrar as contagens convertidas.
6. Confira Financeiro, Agenda, Relatórios e Metas.

## Observação
Este motor não altera o backup original. Ele lê o legado, converte para o STATE V547 e os próximos backups já sairão no formato moderno.
