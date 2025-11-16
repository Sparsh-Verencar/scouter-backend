import mysql from "mysql2/promise";
import dotenv from 'dotenv';
dotenv.config();

let db;

const connectToDB = async () => {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
        console.log("Connected to MySQL");
    } catch (error) {
        console.log("Failed to connect to db");
        console.log(error);
        process.exit(-1);
    }
};

export { connectToDB, db };
