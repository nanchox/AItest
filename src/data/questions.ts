// Server-only: never import this file from a client component.
// Correct answers must not reach players' devices before the reveal.
import "server-only";
import type { Lang } from "@/lib/i18n";

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

type L<T> = { en: T; es: T };

export interface Question {
  id: number;
  level: Level;
  topic: Topic;
  type: "multiple" | "truefalse";
  text: L<string>;
  options: L<string[]>; // same order in both languages; "truefalse" would use two options
  correct: number; // index into options
  timeLimitSec: number;
  explanation: L<string>; // shown on the reveal screen
}

/** The text a player/host sees for a question in a given language. */
export function localize(q: Question, lang: Lang) {
  return { text: q.text[lang], options: q.options[lang], explanation: q.explanation[lang] };
}

// The correct option is deliberately spread across A/B/C/D so that picking the same letter every time doesn't pay off.
export const QUESTIONS: Question[] = [
  {
    id: 1,
    level: "Basic",
    topic: "AI Fundamentals",
    type: "multiple",
    text: {
      en: "Which of the following is an example of Artificial Intelligence?",
      es: "¿Cuál de los siguientes es un ejemplo de Inteligencia Artificial?",
    },
    options: {
      en: ["A basic calculator", "A USB cable", "A chatbot that understands natural language", "An external hard drive"],
      es: ["Una calculadora básica", "Un cable USB", "Un chatbot que entiende el lenguaje natural", "Un disco duro externo"],
    },
    correct: 2,
    timeLimitSec: 20,
    explanation: {
      en: "AI is software that performs tasks that normally need human intelligence, like understanding language. A calculator follows fixed rules, and cables and drives are just hardware.",
      es: "La IA es software que realiza tareas que normalmente requieren inteligencia humana, como entender el lenguaje. Una calculadora sigue reglas fijas, y los cables y los discos son solo hardware.",
    },
  },
  {
    id: 2,
    level: "Basic",
    topic: "AI Fundamentals",
    type: "multiple",
    text: {
      en: "What is Machine Learning?",
      es: "¿Qué es el Machine Learning (aprendizaje automático)?",
    },
    options: {
      en: ["A way to store files", "A programming language", "A database", "A technique that allows systems to learn patterns from data"],
      es: ["Una forma de almacenar archivos", "Un lenguaje de programación", "Una base de datos", "Una técnica que permite a los sistemas aprender patrones a partir de datos"],
    },
    correct: 3,
    timeLimitSec: 20,
    explanation: {
      en: "Instead of being given every rule, a machine learning system finds patterns in examples and uses them to make predictions or decisions.",
      es: "En lugar de recibir todas las reglas, un sistema de machine learning encuentra patrones en ejemplos y los usa para hacer predicciones o tomar decisiones.",
    },
  },
  {
    id: 3,
    level: "Basic",
    topic: "Generative AI",
    type: "multiple",
    text: {
      en: "What mainly distinguishes Generative AI?",
      es: "¿Qué distingue principalmente a la IA Generativa?",
    },
    options: {
      en: ["It can generate new content", "It only analyzes existing data", "It only works with images", "It does not require data"],
      es: ["Puede generar contenido nuevo", "Solo analiza datos existentes", "Solo funciona con imágenes", "No requiere datos"],
    },
    correct: 0,
    timeLimitSec: 20,
    explanation: {
      en: "Generative AI creates new text, images, code, audio or video. It is trained on large amounts of data, and it works with many kinds of content, not only images.",
      es: "La IA generativa crea texto, imágenes, código, audio o video nuevos. Se entrena con grandes cantidades de datos y funciona con muchos tipos de contenido, no solo imágenes.",
    },
  },
  {
    id: 4,
    level: "Basic",
    topic: "Prompting",
    type: "multiple",
    text: {
      en: "What is a prompt in Generative AI?",
      es: "¿Qué es un prompt en la IA Generativa?",
    },
    options: {
      en: ["A compression algorithm", "An instruction or context given to an AI model", "A password used to access AI", "A type of server"],
      es: ["Un algoritmo de compresión", "Una instrucción o contexto que se le da a un modelo de IA", "Una contraseña para acceder a la IA", "Un tipo de servidor"],
    },
    correct: 1,
    timeLimitSec: 20,
    explanation: {
      en: "A prompt is what you tell the model: your question, instructions and context. Clear context, goal and format give much better results.",
      es: "Un prompt es lo que le dices al modelo: tu pregunta, instrucciones y contexto. Un contexto, objetivo y formato claros dan resultados mucho mejores.",
    },
  },
  {
    id: 5,
    level: "Intermediate",
    topic: "Responsible Use",
    type: "multiple",
    text: {
      en: "What is an AI \"hallucination\"?",
      es: "¿Qué es una \"alucinación\" de la IA?",
    },
    options: {
      en: ["When the AI stops working", "When an AI learns too much", "When AI generates incorrect or fabricated information that sounds convincing", "When an AI generates an image"],
      es: ["Cuando la IA deja de funcionar", "Cuando una IA aprende demasiado", "Cuando la IA genera información incorrecta o inventada que suena convincente", "Cuando una IA genera una imagen"],
    },
    correct: 2,
    timeLimitSec: 20,
    explanation: {
      en: "Models predict plausible text, not verified facts, so they can sound sure and still be wrong. Always double-check names, numbers, quotes and sources.",
      es: "Los modelos predicen texto plausible, no hechos verificados, así que pueden sonar seguros y aun así estar equivocados. Verifica siempre nombres, cifras, citas y fuentes.",
    },
  },
  {
    id: 6,
    level: "Intermediate",
    topic: "How LLMs Work",
    type: "multiple",
    text: {
      en: "What is an LLM (Large Language Model)?",
      es: "¿Qué es un LLM (Large Language Model, o modelo de lenguaje grande)?",
    },
    options: {
      en: ["An AI model trained to understand and generate language", "A very large database", "An operating system", "An Internet protocol"],
      es: ["Un modelo de IA entrenado para entender y generar lenguaje", "Una base de datos muy grande", "Un sistema operativo", "Un protocolo de Internet"],
    },
    correct: 0,
    timeLimitSec: 20,
    explanation: {
      en: "An LLM is a model trained on huge amounts of text so it can understand and write language. ChatGPT, Claude and Gemini are built on LLMs.",
      es: "Un LLM es un modelo entrenado con enormes cantidades de texto para entender y escribir lenguaje. ChatGPT, Claude y Gemini están construidos sobre LLMs.",
    },
  },
  {
    id: 7,
    level: "Advanced",
    topic: "Building with AI",
    type: "multiple",
    text: {
      en: "What is RAG (Retrieval-Augmented Generation) used for?",
      es: "¿Para qué se usa RAG (Retrieval-Augmented Generation, o generación aumentada por recuperación)?",
    },
    options: {
      en: ["Reducing the size of an AI model", "Generating images", "Replacing prompts", "Grounding AI responses with relevant external information"],
      es: ["Reducir el tamaño de un modelo de IA", "Generar imágenes", "Reemplazar los prompts", "Fundamentar las respuestas de la IA con información externa relevante"],
    },
    correct: 3,
    timeLimitSec: 20,
    explanation: {
      en: "RAG looks up relevant documents first and gives them to the model, so answers are based on your own, up-to-date information and can cite sources.",
      es: "RAG primero busca documentos relevantes y se los entrega al modelo, así las respuestas se basan en tu información propia y actualizada, y pueden citar sus fuentes.",
    },
  },
  {
    id: 8,
    level: "Advanced",
    topic: "Agents",
    type: "multiple",
    text: {
      en: "What mainly differentiates an AI Agent from a traditional chatbot?",
      es: "¿Qué diferencia principalmente a un Agente de IA de un chatbot tradicional?",
    },
    options: {
      en: ["It only responds faster", "It always uses a larger AI model", "It can reason about tasks, use tools, and take actions to achieve a goal", "It does not need an LLM"],
      es: ["Solo responde más rápido", "Siempre usa un modelo de IA más grande", "Puede razonar sobre tareas, usar herramientas y tomar acciones para lograr un objetivo", "No necesita un LLM"],
    },
    correct: 2,
    timeLimitSec: 20,
    explanation: {
      en: "A chatbot answers. An agent plans steps, uses tools (search, files, apps) and acts toward a goal, so its actions need human oversight.",
      es: "Un chatbot responde. Un agente planea pasos, usa herramientas (búsqueda, archivos, aplicaciones) y actúa para lograr un objetivo, por eso sus acciones necesitan supervisión humana.",
    },
  },
  {
    id: 9,
    level: "Intermediate",
    topic: "Responsible Use",
    type: "multiple",
    text: {
      en: "Which is a good practice when using Generative AI at work?",
      es: "¿Cuál es una buena práctica al usar IA Generativa en el trabajo?",
    },
    options: {
      en: ["Always trust the first answer", "Verify AI-generated results, use approved tools, and follow data policies", "Share any company data to get better results", "Avoid human oversight"],
      es: ["Confiar siempre en la primera respuesta", "Verificar los resultados generados por la IA, usar herramientas aprobadas y seguir las políticas de datos", "Compartir cualquier dato de la empresa para obtener mejores resultados", "Evitar la supervisión humana"],
    },
    correct: 1,
    timeLimitSec: 20,
    explanation: {
      en: "You stay responsible for the result: check it, use company-approved tools and never share confidential or personal data where it is not allowed.",
      es: "Sigues siendo responsable del resultado: revísalo, usa herramientas aprobadas por la empresa y nunca compartas datos confidenciales o personales donde no está permitido.",
    },
  },
  {
    id: 10,
    level: "Bonus",
    topic: "AI Mindset",
    type: "multiple",
    text: {
      en: "What should be the main goal of adopting AI in our daily work?",
      es: "¿Cuál debería ser el objetivo principal de adoptar la IA en nuestro trabajo diario?",
    },
    options: {
      en: ["Augment our capabilities and solve real business problems", "Replace people", "Use AI because it is trendy", "Automate absolutely everything"],
      es: ["Potenciar nuestras capacidades y resolver problemas reales del negocio", "Reemplazar a las personas", "Usar la IA porque está de moda", "Automatizar absolutamente todo"],
    },
    correct: 0,
    timeLimitSec: 20,
    explanation: {
      en: "AI works best as a partner: it frees time and extends what we can do so we can focus on real problems. People stay in charge of judgment and decisions.",
      es: "La IA funciona mejor como un socio: libera tiempo y amplía lo que podemos hacer para enfocarnos en problemas reales. Las personas siguen a cargo del criterio y de las decisiones.",
    },
  },
];
