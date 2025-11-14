

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ModelData, SceneData, ReferenceData, OverlayData } from './types';
import { GENDER_OPTIONS, EXPRESSION_OPTIONS, LIGHTING_OPTIONS, MOOD_OPTIONS, NATIONALITY_OPTIONS, SHOT_TYPE_OPTIONS, INDOOR_PRESET_OPTIONS, ASPECT_RATIO_OPTIONS, MODERN_OUTFITS, AUTHENTIC_OUTFITS, SENSUAL_POSES, NON_SENSUAL_POSES } from './constants';
import { generateAIImage, generateRandomModel, generateRandomScene, adaptScenePreset, generateRandomIndoorScene, generateRandomOutfit, generateRandomPose, generateRandomDescription } from './services/geminiService';
import Card from './components/Card';
import Button from './components/Button';
import Input from './components/Input';
import Select from './components/Select';
import Textarea from './components/Textarea';
import Checkbox from './components/Checkbox';
import ImageUpload from './components/ImageUpload';
import OverlayControl from './components/OverlayControl';

const initialModelData: ModelData = {
  description: 'A young woman with long black hair',
  gender: GENDER_OPTIONS[0],
  age: 25,
  expression: EXPRESSION_OPTIONS[0],
  outfit: 'White linen shirt',
  tones: '',
  pose: 'Standing naturally',
  isSensual: false,
};

const initialSceneData: SceneData = {
  location: 'A cozy corner of a sunlit library',
  lighting: LIGHTING_OPTIONS[0],
  mood: MOOD_OPTIONS[0],
  details: 'Dust particles floating in the light rays, shelves filled with old books',
  shotType: SHOT_TYPE_OPTIONS[0],
};

