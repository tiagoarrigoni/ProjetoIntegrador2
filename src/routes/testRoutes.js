import express from 'express';


export function createTestRouter(testService) {
    const router = express.Router();


    function auth(req, res, next) {
        if (!req.session || !req.session.userId) return res.status(401).json({ message: 'Não autorizado' });
        next();
    }


    router.post('/save-test', auth, async (req, res) => {
        try {
            const { test_type, score } = req.body;
            const inst = await testService.saveTest({ userId: req.session.userId, testType: test_type, score });
            res.json({ message: 'Resultado salvo', result: inst });
        } catch (err) {
            if (err.message.includes('30 dias')) return res.status(409).json({ message: err.message });
            res.status(500).json({ message: err.message });
        }
    });


    router.get('/my-tests', auth, async (req, res) => {
        try {
            const rows = await testService.db.allAsync(
                'SELECT test_type, score, result_text, created_at FROM test_results WHERE user_id = ? ORDER BY created_at DESC',
                [req.session.userId]
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });


    return router;
}