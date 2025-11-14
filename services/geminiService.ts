

// services/geminiService.ts
import { GoogleGenAI, Modality, Part, Type } from '@google/genai';
import type { ModelData, SceneData, ReferenceData } from '../types';
import { GENDER_OPTIONS, EXPRESSION_OPTIONS, LIGHTING_OPTIONS, MOOD_OPTIONS, SHOT_TYPE_OPTIONS, ETHNICITY_FEATURES_MAP, SENSUAL_POSES, NON_SENSUAL_POSES } from '../constants';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

/**
 * Builds a simplified and direct text prompt specifically for the Imagen model.
 */
const buildImagenPrompt = (modelData: ModelData, sceneData: SceneData, country: string, overallStyle: 'modern' | 'authentic', modelType: 'professional' | 'natural'): string => {
  const persona = modelType === 'professional' ? 'professional model' : 'natural person';
  const sensualTone = modelData.isSensual ? 'Tasteful and sensual portrait photography, ' : '';
  const ethnicFeaturesGuide = ETHNICITY_FEATURES_MAP[country] || 'A diverse range of human features.';

  const prompt = `
    **Primary Subject Mandate (NON-NEGOTIABLE):**
    1.  **Ethnicity & Authenticity:** The person in the photograph MUST be of **${country}** ethnicity.
    2.  **Ethnic Feature Guide (ABSOLUTE RULE):** To achieve this, you MUST strictly follow this guide for authentic facial features: **"${ethnicFeaturesGuide}"**. This guide is the final authority on the subject's appearance, overriding any conflicting part of the description below.
    3.  **Conflict Resolution:** If the 'Model Description' seems to contradict the guide, the **GUIDE ALWAYS WINS**.
    4.  **Diversity Mandate:** Avoid stereotypical representations. For every generation, create a completely unique individual with distinct facial features consistent with the guide. Do not reuse faces.

    **Composition Mandate (NON-NEGOTIABLE):**
    - **Framing:** The photograph MUST be a **${sceneData.shotType}**. This is a strict compositional requirement.

    **Photo Details:**
    - **Type:** A ${sensualTone} hyper-realistic cinematic photograph.
    - **Subject:** A ${modelData.age}-year-old ${modelData.gender} ${persona}.
    - **Pose:** ${modelData.pose}.
    - **Model Description (Guideline Only, overruled by Ethnic Guide):** ${modelData.description}.
    - **Tones (Guideline Only, overruled by Ethnic Guide):** ${modelData.tones}.
    - **Outfit:** ${modelData.outfit}.
    - **Expression:** A ${modelData.expression} expression.
    - **Scene:** In ${sceneData.location}. Mood is ${sceneData.mood}. Scene details: ${sceneData.details}.
    - **Style:** ${overallStyle}, culturally authentic to ${country}.
    - **Camera:** Fujifilm X-T4, Fujinon 35mm f/1.4 lens, Classic Chrome simulation.
    - **Goal:** Indistinguishable from a real photograph. Authentic, lived-in feel. NO CGI, 3D, or artificial look.
  `.replace(/\s+/g, ' ').trim();

  return prompt;
};


/**
 * Builds a detailed text prompt for image generation based on user inputs.
 */
