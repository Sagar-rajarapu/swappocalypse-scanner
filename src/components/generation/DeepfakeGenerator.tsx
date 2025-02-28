
import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { simulateDeepfakeGeneration, generateDeepfakeWithBackend, GenerationResult, GenerationOptions } from "@/lib/generation-backend";
import { UploadProgress } from "@/lib/types";

export function DeepfakeGenerator() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [generationMethod, setGenerationMethod] = useState<"faceswap" | "text-to-video">("faceswap");
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 });
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [useBackend, setUseBackend] = useState<boolean>(false);
  const [technique, setTechnique] = useState<string>("gan");
  const [model, setModel] = useState<string>("sd");
  const [duration, setDuration] = useState<number>(5);
  const { toast } = useToast();

  const handleSourceFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video or image file for the source.",
          variant: "destructive"
        });
        return;
      }
      
      setSourceFile(file);
    }
  };

  const handleTargetFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video or image file for the target.",
          variant: "destructive"
        });
        return;
      }
      
      setTargetFile(file);
    }
  };

  const handleTextPromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setTextPrompt(event.target.value);
  };

  const handleGenerate = async () => {
    // Reset state
    setProgress({ status: 'idle', progress: 0 });
    setResult(null);
    
    try {
      if (useBackend) {
        toast({
          title: "Using Python Backend",
          description: "Connecting to real AI generation server...",
        });
      } else {
        toast({
          title: "Using Simulation",
          description: "Running simulated generation (no real AI generation)...",
        });
      }
      
      // Prepare generation options
      const generationOptions: GenerationOptions = {
        method: generationMethod,
        technique: technique,
        model: model,
        duration: duration
      };

      if (generationMethod === 'faceswap') {
        generationOptions.sourceFile = sourceFile;
        generationOptions.targetFile = targetFile;
      } else {
        generationOptions.textPrompt = textPrompt;
      }
      
      // Choose whether to use backend or simulation
      const generationFunc = useBackend ? generateDeepfakeWithBackend : simulateDeepfakeGeneration;
      
      const generatedResult = await generationFunc(generationOptions, (progress) => {
        setProgress(progress);
      });
      
      setResult(generatedResult);
      
      toast({
        title: "Generation Complete",
        description: "Your deepfake video has been successfully generated.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      
      // Create a more user-friendly error message
      let errorMessage = "An unexpected error occurred during generation.";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific connection errors
        if (errorMessage.includes("backend server") || errorMessage.includes("not responding")) {
          errorMessage = "Cannot connect to Python backend server. Please make sure it's running on http://localhost:5000";
          
          toast({
            title: "Backend Server Error",
            description: "Python server is not running. Try using simulation mode instead.",
            variant: "destructive"
          });
        }
      }
      
      setProgress({
        status: 'error',
        progress: 0,
        message: errorMessage,
      });
    }
  };
  
  // Validation check
  const canGenerate = () => {
    if (generationMethod === "faceswap") {
      return sourceFile !== null && targetFile !== null;
    } else {
      return textPrompt.trim().length > 10; // Ensure text prompt is substantial
    }
  };

  const toggleBackendMode = () => {
    if (useBackend) {
      setUseBackend(false);
    } else {
      setUseBackend(true);
      toast({
        title: "Backend Mode Enabled",
        description: "Make sure the Python backend server is running at http://localhost:5000",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Deepfake Generator</CardTitle>
          <CardDescription>
            Create synthetic videos by swapping faces or generating from text prompts.
            <div className="mt-2 text-amber-600 bg-amber-50 p-2 rounded-md text-sm">
              <strong>Educational Use Only:</strong> This tool is for educational and research purposes only.
              Creating deepfakes without consent may be illegal in many jurisdictions.
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 items-center mb-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={useBackend}
                onChange={toggleBackendMode}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                Use Backend Generation
              </span>
            </label>
            <p className="text-xs text-muted-foreground max-w-xs text-center">
              {useBackend 
                ? "Connect to Python backend for real AI-powered generation (requires backend server)" 
                : "Use simulation mode for frontend demo (no real generation)"}
            </p>
          </div>
          
          <Tabs defaultValue="faceswap" onValueChange={(value) => setGenerationMethod(value as "faceswap" | "text-to-video")}>
            <TabsList className="mb-4">
              <TabsTrigger value="faceswap">Face Swap</TabsTrigger>
              <TabsTrigger value="text-to-video">Text to Video</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faceswap">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="source-video">Source Video/Image (face to use)</Label>
                  <Input 
                    id="source-video" 
                    type="file" 
                    accept="video/*,image/*" 
                    onChange={handleSourceFileChange}
                  />
                  {sourceFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {sourceFile.name} ({(sourceFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="target-video">Target Video/Image (where to apply the face)</Label>
                  <Input 
                    id="target-video" 
                    type="file" 
                    accept="video/*,image/*" 
                    onChange={handleTargetFileChange}
                  />
                  {targetFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {targetFile.name} ({(targetFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="technique">Swapping Technique</Label>
                  <Select 
                    defaultValue="gan" 
                    value={technique}
                    onValueChange={(value) => setTechnique(value)}
                  >
                    <SelectTrigger id="technique">
                      <SelectValue placeholder="Select technique" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gan">GAN-based Swapping</SelectItem>
                      <SelectItem value="3dmm">3D Morphable Model</SelectItem>
                      <SelectItem value="landmark">Landmark Alignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="text-to-video">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="text-prompt">Text Description</Label>
                  <Textarea 
                    id="text-prompt" 
                    placeholder="Describe the video you want to generate in detail..." 
                    rows={4}
                    value={textPrompt}
                    onChange={handleTextPromptChange}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="model">Generation Model</Label>
                  <Select 
                    defaultValue="sd"
                    value={model}
                    onValueChange={(value) => setModel(value)}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sd">Stable Diffusion Video</SelectItem>
                      <SelectItem value="imagen">Imagen Video</SelectItem>
                      <SelectItem value="gen2">Runway Gen-2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="duration">Video Duration (seconds)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="1" 
                    max="15" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {progress.status === 'uploading' || progress.status === 'processing' ? (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{progress.message}</span>
                <span className="text-sm font-medium">{progress.progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          ) : null}
          
          {progress.status === 'error' && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <h4 className="font-semibold text-destructive">Generation Failed</h4>
              <p className="text-sm">{progress.message}</p>
              
              {useBackend && (
                <div className="mt-2 text-sm bg-yellow-100 dark:bg-yellow-900 p-3 rounded">
                  <p className="font-medium">Backend server issue detected</p>
                  <p>Make sure the Python backend is running with this command:</p>
                  <pre className="bg-black/10 p-2 mt-1 rounded text-xs overflow-x-auto">python deepfake_detection_api.py</pre>
                  <p className="mt-2">Or switch to "simulation mode" below.</p>
                </div>
              )}
              
              {useBackend && (
                <Button 
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setUseBackend(false);
                    setProgress({ status: 'idle', progress: 0 });
                  }}
                >
                  Switch to Simulation
                </Button>
              )}
            </div>
          )}
          
          {result && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h4 className="font-semibold mb-2">Generation Complete</h4>
              <div className="aspect-video bg-black/10 rounded-md flex items-center justify-center mb-3">
                <p className="text-muted-foreground">
                  [Generated video would appear here]
                </p>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Technique:</span>
                  <span>{result.technique}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Model:</span>
                  <span>{result.parameters.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Generated:</span>
                  <span>{new Date(result.generatedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-3">
                <Button variant="outline" className="w-full" onClick={() => window.open(result.videoUrl, '_blank')}>
                  Download Generated Video
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerate} 
            disabled={!canGenerate() || progress.status === 'uploading' || progress.status === 'processing'}
            className="w-full"
          >
            {progress.status === 'uploading' || progress.status === 'processing' ? 'Generating...' : 'Generate Deepfake Video'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
