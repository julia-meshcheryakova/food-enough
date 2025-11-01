# Food Enough – AI Waiter & Menu Assistant
[Live Demo](https://food-enough.lovable.app)

---

## 🚀 Overview  
Food Enough is an AI-powered dining assistant designed to help users with dietary restrictions, allergies, or specific food preferences confidently pick the right dishes when dining out — even when travelling or facing a menu in a foreign language.  
Users create a food profile (allergies, hated/favourite ingredients, dietary goals), upload or take a photo of a restaurant menu, and receive personalised dish recommendations based on their profile. The system uses OCR, translation, dish-analysis and image generation to deliver smart, inclusive, and healthy dining suggestions.

---

## 🎯 Core Features  
- **User Profile** for food preferences: allergens, disliked / favourite ingredients, lifestyle goals.  
- **Menu Upload & Analysis**: photo or text input of menu → parsed into structured dish information.  
- **Recommendation Engine**: filters and ranks menu dishes to produce top-3 matches for the user.  
- **Dish Visualisation**: generated high-quality dish images to enhance visual appeal.  
- **Restaurant Mode** (planned): allow restaurants to embed the assistant for guest-facing experiences.

---

## 🧪 Demo Flow  
1. Set up a profile: specify allergies, hates, favourites, and goals → `/profile`.  
2. Upload a menu image or paste text → `/menu`.  
3. Receive top-3 dish recommendations with reasoning and images.  
4. (Future) Chat with the “AI Waiter” for follow-up questions or special requests.

---

## 🔧 Tech Stack  
- **Frontend:** Built with Lovable (React/Next.js) — rapid UI prototyping and flow design.  
- **Backend:** Deno HTTP server handling API endpoints (menu parsing, dish scoring, image generation).  
- **AI Services:**  
  - OCR & translation → Google Gemini 2.5 Flash Lite  
  - Dish image generation → Gemini 2.5 Flash Image  
- **Hosting:** Demo version hosted via Lovable → Vercel/Deno-Deploy ready for export.  
