import express from 'express'
import dotenv from 'dotenv'
import connectDB from './db/connectDB.js'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user.router.js'
import postRouter from './routes/post.router.js'
import {v2 as cloudinary} from 'cloudinary'
import path, { dirname } from 'path'
import cors from 'cors'


dotenv.config()


connectDB()
const app=express()
app.use(cors())
const Port = process.env.PORT || 8000
const __dirname = path.resolve()
console.log('dirname',__dirname)


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

//middlewares
app.use(express.json({
    limit: '50mb'
  }));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


//Routes
app.use("/api/users",userRouter)
app.use('/api/posts',postRouter)
app.use(express.static(path.join(__dirname,"/client/dist")))
app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"client","dist","index.html"))
})


app.listen(Port,()=>{
    console.log(`server running at ${Port}`)
})