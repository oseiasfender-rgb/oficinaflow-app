# OFICINAOS V548.20 — FUNCTION RECOVERY

## Objetivo
Recuperar função sem redesenhar layout.

## Aplicado
- Remove resíduos: teste integrado e simulação fictícia.
- Liga inputs do Orçamento ao cálculo.
- Atualiza resumo lateral.
- Calcula cenários.
- Salva orçamento no STATE/localStorage `OficinaOS`.
- Cria nova versão.
- Aprova e envia receita pendente ao Financeiro.
- Abre histórico.
- Gera PDF Premium básico.

## Próximo teste
Abrir `index.html`, preencher Orçamento e verificar se:
1. horas alteram mão de obra;
2. materiais/peças/terceiros alteram total;
3. Salvar orçamento funciona;
4. Aprovar envia lançamento ao Financeiro;
5. botões de teste/simulação sumiram.
