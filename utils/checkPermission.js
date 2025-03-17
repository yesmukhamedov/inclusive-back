import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";

export default async (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    if(token){
        try {
            if(await UserModel.findById(jwt.verify(token, 'key')._id).parrent)
                return res.status(403).json({status: 'error', message: 'Рұқсат жоқ!'});
            next();
        } catch (err) {
            return res.status(403).json({status: 'error', message: 'Рұқсат жоқ!'});
        }
    } else {
        return res.status(403).json({status: 'error', message: 'Рұқсат жоқ!'});
    }
}