import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { getAllCoursesByUserID } from './data-service/course-service';


dotenv.config();


// src/index.js
const app: Express = express();
const port = process.env.PORT;
const cors = require('cors');

app.use(express.json());
app.use(cors());


app.get('/', (req: Request, res: Response) => {
  res.send('Not LMS 249 prototype backend');
});

app.post('/api/course/all', (req:Request, res:Response, next:NextFunction) => {
  

  console.log("[getAllCoursesByUserID] Hit ");

  next();

}, getAllCoursesByUserID);

app.listen(port, () => {
  console.log(`[server]: LMS 249 prototype backend is running at http://localhost:${port}`);
});