const buildPrompt = (modelData: ModelData, sceneData: SceneData, country: string, referenceData: ReferenceData, overallStyle: 'modern' | 'authentic', modelType: 'professional' | 'natural'): string => {
  const sensualModeDirective = modelData.isSensual 
    ? `\n\n  **Sensual Mode Directive:** The overall tone of the photograph should be intimate, tasteful, and sensual. The mood is calm and personal, focusing on soft textures and forms. Avoid anything explicit or vulgar. The goal is artistic and evocative portraiture.`
    : '';

  const personaDirective = modelType === 'professional'
    ? `\n\n  **Subject Persona (CRITICAL):** The subject is a **Professional Model**. Their pose, expression, and gaze must reflect this. They are confident, skilled, and aware of the camera's presence. Their body language should be deliberate and composed.`
    : `\n\n  **Subject Persona (CRITICAL):** The subject is a **Normal Person**, not a model. The goal is to capture a genuine, candid moment. Their pose, expression, and body language must be completely natural, unposed, and relaxed. They should appear unaware of the camera or as if a friend is taking their picture.`;
    
  const ethnicFeaturesGuide = ETHNICITY_FEATURES_MAP[country] || 'A diverse range of human features.';
    
  const prompt = `
  **Primary Directive:** Create a single, hyper-realistic photograph. The final image must be absolutely indistinguishable from a photo taken by a world-class photographer on a real-world location. The aesthetic is authentic, candid, and deeply cinematic.${sensualModeDirective}${personaDirective}

  **Overall Style Mandate (CRITICAL):** The entire photograph must adhere to a '${overallStyle}' aesthetic. This choice influences everything from the architecture and furniture to the fashion and mood.

  **Cultural Context Adaptation (CRITICAL - HIGHEST PRIORITY):**
  - **Country:** ${country}
  - **Instruction:** This is the most important rule. You MUST interpret and adapt ALL other instructions to be authentic and culturally appropriate for ${country}.
    - **For the subject (NON-NEGOTIABLE):** The generated person's ethnicity and physical features (face, skin, hair, eyes) MUST be 100% representative of a person from **${country}**.
        - **Ethnic Feature Guide (ABSOLUTE RULE):** To achieve this, you MUST strictly follow this guide for authentic facial features: **"${ethnicFeaturesGuide}"**. This guide is the final authority on the subject's appearance.
        - **Diversity Mandate:** Avoid stereotypical representations. For every new generation, create a completely unique individual with distinct facial features consistent with the guide. Do not reuse faces.
        - **Conflict Resolution:** If the "Subject Details" below (like description or tones) conflict with the Ethnic Feature Guide, you MUST **IGNORE** the conflicting details and prioritize the guide. This is the absolute final authority.
    - **For the location:** If a specific style mentioned in the 'Environmental Context' (e.g., 'Scandinavian kitchen') conflicts with the country context (${country}), you MUST creatively merge the two concepts. The core cultural identity of the location MUST be ${country}, with the specified style being an influence. For example, for a 'Scandinavian kitchen' in 'Japan', the result should be a Japanese home that incorporates Scandinavian design principles (minimalism, natural wood, functionality), not a Scandinavian home randomly placed in Japan. Always prioritize the authenticity of the ${country} context.

  **Composition Mandate (NON-NEGOTIABLE):**
  - **Framing:** The photograph MUST be a **${sceneData.shotType}**. This is a strict compositional requirement.

  **CRITICAL Prohibition:**
  - **NO Artificial Framing:** The generated image must NOT have any artificial borders, black frames, vignettes, or any visual effect that suggests a digital frame has been added. The image content must extend to the very edge.
  - **NO CGI/3D Look:** Aggressively avoid any trace of CGI, 3D rendering, video game graphics, or digital artificiality. If a surface looks like plastic or unnaturally smooth, the generation has failed.
  - **NO Stock Photo Vibe:** Avoid sterile, perfectly staged, or overly clean environments. The scene must feel lived-in and natural.

  **Subject Details (Guideline Only, overruled by Ethnic Guide):**
  - **Individual:** A ${modelData.age}-year-old ${modelData.gender} model.
  - **Pose (NON-NEGOTIABLE):** The subject MUST be in the following pose: **${modelData.pose}**.
  - **Physicality:** ${modelData.description}.
  - **Color Tones (Hair, Eyes, Skin):** ${modelData.tones}.
  - **Expression:** A natural, candid ${modelData.expression}. Capture an authentic, unposed moment.
  - **Outfit:** ${modelData.outfit}. Clothing must have realistic weight, creases, and texture.

  **Environmental Context:**
  - **Location:** ${sceneData.location}.
  - **Atmosphere:** A palpable ${sceneData.mood} mood.
  - **Scene Details:** ${sceneData.details}.

  **Mandatory Photographic & Realism Engine:**
  - **Camera & Lens Emulation:** Strictly emulate a **Fujifilm X-T4 with a Fujinon 35mm f/1.4 lens**.
  - **Color & Film Science:** Adhere strictly to the **Fujifilm "Classic Chrome" film simulation**. This means muted, cinematic tones with high color fidelity and a subtle, organic film grain (NOT digital noise).
  - **Lighting Physics:** ${sceneData.lighting}. The lighting must be physically accurate. Demonstrate a deep understanding of how light behaves in the real world: how it wraps around forms, creates soft penumbras, bounces off surfaces to create subtle fill light, and how different color temperatures (e.g., cool window light, warm lamp light) mix realistically.
  - **Lived-In Reality Principle:** This is the highest priority. The scene must feel real and occupied.
    - **Physical Coherence:** All elements must obey the laws of physics. Shadows must be cast from a consistent light source. Reflections in surfaces (glass, metal) must accurately mirror the environment. Objects must show the effect of gravity.
    - **Micro-Imperfections:** Introduce subtle, logical signs of life. A faint coffee cup ring on a a table, almost invisible micro-scratches on a phone screen, a book spine that's slightly creased, dust motes dancing in a sunbeam. These details should be barely noticeable but contribute to the overall authenticity.
    - **Texture Fidelity:** All surfaces must possess high-fidelity, tangible textures. Wood shows grain and pores, fabric has a visible weave, skin reveals natural micro-texture.

  **Reference Photo Instructions (If Provided):**
  ${referenceData.usePhoto && referenceData.photo ? `
    An image is provided as a reference. Adhere to these rules:
    - Style: ${referenceData.useStyle ? 'Strongly match the artistic style, color grading, and aesthetic of the reference.' : 'Ignore the style of the reference.'}
    - Composition: ${referenceData.useComposition ? 'Replicate the composition and camera angle of the reference.' : 'Ignore the composition of the reference.'}
    - Overlays: ${referenceData.keepOverlays ? 'Preserve any text or icons from the reference.' : 'Do not include overlays from the reference.'}
  ` : 'No reference photo provided.'}
  `;
  
  return prompt;
};


