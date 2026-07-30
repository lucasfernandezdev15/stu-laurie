const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

const backendOrigin = (
  process.env.EXPO_PUBLIC_API_URL ||
  'https://streaming-backend-vlfm.onrender.com'
).replace(/\/$/, '');

const apiProxy = createProxyMiddleware({
  target: backendOrigin,
  changeOrigin: true,
});

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const url = req.url ?? '';
    if (url.startsWith('/api/') || url === '/api') {
      return apiProxy(req, res, next);
    }
    return middleware(req, res, next);
  };
};

module.exports = config;
