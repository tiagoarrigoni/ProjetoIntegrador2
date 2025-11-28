import express from 'express';

/**
 * createInfoRouter(db)
 * - db deve expor .getAsync e .runAsync (conforme db wrapper promisificado)
 */
export function createInfoRouter(db) {
    const router = express.Router();

    // middleware de autenticação reutilizável
    function auth(req, res, next) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'Não autorizado' });
        }
        next();
    }

    // POST /info/save-info
    // salva informações pessoais — só permite inserir uma única vez
    router.post('/save-info', auth, async (req, res) => {
        try {
            const { nome_completo, nascimento, peso, altura } = req.body;

            // validação básica
            if (!nome_completo || !nascimento) {
                return res.status(400).json({ message: 'nome_completo e nascimento são obrigatórios' });
            }

            // converte peso/altura se enviados e valida
            const pesoNum = peso !== undefined && peso !== null && peso !== '' ? Number(peso) : null;
            const alturaNum = altura !== undefined && altura !== null && altura !== '' ? Number(altura) : null;

            if (pesoNum !== null && (Number.isNaN(pesoNum) || pesoNum <= 0)) {
                return res.status(400).json({ message: 'peso inválido' });
            }
            if (alturaNum !== null && (Number.isNaN(alturaNum) || alturaNum <= 0)) {
                return res.status(400).json({ message: 'altura inválida' });
            }

            // checar se já existem infos para o usuário
            const existing = await db.getAsync('SELECT id FROM user_info WHERE user_id = ?', [req.session.userId]);
            if (existing) {
                return res.status(409).json({ message: 'Informações já preenchidas e não podem ser alteradas.' });
            }

            await db.runAsync(
                'INSERT INTO user_info (user_id, nome_completo, nascimento, peso, altura) VALUES (?, ?, ?, ?, ?)',
                [req.session.userId, nome_completo, nascimento, pesoNum, alturaNum]
            );

            return res.status(201).json({ message: 'Informações salvas com sucesso!' });
        } catch (err) {
            console.error('Erro /info/save-info:', err);
            return res.status(500).json({ message: 'Erro ao salvar informações', detail: err.message });
        }
    });

    // GET /info/user-info
    // retorna as informações pessoais do usuário (ou campos nulos se não existir)
    router.get('/user-info', auth, async (req, res) => {
        try {
            const info = await db.getAsync('SELECT nome_completo, nascimento, peso, altura FROM user_info WHERE user_id = ?', [
                req.session.userId
            ]);

            if (!info) {
                return res.json({
                    nome_completo: null,
                    nascimento: null,
                    peso: null,
                    altura: null
                });
            }

            // garante tipos corretos no retorno (peso/altura como número ou null)
            return res.json({
                nome_completo: info.nome_completo ?? null,
                nascimento: info.nascimento ?? null,
                peso: info.peso !== null && info.peso !== undefined ? Number(info.peso) : null,
                altura: info.altura !== null && info.altura !== undefined ? Number(info.altura) : null
            });
        } catch (err) {
            console.error('Erro /info/user-info:', err);
            return res.status(500).json({ message: 'Erro ao buscar informações pessoais', detail: err.message });
        }
    });

    return router;
}
