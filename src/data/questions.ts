// Server-only: never import this file from a client component.
// Correct answers must not reach players' devices before the reveal.
import "server-only";

export type Level = "Basic" | "Intermediate" | "Advanced" | "Bonus";
export type Topic =
  | "AI Fundamentals"
  | "Generative AI"
  | "Prompting"
  | "How LLMs Work"
  | "Responsible Use"
  | "Building with AI"
  | "Agents"
  | "AI Mindset";

export interface Question {
  id: number;
  level: Level;
  topic: Topic;
  type: "multiple" | "truefalse";
  text: string;
  options: string[]; // 4 for "multiple", ["True", "False"] for "truefalse"
  correct: number; // index into options
  timeLimitSec: number;
  explanation: string; // shown on the reveal screen
}

// The correct option is deliberately spread across A/B/C/D so that picking the same letter every time doesn't pay off.
export const QUESTIONS: Question[] = [
  // ───────────── BASIC ─────────────
  {
    id: 1,
    level: "Basic",
    topic: "AI Fundamentals",
    type: "multiple",
    text: "Which of the following is an example of Artificial Intelligence?",
    options: [
      "A basic calculator",
      "A USB cable",
      "A chatbot that understands natural language",
      "An external hard drive",
    ],
    correct: 2,
    timeLimitSec: 20,
    explanation:
      "AI is software that performs tasks that normally need human intelligence, like understanding language. A calculator follows fixed rules, and cables and drives are just hardware.",
  },
  {
    id: 2,
    level: "Basic",
    topic: "AI Fundamentals",
    type: "multiple",
    text: "What is Machine Learning?",
    options: [
      "A way to store files",
      "A programming language",
      "A database",
      "A technique that allows systems to learn patterns from data",
    ],
    correct: 3,
    timeLimitSec: 20,
    explanation:
      "Instead of being given every rule, a machine learning system finds patterns in examples and uses them to make predictions or decisions.",
  },
  {
    id: 3,
    level: "Basic",
    topic: "Generative AI",
    type: "multiple",
    text: "What mainly distinguishes Generative AI?",
    options: [
      "It can generate new content",
      "It only analyzes existing data",
      "It only works with images",
      "It does not require data",
    ],
    correct: 0,
    timeLimitSec: 20,
    explanation:
      "Generative AI creates new text, images, code, audio or video. It is trained on large amounts of data, and it works with many kinds of content, not only images.",
  },
  {
    id: 4,
    level: "Basic",
    topic: "Prompting",
    type: "multiple",
    text: "What is a prompt in Generative AI?",
    options: [
      "A compression algorithm",
      "An instruction or context given to an AI model",
      "A password used to access AI",
      "A type of server",
    ],
    correct: 1,
    timeLimitSec: 20,
    explanation:
      "A prompt is what you tell the model: your question, instructions and context. Clear context, goal and format give much better results.",
  },

  // ───────────── INTERMEDIATE ─────────────
  {
    id: 5,
    level: "Intermediate",
    topic: "Responsible Use",
    type: "multiple",
    text: "What is an AI \"hallucination\"?",
    options: [
      "When the AI stops working",
      "When an AI learns too much",
      "When AI generates incorrect or fabricated information that sounds convincing",
      "When an AI generates an image",
    ],
    correct: 2,
    timeLimitSec: 20,
    explanation:
      "Models predict plausible text, not verified facts, so they can sound sure and still be wrong. Always double-check names, numbers, quotes and sources.",
  },
  {
    id: 6,
    level: "Intermediate",
    topic: "How LLMs Work",
    type: "multiple",
    text: "What is an LLM (Large Language Model)?",
    options: [
      "An AI model trained to understand and generate language",
      "A very large database",
      "An operating system",
      "An Internet protocol",
    ],
    correct: 0,
    timeLimitSec: 20,
    explanation:
      "An LLM is a model trained on huge amounts of text so it can understand and write language. ChatGPT, Claude and Gemini are built on LLMs.",
  },
  {
    id: 7,
    level: "Advanced",
    topic: "Building with AI",
    type: "multiple",
    text: "What is RAG (Retrieval-Augmented Generation) used for?",
    options: [
      "Reducing the size of an AI model",
      "Generating images",
      "Replacing prompts",
      "Grounding AI responses with relevant external information",
    ],
    correct: 3,
    timeLimitSec: 20,
    explanation:
      "RAG looks up relevant documents first and gives them to the model, so answers are based on your own, up-to-date information and can cite sources.",
  },
  {
    id: 8,
    level: "Advanced",
    topic: "Agents",
    type: "multiple",
    text: "What mainly differentiates an AI Agent from a traditional chatbot?",
    options: [
      "It only responds faster",
      "It always uses a larger AI model",
      "It can reason about tasks, use tools, and take actions to achieve a goal",
      "It does not need an LLM",
    ],
    correct: 2,
    timeLimitSec: 20,
    explanation:
      "A chatbot answers. An agent plans steps, uses tools (search, files, apps) and acts toward a goal, so its actions need human oversight.",
  },

  // ───────────── RESPONSIBLE USE ─────────────
  {
    id: 9,
    level: "Intermediate",
    topic: "Responsible Use",
    type: "multiple",
    text: "Which is a good practice when using Generative AI at work?",
    options: [
      "Always trust the first answer",
      "Verify AI-generated results, use approved tools, and follow data policies",
      "Share any company data to get better results",
      "Avoid human oversight",
    ],
    correct: 1,
    timeLimitSec: 20,
    explanation:
      "You stay responsible for the result: check it, use company-approved tools and never share confidential or personal data where it is not allowed.",
  },

  // ───────────── BONUS ─────────────
  {
    id: 10,
    level: "Bonus",
    topic: "AI Mindset",
    type: "multiple",
    text: "What should be the main goal of adopting AI in our daily work?",
    options: [
      "Augment our capabilities and solve real business problems",
      "Replace people",
      "Use AI because it is trendy",
      "Automate absolutely everything",
    ],
    correct: 0,
    timeLimitSec: 20,
    explanation:
      "AI works best as a partner: it frees time and extends what we can do so we can focus on real problems. People stay in charge of judgment and decisions.",
  },
];
