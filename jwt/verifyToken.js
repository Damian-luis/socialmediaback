var jwt = require('jsonwebtoken');
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(403);
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
       if (err) return res.sendStatus(404);
       req.user = user;
       next();
    });
 }
 module.exports=verifyToken  