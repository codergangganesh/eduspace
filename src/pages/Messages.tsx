import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MessageSquare,
  Users,
  Megaphone,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Mic,
  Send,
  FileText,
  Download,
  Bold,
  Italic,
  List,
  Code,
  Plus,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  sender: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  online?: boolean;
  isGroup?: boolean;
}

const directMessages: Conversation[] = [
  {
    id: "1",
    name: "Dr. Sarah Smith",
    role: "Lecturer",
    lastMessage: "Please review the attached assignment draft.",
    timestamp: "10:42 AM",
    online: true,
  },
  {
    id: "2",
    name: "Alex Johnson",
    lastMessage: "Sent you a file: Notes.pdf",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    name: "Prof. Michael Chen",
    role: "Advisor",
    lastMessage: "Let's schedule our meeting for next week.",
    timestamp: "2 days ago",
  },
];

const courseGroups: Conversation[] = [
  {
    id: "g1",
    name: "CS101 - Algorithms",
    lastMessage: "Jack: Anyone solved Q3?",
    timestamp: "9:20 AM",
    isGroup: true,
    unread: 5,
  },
  {
    id: "g2",
    name: "ENG202 - Literature",
    lastMessage: "Draft submission is open.",
    timestamp: "Yesterday",
    isGroup: true,
  },
  {
    id: "g3",
    name: "MATH301 - Linear Algebra",
    lastMessage: "Reminder: Quiz tomorrow at 2 PM",
    timestamp: "2 days ago",
    isGroup: true,
  },
];

const sampleMessages: Message[] = [
  {
    id: "1",
    content: "Hello Marcus, I've taken a look at your initial proposal. The topic is strong, but you might want to narrow down the scope for the final project.",
    timestamp: "4:30 PM",
    isOwn: false,
    sender: "Dr. Sarah Smith",
  },
  {
    id: "2",
    content: "Thanks Dr. Smith. I was thinking of focusing specifically on the neural network optimization part. Would that work?",
    timestamp: "4:35 PM",
    isOwn: true,
    sender: "You",
  },
  {
    id: "3",
    content: "Yes, that sounds much better. Please review the attached assignment draft guidelines to ensure you hit all the marking criteria.",
    timestamp: "10:41 AM",
    isOwn: false,
    sender: "Dr. Sarah Smith",
    attachment: {
      name: "Final_Project_Guidelines_v2.pdf",
      size: "1.2 MB",
      type: "PDF Document",
    },
  },
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(directMessages[0]);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("messages");

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      sender: "You",
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredDirectMessages = directMessages.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = courseGroups.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Sidebar */}
        <div className="w-80 border-r border-border flex flex-col bg-surface">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="messages" className="gap-1.5">
                  <MessageSquare className="size-4" />
                  <span className="hidden sm:inline">Messages</span>
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">3</Badge>
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-1.5">
                  <Users className="size-4" />
                  <span className="hidden sm:inline">Groups</span>
                </TabsTrigger>
                <TabsTrigger value="announcements" className="gap-1.5">
                  <Megaphone className="size-4" />
                  <span className="hidden sm:inline">News</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {activeTab === "messages" && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Direct Messages
                  </div>
                  {filteredDirectMessages.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                        selectedConversation?.id === conv.id
                          ? "bg-primary/10"
                          : "hover:bg-secondary"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="size-10">
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conv.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-surface" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{conv.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {conv.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {activeTab === "groups" && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Course Groups
                  </div>
                  {filteredGroups.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                        selectedConversation?.id === conv.id
                          ? "bg-primary/10"
                          : "hover:bg-secondary"
                      )}
                    >
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Hash className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{conv.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {conv.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread && (
                        <Badge className="shrink-0">{conv.unread}</Badge>
                      )}
                    </button>
                  ))}
                </>
              )}

              {activeTab === "announcements" && (
                <div className="p-4 text-center text-muted-foreground">
                  <Megaphone className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No new announcements</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-surface">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={selectedConversation.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation.isGroup ? (
                      <Hash className="size-5" />
                    ) : (
                      selectedConversation.name.split(" ").map((n) => n[0]).join("")
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.role || (selectedConversation.online ? "Online" : "Offline")}
                    {selectedConversation.online && !selectedConversation.isGroup && " - Office hours 2-4PM"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="size-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="size-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Info className="size-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Date Divider */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>Yesterday</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {messages.slice(0, 2).map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.isOwn && "flex-row-reverse"
                    )}
                  >
                    {!message.isOwn && (
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {message.sender.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        message.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      {!message.isOwn && (
                        <p className="text-xs font-medium text-primary mb-1">{message.sender}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Today Divider */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>Today</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {messages.slice(2).map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.isOwn && "flex-row-reverse"
                    )}
                  >
                    {!message.isOwn && (
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {message.sender.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="max-w-[70%] space-y-2">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5",
                          message.isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        )}
                      >
                        {!message.isOwn && (
                          <p className="text-xs font-medium text-primary mb-1">{message.sender}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                      {message.attachment && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                          <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <FileText className="size-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {message.attachment.size} • {message.attachment.type}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Download className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-surface">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 mb-2">
                <Button variant="ghost" size="icon" className="size-8">
                  <Bold className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <Italic className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <List className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <Code className="size-4" />
                </Button>
              </div>

              {/* Input Area */}
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Plus className="size-5" />
                </Button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full min-h-[44px] max-h-32 px-4 py-3 rounded-xl bg-secondary border-0 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={1}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="size-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="size-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Mic className="size-5" />
                  </Button>
                  <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <MessageSquare className="size-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
