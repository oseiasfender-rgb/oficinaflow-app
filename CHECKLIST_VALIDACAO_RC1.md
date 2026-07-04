# OFICINAOS DOCUMENT ENGINE — RC1 CHECKLIST

## Núcleo
- [ ] DocumentModel Core carregado.
- [ ] STATE Connector carregado.
- [ ] Template Registry carregado.
- [ ] Render Engine carregado.
- [ ] QR Engine carregado.

## Templates
- [ ] Limaprata Premium V2 registrado.
- [ ] OficinaOS Técnico V3 registrado.
- [ ] Laudo Fotográfico registrado.
- [ ] Clean disponível.
- [ ] Checklist de Entrega disponível.
- [ ] Histórico do Veículo disponível.

## Document Center
- [ ] Botão/central aparece.
- [ ] Template selecionável.
- [ ] Visualizar funciona.
- [ ] Imprimir funciona.
- [ ] Baixar HTML funciona.
- [ ] Salvar no histórico funciona.

## Regras de arquitetura
- [ ] Templates não acessam STATE.
- [ ] Templates recebem somente DocumentModel.
- [ ] Render Engine não lê localStorage.
- [ ] QR Engine não lê STATE.
- [ ] Export/Document Center usa DocumentModel.
- [ ] Não há motor paralelo de PDF.

## Teste integrado com OficinaOS
- [ ] Orçamento real gera DocumentModel.
- [ ] Cliente aparece no documento.
- [ ] Veículo aparece no documento.
- [ ] Total aparece no documento.
- [ ] Fotos aparecem quando existirem.
- [ ] QR WhatsApp é montado.
- [ ] Histórico documental salva registro.