/**
 * Generates an image using Gemini based on text and optional image inputs.
 * Returns an array of base64 encoded strings of the generated image(s).
 */
export const generateAIImage = async (
  apiKey: string,
  modelData: ModelData,
  sceneData: SceneData,
  referenceData: ReferenceData,
  country: string,
  overallStyle: 'modern' | 'authentic',
  modelType: 'professional' | 'natural',
  aspectRatio: '1:1' | '3:4' | '9:16',
  numberOfImages: 1 | 4 = 1,
  generationTier: 'premium' | 'standard' = 'premium',
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey });

  // Case 1: Reference photo is provided (Image Editing/Style Transfer)
  // Use gemini-2.5-flash-image, which generates a single image.
  if (referenceData.usePhoto && referenceData.photo) {
    const prompt = buildPrompt(modelData, sceneData, country, referenceData, overallStyle, modelType);
    const parts: Part[] = [{ text: prompt }];
    const imagePart = await fileToGenerativePart(referenceData.photo);
    parts.unshift(imagePart);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return [part.inlineData.data]; // Return as an array with one image
          }
        }
      } else {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason) {
            throw new Error(`Image generation failed. Reason: ${finishReason}. Please adjust your prompt.`);
        }
      }
    } catch (error: any) {
      console.error("Error generating image with Gemini:", error);
      throw new Error(error.message || 'An unknown error occurred during image generation.');
    }

    throw new Error('No image was generated by the AI. Please try adjusting your prompt or reference image.');
  } 
  
  // Case 2: No reference photo (Image Generation)
  else {
    const prompt = buildImagenPrompt(modelData, sceneData, country, overallStyle, modelType);
    
    if (generationTier === 'standard') {
      // Use gemini-2.5-flash-image for "tier 1" generation
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return [part.inlineData.data]; // Return as an array with one image
            }
          }
        } else {
          const finishReason = response.candidates?.[0]?.finishReason;
          if (finishReason) {
            throw new Error(`Image generation failed. Reason: ${finishReason}. This may be due to safety policies.`);
          }
        }
        
        throw new Error('Image generation failed with Standard engine. No image data received.');

      } catch (error: any) {
        console.error("Error generating image with Gemini Flash Image:", error);
        throw new Error(error.message || 'An unknown error occurred during image generation with the Standard engine.');
      }
    } else { // 'premium' tier
      // Use Imagen to generate 1 or more images.
      try {
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: prompt,
          config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          return response.generatedImages.map(img => img.image.imageBytes);
        } else {
          throw new Error('Image generation failed. The model did not return any images. This may be due to safety policies. Please try adjusting your prompt to be less sensitive.');
        }
      } catch (error: any)
      {
        console.error("Error generating images with Imagen:", error);
        throw new Error(error.message || 'An unknown error occurred during image generation.');
      }
    }
  }
};

