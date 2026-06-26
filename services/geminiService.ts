// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CLASSONE_PRODUCTS } from "../data/products";
import { CLASSONE_DATA } from"../pages/knowledgeBase";

// 1. Double check your key at https://aistudio.google.com/
const API_KEY = "AIzaSyDed4DoJusZEVnKw6y24b25lYCrK-hhV3E"; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const getChatResponse = async (userQuery: string, history: any[]) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Stable version for 2026
      systemInstruction: {
        role: "system",
        parts: [{ 
          text: `You are the "Classone Expert" for Durable Fastener Pvt Ltd, Rajkot.
          
          --- COMPANY KNOWLEDGE ---
          ${JSON.stringify(CLASSONE_DATA)}
          
          --- PRODUCT CATALOG ---
          ${JSON.stringify(CLASSONE_PRODUCTS)}
          
          RULES:
          1. Answer TECHNICAL: Use DIN standards (7504, 7505, 18182) from the catalog.
          2. Answer CAREERS: Use the HR email and Rajkot office info from knowledgeBase.
          3. Answer OEM: Explain our manufacturing and private labeling power.
          4. FORMATTING: Use bullet points and bold text for easier reading.
          5. CONTACT: Always give ${CLASSONE_DATA.location} and ${CLASSONE_DATA.company} branding.` 
        }]
      }
    });

    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(userQuery);
    return result.response.text();

  } catch (error: any) {
    console.error("Connection Error:", error);
    throw error;
  }
};
export default getChatResponse;
// REMOVED: export default AIFinder (This belongs in AIFinder.tsx only)