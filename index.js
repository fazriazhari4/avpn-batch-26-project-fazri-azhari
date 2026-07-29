// import { GoogleGenAI } from "@google/genai";
// import 'dotenv/config';

// const ai = new GoogleGenAI({});

// const interaction = await ai.interactions.create({
//   model: "gemma-4-26b-a4b-it",
//   input: "halo apa kabar?",
// });
// console.log(interaction.output_text);
// import express from "express";
// import multer from "multer";
// import { GoogleGenAI } from "@google/genai";
// import "dotenv/config";

// // bootstrap aplikasi Express
// const app = express();
// const upload = multer();

// // bootstrap GoogleGenAI
// const ai = new GoogleGenAI({});

// // method chaining --> e.g. console.log() atau ai.interactions.create()
// app.use(express.json());

// // route handling
// app.get('/', (req, res) => {
//   console.log("Akses masuk: '/'");
//   res.json({ message: "Healthy" });
// });

// // setup & serve
// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`Masukkk pak Ekooo, di Port: ${PORT}`);
// });

import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// bootstrap aplikasi Express
const app = express();   // webserver
const upload = multer(); // yang nge-handle file upload

// bootstrap GoogleGenAI
const ai = new GoogleGenAI({});

// method chaining --> e.g. console.log() atau ai.interactions.create()
app.use(express.json());

// route handling
app.get('/', (req, res) => {
  console.log("Akses masuk: '/'");

  res.json({ message: "Healthy" });
});

// app.get()
// app.post()
// app.patch()
// app.put()
// app.delete()

app.post(
  '/generate-from-image',
  upload.single('image'),
  async (req, res) => {
    // req.body = { prompt: "Halo dunia!" }
    const { prompt } = req.body; // object destructuring
    // prompt = "Halo dunia!"
    const base64Image = req.file?.buffer.toString('base64');
    //                          ^
    //                          optional method chaining
    const imageMimeType = req.file?.mimetype;

    // try-catch
    // try --> kita "coba" jalankan kodingan di dalam kotak/block { } pertama
    // catch --> kita "tangkap" error yang ditimbulkan di proses `try` tadi
    try {
      const aiResponse = await ai.interactions.create({
        model: "gemma-4-26b-a4b-it",
        input: [
          { type: "text", text: prompt },
          { type: "image", data: base64Image, mime_type: imageMimeType }
        ],
      });

      res.status(200).json({ result: aiResponse.output_text });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: e.message });
    }
  }
);

// setup & serve
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Masukkk pak Ekooo, di Port: ${PORT}`);
});