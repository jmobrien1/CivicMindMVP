export const translations = {
  en: {
    // Landing page
    landing: {
      title: "AI-Powered Municipal Services",
      subtitle: "24/7 instant answers for citizens",
      chatNow: "Chat Now",
      viewTransparency: "View Transparency Report",
    },
    // Chat widget
    chat: {
      placeholder: "Ask about town services...",
      send: "Send",
      helpful: "Was this helpful?",
      speakToStaff: "Speak to Staff",
      poweredBy: "Powered by CivicMind AI",
    },
    // Transparency page
    transparency: {
      title: "AI Transparency Dashboard",
      totalQueries: "Total Queries",
      avgResponse: "Avg Response Time",
      satisfaction: "Satisfaction Rate",
      topTopics: "Top Topics",
    },
  },
  es: {
    // Landing page
    landing: {
      title: "Servicios Municipales con IA",
      subtitle: "Respuestas instantáneas 24/7 para ciudadanos",
      chatNow: "Chatear Ahora",
      viewTransparency: "Ver Informe de Transparencia",
    },
    // Chat widget
    chat: {
      placeholder: "Pregunte sobre servicios del pueblo...",
      send: "Enviar",
      helpful: "¿Fue útil?",
      speakToStaff: "Hablar con Personal",
      poweredBy: "Impulsado por CivicMind AI",
    },
    // Transparency page
    transparency: {
      title: "Panel de Transparencia de IA",
      totalQueries: "Consultas Totales",
      avgResponse: "Tiempo Promedio de Respuesta",
      satisfaction: "Tasa de Satisfacción",
      topTopics: "Temas Principales",
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
