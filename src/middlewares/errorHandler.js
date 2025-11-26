export default function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err)
  res.status(err.status || 500).json({
    message: err.message || 'Server Error'
  })
}
