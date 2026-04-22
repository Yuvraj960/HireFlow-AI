import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select(
      '+status +onboardingCompleted'
    )
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      })
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      status: user.status,
      onboardingCompleted: user.onboardingCompleted,
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' })
    }
    next(error)
  }
}
