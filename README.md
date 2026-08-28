# CorrigeAI Turbo

Quero criar um micro app para estudantes do ENEM chamado CorrigeAI. O app é focado em redaçoes, o aluno coloca a redação dele la e a IA corrige de acordo com a estrutura do ENEM e a forma como os corretores corrigem tbm. Vou alcançar as pessoas por meio do trafego pago, esse app precisa alcançar aqueles publico de estudantes que estão desesperados e precisam estudar em cima da hora faltando 1 mes ou 2 meses ou ate menos. preciso de uma copy agressiva e persuasiva atingindo a dor desse pessoa, a pagina nao pode ser MUITO extensa tem que ser certeira e objetiva, a pagina tem que ter AIDA e um FOMO tbm com alguns gatilhos mentais. Quero um desing de pagina mais levado pra cores dopaminergicas, e na pagina mesmo vai ter uma area onde a pessoa pode colar a redação dela que a IA vai corrigir

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/818e1564-6edc-4082-933c-e799ad58743f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## IA e créditos

A correção paga usa a API da OpenAI apenas no servidor. A pré-análise pública é local e não envia a redação para a OpenAI nem para o banco.

1. Aplique as migrations de `supabase/migrations`, incluindo `20260825233000_ai_usage_controls.sql`.
2. Configure no ambiente do servidor as variáveis de `.env.example`. Nunca use o prefixo `VITE_` na chave da OpenAI.
3. Libere primeiro para contas internas e valide débito, idempotência, reembolso e limites diários.
4. Depois da validação, publique para produção.

```sh
OPENAI_API_KEY=sk-...
OPENAI_CORRECTION_MODEL=gpt-5.4-mini
OPENAI_FAST_MODEL=gpt-5.4-nano
AI_DAILY_BUDGET_USD=10
```

Comandos de verificação:

```sh
npm test
npm run build
```
