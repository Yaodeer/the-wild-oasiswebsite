// pages/api/hello.js
import Cors from 'cors';

// 初始化 cors 中间件
const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'], // 允许的 HTTP 方法
  origin: 'http://localhost:3000', // 允许的来源，替换为你的前端 URL
});

// 中间件处理函数
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// 定义 API 路由
export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 处理其他请求
  res.json({ message: 'Hello Everyone!' });
}
