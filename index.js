import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import cors from "cors";

import * as UserController from "./controllers/UserController.js";
import * as TestController from "./controllers/TestController.js";

import checkAuth from "./utils/checkAuth.js";
import * as validation from "./utils/validations.js";
import handleValidationErrors from "./utils/handleValidationErrors.js";
import checkPermission from "./utils/checkPermission.js";
import {config} from 'dotenv';

config();

mongoose
    .connect(process.env.MONGODB)
    .then(()=>console.log('DB connection OK'))
    .catch(err=>console.log('error', err))

const app = express();
 app.use(cors())

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        if(!fs.existsSync('uploads'))
            fs.mkdirSync('uploads');
        cb(null, 'uploads');
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({storage});


app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    console.log(req)
    res.send('Salem Alem!!!!!!');
});

app.post('/login', validation.login, handleValidationErrors, UserController.login);
app.post('/register', validation.register, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);
app.post('/set-setts', UserController.setAccountSettings);

app.get('/quiz/:collectionName/:count', checkAuth, TestController.getQuiz);
app.post('/quiz/checking', checkAuth, TestController.checking);
app.get('/collection/:collectionName', checkAuth, TestController.getCollection);

app.get("/result/:_id/:collectionName", checkAuth, TestController.fetchResult);
app.get("/progress/:_id", checkAuth, TestController.fetchProgress);
app.get("/results/:supervisorId/:collectionName", checkAuth, TestController.fetchResults);

app.post('/test', checkAuth, checkAuth, TestController.add);
app.patch('/test/:id', checkAuth, TestController.update);
app.delete('/test/:id', checkAuth, TestController.remove);

app.get('/score', checkAuth, UserController.getMe);
app.post('/checkMe', checkAuth, TestController.add);

app.post('/upload', checkAuth, upload.single('recfile'), (req, res) => {
    res.json({status: {type: 'success', message: req.file.originalname, description: 'File сәтті сақталды'}, file: {url: `/uploads/${req.file.originalname}`}})
});

app.listen(process.env.PORT || 4444, (err) => {
    if(err) 
        return console.log(err);

    console.log('server OK on ', process.env.PORT || 4444);
})