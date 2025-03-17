import jwt from "jsonwebtoken";

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    if(token){
        try {
            const decoded = jwt.verify(token, 'key');
            req.userId = decoded._id;
            next();
        } catch (err) {
            return res.status(403).json({status: {type: 'error', message: 'Рұқсат жоқ!', description: 'Сіз ұсынған token ескірген, қайта кіріңіз'}});
        }
    } else {
        return res.status(403).json({status: {type: 'info', message: 'Қош келдіңіз!', description: 'Жүйемен толық танысу үшін қосылыңыз'}});
    }
}