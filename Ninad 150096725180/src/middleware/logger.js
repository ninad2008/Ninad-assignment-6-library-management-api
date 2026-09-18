/**
 * Request Logging Middleware
 * Logs incoming requests with method, URL, timestamp, user info, and response latency
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userIdentifier = req.user ? `${req.user.email} (${req.user.role})` : 'Anonymous/Guest';
    const status = res.statusCode;

    let statusColor = '\x1b[32m'; // Green for 2xx
    if (status >= 400 && status < 500) {
      statusColor = '\x1b[33m'; // Yellow for 4xx
    } else if (status >= 500) {
      statusColor = '\x1b[31m'; // Red for 5xx
    }
    const resetColor = '\x1b[0m';

    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${statusColor}${status}${resetColor} - ${duration}ms - User: ${userIdentifier}`
    );
  });

  next();
};

module.exports = { requestLogger };
