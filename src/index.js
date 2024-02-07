// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path : './env'
})

connectDB()
.then(
    app.listen(process.env.PORT || 4000,()=> {
        console.log(`server started on ${process.env.PORT}`)
    })
)
.catch((err) => {
  console.log("failed db Connections failed !!!!")
})












// approach 1--------------------------
// import express from "express"

// const app = express();
// (async ()=>{

// try{
//    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//    //this is part of express if app can no talk to DB
//    app.on("error",(error)=>{
//     console.log("ERR: ", error)
//    })

//    app.listen(process.env.PORT,()=>{
//     console.log("")
//    })
// }
// catch(error){
//   console.log("Error :",error)
//   throw error
// }

// })()

