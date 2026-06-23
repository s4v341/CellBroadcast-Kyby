const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const { runAsync, getAsync, allAsync } = require('../db/database');
const { broadcastAlert } = require('../services/alertService');

const router = express.Router();

// Listar todos os alertas
router.get('/', async (req, res) => {
  try {
    const alerts = await allAsync(
      'SELECT * FROM alerts WHERE is_active = 1 ORDER BY created_at DESC'
    );
    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).json({ error: 'Erro ao listar alertas' });
  }
});

// Criar novo alerta (ADMIN ONLY)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas admins podem criar alertas.' });
    }

    const { title, message, severity, category, location, expiresIn } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
    }

    const alertId = uuidv4();
    const now = new Date();
    const expiresAt = expiresIn ? new Date(now.getTime() + expiresIn * 1000) : null;

    await runAsync(
      `INSERT INTO alerts (id, title, message, severity, category, location, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [alertId, title, message, severity || 'normal', category, location, req.user.username, expiresAt]
    );

    const alert = {
      id: alertId,
      title,
      message,
      severity: severity || 'normal',
      category,
      location,
      created_by: req.user.username,
      created_at: now.toISOString(),
      expires_at: expiresAt?.toISOString() || null
    };

    // Registrar log
    await runAsync(
      `INSERT INTO logs (action, admin_id, alert_id, details)
       VALUES (?, ?, ?, ?)`,
      ['alert_created', req.user.username, alertId, JSON.stringify(alert)]
    );

    // Transmitir alerta em tempo real
    broadcastAlert('alert:new', alert);

    res.status(201).json({
      success: true,
      message: 'Alerta criado e transmitido com sucesso',
      alert
    });
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

// Deletar alerta (ADMIN ONLY)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas admins podem deletar alertas.' });
    }

    const { id } = req.params;

    const alert = await getAsync('SELECT * FROM alerts WHERE id = ?', [id]);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    await runAsync('UPDATE alerts SET is_active = 0 WHERE id = ?', [id]);

    // Registrar log
    await runAsync(
      `INSERT INTO logs (action, admin_id, alert_id, details)
       VALUES (?, ?, ?, ?)`,
      ['alert_deleted', req.user.username, id, 'Alerta desativado']
    );

    // Transmitir atualização
    global.io.emit('alert:deleted', { id });

    res.json({
      success: true,
      message: 'Alerta deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar alerta:', error);
    res.status(500).json({ error: 'Erro ao deletar alerta' });
  }
});

// Histórico de alertas (ADMIN ONLY)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const logs = await allAsync(
      'SELECT * FROM logs ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
