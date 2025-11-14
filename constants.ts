import { SceneData } from "./types";

export const GENDER_OPTIONS = ["Female", "Male", "Androgynous"];
export const EXPRESSION_OPTIONS = ["Soft smile", "Natural", "Serious", "Focused", "Joyful", "Surprised"];
export const LIGHTING_OPTIONS = [
  "Natural soft light", 
  "Golden hour", 
  "Studio dramatic light", 
  "Cinematic neon", 
  "Moonlight", 
  "Harsh fluorescent vanity light", 
  "Cool, even fluorescent lighting", 
  "Warm, soft light from an overhead fixture",
  "Direct flash from a camera",
  "Overcast daylight through a window",
  "A single bare lightbulb",
  "Mixed lighting (warm lamp and cool window)"
];
export const MOOD_OPTIONS = ["Cozy", "Elegant", "Professional", "Energetic", "Mysterious", "Calm", "Focused", "Candid", "Lived-in", "Contemplative", "Nostalgic"];
export const NATIONALITY_OPTIONS = [
  "American", "Argentinian", "Australian", "Brazilian", "British", "Canadian", "Chinese", "Colombian", "Dutch",
  "Egyptian", "Ethiopian", "Filipino", "French", "German", "Ghanaian", "Greek", "Indian", "Indonesian", "Irish",
  "Israeli", "Italian", "Jamaican", "Japanese", "Kenyan", "Korean", "Mexican", "New Zealander", "Nigerian",
  "Peruvian", "Polish", "Russian", "Saudi Arabian", "South African", "Spanish", "Swedish", "Thai", "Turkish", "Vietnamese"
];
export const SHOT_TYPE_OPTIONS = ["Full Body", "Half Body (Waist Up)", "Close-up Portrait"];
export const ASPECT_RATIO_OPTIONS: { name: string, value: '1:1' | '3:4' | '9:16' }[] = [
    { name: "Square", value: '1:1' },
    { name: "Portrait", value: '3:4' },
    { name: "Tall Portrait", value: '9:16' }
];

export const MODERN_OUTFITS = [
  "A minimalist oversized beige trench coat over a black turtleneck and wide-leg trousers.",
  "A sleek, tailored black pantsuit with a simple silk camisole underneath.",
  "High-waisted dark wash jeans, a crisp white t-shirt, and a classic leather biker jacket.",
  "A flowing, floral-print midi dress paired with contemporary white sneakers.",
  "A monochromatic athleisure set in a muted earth tone, with chunky sneakers.",
  "An asymmetrical, single-shoulder knit top paired with tailored culottes and heeled mules.",
  "A structured blazer worn over a simple slip dress.",
];

export const AUTHENTIC_OUTFITS = [
  "A classic indigo-dyed jacket with a simple cotton shirt and traditional trousers.",
  "An intricately embroidered tunic and matching trousers made from traditional patterned cloth.",
  "A vibrant, hand-woven cloth wrapped artfully as a traditional dress or robe.",
  "A long, elegant silk tunic worn over wide-legged pants, in a soft pastel color.",
  "A colorful, layered full skirt paired with a beautifully embroidered blouse.",
  "A simple, elegant linen shirt or dress featuring traditional geometric embroidery along the collar and cuffs.",
  "A hand-painted batik sarong paired with a simple, fitted top.",
];

export const NON_SENSUAL_POSES = [
  "Standing naturally",
  "Leaning casually against a wall",
  "Sitting comfortably in an armchair",
  "Walking mid-stride, looking towards the camera",
  "Sitting on steps",
  "Looking thoughtfully out a window",
  "Cross-legged on the floor",
  "Perched on the edge of a desk",
  "Hands in pockets, with a relaxed stance"
];
export const SENSUAL_POSES = [
  "Reclining gracefully on a chaise lounge",
  "Sitting on the edge of a bed, draped in a silk robe",
  "Lying on a plush rug in front of a fireplace",
  "Arching back slightly while stretching",
  "Leaning over a balcony, looking at the view",
  "Partially submerged in a bathtub with flower petals",
  "Draped over a vintage armchair",
  "Lying on their side on soft linens"
];

