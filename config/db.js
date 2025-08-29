import mongoose from "mongoose";

const connectDB = ()=>{
mongoose.connect("mongodb+srv://admin:123@cluster0.mlub9lx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch((err)=>{
    console.log("Error connecting to MongoDB", err);
});
}

export default connectDB;