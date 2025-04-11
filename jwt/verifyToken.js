var jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Comentamos la verificación del token
    // const authHeader = req.headers["authorization"];
    // const token = authHeader && authHeader.split(" ")[1];
    // if (!token) {
    //     return res.status(401).json({ message: "No token provided" });
    // }
    // jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    //     if (err) {
    //         return res.status(401).json({ message: "Invalid token" });
    //     }
    //     req.userId = decoded.id;
    //     next();
    // });
    next();
};

module.exports = verifyToken;  