export const ETHNICITY_FEATURES_MAP: Record<string, string> = {
  "American": "Represents an extremely diverse mix of global ethnicities. For a 'typical' representation, focus on Caucasian, African American, Hispanic, or Asian features, but avoid blending them into a generic look. Be specific, e.g., 'Caucasian with freckles and blue eyes,' or 'African American with high cheekbones and dark skin.' The key is specificity and acknowledging the vast diversity.",
  "Argentinian": "Typically a blend of Southern European features, especially Spanish and Italian. Common traits include olive to fair skin, dark hair (brown to black), and brown or hazel eyes. Facial structures can vary but often reflect Mediterranean ancestry.",
  "Australian": "Historically Anglo-Celtic features are common (fair skin, light-colored eyes, and hair), but modern Australia is highly multicultural. Also represents a significant population of Asian, and Middle Eastern descent, as well as Indigenous Australians with distinct, strong facial features and darker skin tones.",
  "Brazilian": "Represents a rich mix of European, African, and Indigenous ancestries. Skin tones range from very fair to deep brown. Hair can be straight, wavy, or tightly curled. Features are incredibly varied; specificity is key to avoiding stereotypes. It's common to see a mix of features like lighter eyes with darker skin, or Afro-textured hair with a lighter complexion.",
  "British": "Primarily Northern European (Anglo-Saxon, Celtic) features. Skin is often fair, sometimes with freckles. Hair color ranges from blonde and red to brown. Eye colors are diverse, including blue, green, and brown. Modern Britain is also very multicultural, with large South Asian and Afro-Caribbean populations.",
  "Canadian": "Similar to American in its diversity, with a strong European (especially British and French) foundation. Also has large East Asian, South Asian, and Indigenous populations. Specify the heritage for an authentic look, e.g., 'French-Canadian with high cheekbones' or 'Chinese-Canadian with monolids.'",
  "Chinese": "Represents many ethnic groups, but Han Chinese are the majority. Common features include a rounder facial structure, monolids or low-crease double eyelids, and a lower nose bridge. Skin tones range from pale to light tan. Hair is typically straight and black.",
  "Colombian": "A mix of Indigenous, European (mostly Spanish), and African heritage. Skin tones range from fair to medium tan (mestizo) to dark brown. Hair is usually dark brown or black, ranging from straight to curly. Features often include high cheekbones and almond-shaped eyes.",
  "Dutch": "Typically Northern European features. Often characterized by taller statures, fair skin, and light-colored eyes (blue, green). Hair color is commonly blonde to light brown. Facial structures are often angular with prominent jawlines.",
  "Egyptian": "A mix of North African and Middle Eastern features. Skin tones are typically olive to medium brown. Hair is usually dark and thick, often wavy or curly. Facial features often include almond-shaped dark eyes, fuller lips, and strong noses.",
  "Ethiopian": "Distinct East African features. High cheekbones, defined jawlines, and slender facial structures are common. Skin tones range from light brown to deep, rich brown. Eyes are typically dark and almond-shaped. Noses can be narrow and long. Hair is often tightly coiled or curly.",
  "Filipino": "Represents a mix of Austronesian, Spanish, and Chinese heritage. Skin tones range from fair to medium and deep brown. Features include rounder faces, dark eyes, and a flatter nose bridge. Hair is typically dark and straight or wavy.",
  "French": "Predominantly Central and Southern European features. Diverse looks, but common traits include fair to olive skin, a range of hair colors from blonde to dark brown, and varied eye colors. Facial structures can be sharp and defined.",
  "German": "Typically Central and Northern European features. Fair skin, light eyes (blue, green), and blonde or brown hair are common. Facial structures can be strong and angular.",
  "Ghanaian": "West African features are prominent. Skin tones are typically rich dark brown. Features include rounder faces, full lips, and broader noses. Hair is black and tightly coiled. Represents various ethnic groups like Akan and Ewe.",
  "Greek": "Classic Mediterranean features. Olive skin, thick dark hair, and large, dark expressive eyes are common. Facial structures often include strong jawlines and prominent or straight noses.",
  "Indian": "Incredibly diverse, representing numerous ethnic and regional groups. Features vary widely from North to South. Skin tones range from fair wheatish to deep brown. Hair is typically thick, dark, and can be straight, wavy, or curly. Facial features are extremely varied; specify a region (e.g., 'North Indian with sharper features,' 'South Indian with Dravidian features') for better results.",
  "Indonesian": "Austronesian/Malay features are common. Skin tones range from light tan to deep brown. Hair is typically black and straight. Features often include round faces, dark eyes, and a softer nose bridge. Represents hundreds of ethnic groups like Javanese and Sundanese.",
  "Irish": "Celtic features are common. Very fair skin, often with freckles, is characteristic. Red hair is a well-known trait, but brown and blonde hair are more common. Eyes are often light-colored (blue, green).",
  "Israeli": "Highly diverse, representing Jewish people from around the world (Ashkenazi, Sephardic, Mizrahi) as well as Arab citizens. Features can be European, Middle Eastern, or North African. There is no single 'Israeli' look; specificity about background is essential.",
  "Italian": "Mediterranean features, with variation from North to South. Northern Italians may have fairer skin and lighter features, while Southern Italians typically have olive skin, dark hair, and dark eyes. Strong facial features are common.",
  "Jamaican": "Predominantly of African descent. Features reflect a strong West African heritage, often with a mix of European, Indian, and Chinese influences. Skin tones range from light brown to deep dark brown. Hair is typically black and tightly coiled.",
  "Japanese": "Common features include oval or heart-shaped faces with softer jawlines. Eyes are typically almond-shaped, dark brown, and can be monolids or have double eyelids (futae). Noses often have a lower bridge. Skin tones vary from fair ivory to light beige. Hair is predominantly straight and black or very dark brown.",
  "Kenyan": "Represents diverse East African ethnic groups (e.g., Kikuyu, Luo). Features often include high cheekbones, slender builds, and defined facial structures. Skin tones range from medium to very dark brown. Hair is typically black and tightly coiled.",
  "Korean": "Common features include a round or oval face shape, often with high cheekbones. Eyes are typically monolids, and skin tones are generally fair to light beige. Hair is usually straight and black. A defined jawline is also a common trait.",
  "Mexican": "A mix of Indigenous (Amerindian) and European (Spanish) heritage (Mestizo). Features vary greatly. Skin tones range from fair to deep brown. Hair is typically dark brown or black and straight or wavy. Common features include high cheekbones and dark, almond-shaped eyes.",
  "New Zealander": "Predominantly of European (British) descent (Pākehā), with features similar to British or Australian populations. Also includes the indigenous Māori people, who have distinct Polynesian features with strong facial structures, tan skin, and often intricate facial tattoos (tā moko).",
  "Nigerian": "Represents a wide diversity of West African ethnic groups (e.g., Yoruba, Igbo, Hausa). Common features include a variety of facial shapes, prominent cheekbones, fuller lips, and broader noses. Skin tones range widely from deep ebony to rich dark brown. Hair is typically black and tightly coiled.",
  "Peruvian": "Predominantly of Indigenous (Quechua/Aymara) and Mestizo descent. Indigenous features include high cheekbones, tan to brown skin, dark eyes, and straight black hair. Mestizo individuals show a blend of these features with European (Spanish) traits.",
  "Polish": "Slavic/Eastern European features. Typically fair skin, light-colored eyes (blue, grey), and hair colors ranging from blonde to brown. Facial structures often feature prominent cheekbones.",
  "Russian": "Eastern Slavic features are common. A range of features exist, but often include fair skin, light eyes (blue, green, grey), and hair colors from blonde to dark brown. Facial structures can be broad with high cheekbones.",
  "Saudi Arabian": "Peninsular Arab features. Skin tones range from fair to deep brown. Features include large, expressive dark eyes, defined eyebrows, and prominent noses. Hair is typically thick, dark, and wavy or curly.",
  "South African": "Extremely diverse. Represents people of African (e.g., Zulu, Xhosa), European (Afrikaner/British), and mixed-race (Coloured) descent, as well as an Indian population. There is no single look; specify the group for authentic results.",
  "Spanish": "Mediterranean/Iberian features. Olive skin, dark brown hair, and brown eyes are common. Facial structures are often strong and defined.",
  "Swedish": "Nordic/Northern European features. Fair skin, light blonde hair, and blue eyes are stereotypical but common. Facial structures are often angular with sharp cheekbones and jawlines.",
  "Thai": "Southeast Asian features. Skin tones are typically light to medium tan with golden undertones. Faces are often round or oval. Eyes are dark and almond-shaped. Hair is typically black and straight.",
  "Turkish": "A mix of Mediterranean, Middle Eastern, and Central Asian features. Skin tones range from fair to olive. Hair and eyes are typically dark brown. Facial features are diverse, often with strong bone structure.",
  "Vietnamese": "Southeast Asian features, similar to Thai but with regional variations. Common features include rounder faces, softer jawlines, and dark hair. Skin tones are typically light to medium tan.",
};


