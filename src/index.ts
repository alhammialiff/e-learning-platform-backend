import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { getAllCourse_SuperUser, getAllCoursesByUserID, postNewCourse } from './data-service/course-service';
import multer from 'multer';
import { FileMetaData } from './model/FileMetaData';
import { getCurrentTimestamp } from './data-service/time-service';
import { getAllPublicUserData } from './data-service/user-service';


dotenv.config();


// src/index.js
const app: Express = express();
const port = process.env.PORT;
const cors = require('cors');

// =================================
// Multer File Upload Config
// =================================
const upload = multer({
  
  storage: multer.diskStorage({

    destination: (req: any, file: FileMetaData, cb: any) => {

      cb(null, __dirname + "/course-multimedia/")

    },

    filename: (req: any, file: FileMetaData, cb: any) => {

      const uniqueSuffix = Math.round(Math.random() * 1E9);
      const fileNameWithoutExtension = file.originalname.split('.')[0];
      const fileExtension = file.originalname.split('.')[1];
      const reconstructedFileName = fileNameWithoutExtension + '-' + uniqueSuffix + '.' + fileExtension;

      cb(null, reconstructedFileName);

    }

  })

});



app.use(express.json());
app.use(cors());


app.get('/', (req: Request, res: Response) => {
  res.send('Not LMS 249 prototype backend');
});


app.post('/api/user/all', (req:Request, res:Response, next:NextFunction) => {
  

  console.log("[getAllUsers] Hit ");

  next();

}, getAllPublicUserData);


app.post('/api/course/all', (req:Request, res:Response, next:NextFunction) => {
  

  console.log("[getAllCoursesByUserID] Hit ");

  next();

}, getAllCourse_SuperUser);
// }, getAllCoursesByUserID);



app.post('/api/course/new', (req: Request, res: Response, next: NextFunction) => {

  console.log("[postNewCourse | FormData Upload] Hit");

  next();

}, postNewCourse);




app.post('/api/course/new/upload', upload.array('files[]'), (req: Request, res: Response) => {

  console.log("[postNewCourse | Multimedia Upload] Hit", req.file);

  res.status(200).send({
    status: 200,
    message: "Multimedia Files uploaded successfully",
    timestamp: getCurrentTimestamp()
  })

});

app.listen(port, () => {
  console.log(`[server]: LMS 249 prototype backend is running at http://localhost:${port}`);
});