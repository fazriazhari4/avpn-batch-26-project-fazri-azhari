// import { GoogleGenAI } from "@google/genai";
// import 'dotenv/config';

// const ai = new GoogleGenAI({});

// const interaction = await ai.interactions.create({
//   model: "gemma-4-26b-a4b-it",
//   input: "halo apa kabar?",
// });
// console.log(interaction.output_text);

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

app.post(
  '/generate',
  upload.single('image'),
  async (req, res) => {
    const { prompt } = req.body;

    try {
      // 1. Inisialisasi array input dengan teks prompt utama
      const input = [{ type: "text", text: prompt }];

      // 2. Jika ada file gambar yang diunggah, baru masukkan object image ke array
      if (req.file) {
        input.push({
          type: "image",
          data: req.file.buffer.toString('base64'),
          mime_type: req.file.mimetype
        });
      }

      // 3. Panggil API AI sekali saja
      const aiResponse = await ai.interactions.create({
        model: "gemma-4-26b-a4b-it",
        input: input,
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