const generationLoadingMessages = [
  "Contacting the AI studio...",
  "Building a new model from scratch...",
  "Setting up the lighting and mood...",
  "Applying the final touches... Almost there!",
];

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini-api-key') || '');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(!!localStorage.getItem('gemini-api-key'));
  
  const [model, setModel] = useState<ModelData>(initialModelData);
  const [scene, setScene] = useState<SceneData>(initialSceneData);
  const [nationality, setNationality] = useState<string>(NATIONALITY_OPTIONS[0]);
  const [overallStyle, setOverallStyle] = useState<'modern' | 'authentic'>('modern');
  const [modelType, setModelType] = useState<'professional' | 'natural'>('professional');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '9:16'>('1:1');
  const [generationTier, setGenerationTier] = useState<'premium' | 'standard'>('standard');
  const [isCountryRandom, setIsCountryRandom] = useState<boolean>(false);
  const [reference, setReference] = useState<ReferenceData>({
    photo: null,
    usePhoto: false,
    useStyle: false,
    useComposition: false,
    keepOverlays: false,
  });
  const [overlays, setOverlays] = useState<OverlayData[]>([]);

  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [generatingCount, setGeneratingCount] = useState<0 | 1 | 4>(0);
  const [isRandomizingModel, setIsRandomizingModel] = useState<boolean>(false);
  const [isRandomizingScene, setIsRandomizingScene] = useState<boolean>(false);
  const [isRandomizingOutfit, setIsRandomizingOutfit] = useState<boolean>(false);
  const [isRandomizingPose, setIsRandomizingPose] = useState<boolean>(false);
  const [isRandomizingDescription, setIsRandomizingDescription] = useState<boolean>(false);
  const [isAdaptingScene, setIsAdaptingScene] = useState<boolean>(false);
  const [isGeneratingRandomly, setIsGeneratingRandomly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(generationLoadingMessages[0]);
  
  const loadingIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isLoading = generatingCount > 0;

  const handleApiKeySave = () => {
    if (apiKeyInput.trim()) {
      const trimmedKey = apiKeyInput.trim();
      localStorage.setItem('gemini-api-key', trimmedKey);
      setApiKey(trimmedKey);
      setIsApiKeySet(true);
    }
  };

  const handleApiKeyChange = () => {
    localStorage.removeItem('gemini-api-key');
    setApiKey('');
    setIsApiKeySet(false);
    setApiKeyInput('');
  };

  useEffect(() => {
    if (reference.usePhoto || !generatedImages || generatedImages.length === 0) {
      setCompositeImage(null);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const loadImage = (src: string): Promise<HTMLImageElement> => 
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
      });

    const drawCompositeImage = async () => {
      try {
        const selectedImage = generatedImages[selectedImageIndex];
        if (!selectedImage) return;

        const baseImg = await loadImage(`data:image/png;base64,${selectedImage}`);
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(baseImg, 0, 0);

        const activeOverlays = overlays.filter(o => o.file && o.preview);
        
        if (activeOverlays.length > 0) {
          const overlayImages = await Promise.all(
            activeOverlays.map(o => loadImage(o.preview!))
          );
          
          overlayImages.forEach((overlayImg, index) => {
            const overlayData = activeOverlays[index];
            const scale = overlayData.scale / 100;
            const w = overlayImg.width * scale;
            const h = overlayImg.height * scale;
            const x = (overlayData.x / 100) * canvas.width - w / 2;
            const y = (overlayData.y / 100) * canvas.height - h / 2;
            ctx.drawImage(overlayImg, x, y, w, h);
          });
        }
        
        setCompositeImage(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("Error composing image on canvas:", err);
        setError("Failed to load an overlay image. Please try re-uploading it.");
      }
    };

    drawCompositeImage();
  }, [generatedImages, selectedImageIndex, overlays, reference.usePhoto]);

  // FIX: Added HTMLTextAreaElement to the event type to support the Textarea component.
  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const inputValue = isCheckbox 
      ? (e.target as HTMLInputElement).checked 
      : (name === 'age' ? parseInt(value, 10) : value);
      
    setModel(prev => ({ ...prev, [name]: inputValue }));
  };

  const handleOutfitChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === 'RANDOMIZE_OUTFIT') {
        setIsRandomizingOutfit(true);
        setError(null);
        try {
            const { outfit } = await generateRandomOutfit(apiKey, nationality, model.gender, model.isSensual, overallStyle);
            setModel(prev => ({ ...prev, outfit }));
        } catch (err: any) {
            setError(err.message || 'Failed to randomize outfit.');
        } finally {
            setIsRandomizingOutfit(false);
        }
    } else {
        setModel(prev => ({ ...prev, outfit: value }));
    }
  };

  const handlePoseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === 'RANDOMIZE_POSE') {
        setIsRandomizingPose(true);
        setError(null);
        try {
            const { pose } = await generateRandomPose(apiKey, model.isSensual, modelType);
            setModel(prev => ({ ...prev, pose }));
        } catch (err: any) {
            setError(err.message || 'Failed to randomize pose.');
        } finally {
            setIsRandomizingPose(false);
        }
    } else {
        setModel(prev => ({ ...prev, pose: value }));
    }
  };
  
  const randomizeForNewCountry = useCallback(async (newCountry: string) => {
    setIsRandomizingModel(true);
    setIsRandomizingScene(true);
    setError(null);
    try {
      // Generate model first to get its gender
      const modelData = await generateRandomModel(apiKey, newCountry, model.isSensual, overallStyle, modelType);
      // Use the new model's gender to generate a culturally and contextually appropriate scene
      const genderForScene = modelData.gender || model.gender;
      const sceneData = await generateRandomScene(apiKey, newCountry, genderForScene, overallStyle);

      // Update state with both new model and scene data
      setModel(prev => ({ ...prev, ...modelData }));
      setScene(prev => ({ ...prev, ...sceneData }));
    } catch (err: any) {
      setError(err.message || 'Failed to auto-randomize for the new country.');
    } finally {
      setIsRandomizingModel(false);
      setIsRandomizingScene(false);
    }
  }, [apiKey, model.gender, model.isSensual, overallStyle, modelType]);

  const handleNationalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setNationality(newCountry);
    // Automatically randomize model and scene when the country changes.
    if (!isCountryRandom) {
      randomizeForNewCountry(newCountry);
    }
  };
  
  const handleCountryRandomizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCountryRandom(e.target.checked);
  };

  const handleSceneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScene(prev => ({ ...prev, [name]: value }));
  };
  
  const handleScenePresetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (!presetName) return;
  
    e.target.value = "";
  
    if (presetName === 'RANDOMIZE_INDOOR') {
      setIsAdaptingScene(true);
      setError(null);
      try {
        const randomIndoorData = await generateRandomIndoorScene(apiKey, nationality, model.gender, overallStyle);
        setScene(prev => ({ ...prev, ...randomIndoorData }));
      } catch (err: any) {
        setError(err.message || 'Failed to generate a random indoor scene.');
      } finally {
        setIsAdaptingScene(false);
      }
      return;
    }
  
    const preset = INDOOR_PRESET_OPTIONS.find(p => p.name === presetName);
    if (!preset) return;
  
    setIsAdaptingScene(true);
    setError(null);
    
    // Immediately apply all of the preset's data, including its recommended shotType.
    // This provides a quick UI update.
    setScene(prev => ({ ...prev, ...preset.data }));
    
    try {
      const adaptedData = await adaptScenePreset(apiKey, preset.data, nationality);
      // Now, update with the adapted location and details, while keeping the rest of the preset data.
      setScene(prev => ({ ...prev, ...preset.data, ...adaptedData }));
    } catch (err: any) {
      setError(err.message || 'Failed to adapt scene. Using default preset values.');
      // If adaptation fails, the preset data is already applied from the line above.
    } finally {
      setIsAdaptingScene(false);
    }
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setReference(prev => {
        const newState = { ...prev, [name]: checked };
        if (name === 'usePhoto' && !checked) {
            newState.photo = null;
            newState.useStyle = false;
            newState.useComposition = false;
            newState.keepOverlays = false;
        }
        return newState;
    });
  };
  
  const handleFileChange = (file: File | null) => {
    setReference(prev => ({...prev, photo: file}));
    if (file) {
      setOverlays([]);
      setCompositeImage(null);
    }
  };

  const handleOverlayFileChange = (id: number, file: File | null) => {
    if (!file) {
      setOverlays(prev => prev.map(o => o.id === id ? { ...o, file: null, preview: null } : o));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setOverlays(prev => prev.map(o => o.id === id ? { ...o, file, preview: reader.result as string } : o));
    };
    reader.readAsDataURL(file);
  };

  const handleOverlayPropChange = (id: number, field: 'x' | 'y' | 'scale', value: string) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, [field]: Number(value) } : o));
  };
  
  const handleAddOverlay = () => {
    if (overlays.length < 5) {
      const newOverlay: OverlayData = {
        id: Date.now(),
        file: null,
        preview: null,
        x: 50,
        y: 50,
        scale: 20,
      };
      setOverlays(prev => [...prev, newOverlay]);
    }
  };

  const handleRandomizeDescription = async () => {
    setIsRandomizingDescription(true);
    setError(null);
    try {
      const { description } = await generateRandomDescription(apiKey, nationality, model.gender, model.age, model.expression);
      setModel(prev => ({ ...prev, description }));
    } catch (err: any) {
      setError(err.message || 'Failed to randomize description.');
    } finally {
      setIsRandomizingDescription(false);
    }
  };

  const handleRandomizeModel = async () => {
    setIsRandomizingModel(true);
    setError(null);
    try {
      const effectiveCountry = isCountryRandom
        ? NATIONALITY_OPTIONS[Math.floor(Math.random() * NATIONALITY_OPTIONS.length)]
        : nationality;
      
      if (isCountryRandom) {
        setNationality(effectiveCountry);
      }

      const randomData = await generateRandomModel(apiKey, effectiveCountry, model.isSensual, overallStyle, modelType);
      setModel(prev => ({
        ...prev,
        ...randomData,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to randomize model.');
    } finally {
      setIsRandomizingModel(false);
    }
  };

  const handleRandomizeScene = async () => {
    setIsRandomizingScene(true);
    setError(null);
    try {
       const effectiveCountry = isCountryRandom
        ? NATIONALITY_OPTIONS[Math.floor(Math.random() * NATIONALITY_OPTIONS.length)]
        : nationality;
      
      if (isCountryRandom) {
        setNationality(effectiveCountry);
      }
      
      const randomData = await generateRandomScene(apiKey, effectiveCountry, model.gender, overallStyle);
      setScene(prev => ({
        ...prev,
        ...randomData,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to randomize scene.');
    } finally {
      setIsRandomizingScene(false);
    }
  };

  const handleGenerateImage = useCallback(async (numImages: 1 | 4) => {
    setGeneratingCount(numImages);
    setError(null);
    setGeneratedImages(null);
    setCompositeImage(null);
    
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }

    try {
      let messageIndex = 0;
      setLoadingMessage(generationLoadingMessages[messageIndex]);
      const intervalId = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % generationLoadingMessages.length;
        setLoadingMessage(generationLoadingMessages[messageIndex]);
      }, 3000);
      loadingIntervalRef.current = intervalId;

      const effectiveCountry = isCountryRandom 
          ? NATIONALITY_OPTIONS[Math.floor(Math.random() * NATIONALITY_OPTIONS.length)] 
          : nationality;
      
      if (isCountryRandom) {
          setNationality(effectiveCountry);
      }
      
      const imagesData = await generateAIImage(apiKey, model, scene, reference, effectiveCountry, overallStyle, modelType, aspectRatio, numImages, generationTier);
      setGeneratedImages(imagesData);
      setSelectedImageIndex(0);

    } catch (err: any) {
      if (err && err.message) {
        try {
          const errorJson = JSON.parse(err.message);
          const apiError = errorJson.error;
          if (apiError) {
            if (apiError.status === 'RESOURCE_EXHAUSTED') {
              setError(
                'BILLING_ERROR:This usually means billing is not enabled for your Google Cloud project. While your key works in AI Studio, using it here requires an active billing account. Please enable billing and try again.'
              );
            } else if (apiError.status === 'INVALID_ARGUMENT') {
               setError(
                'INVALID_KEY_ERROR:The API key is not valid. Please check for typos or restrictions.'
              );
            } else {
              setError(apiError.message || err.message);
            }
          } else {
             setError(err.message);
          }
        } catch (e) {
          if (err.message.toLowerCase().includes('api key not valid')) {
             setError(
              'INVALID_KEY_ERROR:The API key is not valid. Please check for typos or restrictions.'
            );
          } else {
            setError(err.message);
          }
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setGeneratingCount(0);
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
  }, [apiKey, model, scene, reference, nationality, isCountryRandom, overallStyle, modelType, aspectRatio, generationTier]);
  
  const handleGenerateFullyRandom = useCallback(async () => {
    setIsGeneratingRandomly(true);
    setGeneratingCount(1);
    setError(null);
    setGeneratedImages(null);
    setCompositeImage(null);
  
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
  
    try {
      let messageIndex = 0;
      setLoadingMessage(generationLoadingMessages[messageIndex]);
      const intervalId = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % generationLoadingMessages.length;
        setLoadingMessage(generationLoadingMessages[messageIndex]);
      }, 3000);
      loadingIntervalRef.current = intervalId;
  
      // 1. Determine settings for this generation
      const effectiveCountry = isCountryRandom
        ? NATIONALITY_OPTIONS[Math.floor(Math.random() * NATIONALITY_OPTIONS.length)]
        : nationality;
      
      const generationIsSensual = isCountryRandom ? Math.random() < 0.2 : model.isSensual;
      const generationOverallStyle = isCountryRandom ? (Math.random() < 0.5 ? 'modern' : 'authentic') : overallStyle;
      const generationModelType = isCountryRandom ? (Math.random() < 0.5 ? 'professional' : 'natural') : modelType;
      const generationShotType = isCountryRandom
        ? SHOT_TYPE_OPTIONS[Math.floor(Math.random() * SHOT_TYPE_OPTIONS.length)]
        : scene.shotType;
  
      // 2. Generate new data from API
      const newModelData = await generateRandomModel(apiKey, effectiveCountry, generationIsSensual, generationOverallStyle, generationModelType);
      const genderForScene = newModelData.gender || model.gender;
      const newSceneData = await generateRandomScene(apiKey, effectiveCountry, genderForScene, generationOverallStyle);
  
      // 3. Construct the FINAL state objects for the API call AND for the state update
      const finalModelData: ModelData = {
        ...model,
        ...newModelData,
        isSensual: generationIsSensual,
      };
      const finalSceneData: SceneData = {
        ...scene,
        ...newSceneData,
        shotType: generationShotType,
      };
      
      // 4. Update UI state for ALL settings at once so it's in sync with the generation.
      if (isCountryRandom) {
        setNationality(effectiveCountry);
        setOverallStyle(generationOverallStyle);
        setModelType(generationModelType);
      }
      setModel(finalModelData);
      setScene(finalSceneData);
      
      // 5. Generate the image using the final, consistent data
      const imagesData = await generateAIImage(
          apiKey, 
          finalModelData, 
          finalSceneData, 
          {...reference, usePhoto: false},
          effectiveCountry, 
          generationOverallStyle, 
          generationModelType, 
          aspectRatio, 
          1, 
          generationTier
      );
      setGeneratedImages(imagesData);
      setSelectedImageIndex(0);
  
    } catch (err: any) {
       if (err && err.message) {
        try {
          const errorJson = JSON.parse(err.message);
          const apiError = errorJson.error;
          if (apiError) {
            if (apiError.status === 'RESOURCE_EXHAUSTED') {
              setError(
                'BILLING_ERROR:This usually means billing is not enabled for your Google Cloud project. While your key works in AI Studio, using it here requires an active billing account. Please enable billing and try again.'
              );
            } else if (apiError.status === 'INVALID_ARGUMENT') {
               setError(
                'INVALID_KEY_ERROR:The API key is not valid. Please check for typos or restrictions.'
              );
            } else {
              setError(apiError.message || err.message);
            }
          } else {
             setError(err.message);
          }
        } catch (e) {
          if (err.message.toLowerCase().includes('api key not valid')) {
             setError(
              'INVALID_KEY_ERROR:The API key is not valid. Please check for typos or restrictions.'
            );
          } else {
            setError(err.message);
          }
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsGeneratingRandomly(false);
      setGeneratingCount(0);
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
  }, [apiKey, model, scene, reference, aspectRatio, generationTier, isCountryRandom, nationality, overallStyle, modelType]);
  
  const handleDownloadImage = () => {
    const selectedImage = generatedImages ? generatedImages[selectedImageIndex] : null;
    const imageToDownload = compositeImage || (selectedImage ? `data:image/png;base64,${selectedImage}` : null);

    if (imageToDownload) {
      const link = document.createElement('a');
      link.href = imageToDownload;
      link.download = 'ai-generated-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const anyLoading = isLoading || isRandomizingModel || isRandomizingScene || isAdaptingScene || isRandomizingOutfit || isRandomizingPose || isRandomizingDescription || isGeneratingRandomly;
  const selectedImage = generatedImages ? generatedImages[selectedImageIndex] : null;
  const finalImage = compositeImage || (selectedImage ? `data:image/png;base64,${selectedImage}` : null);
  const outfitOptions = overallStyle === 'modern' ? MODERN_OUTFITS : AUTHENTIC_OUTFITS;
  const poseOptions = model.isSensual ? SENSUAL_POSES : NON_SENSUAL_POSES;
  
  const sensualModeText = model.isSensual ? 'Sensual On' : 'Sensual Off';
  const randomButtonText = isCountryRandom 
    ? 'Generate Fully Random Image' 
    : `Generate Random Image (in ${nationality}, ${scene.shotType}, ${sensualModeText})`;

  if (!isApiKeySet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <h2 className="text-2xl font-semibold text-center mb-4">Enter Your API Key</h2>
          <p className="text-gray-600 text-center mb-6">
            Please provide your Google Gemini API key to use the application.
          </p>
          <div className="space-y-4">
            <Input 
              label="Gemini API Key"
              id="apiKey"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your key here"
            />
            <Button onClick={handleApiKeySave} className="w-full">
              Save and Continue
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Your key is stored only in your browser's local storage.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .segmented-control button[aria-selected="true"] {
          background-color: #4f46e5;
          color: white;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .segmented-control button {
          background-color: #e5e7eb;
          color: #374151;
        }
      `}</style>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">AI Studio Image Generator</h1>
          <p className="mt-2 text-lg text-gray-600">Generate realistic, studio-style images from your reference photo and descriptions.</p>
        </header>

        <div className="flex justify-end mb-4">
          <Button onClick={handleApiKeyChange} variant="secondary" className="py-2 px-4 text-sm">
            Change API Key
          </Button>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="w-full space-y-8">
            <Card>
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">1. Generation Mode</h2>
                <div className="space-y-4">
                  <Checkbox 
                    label="Enable Sensual Mode" 
                    id="isSensual" 
                    name="isSensual" 
                    checked={model.isSensual} 
                    onChange={handleModelChange} 
                    disabled={anyLoading}
                  />
                </div>
            </Card>

            <Card>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">2. Overall Style</h2>
              <p className="text-sm text-gray-600 mb-4">Choose the global aesthetic for the clothing, architecture, and mood.</p>
              <div className="flex rounded-lg p-1 bg-gray-200 w-full md:w-auto segmented-control">
                <button 
                  onClick={() => setOverallStyle('modern')}
                  aria-selected={overallStyle === 'modern'}
                  className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                  disabled={anyLoading}
                >
                  Modern
                </button>
                <button 
                  onClick={() => setOverallStyle('authentic')}
                  aria-selected={overallStyle === 'authentic'}
                  className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                  disabled={anyLoading}
                >
                  Authentic
                </button>
              </div>
            </Card>

            <Card>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">3. Model Type</h2>
              <p className="text-sm text-gray-600 mb-4">Choose the subject's persona to influence their expression and pose.</p>
              <div className="flex rounded-lg p-1 bg-gray-200 w-full md:w-auto segmented-control">
                <button 
                  onClick={() => setModelType('professional')}
                  aria-selected={modelType === 'professional'}
                  className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                  disabled={anyLoading}
                >
                  Professional Model
                </button>
                <button 
                  onClick={() => setModelType('natural')}
                  aria-selected={modelType === 'natural'}
                  className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                  disabled={anyLoading}
                >
                  Normal Person
                </button>
              </div>
            </Card>

            <Card>
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">4. Country Reference</h2>
                <p className="text-sm text-gray-600 mb-4">Select a country or let the AI choose one randomly. This sets the context for the model's ethnicity and scene's location.</p>
                <div className="space-y-4">
                  <Select 
                    label="Reference Country" 
                    id="nationality" 
                    name="nationality" 
                    value={nationality} 
                    onChange={handleNationalityChange} 
                    options={NATIONALITY_OPTIONS} 
                    disabled={anyLoading || isCountryRandom}
                  />
                  <Checkbox
                    label="Randomize Country"
                    id="isCountryRandom"
                    name="isCountryRandom"
                    checked={isCountryRandom}
                    onChange={handleCountryRandomizationChange}
                    disabled={anyLoading}
                  />
                </div>
            </Card>

            <Card>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">5. Upload & Settings</h2>
              <div className="mt-4">
                <Checkbox id="usePhoto" name="usePhoto" label="Use Reference Photo" checked={reference.usePhoto} onChange={handleReferenceChange} disabled={anyLoading} />
              </div>
              
              {reference.usePhoto && (
                 <div className="mt-4 animate-fade-in">
                    <ImageUpload onFileChange={handleFileChange} />
                    <div className="mt-4 space-y-3">
                      <Checkbox id="useStyle" name="useStyle" label="Use style from this photo" checked={reference.useStyle} onChange={handleReferenceChange} disabled={!reference.photo || anyLoading} />
                      <Checkbox id="useComposition" name="useComposition" label="Use composition from this photo" checked={reference.useComposition} onChange={handleReferenceChange} disabled={!reference.photo || anyLoading} />
                      <Checkbox id="keepOverlays" name="keepOverlays" label="Keep overlays (icons, watermarks)" checked={reference.keepOverlays} onChange={handleReferenceChange} disabled={!reference.photo || anyLoading} />
                    </div>
                 </div>
              )}
            </Card>
            
            <Card>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                  <h2 className="text-2xl font-semibold">6. Manual Overlays</h2>
                  <Button onClick={handleAddOverlay} disabled={anyLoading || overlays.length >= 5 || reference.usePhoto} variant="secondary" className="px-3 py-1 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Slot
                  </Button>
              </div>
              <div className="space-y-4">
                {overlays.length > 0 ? (
                  overlays.map((overlay, index) => (
                    <OverlayControl
                      key={overlay.id}
                      overlay={overlay}
                      onFileChange={(file) => handleOverlayFileChange(overlay.id, file)}
                      onPropChange={(field, value) => handleOverlayPropChange(overlay.id, field, value)}
                      disabled={anyLoading || reference.usePhoto}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {reference.usePhoto ? "Manual overlays are disabled when using a reference photo." : "No overlays added. Click 'Add Slot' to add one."}
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-2xl font-semibold">7. Model Creator</h2>
                <Button onClick={handleRandomizeModel} disabled={anyLoading} variant="secondary" className="px-4 py-2 text-sm">
                  {isRandomizingModel ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Randomizing...
                    </>
                  ) : 'Randomize'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Select label="Gender" id="gender" name="gender" value={model.gender} onChange={handleModelChange} options={GENDER_OPTIONS} disabled={anyLoading} />
                <Input label="Age" id="age" name="age" type="number" value={model.age} onChange={handleModelChange} disabled={anyLoading} />
                <Select label="Expression" id="expression" name="expression" value={model.expression} onChange={handleModelChange} options={EXPRESSION_OPTIONS} disabled={anyLoading} />
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                        </label>
                        <button
                        type="button"
                        onClick={handleRandomizeDescription}
                        disabled={anyLoading}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                        {isRandomizingDescription ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.934L13.033 17.256A1 1 0 0112 18V2z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span>Randomize</span>
                        </button>
                    </div>
                    <textarea
                        id="description"
                        name="description"
                        value={model.description}
                        onChange={handleModelChange}
                        disabled={anyLoading}
                        placeholder="e.g., A man with sharp jawline and short, curly hair."
                        rows={4}
                        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="outfit" className="block text-sm font-medium text-gray-700 mb-1">
                      Outfit
                      {isRandomizingOutfit && (
                        <span className="ml-2 text-xs text-indigo-600 animate-pulse">Generating...</span>
                      )}
                    </label>
                    <select
                      id="outfit"
                      name="outfit"
                      value={model.outfit}
                      onChange={handleOutfitChange}
                      disabled={anyLoading}
                      className="block w-full pl-3 pr-10 py-2 text-base bg-gray-50 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="RANDOMIZE_OUTFIT">✨ Randomize New Outfit</option>
                      {outfitOptions.map((outfit) => (
                        <option key={outfit} value={outfit}>
                          {outfit}
                        </option>
                      ))}
                      {!outfitOptions.includes(model.outfit) && model.outfit && (
                        <option key={model.outfit} value={model.outfit}>
                          {model.outfit}
                        </option>
                      )}
                    </select>
                 </div>
                 <div className="md:col-span-2">
                    <label htmlFor="pose" className="block text-sm font-medium text-gray-700 mb-1">
                      Pose
                      {isRandomizingPose && (
                        <span className="ml-2 text-xs text-indigo-600 animate-pulse">Generating...</span>
                      )}
                    </label>
                    <select
                      id="pose"
                      name="pose"
                      value={model.pose}
                      onChange={handlePoseChange}
                      disabled={anyLoading}
                      className="block w-full pl-3 pr-10 py-2 text-base bg-gray-50 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="RANDOMIZE_POSE">✨ Randomize New Pose</option>
                      {poseOptions.map((pose) => (
                        <option key={pose} value={pose}>
                          {pose}
                        </option>
                      ))}
                      {!poseOptions.includes(model.pose) && model.pose && (
                        <option key={model.pose} value={model.pose}>
                          {model.pose}
                        </option>
                      )}
                    </select>
                 </div>
                 <div className="md:col-span-2">
                   <Input label="Hair/Eye/Skin Tones" id="tones" name="tones" value={model.tones} onChange={handleModelChange} disabled={anyLoading} placeholder="e.g., Brunette hair, hazel eyes, olive skin." />
                 </div>
              </div>
            </Card>
            
             <Card>
                <h2 className="text-2xl font-semibold mb-6 border-b pb-2">8. Composition</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aspect Ratio
                        </label>
                        <div className={`flex rounded-lg p-1 bg-gray-200 w-full segmented-control ${reference.usePhoto || generationTier === 'standard' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {ASPECT_RATIO_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setAspectRatio(option.value)}
                                    aria-selected={aspectRatio === option.value}
                                    className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                                    disabled={anyLoading || reference.usePhoto || generationTier === 'standard'}
                                >
                                    {option.name} ({option.value})
                                </button>
                            ))}
                        </div>
                         {(reference.usePhoto || generationTier === 'standard') && <p className="text-xs text-gray-500 mt-2">{reference.usePhoto ? 'Aspect ratio is determined by the reference photo.' : 'Aspect ratio is fixed for the Standard engine.'}</p>}
                    </div>
                    <Select label="Shot Type" id="shotType" name="shotType" value={scene.shotType} onChange={handleSceneChange} options={SHOT_TYPE_OPTIONS} disabled={anyLoading} />
                </div>
            </Card>

            <Card>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">9. Generation Engine</h2>
              <p className="text-sm text-gray-600 mb-4">Choose the AI model. Premium offers higher quality and more options but may require billing. Standard is faster and may have a free tier.</p>
              <div className="flex rounded-lg p-1 bg-gray-200 w-full md:w-auto segmented-control">
                <button 
                  onClick={() => setGenerationTier('premium')}
                  aria-selected={generationTier === 'premium'}
                  className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                  disabled={anyLoading || reference.usePhoto}
                >
                  Premium (Imagen 4)
                </button>
                <button 
                  onClick={() => setGenerationTier('standard')}
                  aria-selected={generationTier === 'standard'}
                  className="px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors"
                  disabled={anyLoading || reference.usePhoto}
                >
                  Standard (Flash Image)
                </button>
              </div>
              {reference.usePhoto && <p className="text-xs text-gray-500 mt-2">Engine is automatically selected when using a reference photo.</p>}
            </Card>

            <Card>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b pb-2">
                <h2 className="text-2xl font-semibold">10. Scene & Background</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdaptingScene && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Adapting/Creating...
                    </div>
                  )}
                  <Button onClick={handleRandomizeScene} disabled={anyLoading} variant="secondary" className="px-4 py-2 text-sm">
                    {isRandomizingScene ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : 'Randomize'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                   <select
                    onChange={handleScenePresetChange}
                    disabled={anyLoading}
                    className="block w-full mb-4 pl-3 pr-10 py-2 text-base bg-gray-50 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    defaultValue=""
                  >
                    <option value="" disabled>Select an indoor preset...</option>
                    <option value="RANDOMIZE_INDOOR">✨ Randomize New Indoor Scene</option>
                    {INDOOR_PRESET_OPTIONS.map((preset) => (
                      <option key={preset.name} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Textarea label="Location" id="location" name="location" value={scene.location} onChange={handleSceneChange} disabled={anyLoading} placeholder="e.g., Shibuya Crossing at night with neon lights..." />
                </div>
                <Select label="Lighting" id="lighting" name="lighting" value={scene.lighting} onChange={handleSceneChange} options={LIGHTING_OPTIONS} disabled={anyLoading} />
                <Select label="Mood" id="mood" name="mood" value={scene.mood} onChange={handleSceneChange} options={MOOD_OPTIONS} disabled={anyLoading} />
                <div className="md:col-span-2">
                  <Textarea label="Extra Details" id="details" name="details" value={scene.details} onChange={handleSceneChange} disabled={anyLoading} placeholder="e.g., Rain-slicked streets, a vintage bicycle..." />
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Button onClick={() => handleGenerateImage(1)} disabled={anyLoading} className="w-full text-lg">
                {generatingCount === 1 && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {generatingCount === 1 && !isGeneratingRandomly ? 'Generating Image...' : 'Generate Image'}
              </Button>
              <Button onClick={() => handleGenerateImage(4)} disabled={anyLoading || reference.usePhoto || generationTier === 'standard'} variant="secondary" className="w-full text-lg">
                {generatingCount === 4 && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {generatingCount === 4 ? 'Generating 4 Images...' : 'Generate 4 Images'}
              </Button>
              {(reference.usePhoto || generationTier === 'standard') && (
                  <p className="text-xs text-center text-gray-500">
                      {reference.usePhoto ? 'Generating multiple images is unavailable with a reference photo.' : 'Generating multiple images is unavailable with the Standard engine.'}
                  </p>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-8 w-full">
            <Card>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">11. Generated Image</h2>
              <div className="mb-4">
                <Button 
                  onClick={handleGenerateFullyRandom} 
                  disabled={anyLoading} 
                  className="w-full text-lg animate-fade-in"
                >
                  {isGeneratingRandomly ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : '✨'}
                  {isGeneratingRandomly ? 'Generating Inspiration...' : randomButtonText}
                </Button>
              </div>
              <div className="mt-4 aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                {anyLoading ? (
                  <div className="text-center p-4">
                     <svg className="animate-spin mx-auto h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-4 text-gray-600 font-semibold">{loadingMessage}</p>
                    <p className="mt-1 text-sm text-gray-500">This can take up to a minute...</p>
                  </div>
                ) : error ? (
                   <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
                    {error.startsWith('BILLING_ERROR:') ? (
                        <>
                            <h3 className="font-bold mb-2">Quota Exceeded: Billing Required</h3>
                            <p className="text-sm">
                                {error.replace('BILLING_ERROR:', '').replace('Please enable billing and try again.', '')}
                                Please <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-red-800">enable billing for your project</a> and try again.
                            </p>
                        </>
                    ) : error.startsWith('INVALID_KEY_ERROR:') ? (
                      <>
                        <h3 className="font-bold mb-2">API Key Not Valid</h3>
                        <p className="text-sm mb-2 text-left">
                          The API key you provided is being rejected by Google. Common reasons include:
                        </p>
                        <ul className="text-sm text-left list-disc list-inside space-y-1">
                          <li>
                            <strong>Typo:</strong> The key was entered incorrectly. Please try entering it again.
                          </li>
                          <li>
                            <strong>Restrictions:</strong> Your key is restricted (e.g., by website URL). This is a common issue for deployed apps. Ensure your key has no HTTP referrer restrictions or that it allows the current domain.
                          </li>
                          <li>
                            <strong>Disabled Key:</strong> The key was disabled or deleted in your Google Cloud project.
                          </li>
                        </ul>
                        <p className="text-sm mt-3">
                          <strong>Next Step:</strong> Please visit your{' '}
                          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-red-800">
                            Google Cloud Credentials page
                          </a>
                          {' '}to verify your key's status and restrictions.
                        </p>
                      </>
                    ) : (
                        <>
                            <h3 className="font-bold mb-2">Error Generating Image</h3>
                            <p className="text-sm">{error}</p>
                        </>
                    )}
                    </div>
                ) : finalImage ? (
                  <img src={finalImage} alt="Generated AI" className="rounded-lg object-contain h-full w-full" />
                ) : (
                   <div className="text-center p-4 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="mt-2 font-semibold">Your generated image will appear here.</p>
                      <p className="text-sm">Configure the options and click "Generate Image".</p>
                   </div>
                )}
              </div>
              
              {generatedImages && generatedImages.length > 1 && !anyLoading && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                    {generatedImages.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`rounded-lg overflow-hidden border-2 transition-colors ${selectedImageIndex === index ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            aria-label={`Select image variant ${index + 1}`}
                        >
                            <img
                                src={`data:image/png;base64,${img}`}
                                alt={`Variant ${index + 1}`}
                                className="aspect-square object-cover w-full h-full"
                            />
                        </button>
                    ))}
                </div>
              )}

              {finalImage && !anyLoading && (
                <Button onClick={handleDownloadImage} className="w-full mt-6">Download Image</Button>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
