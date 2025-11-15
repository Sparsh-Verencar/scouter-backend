import dotenv from 'dotenv'
import express from 'express'

dotenv.config()
const app = express()

app.get("/", (req, res)=>{
    res.send("server is running")
})

app.listen(process.env.PORT, ()=>{
    console.log(`servers is running on port ${process.env.PORT}`)
})

