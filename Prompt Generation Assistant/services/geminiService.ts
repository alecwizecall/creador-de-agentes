import { GoogleGenAI, Type } from "@google/genai";
import { BusinessInfo, DataSource } from "../types";

// Initialize the client strictly as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini with Google Search to find information about a business or URL.
 */
export const enrichBusinessInfo = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for detailed information about: "${query}". 
      Provide a comprehensive summary of the business, its services, products, pricing (if available), and key values. 
      Format it as clear text suitable for building a knowledge base. Return the summary in Spanish.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "No se encontró información.";
  } catch (error) {
    console.error("Error fetching business info:", error);
    throw new Error("No se pudo recuperar la información de la web.");
  }
};

/**
 * Uses Gemini to crawl/summarize a specific URL via Search Grounding.
 */
export const summarizeUrlContent = async (url: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Access information related to this URL: ${url}. 
      Summarize the key content found on this page that would be relevant for a customer support bot (FAQs, Policies, Pricing, Company Info).
      Return the summary in Spanish.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "No se pudo extraer contenido de esta URL.";
  } catch (error) {
    console.error("Error summarizing URL:", error);
    throw new Error("No se pudo procesar la URL.");
  }
};

/**
 * Generates the final System Prompt using the gathered context.
 * Uses Pro model for better reasoning and structure.
 */
export const generateSystemPrompt = async (
  info: BusinessInfo,
  dataSources: DataSource[]
): Promise<string> => {
  const contextData = dataSources
    .map((ds) => `--- FUENTE: ${ds.name} (${ds.type}) ---\n${ds.content}\n`)
    .join("\n");

  const prompt = `
    Role: Experto Ingeniero de Prompts de IA.
    Task: Crear una "Instrucción del Sistema" (System Prompt) altamente estructurada y profesional para un Agente Chatbot de IA, optimizada para LLMs modernos.
    
    Información del Negocio:
    - Nombre: ${info.name}
    - Industria: ${info.industry}
    - Descripción: ${info.description}
    - Tono Deseado: ${info.tone}
    - Idioma Principal: ${info.language}

    Base de Conocimiento / Datos de Contexto (Usa esto para poblar la sección de contexto):
    ${contextData}

    INSTRUCCIONES DE SALIDA:
    Genera un System Prompt completo y listo para copiar. DEBES seguir estrictamente esta estructura de 10 puntos en formato Markdown:

    # 1. IDENTIDAD DEL AGENTE
    [Define quién es el agente (ej. "Eres..."), su nombre y su rol experto]

    # 2. PROPÓSITO / MISIÓN PRINCIPAL
    [Define el objetivo principal de la interacción (ej. "Tu misión es...")]

    # 3. RESPONSABILIDADES
    [Lista con viñetas de tareas clave que debe realizar]

    # 4. LÍMITES Y RESTRICCIONES
    [Qué NO hacer: temas prohibidos, alucinaciones, inventar precios, consejos médicos/legales si aplica]

    # 5. CONTEXTO / BASE DE CONOCIMIENTO
    [Resumen sintetizado y bien organizado de TODA la información proporcionada en el contexto (Precios, horarios, servicios, políticas, FAQs)]

    # 6. ESTILO DE COMUNICACIÓN
    [Instrucciones sobre: Tono, Voz, Longitud de respuesta y Formato]

    # 7. PROTOCOLO DE RESPUESTA
    [Pasos lógicos para responder consultas (ej. 1. Analizar, 2. Consultar base, 3. Responder)]

    # 8. MANEJO DE CASOS FUERA DE ALCANCE
    [Instrucciones específicas sobre qué decir si no sabe la respuesta o el tema no es relevante para el negocio]

    # 9. PRIVACIDAD / SEGURIDAD
    [Lineamientos sobre manejo de datos del usuario]

    # 10. EJEMPLOS DE DIÁLOGO
    [Genera 2 ejemplos de interacción ideal Usuario <-> IA (Few-Shot prompting) basados en el negocio real]

    IMPORTANTE: 
    - El contenido debe estar dirigido al modelo en segunda persona (ej. "Eres...", "Debes...").
    - Escribe el prompt final en ${info.language}.
    - Si falta información específica en la base de conocimiento para alguna sección (como privacidad), genera directrices estándar profesionales adecuadas para la industria.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning and synthesis
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        // Higher thinking budget for better structure if needed, but 0 is fine for this unless it gets very complex.
        // Let's rely on Pro's native capability.
        temperature: 0.7,
      }
    });

    return response.text || "Falló la generación del prompt.";
  } catch (error) {
    console.error("Error generating system prompt:", error);
    throw new Error("Falló la generación del system prompt.");
  }
};