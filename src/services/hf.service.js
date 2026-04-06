const { HfInference } = require('@huggingface/inference');
const { OpenAI } = require('openai');
const { CHAT_MODELS } = require('../config/constants');

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_TOKEN,
});

exports.generateEmbedding = async (text) => {
  try {
    const response = await hf.featureExtraction({
      model: CHAT_MODELS.EMBEDDING,
      inputs: text,
    });
    const vector = Array.isArray(response[0]) ? response[0] : response;
    return vector.slice(0, 384);
  } catch (err) {
    throw new Error(`Neural Embedding Failed: ${err.message}`);
  }
};

exports.generateResponse = async (prompt, context = [], modelType = 'content', history = [], imageBuffer = null) => {
  if (!process.env.HUGGINGFACE_TOKEN) {
    throw new Error('Neural Protocol Error: TOKEN missing.');
  }

  const modelKey = modelType.toUpperCase();
  const selectedModel = CHAT_MODELS[modelKey] || CHAT_MODELS.CONTENT;

  try {
    const contextStr = (Array.isArray(context) && context.length > 0) 
      ? `[KNOWLEDGE BASE CONTEXT]\n${context.join('\n')}\n\n` 
      : "";

    let messages = [{ 
      role: "system", 
      content: "You are Lumina, an expert AI Architect. Provide precise analysis based on text and visual input." 
    }];

    if (Array.isArray(history) && history.length > 0) {
      history.forEach(msg => {
        if (msg.content && typeof msg.content === 'string') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }
    
    if (modelType === 'image_analyzer' && imageBuffer) {
      const base64Image = imageBuffer.toString('base64');
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `${contextStr}${prompt || "Analyze this image."}` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      });
    } else {
      messages.push({ role: "user", content: `${contextStr}${prompt}` });
    }

    const chatResponse = await client.chat.completions.create({
      model: selectedModel,
      messages: messages,
      max_tokens: 4096, 
      temperature: 0.2,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error("Neural Void: No response returned from Router.");
    }

    return chatResponse.choices[0].message.content;

  } catch (err) {
    console.error(`--- NEURAL ENGINE DIAGNOSTICS ---`);
    console.error(`Model: ${selectedModel} | Error: ${err.message}`);
    
    if (err.message.includes('provider')) {
      throw new Error("Neural Link Failure: No active provider for this model. Please try again in 30s.");
    }
    throw new Error(err.message);
  }
};

exports.generateImage = async (prompt) => {
  try {
    return await hf.textToImage({
      model: CHAT_MODELS.IMAGE,
      inputs: prompt,
      parameters: { 
        guidance_scale: 7.5, 
        num_inference_steps: 4 
      }
    });
  } catch (err) {
    throw new Error(`Visual Synthesis Error: ${err.message}`);
  }
};