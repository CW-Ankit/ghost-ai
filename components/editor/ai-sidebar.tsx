"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  FileText, 
  Download, 
  Layers, 
  Terminal, 
  Cpu, 
  ArrowRight,
  Clock,
  CheckCircle2,
  FileCode2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  {
    icon: Layers,
    label: "Design an e-commerce backend",
    prompt: "Design an e-commerce backend architecture with microservices, API Gateway, auth service, product catalog, payment processing, and Kafka event streaming."
  },
  {
    icon: Terminal,
    label: "Create a chat app architecture",
    prompt: "Create a real-time chat app architecture using WebSockets, Redis pub/sub, message queue, and partitioned PostgreSQL storage."
  },
  {
    icon: Cpu,
    label: "Build a CI/CD pipeline",
    prompt: "Build an automated CI/CD pipeline architecture featuring GitHub Actions, Docker container builds, staging validation, and Kubernetes rolling deployment."
  }
];

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("architect");
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 72), 160)}px`;
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputPrompt).trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "72px";
    }

    // Mock assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: "assistant",
        content: `I've analyzed your architecture request: "${content.length > 60 ? content.slice(0, 57) + '...' : content}". In the upcoming backend phase, nodes and relationships will automatically appear in your canvas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectStarterChip = (prompt: string) => {
    setInputPrompt(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 72), 160)}px`;
        }
      }, 0);
    }
  };

  const handleGenerateSpec = () => {
    setIsGeneratingSpec(true);
    setTimeout(() => {
      setIsGeneratingSpec(false);
    }, 1200);
  };

  return (
    <aside
      className={cn(
        "h-full bg-bg-surface/95 backdrop-blur-md border-l border-border-default shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col z-20 flex-shrink-0",
        isOpen ? "w-96" : "w-0 border-l-0"
      )}
      aria-label="AI Workspace"
    >
      <div className="w-96 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-accent-ai-dim border border-accent-ai/30 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="h-4 w-4 text-accent-ai-text" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary leading-none font-heading">
                AI Workspace
              </h2>
              <p className="text-[11px] text-text-muted mt-1 leading-none">
                Collaborate with Ghost AI
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close AI workspace"
            className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-bg-subtle rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 pt-2">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 bg-bg-subtle p-1 rounded-xl border border-border-subtle flex-shrink-0">
              <TabsTrigger 
                value="architect" 
                className="gap-2 text-xs font-medium data-active:bg-bg-elevated data-active:text-text-primary data-active:shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent-ai-text" />
                AI Architect
              </TabsTrigger>
              <TabsTrigger 
                value="specs" 
                className="gap-2 text-xs font-medium data-active:bg-bg-elevated data-active:text-text-primary data-active:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-accent-primary" />
                Specs
              </TabsTrigger>
            </TabsList>

            {/* AI Architect Tab Content */}
            <TabsContent value="architect" className="flex-1 flex flex-col overflow-hidden mt-3 p-0 data-active:flex">
              {/* Chat messages / Empty state */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-between py-2">
                    <div className="flex flex-col items-center text-center px-2 pt-4">
                      <div className="h-14 w-14 rounded-2xl bg-accent-ai-dim border border-accent-ai/20 flex items-center justify-center mb-3 shadow-inner">
                        <Bot className="h-7 w-7 text-accent-ai-text" />
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary font-heading">
                        Ghost AI Architect
                      </h3>
                      <p className="text-xs text-text-muted mt-1 max-w-[260px] leading-relaxed">
                        Describe your system architecture in plain English, and Ghost AI will generate the graph.
                      </p>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="text-[11px] font-medium text-text-faint uppercase tracking-wider px-1">
                        Starter Prompts
                      </div>
                      <div className="flex flex-col gap-2">
                        {STARTER_PROMPTS.map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectStarterChip(item.prompt)}
                              className="group flex items-center justify-between p-2.5 rounded-xl bg-bg-subtle hover:bg-bg-elevated border border-border-subtle hover:border-accent-ai/30 text-left transition-all text-xs cursor-pointer shadow-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-bg-surface border border-border-subtle group-hover:border-accent-ai/30 group-hover:text-accent-ai-text text-text-muted transition-colors">
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                  {item.label}
                                </span>
                              </div>
                              <ArrowRight className="h-3 w-3 text-text-faint group-hover:text-accent-ai-text group-hover:translate-x-0.5 transition-all" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-1 max-w-[88%]",
                          msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl p-3 text-xs leading-relaxed shadow-sm",
                            msg.sender === "user"
                              ? "bg-accent-primary-dim border border-accent-primary/40 text-text-primary rounded-tr-sm"
                              : "bg-bg-elevated border border-border-default text-text-secondary rounded-tl-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className="text-[10px] text-text-faint px-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="mt-3 pt-2 border-t border-border-subtle flex-shrink-0">
                <div className="relative rounded-xl bg-bg-elevated border border-border-default focus-within:border-accent-ai/60 focus-within:ring-1 focus-within:ring-accent-ai/40 transition-all p-2 flex flex-col gap-2 shadow-inner">
                  <Textarea
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe a system architecture..."
                    className="min-h-[72px] max-h-[160px] resize-none border-0 bg-transparent p-1 text-xs text-text-primary placeholder:text-text-muted focus-visible:ring-0 focus-visible:outline-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50">
                    <span className="text-[10px] text-text-faint">
                      <kbd className="px-1 py-0.5 rounded bg-bg-subtle text-text-muted font-mono text-[9px] border border-border-subtle">
                        Enter
                      </kbd>{" "}
                      send •{" "}
                      <kbd className="px-1 py-0.5 rounded bg-bg-subtle text-text-muted font-mono text-[9px] border border-border-subtle">
                        Shift+Enter
                      </kbd>{" "}
                      newline
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleSendMessage()}
                      disabled={!inputPrompt.trim()}
                      className="h-7 px-3 gap-1.5 bg-accent-ai hover:bg-accent-ai/90 text-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <span>Send</span>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Specs Tab Content */}
            <TabsContent value="specs" className="flex-1 flex flex-col overflow-hidden mt-3 p-0 data-active:flex">
              <ScrollArea className="flex-1 pr-1">
                <div className="space-y-4 py-1">
                  {/* Generate Spec Action */}
                  <div className="p-3.5 rounded-2xl bg-bg-subtle border border-border-subtle flex flex-col gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary font-heading flex items-center gap-1.5">
                        <FileCode2 className="h-4 w-4 text-accent-primary" />
                        Specification Generator
                      </h4>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Convert the active canvas graph into a structured Markdown technical specification.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={handleGenerateSpec}
                      disabled={isGeneratingSpec}
                      className="w-full gap-2 bg-accent-ai hover:bg-accent-ai/90 text-white text-xs font-medium rounded-xl h-8 shadow-sm transition-all"
                    >
                      <Sparkles className={cn("h-3.5 w-3.5", isGeneratingSpec && "animate-spin")} />
                      <span>{isGeneratingSpec ? "Synthesizing Graph..." : "Generate Spec"}</span>
                    </Button>
                  </div>

                  {/* Demo Spec Card */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-text-faint uppercase tracking-wider px-1">
                      Generated Artifacts
                    </div>

                    <div className="rounded-2xl bg-bg-elevated border border-border-default p-4 flex flex-col gap-3 transition-colors hover:border-border-subtle shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-bg-subtle border border-border-subtle text-accent-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-text-primary leading-tight">
                              System Architecture Specification (Draft)
                            </h5>
                            <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5 text-state-success" />
                              Markdown • 4 sections • Draft
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Code preview snippet */}
                      <div className="rounded-xl bg-bg-base/80 border border-border-subtle p-2.5 font-mono text-[10px] text-text-muted leading-relaxed overflow-hidden">
                        <div className="text-text-secondary font-semibold"># System Architecture Spec</div>
                        <div className="text-accent-ai-text mt-0.5">## 1. Executive Overview</div>
                        <div className="text-text-muted/80 truncate">Describes decoupled microservices and event queues...</div>
                        <div className="text-accent-ai-text mt-0.5">## 2. Infrastructure Graph</div>
                        <div className="text-text-muted/80 truncate">- API Gateway -&gt; Microservice Mesh</div>
                      </div>

                      {/* Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="w-full gap-2 text-xs border-border-subtle bg-bg-subtle text-text-muted opacity-60 cursor-not-allowed h-8 rounded-xl justify-center"
                        title="Spec download will be enabled in the upcoming background workflows phase"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Spec (.md)</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </aside>
  );
}
