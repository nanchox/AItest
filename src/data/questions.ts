// Server-only: never import this file from a client component.
// Correct answers must not reach players' devices before the reveal.
import "server-only";

export type Level = "Basic" | "Intermediate" | "Advanced";
export type Topic =
  | "AI Fundamentals"
  | "How LLMs Work"
  | "Responsible Use"
  | "Prompting"
  | "Building with AI"
  | "Agents"
  | "Architecture";

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

export const QUESTIONS: Question[] = [
  // ───────────── BASIC ─────────────
  {
    id: 1,
    level: "Basic",
    topic: "AI Fundamentals",
    type: "multiple",
    text: "How are Artificial Intelligence, Machine Learning and Deep Learning related?",
    options: [
      "They are three independent fields",
      "Deep Learning is part of Machine Learning, which is part of AI",
      "Machine Learning is part of Deep Learning",
      "AI is one type of Machine Learning",
    ],
    correct: 1,
    timeLimitSec: 20,
    explanation:
      "AI is the broad goal of machines doing intelligent tasks. Machine Learning is how they learn from data, and Deep Learning uses many-layered neural networks. It is what powers today's LLMs.",
  },
  {
    id: 2,
    level: "Basic",
    topic: "How LLMs Work",
    type: "truefalse",
    text: "On its own, a language model like ChatGPT answers by looking up facts stored in a database.",
    options: ["True", "False"],
    correct: 1,
    timeLimitSec: 20,
    explanation:
      "An LLM generates text one token at a time, predicting what is most likely to come next based on patterns learned in training. That is why it can sound right and still be wrong.",
  },
  {
    id: 3,
    level: "Basic",
    topic: "Responsible Use",
    type: "multiple",
    text: "In Generative AI, what is a \"hallucination\"?",
    options: [
      "A crash caused by too many requests",
      "When the model refuses to answer",
      "An image generated from a text prompt",
      "A confident answer that is false or made up",
    ],
    correct: 3,
    timeLimitSec: 20,
    explanation:
      "Models predict plausible text, not verified facts. Always double-check names, numbers, quotes and citations before using AI output.",
  },

  // ───────────── INTERMEDIATE ─────────────
  {
    id: 4,
    level: "Intermediate",
    topic: "How LLMs Work",
    type: "multiple",
    text: "When an LLM processes text, what is a \"token\"?",
    options: [
      "A chunk of text, such as a word or part of a word",
      "A password used to access the model",
      "One full sentence of the prompt",
      "A single neuron in the network",
    ],
    correct: 0,
    timeLimitSec: 20,
    explanation:
      "In English, 1 token is roughly ¾ of a word. Context limits, speed and pricing are all measured in tokens.",
  },
  {
    id: 5,
    level: "Intermediate",
    topic: "Prompting",
    type: "multiple",
    text: "What is \"few-shot prompting\"?",
    options: [
      "Asking the same question a few times and picking the best answer",
      "Using a smaller model to reduce cost",
      "Including a few examples of the desired input and output in the prompt",
      "Limiting the answer to a few sentences",
    ],
    correct: 2,
    timeLimitSec: 20,
    explanation:
      "Showing 2–5 examples teaches the model the format and style you want, with no retraining. Zero-shot means giving no examples.",
  },
  {
    id: 6,
    level: "Intermediate",
    topic: "How LLMs Work",
    type: "truefalse",
    text: "Lowering a model's \"temperature\" setting makes its output more predictable and consistent.",
    options: ["True", "False"],
    correct: 0,
    timeLimitSec: 20,
    explanation:
      "Temperature controls how random the next-token choice is. Use a low value for factual or structured tasks and a higher one for brainstorming.",
  },
  {
    id: 7,
    level: "Intermediate",
    topic: "Building with AI",
    type: "multiple",
    text: "What are \"embeddings\"?",
    options: [
      "Images hidden inside a document",
      "Lists of numbers (vectors) that represent the meaning of text",
      "Ads inserted into AI-generated content",
      "Code that runs a model inside a web page",
    ],
    correct: 1,
    timeLimitSec: 20,
    explanation:
      "Texts with similar meaning get vectors that are close together. This powers semantic search, recommendations, clustering and RAG.",
  },

  // ───────────── ADVANCED ─────────────
  {
    id: 8,
    level: "Advanced",
    topic: "Building with AI",
    type: "multiple",
    text: "Your team needs an assistant that answers from internal policies that change every week. What is the best approach?",
    options: [
      "Fine-tune the model every week on the new policies",
      "Train a new model from scratch",
      "Paste every policy document into each prompt by hand",
      "RAG: retrieve the relevant policy sections and add them to the prompt",
    ],
    correct: 3,
    timeLimitSec: 20,
    explanation:
      "Retrieval-Augmented Generation keeps knowledge current without retraining and lets the assistant cite its sources. Fine-tuning is better for teaching style or behavior than for facts that change often.",
  },
  {
    id: 9,
    level: "Advanced",
    topic: "Agents",
    type: "multiple",
    text: "What best distinguishes an AI agent from a simple chatbot?",
    options: [
      "It plans steps and uses tools (search, code, APIs) in a loop to reach a goal",
      "It always runs on a larger model",
      "It talks to you through a voice interface",
      "It is trained only on company data",
    ],
    correct: 0,
    timeLimitSec: 20,
    explanation:
      "An agent combines an LLM with tools, memory and a reason, act, observe loop. Standards like MCP (Model Context Protocol) make it easier to connect agents to tools and data.",
  },
  {
    id: 10,
    level: "Advanced",
    topic: "Architecture",
    type: "multiple",
    text: "Which mechanism at the core of the Transformer lets a model weigh how relevant each token is to every other token?",
    options: ["Backpropagation", "Convolution", "Self-attention", "Gradient boosting"],
    correct: 2,
    timeLimitSec: 20,
    explanation:
      "Self-attention, introduced in the 2017 paper \"Attention Is All You Need\", lets models use context across a whole passage at once. It is the foundation of GPT, Claude, Gemini and Llama.",
  },
];
