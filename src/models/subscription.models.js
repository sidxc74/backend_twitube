import mongoose, {Schema} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";


const subscriptionSchema = new Schema ({

    subscriber : {
        type : Schema.Types.ObjectId, // who is subscribing
        ref : 'User'
    },
    channel : {
        type : Schema.Types.ObjectId, //to  whom is subscribing
        ref : 'User'
    }


},
{
    timestamps : true
})





export const Subscription = mongoose.model("Subscription",subscriptionSchema)