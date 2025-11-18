import mysql from "mysql2/promise"
import dotenv from 'dotenv'
dotenv.config({ path: '/.env' })

let db;
const connectToDB = async ()=>{
    try {
        db = await mysql.createConnection(
            {
                host:process.env.DB_HOST,
                user:process.env.DB_USER,
                password:process.env.DB_PASSWORD,
                database:process.env.DB_DATABASE,
            }
        )
        console.log("connected to server")
    } catch (error) {
        console.log("Failed to connect to db")
        console.log(error)
        process.exit(-1)
    }
}



export {connectToDB, db}