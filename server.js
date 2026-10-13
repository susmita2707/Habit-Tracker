import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app=express();
app.use(cors());
app.use(express.json());

const habitSchema=new mongoose.Schema({
  name:{type:String,required:true},
  description:{type:String,default:""},
  completions:[Date]
},{timestamps:true});

const Habit=mongoose.model("Habit",habitSchema);

app.get("/",(req,res)=>res.json({success:true,message:"Habit Tracker API is running"}));
app.get("/api/habits",async(req,res)=>res.json(await Habit.find().sort({createdAt:-1})));

app.post("/api/habits",async(req,res)=>{
  const habit=await Habit.create({name:req.body.name,description:req.body.description||""});
  res.status(201).json(habit);
});

app.put("/api/habits/:id",async(req,res)=>{
  const habit=await Habit.findByIdAndUpdate(req.params.id,req.body,{new:true});
  if(!habit)return res.status(404).json({message:"Habit not found"});
  res.json(habit);
});

app.delete("/api/habits/:id",async(req,res)=>{
  await Habit.findByIdAndDelete(req.params.id);
  res.json({message:"Habit deleted"});
});

app.post("/api/habits/:id/complete",async(req,res)=>{
  const habit=await Habit.findById(req.params.id);
  if(!habit)return res.status(404).json({message:"Habit not found"});
  const date=new Date(req.body.date||Date.now()); date.setHours(0,0,0,0);
  const index=habit.completions.findIndex(d=>{
    const x=new Date(d);x.setHours(0,0,0,0);return x.getTime()===date.getTime();
  });
  if(index>=0)habit.completions.splice(index,1);else habit.completions.push(date);
  await habit.save();res.json(habit);
});

app.get("/api/habits/:id/progress",async(req,res)=>{
  const habit=await Habit.findById(req.params.id);
  if(!habit)return res.status(404).json({message:"Habit not found"});
  res.json({completedDays:habit.completions.length,habitId:habit._id});
});

mongoose.connect(process.env.MONGO_URI||"mongodb://127.0.0.1:27017/habit_tracker")
.then(()=>app.listen(5000,()=>console.log("Habit Tracker API: http://localhost:5000")))
.catch(err=>console.error("MongoDB error:",err.message));
