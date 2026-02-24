import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Sparkles, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

type CommandResult = {
  type: "action" | "message" | "error";
  action?: string;
  data?: Record<string, unknown>;
  text?: string;
};

export function VoiceCommandButton({ onWhatsAppMessage }: { onWhatsAppMessage?: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<CommandResult | null>(null);
  const [textInput, setTextInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [, navigate] = useLocation();

  const uploadMut = trpc.voice.uploadAudio.useMutation();
  const transcribeMut = trpc.voice.transcribe.useMutation();
  const aiCommandMut = trpc.aiCommand.execute.useMutation();

  const handleResult = useCallback((res: CommandResult) => {
    setResult(res);
    if (res.type === "action") {
      switch (res.action) {
        case "navigate":
          setTimeout(() => { navigate(res.data?.path as string || "/dashboard"); setOpen(false); }, 800);
          break;
        case "startPomodoro":
          setTimeout(() => { navigate("/routine"); setOpen(false); }, 800);
          break;
        case "taskCreated":
        case "clientCreated":
          toast.success(res.text || "Ação executada!");
          break;
        case "navigateToCampaignCreation":
          setTimeout(() => { navigate("/campaigns/new"); setOpen(false); }, 800);
          break;
      }
    }
  }, [navigate]);

  const processCommand = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setTranscript(text);
    setStatusMsg("");

    if (onWhatsAppMessage) {
      onWhatsAppMessage(text);
      setOpen(false);
      return;
    }

    setIsProcessing(true);
    setStatusMsg("Processando comando com IA...");
    try {
      const res = await aiCommandMut.mutateAsync({ command: text });
      handleResult(res as CommandResult);
    } catch {
      setResult({ type: "error", text: "Erro ao processar comando. Tente novamente." });
    } finally {
      setIsProcessing(false);
      setStatusMsg("");
    }
  }, [onWhatsAppMessage, aiCommandMut, handleResult]);

  // Web Speech API - works directly in browser, no server needed
  const startWebSpeechRecognition = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        resolve(null);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript;
        resolve(text || null);
      };
      recognition.onerror = () => resolve(null);
      recognition.onnomatch = () => resolve(null);
      recognition.onend = () => {}; // handled by promise
      recognition.start();
    });
  }, []);

  const startRecording = useCallback(async () => {
    setResult(null);
    setTranscript("");
    setStatusMsg("Gravando...");

    // Strategy: Try MediaRecorder first for Whisper, with Web Speech API as fallback
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Mic permission denied or not available - try Web Speech API directly
      setStatusMsg("Usando reconhecimento do navegador...");
      setIsRecording(true);
      const text = await startWebSpeechRecognition();
      setIsRecording(false);
      if (text) {
        await processCommand(text);
      } else {
        setStatusMsg("");
        toast.error("Não foi possível acessar o microfone. Use o campo de texto.");
      }
      return;
    }

    // MediaRecorder available - record audio
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream!.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        setIsProcessing(true);

        // Check minimum size (very short recordings fail)
        if (blob.size < 1000) {
          setStatusMsg("Gravação muito curta. Usando reconhecimento do navegador...");
          // Fallback to Web Speech
          setIsProcessing(false);
          const text = await startWebSpeechRecognition();
          if (text) {
            await processCommand(text);
          } else {
            setStatusMsg("");
            toast.info("Gravação muito curta. Tente falar por mais tempo ou use o campo de texto.");
          }
          return;
        }

        try {
          // Step 1: Upload audio
          setStatusMsg("Enviando áudio...");
          const arrayBuffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const base64 = btoa(binary);
          const { url } = await uploadMut.mutateAsync({ audioBase64: base64, mimeType: "audio/webm" });

          // Step 2: Try Whisper transcription
          setStatusMsg("Transcrevendo com IA...");
          try {
            const { text } = await transcribeMut.mutateAsync({ audioUrl: url, language: "pt" });
            if (text && text.trim()) {
              await processCommand(text);
              return;
            }
          } catch (whisperErr) {
            console.warn("[Voice] Whisper failed, trying Web Speech API fallback:", whisperErr);
          }

          // Step 3: Whisper failed - try Web Speech API fallback
          setStatusMsg("Whisper indisponível. Usando reconhecimento do navegador...");
          setIsProcessing(false);
          setIsRecording(true);
          const fallbackText = await startWebSpeechRecognition();
          setIsRecording(false);
          if (fallbackText) {
            await processCommand(fallbackText);
          } else {
            setStatusMsg("");
            toast.info("Transcrição falhou. Por favor, use o campo de texto abaixo.");
          }
        } catch (err) {
          console.error("[Voice] Full pipeline failed:", err);
          setIsProcessing(false);
          // Last resort: Web Speech
          setStatusMsg("Erro no upload. Usando reconhecimento do navegador...");
          setIsRecording(true);
          const lastResort = await startWebSpeechRecognition();
          setIsRecording(false);
          if (lastResort) {
            await processCommand(lastResort);
          } else {
            setStatusMsg("");
            toast.info("Use o campo de texto para enviar seu comando.");
          }
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      stream.getTracks().forEach(t => t.stop());
      // Fallback
      setIsRecording(true);
      setStatusMsg("Usando reconhecimento do navegador...");
      const text = await startWebSpeechRecognition();
      setIsRecording(false);
      if (text) {
        await processCommand(text);
      } else {
        setStatusMsg("");
        toast.error("Reconhecimento de voz não disponível. Use o campo de texto.");
      }
    }
  }, [uploadMut, transcribeMut, processCommand, startWebSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processCommand(textInput);
      setTextInput("");
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-full hover:bg-primary/10" onClick={() => { setOpen(true); setTranscript(""); setResult(null); setStatusMsg(""); }}>
        <Mic className="w-4 h-4" />
        <span className="sr-only">Comando de Voz</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Comando Inteligente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Voice Button */}
            <div className="flex justify-center py-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30"
                    : isProcessing
                    ? "bg-muted"
                    : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {statusMsg || (isRecording ? "Gravando... Clique para parar" : isProcessing ? "Processando..." : "Clique para falar ou digite abaixo")}
            </p>

            {/* Text Input Alternative */}
            <div className="flex gap-2">
              <Input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Ex: Cria campanha de Black Friday..."
                onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
                disabled={isProcessing}
              />
              <Button size="icon" onClick={handleTextSubmit} disabled={isProcessing || !textInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Você disse:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`p-3 rounded-lg border ${
                result.type === "error" ? "bg-red-500/10 border-red-500/20" : "bg-primary/10 border-primary/20"
              }`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {result.type === "action" ? "Ação executada:" : result.type === "error" ? "Erro:" : "Resposta:"}
                </p>
                <p className="text-sm">{result.text}</p>
              </div>
            )}

            {/* Quick Commands */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Comandos rápidos:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  "Começa pomodoro",
                  "Me mostra os clientes",
                  "Cria tarefa: revisar copies",
                  "Abre o CRM",
                ].map(cmd => (
                  <Button key={cmd} variant="outline" size="sm" className="text-xs h-7" onClick={() => processCommand(cmd)} disabled={isProcessing}>
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
