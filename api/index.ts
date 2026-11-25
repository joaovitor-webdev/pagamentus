import { app } from '../src/app';

// Se a raiz ou rotas de páginas forem interceptadas pelo Express na Vercel, redireciona para /index.html
app.get('/', (_req, res) => {
  res.redirect(301, '/index.html');
});

// Entrypoint Serverless para deploy na plataforma Vercel
export default app;
