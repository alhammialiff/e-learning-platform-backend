import { Course } from "../model/Course";
import { Request, Response, NextFunction, response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentTimestamp } from "./time-service";

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
