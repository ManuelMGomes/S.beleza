# Deploy no Render e Vercel

## O que vai para cada plataforma

- `backend/` -> Render Web Service
- `frontend/` -> Vercel Project
- `Postgres` -> Render Database
- `Redis/Key Value` -> Render Key Value

## Arquivos preparados neste repositório

- `render.yaml`: cria backend + Postgres + Key Value no Render por Blueprint
- `frontend/vercel.json`: habilita deep links da SPA no Vercel
- `frontend/.env.production.example`: mostra a variável `VITE_API_BASE_URL` esperada no frontend

## Render

1. Envie o repositório para GitHub ou GitLab.
2. No Render, escolha `New +` -> `Blueprint`.
3. Aponte para este repositório.
4. O Render vai ler `render.yaml` da raiz.
5. Quando ele pedir `CORS_ORIGINS`, informe as URLs do frontend.

Exemplo:

```text
https://seu-projeto.vercel.app,https://app.seudominio.com
```

6. Faça o sync do Blueprint.
7. Depois que o backend subir, copie a URL pública dele.

Exemplo:

```text
https://genomni-salon-api.onrender.com
```

## Vercel

1. No Vercel, crie um novo projeto apontando para este repositório.
2. Em `Root Directory`, selecione `frontend`.
3. Confirme o framework como `Vite`.
4. Em `Environment Variables`, crie:

```text
VITE_API_BASE_URL=https://SEU_BACKEND.onrender.com/api/v1
```

5. Faça o deploy.

## Pós-deploy

Teste:

- Frontend: `/`
- Login: `/login`
- Cadastro: `/register`
- Backend health: `/health`

Exemplo:

```text
https://seu-backend.onrender.com/health
```

## Super admin

O projeto pode criar ou promover automaticamente um super admin no startup do backend se estas variaveis estiverem configuradas no Render:

```text
SUPER_ADMIN_EMAIL=seu@email.com
SUPER_ADMIN_PASSWORD=uma-senha-forte
SUPER_ADMIN_NAME=Seu Nome
```

Depois de salvar essas variaveis, faca um redeploy do backend.

Se preferir, tambem e possivel criar manualmente com o CLI:

```bash
python -m app.cli create-super-admin --email seu@email.com --password 'uma-senha-forte' --name 'Seu Nome'
```

Execute esse comando no Shell do serviço `backend` no Render, dentro de `backend/`.
