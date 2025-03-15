import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Unauthorized User - No Token Provided" });
        }

        // Check if token is blacklisted
        const isBlackListed = await redisClient.get(token);
        if (isBlackListed) {
            res.clearCookie("token"); // ✅ Token ko clear bhi karein
            return res.status(401).json({ error: "Unauthorized User - Token Blacklisted" });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({ error: "Unauthorized User - Token Expired" });
                } else {
                    return res.status(401).json({ error: "Unauthorized User - Invalid Token" });
                }
            }
            req.user = decoded;
            next();
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