export const INDOOR_PRESET_OPTIONS: { name: string; data: Partial<SceneData> }[] = [
  {
    name: "Simple Bathroom Mirror",
    data: {
      location: "A simple, standard bathroom, seen through the reflection in the mirror.",
      lighting: "Harsh fluorescent vanity light",
      mood: "Candid",
      shotType: "Half Body (Waist Up)",
      details: "The background shows a shower curtain and some toiletries on the counter. The mirror has a few water spots, giving it a realistic feel."
    }
  },
  {
    name: "Grandma's Kitchen",
    data: {
      location: "The warm and slightly dated kitchen of a grandmother's house.",
      lighting: "Warm, soft light from an overhead fixture",
      mood: "Nostalgic",
      shotType: "Half Body (Waist Up)",
      details: "The countertops are formica, and the cabinets are a warm wood tone. A collection of mismatched mugs hangs from hooks. The air smells of baked goods. The scene is full of love and history."
    }
  },
  {
    name: "Messy Student Dorm Room",
    data: {
      location: "A cluttered but cozy student dorm room, filled with personal items.",
      lighting: "Natural soft light from a single window",
      mood: "Lived-in",
      shotType: "Full Body",
      details: "Posters are taped to the wall, a stack of textbooks sits on the desk next to a laptop, and clothes are draped over a chair. The scene feels authentic and personal."
    }
  },
  {
    name: "Quiet Public Laundromat",
    data: {
      location: "A quiet, slightly old-fashioned public laundromat at an off-peak hour.",
      lighting: "Cool, even fluorescent lighting",
      mood: "Contemplative",
      shotType: "Full Body",
      details: "Rows of silver washing machines line the walls. A few plastic baskets are scattered around. The floor is slightly worn linoleum. The scene is clean but shows signs of age and use."
    }
  },
  {
    name: "Bohemian Living Room",
    data: {
      location: "A cozy, warm, and eclectic Bohemian living room, filled with rich textures and personal touches.",
      lighting: "Golden hour",
      mood: "Cozy",
      shotType: "Full Body",
      details: "Mix patterns and textures freely: macrame wall hangings, a vintage kilim rug, velvet cushions. Include plenty of houseplants (like a monstera or fiddle-leaf fig) and personal items like books, vinyl records, or musical instruments to create a warm, lived-in feel. The air might smell faintly of incense."
    }
  },
  {
    name: "Scandinavian-style Kitchen",
    data: {
      location: "A kitchen embodying Scandinavian design principles: minimalism, functionality, and abundant natural light.",
      lighting: "Natural soft light",
      mood: "Calm",
      shotType: "Half Body (Waist Up)",
      details: "Focus on light wood tones (like ash or pine), clean lines, and an uncluttered sense of order. Add details like handmade ceramic mugs on open shelves, a worn wooden cutting board with fresh herbs, and a minimalist gooseneck faucet."
    }
  },
  {
    name: "Rustic Farmhouse Bathroom",
    data: {
      location: "A charming and rustic farmhouse-style bathroom that feels both cozy and clean, with a connection to the outdoors.",
      lighting: "Natural soft light",
      mood: "Calm",
      shotType: "Full Body",
      details: "Combine natural wood elements (like a reclaimed wood vanity) with vintage fixtures like a clawfoot tub and antique brass fittings. Add simple, honest materials like linen towels, a stone vessel sink, and perhaps a small window looking out onto a green pasture."
    }
  },
  {
    name: "Lofi Study Nook",
    data: {
      location: "A cozy, lofi-inspired study nook at night, perfect for focused work or relaxation.",
      lighting: "Cinematic neon",
      mood: "Focused",
      shotType: "Half Body (Waist Up)",
      details: 'Use warm, soft lighting from a desk lamp mixed with the cool glow of a monitor and a subtle purple or pink neon light. The desk should have personal collectibles like anime figurines or potted succulents, stacks of books, and a sleeping cat curled up nearby to create a calm, nostalgic mood.',
    }
  },
];