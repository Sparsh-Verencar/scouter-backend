import dotenv from 'dotenv'
import express from 'express'
import {connectToDB, db} from './db/db.js'

dotenv.config()
const app = express()

app.get("/",async (req, res)=>{
    res.send("server is running")
})

const startServer = async ()=>{
    await connectToDB()
    const [row] = await db.execute("select * from users")//can be any table from the database used in connection, this is just to test code working
    console.log(row)
    app.listen(process.env.PORT, ()=>{
        console.log(`servers is running on port ${process.env.PORT}`)
    })
}

startServer()

