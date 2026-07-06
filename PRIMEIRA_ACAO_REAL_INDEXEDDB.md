# Primeira ação real com IndexedDB

1. Abra o sistema.
2. No console, rode:

```js
await StorageAdapter.status()
CleanStart.verifyZero()
```

3. Se `zero: true`, escolha:

## Começar do zero

- Configurar dados da empresa.
- Cadastrar primeiro cliente real.
- Cadastrar primeiro veículo real.
- Criar primeiro orçamento real.
- Rodar:

```js
await StorageAdapter.backup('primeiro-backup-real')
```

## Importar dados reais

```js
await StorageAdapter.migrateFromLocalStorage()
```

ou use a importação JSON já existente.

4. Depois da importação, rode:

```js
await StorageAdapter.status()
await StorageAdapter.backup('pos-importacao')
```
