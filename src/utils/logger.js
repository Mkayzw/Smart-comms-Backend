const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log response on finish
  const oldSend = res.send;
  res.send = function (data) {
    console.log(`[${timestamp}] ${method} ${url} - Status: ${res.statusCode}`);
    oldSend.apply(res, arguments);
  };

  next();
};

module.exports = logger;

