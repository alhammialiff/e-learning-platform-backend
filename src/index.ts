import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { getAllCourse_SuperUser, getAllCoursesByUserID, getComprehensiveCourseData, getOverviewCourseDataByCourseID, postNewCourse } from './data-service/course-service';
import multer from 'multer';
import { FileMetaData } from './model/FileMetaData';
import { getCurrentTimestamp } from './data-service/time-service';
import { getAllPublicUserData } from './data-service/user-service';
import { postCourseEnrollment } from './data-service/enroll-service';


dotenv.config();


// src/index.js
const app: Express = express();
const port = process.env.PORT || 3005;
const cors = require('cors');

// =================================
// Multer File Upload Config
// =================================
const courseMultimediaUpload = multer({
  
  storage: multer.diskStorage({

    destination: (req: any, file: FileMetaData, cb: any) => {

      cb(null, __dirname + "/course-multimedia/")

    },

    filename: (req: any, file: FileMetaData, cb: any) => {

      const uniqueSuffix = Math.round(Math.random() * 1E9);
      const fileNameWithoutExtension = file.originalname.split('.')[0];
      const fileExtension = file.originalname.split('.')[1];
      const reconstructedFileName = fileNameWithoutExtension + '.' + fileExtension;
      
      cb(null, reconstructedFileName);

    }

  })

});

const courseCoverImageUpload = multer({
  
  storage: multer.diskStorage({

    destination: (req: any, file: FileMetaData, cb: any) => {

      cb(null, __dirname + "/course-multimedia/images/course-image-cover/")

    },

    filename: (req: any, file: FileMetaData, cb: any) => {

      // const uniqueSuffix = Math.round(Math.random() * 1E9);
      const fileNameWithoutExtension = file.originalname.split('.')[0];
      const fileExtension = file.originalname.split('.')[1];
      const reconstructedFileName = fileNameWithoutExtension + '.' + fileExtension;
      
      cb(null, reconstructedFileName);

    }

  })

});

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Not LMS 249 prototype backend');
});

// ==================================
// POST Get Course By Course ID
// ==================================
app.post('/api/course/id', (req:Request, res:Response, next:NextFunction) => {
  
  next();

}, getComprehensiveCourseData);

// ==================================
// POST Get All Users (Public Data)
// ==================================
app.post('/api/user/all', (req:Request, res:Response, next:NextFunction) => {
  

  console.log("[getAllUsers] Hit ");

  next();

}, getAllPublicUserData);

// ==================================
// POST Get All Courses
// ==================================
app.post('/api/course/all', (req:Request, res:Response, next:NextFunction) => {
  

  console.log("[getAllCoursesByUserID] Hit ");

  next();

}, getAllCourse_SuperUser);
// }, getAllCoursesByUserID);


// ==================================
// POST Create New Course 
// Accepts FormData and user-input New Course Data
// ==================================
// app.post('/api/course/new', courseMultimediaUpload.array('files[]'), (req: Request, res: Response, next: NextFunction) => {
app.post('/api/course/new', (req: Request, res: Response, next: NextFunction) => {

  // console.log("[postNewCourse | FormData Upload] Hit", JSON.parse(req.body?.courseData));
  postNewCourse(req, res, next);

});

// ==================================
// POST Upload New Course Multimedia (SHELVED)
// ==================================
app.post('/api/course/new/multimedia-upload', courseMultimediaUpload.array('files[]'), (req: Request, res: Response) => {

  console.log("[postNewCourse | Multimedia Upload] Hit", req.files);

  res.status(200).send({
    status: 200,
    message: "Multimedia Files uploaded successfully",
    timestamp: getCurrentTimestamp()
  })

});

app.post('/api/course/new/course-image-cover-upload', courseCoverImageUpload.array('courseCoverImage'), (req: Request, res: Response) => {

  console.log("[postNewCourse | Multimedia Upload] Hit", req.files);

  res.status(200).send({
    status: 200,
    message: "Course Image Cover File uploaded successfully",
    timestamp: getCurrentTimestamp()
  })

});


// ==================================
// POST Enroll User By User ID
// Accepts Course ID and Array of User IDs
// ==================================
app.post('/api/course/enrollByUser', (req: Request, res: Response, next: NextFunction) => {

  console.log("[postCourseEnrollment] Hit");

  next();

}, postCourseEnrollment);

app.listen(port, () => {
  console.log(`[server]: LMS 249 prototype backend is running at http://localhost:${port}`);
});