import mysql from "mysql2/promise"
import dotenv from 'dotenv'
dotenv.config()

let db;
const connectToDB = async ()=>{
    try {
        db = await mysql.createConnection(
            {
                host:process.env.HOST,
                user:process.env.USER,
                password:process.env.PASSWORD,
                database:process.env.DATABASE,
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