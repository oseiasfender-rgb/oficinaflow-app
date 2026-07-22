# Política de Segurança

Não abra issues públicas contendo credenciais, dados pessoais, dumps de banco, tokens, segredos JWT ou informações de clientes.

Relate vulnerabilidades de forma privada ao responsável pelo repositório. Inclua versão afetada, impacto, passos mínimos para reprodução e evidências sanitizadas.

## Segredos

- Nunca versione `.env`.
- Use GitHub Environments e GitHub Actions Secrets.
- Faça rotação imediata de qualquer segredo exposto.
- Dados reais de clientes não devem ser usados em testes públicos.
