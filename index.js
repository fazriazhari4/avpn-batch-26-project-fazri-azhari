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
import cors from "cors";

// bootstrap aplikasi Express
const app = express();   // webserver
const upload = multer(); // yang nge-handle file upload

// bootstrap GoogleGenAI
const ai = new GoogleGenAI({});

// method chaining --> e.g. console.log() atau ai.interactions.create()
app.use(express.static("public"))
app.use(cors());
app.use(express.json());

// route handling
// app.get('/', (req, res) => {
//   console.log("Akses masuk: '/'");

//   res.json({ message: "Healthy" });
// });

//app.post("/chat")
// app.post("/chat", async (req, res) => {
//   const { conversation } = req.body;

//   try {
//     if(!Array.isArray(conversation)) {
//       return res.status(400).json({error: "Harus array woy!!!"});
//     }

//     const aiResponse = await ai.interactions.create({
//       input: conversation,
//       model: "gemma-4-26b-a4b-it",
//       generation_config: {
//         temperature: 0.9,
//         top_p: 0.9
//       },
//       system_instruction: "Jawab dengan Bahasa Indonesia"
//     })
    
//     return res.status(200).json({ result: aiResponse.output_text });
//   } catch(e) {
//     console.log(e);
//     return res.status(500).json({ error: "Ada masalah di server kami, nanti kami perbaiki dulu ya!" });
//   }
// });

// app.post("/chat", async (req, res) => {
//   // 1. extract [conversation] dan [interactionId] jika ada, dari [req.body]
//   const { conversation, interactionId } = req.body;
//   // req.body = { conversation: [ { ... } ] }
//   // conversation --> [ {  } ]

//   try {
//     // 2. tambahkan satpam untuk mengecek apakah dia berbentuk array atau bukan
//     // satpam 1 --> cek dia bentuknya array atau bukan
//     if (!Array.isArray(conversation)) {
//       return res.status(400).json({ error: "Messages must be an array!!!!!!1!" });
//     }

//     const payload = {
//       // conversation harus berisi --> { role: 'user' | 'model', type: 'text', text: '<isi-teksnya>' } dalam bentuk array
//       input: conversation,
//       model: "gemma-4-26b-a4b-it",
//       generation_config: {
//         temperature: 0.9,
//         top_p: 0.9,
//       },
//       system_instruction: "Jawab dengan bahasa Jawa, dan dalam intonasi yang sopan dan nggak kasar!"
//     };

//     // satpam ke-2 --> cek apakah ada [interactionId]
//     if (interactionId) {
//       payload.previous_interaction_id = interactionId;
//     }

//     // 3. lemparkan request ke Gemini API
//     const aiResponse = await ai.interactions.create(payload);

//     // 4. kembalikan hasilnya berupa teks
//     return res.status(200).json({ result: aiResponse.output_text, interactionId: aiResponse.previous_interaction_id });
//   } catch (e) {
//     // kalau error, log dan juga kembalikan pesan error-nya di sini
//     console.log(e);
//     return res.status(500).json({ error: "Ada masalah di server kami, nanti kami perbaiki dulu ya!" });
//   }
// });

app.post("/chat", upload.single("image"), async (req, res) => {
  try {
    let { conversation, interactionId } = req.body;

    // Handle FormData JSON string parsing if conversation is sent as string
    if (typeof conversation === "string") {
      try {
        conversation = JSON.parse(conversation);
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON format for conversation" });
      }
    }

    if (!Array.isArray(conversation)) {
      return res.status(400).json({ error: "Messages must be an array!!!!!!1!" });
    }

    // Append uploaded image if available
    if (req.file) {
      conversation.push({
        type: "image",
        data: req.file.buffer.toString("base64"),
        mime_type: req.file.mimetype,
      });
    }

    const payload = {
      // conversation berisi --> { type: 'text', text: '...' } atau { type: 'image', data: '...', mime_type: '...' }
      input: conversation,
      model: "gemma-4-26b-a4b-it",
      generation_config: {
        temperature: 0.9,
        top_p: 0.9,
      },
      system_instruction: `Kamu adalah asisten konsultan diet dan nutrisi pribadi yang ramah, suportif, dan menggunakan bahasa Indonesia yang santai dan akrab (seperti teman mengobrol).

Tugas utama kamu:
1. Memberikan saran, tips, dan edukasi seputar diet sehat, pola makan, nutrisi, dan gaya hidup sehat.
2. Memberikan REKOMENDASI MENU HARIAN (sarapan, makan siang, makan malam, dan camilan sehat) yang bervariasi dan lezat sesuai tujuan pengguna (misal: defisit kalori, bulking, diet rendah gula, diet tinggi protein, dll).
3. Membantu menghitung atau memberikan estimasi kalori dan nutrisi makanan jika diminta.
4. Menganalisis gambar/foto makanan yang diunggah pengguna, mengidentifikasi jenis makanan/bahan, serta memberikan estimasi kalori, makronutrisi (protein, karbohidrat, lemak), dan tips kesehatan/porsi ideal.

Aturan Penting:
- Gunakan bahasa santai, kasual, dan bersemangat.
- Jika pengguna menanyakan hal di luar topik diet, makanan sehat, nutrisi, atau gaya hidup sehat (seperti teknologi, coding, politik, game, dll.), tolak dengan santai dan ingatkan bahwa kamu hanya berfokus membantu urusan diet dan rekomendasi menu sehat.`
    };

    // satpam ke-2 --> cek apakah ada [interactionId]
    if (interactionId) {
      payload.previous_interaction_id = interactionId;
    }

    // 3. lemparkan request ke Gemini API
    const aiResponse = await ai.interactions.create(payload);

    console.log({ aiResponse });

    // 4. kembalikan hasilnya berupa teks
    return res.status(200).json({ result: aiResponse.output_text, interactionId: aiResponse.id });
  } catch (e) {
    // kalau error, log dan juga kembalikan pesan error-nya di sini
    console.log(e);
    return res.status(500).json({ error: "Ada masalah di server kami, nanti kami perbaiki dulu ya!" });
  }
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