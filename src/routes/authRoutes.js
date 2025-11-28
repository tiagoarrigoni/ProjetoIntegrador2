// src/routes/authRoutes.js
import express from "express";

/**
 * createAuthRouter(authService)
 * - authService deve implementar register({ username, email, password }) e login({ username, password })
 */
export function createAuthRouter(authService) {
  const router = express.Router();

  // Helper para detectar se a requisição veio de um form HTML
  function isHtmlRequest(req) {
    const ct = req.headers["content-type"] || "";
    const accept = req.headers["accept"] || "";
    // form posts geralmente são application/x-www-form-urlencoded
    return ct.includes("application/x-www-form-urlencoded") || accept.includes("text/html");
  }

  // POST /auth/register
  router.post("/register", async (req, res) => {
    try {
      const { username, email, password, confirm_password } = req.body;

      // validação mínima no servidor
      if (!username || !email || !password) {
        if (isHtmlRequest(req)) {
          return res.redirect("/register.html?error=CamposObrigatorios");
        }
        return res.status(400).json({ message: "Campos obrigatórios faltando" });
      }

      if (confirm_password && password !== confirm_password) {
        if (isHtmlRequest(req)) {
          return res.redirect("/register.html?error=SenhasDivergentes");
        }
        return res.status(400).json({ message: "As senhas não coincidem" });
      }

      // chama o service (pode lançar erro em caso de usuário/email já existente)
      const user = await authService.register({ username, email, password });

      // sucesso — comportamento diferente para HTML vs API
      if (isHtmlRequest(req)) {
        return res.redirect("/index.html?success=1");
      }
      return res.status(201).json({ id: user.id, username: user.username });
    } catch (err) {
      // detecta conflito (mensagem lançada pelo service)
      const msg = (err && err.message) || "Erro no servidor";
      console.error("Erro /auth/register:", err);

      if (isHtmlRequest(req)) {
        // mapeia mensagens para query string (padrão do seu front)
        if (msg.includes("Usuário ou email")) {
          return res.redirect("/register.html?error=UsuarioOuEmailExistente");
        }
        return res.redirect("/register.html?error=ErroServidor");
      }

      // API JSON
      if (msg.includes("Usuário ou email")) {
        return res.status(409).json({ message: msg });
      }
      return res.status(500).json({ message: msg });
    }
  });

  // POST /auth/login  (exemplo básico — usamos sessão no server.js)
  router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        if (isHtmlRequest(req)) return res.redirect("/index.html?error=CamposObrigatorios");
        return res.status(400).json({ message: "Campos obrigatórios faltando" });
      }

      const user = await authService.login({ username, password });

      // cria sessão
      req.session.userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Erro ao salvar sessão:", saveErr);
          if (isHtmlRequest(req)) return res.redirect("/index.html?error=ErroSessao");
          return res.status(500).json({ message: "Erro ao criar sessão" });
        }
        if (isHtmlRequest(req)) {
          return res.redirect("/painel.html");
        } else {
          return res.json({ message: "Logado", id: user.id });
        }
      });
    } catch (err) {
      console.error("Erro /auth/login:", err);
      const msg = (err && err.message) || "Erro no login";
      if (isHtmlRequest(req)) return res.redirect("/index.html?error=CredenciaisInvalidas");
      return res.status(400).json({ message: msg });
    }
  });

  // POST /auth/logout
  router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao destruir sessão:", err);
        if (isHtmlRequest(req)) return res.redirect("/index.html?error=ErroLogout");
        return res.status(500).json({ message: "Erro ao sair" });
      }
      res.clearCookie("connect.sid");
      if (isHtmlRequest(req)) return res.redirect("/index.html?logout=1");
      return res.json({ message: "Desconectado" });
    });
  });

  return router;
}
