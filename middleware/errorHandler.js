function errorHandler(err, req, res, next) {
  console.error('에러 발생:', err.message);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    error: err.message,
  });
}

module.exports = errorHandler;