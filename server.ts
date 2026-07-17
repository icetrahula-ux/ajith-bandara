import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI client:", e);
}

// System context description for Ajith Bandara's Sanskrit Academy
const SYSTEM_INSTRUCTION = `
You are the scholarly, friendly, and encouraging Sanskrit Language AI Tutor assisting students on the personal website of Mr. Ajith Bandara (අජිත් බංඩාර), an esteemed and veteran Sanskrit Teacher in Sri Lanka.

Teacher Profile & Context:
- Teacher Name: Mr. Ajith Bandara (අජිත් බංඩාර මහතා)
- Profession: Veteran Sanskrit Educator, Scholar, and Counselor (සංස්කෘත භාෂා හා සාහිත්‍ය පිළිබඳ ජ්‍යෙෂ්ඨ ආචාර්ය)
- Offerings: Private & group classes for schools (Grade 6 to Advanced Level), university students, and general language enthusiasts wanting to learn Sanskrit. Conducts interactive classes using multimedia tools.
- Courses Available: 
  1. පිරිවෙන් 1-5 වසර මූලික සංස්කෘත පදනම (Pirivena Grade 1-5 Sanskrit Foundation) - specially designed for monastic/Pirivena students from Year 1 to 5, teaching letters, basic words, chanting, and writing. (Free / Fair contribution. Saturday 9.00 AM)
  2. පාසල් සිසුන් සඳහා සරල සංස්කෘත ප්‍රවේශය (Sanskrit Primer for School Students) - for school kids and beginners of any grade, focusing on fun everyday conversations, basic grammar, and moral subhashitas. (Monthly Rs. 800. Sunday 3.00 PM)
  3. අපොස උසස් පෙළ (A/L) පන්තිය (GCE A/L Class) - full coverage of Grades 12 & 13 syllabus, past paper analysis. (Monthly Rs. 1500. Saturday 4.00 PM)
  4. 6-11 ශ්‍රේණි පාසල් පන්ති (Junior Batches) - foundation, school syllabus, and exam preparation. (Monthly Rs. 1000. Sunday 8.30 AM)
  5. ප්‍රාචීන ප්‍රාරම්භ / මධ්‍යම විභාග (Prachina Exams) - traditional deep studies. (Monthly Rs. 2000. Wednesday 8.00 PM)
  6. වැඩිහිටි සංස්කෘත සරල ප්‍රවේශය (Adult Sanskrit Primer) - Gita and classical literature reading. (Monthly Rs. 1500. Sunday 8.00 PM)
- Classes Available: Online (via Zoom) and physical classes in Sri Lanka.
- Phone Number: +94 75 829 2584 (+94758292584)
- Contact Email: sithuvilidehena207@gmail.com
- User Account: sithuvilidehena207@gmail.com

Your Instructions:
1. Greet users with a traditional Sanskrit blessing: "නමස්කාරේණ ස්වාගතම්!" (Greetings and Welcome!) or "තෙරුවන් සරණයි! ආයුබෝවන්!".
2. You can answer questions about:
   - Sanskrit grammar (Vyakaran, Sandhi, Samasa, Dhatu, Shabda/Declensions).
   - Sanskrit Shlokas and Subhashitas (translations, pronunciation, spiritual and ethical meanings).
   - Famous classics like Bhagavad Gita, Upanishads, Panchatantra, Kalidasa's works, and their relevance to life.
   - Information about Mr. Ajith Bandara's classes, especially the Pirivena Grade 1-5 Foundation course, the School Student Sanskrit introduction course, school syllabus (GCE O/L and A/L), grade levels, and how to enroll.
   - Contact details of Mr. Ajith Bandara (+94 75 829 2584, sithuvilidehena207@gmail.com).
3. If asked in Sinhala, reply in helpful and easy-to-understand Sinhala. If asked in English or Singlish, reply in English or dual-language format.
4. Try to write Sanskrit words in both Devanagari script (देवनागरी) and Sinhala/Latin phonetics for easy pronunciation.
5. Keep your tone scholarly, patient, and highly inspiring to students.
`;

// 1. AI Consult Chatbot Endpoint
app.post("/api/gemini-consult", async (req, res) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!ai) {
    // If Gemini is not loaded, return fallback response
    return res.json({
      reply: "ආයුබෝවන්! මම අජිත් බංඩාර මහතාගේ සංස්කෘත අධ්‍යයන අංශයේ සහය AI උපදේශකයා (Sanskrit AI Assistant). දැනට සේවාදායකයේ Gemini API සක්‍රිය වී නොමැති වුවත්, පන්ති සහ ගුරුතුමා පිළිබඳ මූලික තොරතුරු මා සතුව ඇත. \n\n" +
             "**අජිත් බංඩාර මහතා (Sanskrit Teacher)**\n" +
             "* **ජංගම දුරකථනය:** +94 75 829 2584\n" +
             "* **විද්‍යුත් ලිපිනය:** sithuvilidehena207@gmail.com\n" +
             "* **පන්ති කාණ්ඩ:** \n" +
             "  1. පිරිවෙන් 1-5 වසර මූලික සංස්කෘත පදනම (සෙනසුරාදා උදෑසන 9.00 - නොමිලේ/දායකත්ව)\n" +
             "  2. පාසල් සිසුන් සඳහා සරල සංස්කෘත ප්‍රවේශය (ඉරිදා සවස 3.00 - රු. 800)\n" +
             "  3. 6 ශ්‍රේණියේ සිට අපොස උසස් පෙළ දක්වා සහ ප්‍රාචීන/වැඩිහිටි පන්ති\n\n" +
             "සංස්කෘත ව්‍යාකරණ, ශ්ලෝක විග්‍රහ සහ පන්ති ඇතුළත් කිරීම් පිළිබඳ වැඩිදුර විස්තර සඳහා අපගේ අජිත් බංඩාර ගුරුතුමා සෘජුවම +94 75 829 2584 ඔස්සේ සම්බන්ධ කර ගත හැක. ස්තුතියි!"
    });
  }

  try {
    const formattedHistory = (chatHistory || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `SYSTEM INSTRUCTION:\n${SYSTEM_INSTRUCTION}` }] },
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I'm sorry, I couldn't generate a response.";
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Consult Chat Error:", err);
    res.status(500).json({ error: "Failed to generate AI response: " + err.message });
  }
});

