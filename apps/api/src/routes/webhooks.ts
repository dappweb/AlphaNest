/**
 * Webhook 路由
 * 处理来自外部服务的回调
 */

import { Hono } from 'hono';

const app = new Hono();

/**
 * POST /the-graph
 * The Graph 索引更新通知
 */
app.post('/the-graph', async (c) => {
  // 验证签名
  const signature = c.req.header('X-Graph-Signature');
  // TODO: 验证签名

  const payload = await c.req.json();

  // 处理索引更新
  console.log('The Graph webhook:', payload);

  return c.json({ success: true });
});

/**
 * POST /chainlink
 * Chainlink 预言机更新
 */
app.post('/chainlink', async (c) => {
  const payload = await c.req.json();

  // 处理价格更新
  console.log('Chainlink webhook:', payload);

  return c.json({ success: true });
});

/**
 * POST /rug-detector
 * Rug 检测服务回调
 */
app.post('/rug-detector', async (c) => {
  const payload = await c.req.json();
  const { token_address, chain, is_rugged, confidence, details } = payload;

  if (is_rugged && confidence > 0.8) {
    // 标记代币为 rugged
    await c.env.DB.prepare(`
      UPDATE tokens 
      SET status = 'rugged', rug_detected_at = ?
      WHERE contract_address = ? AND chain = ?
    `).bind(Date.now(), token_address, chain).run();

    // 触发保险结算
    await c.env.TASK_QUEUE.send({
      type: 'SETTLE_INSURANCE',
      payload: { token_address, chain, outcome: 'rug' },
    });

    // 更新 Dev 信誉
    await c.env.TASK_QUEUE.send({
      type: 'UPDATE_DEV_SCORE',
      payload: { token_address, chain, event: 'rug' },
    });
  }

  return c.json({ success: true });
});

export { app as webhookRoutes };