/**
 * Generates a random model description using Gemini.
 */
export const generateRandomModel = async (apiKey: string, country: string, isSensual: boolean, overallStyle: 'modern' | 'authentic', modelType: 'professional' | 'natural'): Promise<Partial<ModelData>> => {
  const ai = new GoogleGenAI({ apiKey });
  let outfitPrompt: string;
  const creativityDirective = `To ensure variety, be highly creative and avoid common or stereotypical outfits. Your answer MUST be unique and not a repeat of previous generations. VARY THE COLORS, STYLES, AND MATERIALS SIGNIFICANTLY. For example, if you generated a blue silk dress before, consider a red wool coat or a green linen jumpsuit next. Think outside the box and provide a fresh, interesting description of the entire outfit.`;

  if (isSensual) {
    if (overallStyle === 'authentic') {
      outfitPrompt = `This is a tasteful, intimate, and sensual photoshoot. The style is 'Authentic Sensual'. Generate a description of an outfit or draping that is inspired by traditional or cultural fabrics, materials, or garments from ${country}. It MUST be culturally sensitive, respectful, and artistic. Avoid explicit descriptions. Focus on evocative materials and reimagined traditional styles. Examples could include: "artfully draped in a traditional hand-woven Kente cloth," "wearing a translucent, delicately embroidered silk Sari," "an unfastened traditional Moroccan caftan made of velvet, revealing the shoulders." Be creative, elegant, and respectful. ${creativityDirective}`;
    } else { // modern
      outfitPrompt = `This is a tasteful, intimate, and sensual photoshoot. The style is 'Modern Sensual'. Generate a description of a modern, elegant, and sensual outfit. It should be stylish and contemporary. Avoid explicit descriptions. Focus on evocative materials and minimalist styles. Examples could include: "wearing a delicate silk and lace chemise," "a simple, wet, white linen shirt that clings to the form," "a minimalist black bikini by a private pool," or "an oversized cashmere sweater worn off the shoulder." Be creative and chic. ${creativityDirective}`;
    }
  } else {
    if (overallStyle === 'authentic') {
        outfitPrompt = `This is critical. Generate a description of a single, complete outfit. It MUST be stylistically authentic and TRADITIONAL for a person of the specified gender and age in ${country}. Research authentic, historic, or classic cultural styles to provide a culturally relevant and non-sensual outfit description. For example, for Japan: "A classic indigo-dyed Noragi jacket over a simple cotton shirt, paired with traditional 'momohiki' trousers." For Nigeria: "A formal, intricately embroidered 'Buba and Sokoto' ensemble made from traditional adire cloth." Be specific and descriptive. ${creativityDirective}`;
    } else { // modern
        outfitPrompt = `This is critical. Generate a description of a single, complete outfit. It MUST be stylistically CONTEMPORARY AND MODERN for a person of the specified gender and age in ${country}. Research current, everyday, and high-fashion styles to provide a culturally relevant and non-sensual outfit description. For example, for Japan: "A minimalist oversized beige trench coat over a black turtleneck and wide-leg trousers." For Nigeria: "A modern tailored 'Senator' style suit in a deep blue, with subtle embroidery." Be specific and descriptive. ${creativityDirective}`;
    }
  }

  const expressionPersonaPrompt = modelType === 'professional'
    ? `The expression MUST be professional and practiced, suitable for a high-fashion or commercial photoshoot. Think poised, confident, and aware of the camera. Choose from: Soft smile, Serious, Focused.`
    : `The expression MUST be natural and candid, as if capturing a real, unposed moment. Think relaxed, spontaneous, and unaware of the camera. The person should feel like a real person, not a professional model. Choose from: Natural, Joyful, Surprised.`;
    
  const ethnicFeaturesGuide = ETHNICITY_FEATURES_MAP[country] || 'A diverse range of human features.';
  
  const moodForPose = isSensual ? 'sensual, intimate, and artistic' : 'natural, candid, or professional';
  const posePrompt = `Generate a single, new, and creative pose description. The mood is: ${moodForPose}. The subject is a ${modelType}. Be descriptive and evocative, and ensure the pose is unique and not a generic one like 'standing' or 'sitting'. For example, instead of "sitting," describe "sitting on the floor, leaning back on their hands, looking up thoughtfully."`;

  const bodyTypePrompt = isSensual
    ? `The description MUST also include a brief, respectful description of their body type. The body type should be varied for each generation to represent a diverse range of sensual forms, such as "a soft, curvy figure with full hips," "a lean and athletic build with toned muscles," or "a slender and willowy frame." Be creative and avoid repetition.`
    : `The description MUST also include a brief, realistic description of their body type, such as "an average build," "a strong, athletic frame," or "a slim physique."`;


  const prompt = `You are a world-class cultural anthropologist and fashion stylist. Your task is to generate a realistic and unique human model description for a photoshoot, with an ethnicity from ${country}. Your goal is to celebrate the diversity of human appearance.

  **CRITICAL CONTEXT: Ethnic Feature Guide (NON-NEGOTIABLE)**
  To ensure authenticity, you MUST use the following expert guide on the diverse range of features for people from ${country}:
  "${ethnicFeaturesGuide}"

  **Your Task:**
  Provide a JSON object with the following keys: "description", "gender", "age", "expression", "outfit", "tones", "pose".
  - "description": Based on the guide above, create a brief, evocative description of a **unique individual's** facial features AND body type. ${bodyTypePrompt} Be **hyper-specific**. DO NOT repeat the guide; create a concrete example of a person who fits within it.
    - **BAD (Generic):** 'A woman with dark hair.'
    - **GOOD (Specific & Authentic, for Japanese):** 'A woman with a heart-shaped face, soft monolids that curve upwards slightly, and a small, delicate nose. She has a slender, willowy frame.'
  - "gender": Choose one from: ${GENDER_OPTIONS.join(', ')}.
  - "age": A number between 18 and 60. To ensure variety, provide a widely different age for each generation and avoid concentrating in the 20-30 range.
  - "expression": ${expressionPersonaPrompt}
  - "outfit": ${outfitPrompt}
  - "tones": Also based on the guide, describe specific hair, eye, and skin tones.
    - **BAD (Generic):** 'dark skin.'
    - **GOOD (Specific & Authentic, for Nigerian):** 'Deep espresso-brown skin with warm undertones, dark chocolate-brown eyes, and tightly coiled jet-black hair.'
  - "pose": ${posePrompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          gender: { type: Type.STRING, enum: GENDER_OPTIONS },
          age: { type: Type.INTEGER },
          expression: { type: Type.STRING, enum: EXPRESSION_OPTIONS },
          outfit: { type: Type.STRING },
          tones: { type: Type.STRING },
          pose: { type: Type.STRING },
        },
        required: ["description", "gender", "age", "expression", "outfit", "tones", "pose"],
      },
    },
  });
  
  const jsonResponse = JSON.parse(response.text);
  return jsonResponse as Partial<ModelData>;
};

/**
 * Generates a random model description using Gemini.
 */
export const generateRandomDescription = async (apiKey: string, country: string, gender: string, age: number, expression: string): Promise<{ description: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  const ethnicFeaturesGuide = ETHNICITY_FEATURES_MAP[country] || 'A diverse range of human features.';

  const prompt = `You are a world-class cultural anthropologist and character designer. Your task is to generate a realistic and unique human model description for a photoshoot.

  **CRITICAL CONTEXT: Ethnic Feature Guide (NON-NEGOTIABLE)**
  To ensure authenticity, you MUST use the following expert guide on the diverse range of features for people from ${country}:
  "${ethnicFeaturesGuide}"

  **Character Profile:**
  - **Ethnicity:** ${country}
  - **Gender:** ${gender}
  - **Age:** ${age} years old
  - **Expression:** ${expression}

  **Your Task:**
  Provide a JSON object with a single key: "description".
  - "description": Based on ALL the details in the Character Profile and the Ethnic Feature Guide, create a brief, evocative description of this **unique individual's** facial features.
    - The description must be **hyper-specific** and consistent with the specified age. For example, a ${age}-year-old might have subtle signs of aging if appropriate.
    - The description should also reflect the **'${expression}'** expression. For example, a joyful expression might mention smiling eyes or laugh lines.
    - **DO NOT** repeat the guide; create a concrete example of a person who fits within it.
    
    - **BAD (Generic):** 'A woman with dark hair.'
    - **GOOD (Specific & Authentic, for a 25-year-old Japanese woman with a Soft smile):** 'A woman with a heart-shaped face and high cheekbones, her dark, almond-shaped eyes crinkle slightly at the corners, complementing her gentle, soft smile. She has a small, delicate nose.'
    - **GOOD (Specific & Authentic, for a 45-year-old Nigerian man with a Serious expression):** 'A man with a strong, square jaw and prominent cheekbones. His deep-set, intelligent eyes hold a focused gaze under defined brows. There are faint lines etched at the corners of his eyes and on his forehead, indicating maturity.'`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
        },
        required: ["description"],
      },
    },
  });

  return JSON.parse(response.text) as { description: string };
};

const SCENE_GENERATION_PROMPT = `You are a reality simulation engine. Your task is to generate a data profile for an average, everyday location in {COUNTRY}. Your ONLY priority is raw, unpolished realism for a sociological study, NOT aesthetics.

**Core Mandate: Absolute Realism (NON-NEGOTIABLE)**
Your goal is to describe a scene that is 100% authentic and commonplace.

**MANDATE FOR MUNDANITY (ABSOLUTE RULE):**
- **AVOID:** Designer furniture, perfect cleanliness, trendy decor, flawless architecture, artfully arranged clutter, idealized "golden hour" lighting unless it's genuinely happening through a dusty window.
- **INCLUDE:** Normal signs of wear and tear (scuff marks, faded paint), generic non-designer items, unplanned clutter (a pile of mail, charging cables), imperfections (a slightly crooked picture frame), and culturally specific *commonplace* items.

**CRITICAL INSTRUCTION: Cultural Authenticity is Paramount**
The mundane details MUST be culturally specific. A typical kitchen in Vietnam is different from one in Mexico.

Provide a JSON object with the following keys: "location", "lighting", "mood", "details".
- "location": Describe a precise, real-world-inspired location following the realism mandate.
- "lighting": Choose one from: ${LIGHTING_OPTIONS.join(', ')}.
- "mood": Choose one from: ${MOOD_OPTIONS.join(', ')}.
- "details": Provide 2-3 sensory and physical details that ground the scene in unpolished reality (e.g., "The low hum of a refrigerator, scuff marks on the linoleum floor, the smell of old coffee.").`;


/**
 * Generates a random scene description using Gemini.
 * Returns a partial SceneData object.
 */
export const generateRandomScene = async (apiKey: string, country: string, gender: string, overallStyle: 'modern' | 'authentic'): Promise<Partial<SceneData>> => {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = SCENE_GENERATION_PROMPT.replace('{COUNTRY}', country);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING },
          lighting: { type: Type.STRING, enum: LIGHTING_OPTIONS },
          mood: { type: Type.STRING, enum: MOOD_OPTIONS },
          details: { type: Type.STRING },
        },
        required: ["location", "lighting", "mood", "details"],
      },
    },
  });

  const jsonResponse = JSON.parse(response.text);
  return jsonResponse as Partial<SceneData>;
};

/**
 * Generates a random INDOOR scene description using Gemini.
 * Returns a partial SceneData object.
 */
export const generateRandomIndoorScene = async (apiKey: string, country: string, gender: string, overallStyle: 'modern' | 'authentic'): Promise<Partial<SceneData>> => {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = SCENE_GENERATION_PROMPT.replace('{COUNTRY}', country) + "\n The location must be an INDOOR scene.";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING },
          lighting: { type: Type.STRING, enum: LIGHTING_OPTIONS },
          mood: { type: Type.STRING, enum: MOOD_OPTIONS },
          details: { type: Type.STRING },
        },
        required: ["location", "lighting", "mood", "details"],
      },
    },
  });

  const jsonResponse = JSON.parse(response.text);
  return jsonResponse as Partial<SceneData>;
};

/**
 * Generates a random outfit description using Gemini.
 */
export const generateRandomOutfit = async (apiKey: string, country: string, gender: string, isSensual: boolean, overallStyle: 'modern' | 'authentic'): Promise<{ outfit: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  let outfitPrompt: string;
  const creativityDirective = `To ensure variety, be highly creative and avoid common or stereotypical outfits. Your answer MUST be unique and not a repeat of previous generations. Think outside the box and provide a fresh, interesting description.`;

  if (isSensual) {
    if (overallStyle === 'authentic') {
      outfitPrompt = `This is a tasteful, intimate, and sensual photoshoot. The style is 'Authentic Sensual'. Generate a description of an outfit or draping that is inspired by traditional or cultural fabrics, materials, or garments from ${country}. It MUST be culturally sensitive, respectful, and artistic. Avoid explicit descriptions. Focus on evocative materials and reimagined traditional styles. Examples could include: "artfully draped in a traditional hand-woven Kente cloth," "wearing a translucent, delicately embroidered silk Sari," "an unfastened traditional Moroccan caftan made of velvet, revealing the shoulders." Be creative, elegant, and respectful. ${creativityDirective}`;
    } else { // modern
      outfitPrompt = `This is a tasteful, intimate, and sensual photoshoot. The style is 'Modern Sensual'. Generate a description of a modern, elegant, and sensual outfit. It should be stylish and contemporary. Avoid explicit descriptions. Focus on evocative materials and minimalist styles. Examples could include: "wearing a delicate silk and lace chemise," "a simple, wet, white linen shirt that clings to the form," "a minimalist black bikini by a private pool," or "an oversized cashmere sweater worn off the shoulder." Be creative and chic. ${creativityDirective}`;
    }
  } else {
    if (overallStyle === 'authentic') {
        outfitPrompt = `This is critical. Generate a description of a single, complete outfit. It MUST be stylistically authentic and TRADITIONAL for a person of the specified gender in ${country}. Research authentic, historic, or classic cultural styles to provide a culturally relevant and non-sensual outfit description. For example, for Japan: "A classic indigo-dyed Noragi jacket over a simple cotton shirt, paired with traditional 'momohiki' trousers." For Nigeria: "A formal, intricately embroidered 'Buba and Sokoto' ensemble made from traditional adire cloth." Be specific and descriptive. ${creativityDirective}`;
    } else { // modern
        outfitPrompt = `This is critical. Generate a description of a single, complete outfit. It MUST be stylistically CONTEMPORARY AND MODERN for a person of the specified gender in ${country}. Research current, everyday, and high-fashion styles to provide a culturally relevant and non-sensual outfit description. For example, for Japan: "A minimalist oversized beige trench coat over a black turtleneck and wide-leg trousers." For Nigeria: "A modern tailored 'Senator' style suit in a deep blue, with subtle embroidery." Be specific and descriptive. ${creativityDirective}`;
    }
  }

  const prompt = `You are a world-class cultural anthropologist and fashion stylist. Your task is to generate a single, realistic, and unique outfit description for a photoshoot set in ${country} for a ${gender}.
  **CRITICAL INSTRUCTION:** ${outfitPrompt}
  Provide a JSON object with a single key: "outfit".`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          outfit: { type: Type.STRING },
        },
        required: ["outfit"],
      },
    },
  });

  return JSON.parse(response.text) as { outfit: string };
};

/**
 * Generates a random pose description using Gemini.
 */
export const generateRandomPose = async (apiKey: string, isSensual: boolean, modelType: 'professional' | 'natural'): Promise<{ pose: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  const existingPoses = isSensual ? SENSUAL_POSES : NON_SENSUAL_POSES;
  const mood = isSensual ? 'sensual, intimate, and artistic' : 'natural, candid, or professional';
  const persona = modelType === 'professional' ? 'a professional model' : 'a normal person in a candid moment';

  const prompt = `You are a creative director for a photoshoot. Generate a single, new, and creative pose description for a subject.
  - The mood is: ${mood}.
  - The subject is: ${persona}.
  - The pose must NOT be a simple variation of any of these common poses: ${existingPoses.join(', ')}.
  - Be descriptive and evocative. For example, instead of "sitting," describe "sitting on the floor, leaning back on their hands, looking up thoughtfully."

  Provide a JSON object with a single key: "pose".`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pose: { type: Type.STRING },
        },
        required: ["pose"],
      },
    },
  });

  return JSON.parse(response.text) as { pose: string };
};


/**
 * Adapts a scene preset to a specific country's cultural context using Gemini.
 */
export const adaptScenePreset = async (
  apiKey: string,
  presetData: Partial<SceneData>,
  country: string
): Promise<Partial<SceneData>> => {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a reality simulation engine. Your task is to adapt a preset scene concept into a 100% realistic data profile for an average, everyday location in ${country}.
  
  **Core Mandate: Absolute Realism, NOT Aesthetics (NON-NEGOTIABLE)**
  Your ONLY priority is raw, unpolished realism. AVOID glossy, idealized, or "influencer" aesthetics at all costs.

  **MANDATE FOR MUNDANITY (ABSOLUTE RULE):**
  - **AVOID:** Designer furniture, perfect cleanliness, trendy decor.
  - **INCLUDE:** Normal signs of wear and tear, generic non-designer items, unplanned clutter, and culturally specific *commonplace* items.

  **Adaptation Task:**
  - **Original Scene Concept:** ${presetData.location}
  - **Original Scene Details:** ${presetData.details}
  - **Target Country:** ${country}

  **Instruction (CRITICAL):**
  Take the *essence* of the preset and filter it through your realism engine for ${country}. If the preset is "Grandma's Kitchen", you MUST describe a REAL, slightly messy, lived-in kitchen of a typical, non-wealthy grandmother in ${country}. It must NOT be a stylized, perfectly clean "farmhouse chic" kitchen. It must have authentic, culturally specific clutter.

  Provide a JSON object with two keys: "location" and "details".
  - "location": The rewritten, realistic, culturally-adapted location description.
  - "details": The rewritten, realistic, culturally-adapted details with sensory information that ground the scene in unpolished reality.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING, description: "The rewritten, culturally-adapted location description." },
            details: { type: Type.STRING, description: "The rewritten, culturally-adapted details with sensory information." },
          },
          required: ["location", "details"],
        },
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse as Partial<SceneData>;
  } catch (error: any) {
    console.error("Error adapting scene preset:", error);
    throw new Error("Failed to adapt scene preset. Please try again or manually edit the fields.");
  }
};