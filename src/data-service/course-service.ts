// import { DummyData } from "../models/DummyData";
import { Course } from "../model/Course";
import { Request, Response, NextFunction } from "express";

const pgp = require('pg-promise')();

const getDBTools = () => {
    
    // ================================================
    // DEV ENV TYPE 1: LOCALHOST DB CONNECTION
    //                 Use this when developing locally 
    //                 Frontend -> localhost:4200
    //                 Backend  -> localhost:3000
    //                 DB       -> localhost:5432
    // ================================================
    const db = pgp('postgres://postgres:password@localhost:5432/LMS-249-Prototype-DB');
    
    
    // ===========================================================================
    // DEV ENV TYPE 2: DOCKER COMPOSE DB CONNECTION
    //                 Use this when developing locally
    //                 Frontend  -> DHCP_ASSIGNED_IP:8080
    //                 Backend   -> DHCP_ASSIGNED_IP:8081
    //                 DB        -> DHCP_ASSIGNED_IP:5432
    // ===========================================================================
    // const db = pgp('postgres://postgres:password@db:5432/Internal-BI-DB');

    const { ParameterizedQuery: PQ } = pgp;      

    return {
        postgresDB: db,
        PQ: PQ
    }
}

const { postgresDB, PQ } = getDBTools();

export const getAllCoursesByUserID = (req: Request, res: Response, next: NextFunction) => {

    const dummyData: any = {...req.body};
    const userID: string = req.body.userID;

    console.log(dummyData);
    
    const query = new PQ({
        text: `SELECT * FROM public.\"enrollments\" WHERE userid = $1`}
    );

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        })

    }

    query.values = [
        // dummyData.id
        userID
    ]

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getAllCoursesByUserID] Response: ", response);

            return res.status(200).json({
                status: 200,
                message: '[Success] Courses by User ID retrieved',
                data: response
            });
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return res.status(500).json({ 
                status: 500,
                message: error,
                data: null
            });
        
        });

};
