const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chat = async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    if (!process.env.GEMINI_API_KEY) {
      // Simulate typing delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        text: "Hi there! I am your AI Study Assistant. To enable my brain, your administrator needs to add a valid `GEMINI_API_KEY` to the backend's `.env` file! Once added, I can help you summarize notes, explain complex topics, and create study plans!"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
    });

    let formattedHistory = history && Array.isArray(history) ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) : [];

    // Gemini API requires history to start with a 'user' message. If it starts with 'model', drop it.
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const personaPrefix = history && history.length > 0 ? "" : "System Setup: You are an intelligent 'Study Buddy' AI assistant embedded inside StudyBuddyFinder. Help students learn, summarize, and format code. Be polite and concise. User: ";
    const result = await chatSession.sendMessage(personaPrefix + prompt);
    const responseText = result.response.text();

    res.json({ text: responseText });
  } catch (err) {
    console.error('AI Chat Error Details:', err.message, err.stack);
    res.status(500).json({ message: 'Failed to process AI request. Please try again later.', error: err.message });
  }
};