// 2. Dynamic Sanskrit Motto & Study Plan Scroll Generator
app.post("/api/generate-brief", async (req, res) => {
  const { devoteeName, sponsorshipType, dedicationMessage, amount } = req.body;
  // Map parameters from the client for backwards compatibility
  const studentName = devoteeName || "පින්වත් ශිෂ්‍යයා";
  const theme = sponsorshipType || "ප්‍රඥාව / ඥානය";
  const aspiration = dedicationMessage || "සාර්ථක අධ්‍යයන කටයුතු";

  if (!ai) {
    // If Gemini is offline, return a respectful fallback
    return res.json({
      title: "සරස්වතී ශිෂ්‍ය අභිප්‍රේරණ පත්‍රිකාව",
      shloka: "विद्या ददाति विनयं विनयाद् याति पात्रताम्।\nपात्रत्वात् धनमाप्नोति धनाद्धर्मं ततः सुखम्॥",
      transliteration: "vidyā dadāti vinayaṃ vinayād yāti pātratām |\npātratvāt dhanamāpnoti dhanāddharmaṃ tataḥ sukham ||",
      translation: "Vidyā (knowledge) gives Vinaya (humility); from humility comes capability; from capability comes wealth; from wealth comes righteousness, and from that comes happiness.",
      sinhalaTranslation: "පညာව විසින් විනය (හික්මීම) ලබාදේ; විනයෙන් සුදුසුකම් ඇතිවේ; සුදුසුකම් තුළින් ධනයත්, ධනයෙන් ධර්මයත්, ධර්මයෙන් සැබෑ සතුටත් උදාවේ.",
      sponsorshipLevel: "ඥාන ගවේෂක (Knowledge Seeker)",
      message: `අජිත් බංඩාර ගුරුතුමාගේ විශේෂ පණිවිඩය: පින්වත් ${studentName}, ඔබ තෝරාගත් '${theme}' තේමාව යටතේ සංස්කෘත භාෂාව හැදෑරීමට දක්වන උනන්දුව අගය කරමි. '${aspiration}' යන ඔබගේ උදාර පැතුම ඉටුවේවා!`
    });
  }

  try {
    const prompt = `
Generate a beautiful, traditional Sanskrit Inspirational and Study Motivation scroll ("සරස්වතී ශිෂ්‍ය අභිප්‍රේරණ පත්‍රිකාව") based on the following student information:
- Student Name (ශිෂ්‍යයාගේ නම): ${studentName}
- Theme of Interest (අධ්‍යයන තේමාව): ${theme}
- Aspiration/Goal (පෞද්ගලික ප්‍රාර්ථනාව / ඉලක්කය): "${aspiration}"

The response must include an authentic ancient Sanskrit Shloka matching the theme (e.g., from Subhashitas, Bhagavad Gita, or Chanakya Neeti).
Structure your response EXACTLY as a JSON object with the following fields:
{
  "title": "A highly respectful traditional educational title in Sinhala (e.g. 'සරස්වතී වන්දනා සහ අභිප්‍රේරණ පත්‍රිකාව')",
  "shloka": "The selected authentic Sanskrit Shloka in clean Devanagari script (देवनागरी)",
  "transliteration": "The Sanskrit Shloka in clean English/Latin transliteration phonetics",
  "translation": "The translation of the Shloka in fluent English",
  "sinhalaTranslation": "The translation of the Shloka in beautiful literary Sinhala, explaining the deep educational/moral meaning.",
  "sponsorshipLevel": "An elegant honorary student title in Sinhala (e.g. 'සංස්කෘත ශිෂ්‍ය ප්‍රදීප', 'ඥාන ගවේෂක ධුරන්ධර', 'විද්‍යා සාධක වීරෝදාර')",
  "message": "An encouraging and personalized mentor message in Sinhala from Mr. Ajith Bandara to the student, referencing their specific aspiration, wishing them academic and life success."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Sanskrit Scroll Generator Error:", err);
    res.status(500).json({ error: "Failed to compile Sanskrit scroll: " + err.message });
  }
});

// Serve index.html statically
app.use(express.static(path.join(process.cwd())));
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
