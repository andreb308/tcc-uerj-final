// -- Report data type and versioned datasets --

export interface DialectMapEntry {
  label: string;
  value: number; // 0–100
}

export interface Idiom {
  term: string;
  definition: string;
}

export interface ReportData {
  // Header
  reportId: string;
  trackTitle: string;
  artist: string;

  // Metadata
  metadata: {
    album: string;
    year: number;
    genre: string;
    bpm: number;
    musicalKey: string;
  };

  // Section 01 — Thesis
  thesis: {
    summary: string;
    extendedAnalysis: string;
    instructorNote: string;
  };

  // Section 02 — Data metrics
  dataMetrics: {
    wordCount: number;
    uniqueStems: number;
    complexity: number;
    complexityLabel: string;
    rhymeDensity: number; // 1–5
    dialectMap: DialectMapEntry[];
  };

  // Section 03 — Idioms
  idioms: Idiom[];

  // Footer
  footer: {
    userId: string;
    sessionId: string;
    timestamp: string;
  };
}

// ---------------------------------------------------------------------------
// Version 0 — Kendrick Lamar "u" (original hardcoded data)
// ---------------------------------------------------------------------------
const kendrickReport: ReportData = {
  reportId: '#00992-ALPHA',
  trackTitle: 'u',
  artist: 'Kendrick Lamar',

  metadata: {
    album: 'TO PIMP A BUTTERFLY',
    year: 2015,
    genre: 'HIP HOP / JAZZ RAP',
    bpm: 78,
    musicalKey: 'A MINOR',
  },

  thesis: {
    summary:
      '"u" serves as the chaotic, introspective inverse to the self-celebratory anthem "i". Through a drunken, sobbing vocal delivery, Lamar interrogates his own survivor\'s guilt, framing his success as a failure to protect his community back in Compton.',
    extendedAnalysis:
      'The track utilizes a "bottle" metaphor not just for alcoholism, but for the containment of toxic masculinity and emotional suppression. The text is broken by scream-like interjections, disrupting the flow and mirroring a psychological breakdown.',
    instructorNote:
      '"The syntax here is deliberately fractured. Study the breaks in rhythm--they are linguistic representations of the speaker\'s deteriorating mental state."',
  },

  dataMetrics: {
    wordCount: 482,
    uniqueStems: 156,
    complexity: 0.85,
    complexityLabel: 'HIGH',
    rhymeDensity: 4,
    dialectMap: [
      { label: 'AAVE', value: 90 },
      { label: 'POETIC', value: 70 },
      { label: 'SLANG', value: 60 },
      { label: 'FORMAL', value: 20 },
    ],
  },

  idioms: [
    {
      term: '"Bottle up"',
      definition:
        'To suppress emotions or keep them hidden inside, like liquid in a sealed container.',
    },
    {
      term: '"Housekeeping"',
      definition:
        "Here, a metaphor for internal mental maintenance or cleaning up one's own life/mess.",
    },
    {
      term: '"Survivor\'s Guilt"',
      definition:
        'A mental condition that occurs when a person believes they have done wrong by surviving a traumatic event when others did not.',
    },
    {
      term: '"Broken Window Theory"',
      definition:
        'Implied context: Visible signs of disorder and misbehavior in an environment encourage further disorder.',
    },
  ],

  footer: {
    userId: 'User_882',
    sessionId: 'XJ-992-ALPHA',
    timestamp: '2023-10-27 14:02 UTC',
  },
};

// ---------------------------------------------------------------------------
// Version 1 — Taylor Swift "ME!" (AI-generated analysis)
// ---------------------------------------------------------------------------
const taylorReport: ReportData = {
  reportId: '#00993-BETA',
  trackTitle: 'ME! (feat. Brendon Urie)',
  artist: 'Taylor Swift',

  metadata: {
    album: 'Lover',
    year: 2019,
    genre: 'SYNTH-POP',
    bpm: 112,
    musicalKey: 'C MAJOR',
  },

  thesis: {
    summary:
      'O trecho opera uma **subversão semântica de um aforismo popular**, transformando um lembrete sobre coletivismo em uma afirmação vibrante de **individualidade e autoconfiança**.',
    extendedAnalysis:
      "A letra utiliza um *pun* (trocadilho) linguístico para desconstruir a máxima 'there is no I in team' (não há 'eu' em equipe). Ao inverter a lógica do provérbio, Swift desloca o eixo da narrativa do altruísmo para a **autoafirmação**, característica central da era *Lover*. \n\nContextualmente, a faixa 'ME!' marca a transição da artista de uma fase de introspecção e conflito (era *Reputation*) para uma celebração pública de sua identidade. A simplicidade da estrutura lírica reflete a estética *bubblegum pop*, onde a mensagem de **empoderamento pessoal** é entregue de forma direta, quase infantil em sua candura, mas tecnicamente precisa em sua entrega rítmica para o consumo de massa.",
    instructorNote:
      'A manobra retórica aqui é classificada como *paraprosdokian*: o final da frase é inesperado e altera a interpretação do início, criando um efeito cômico e assertivo.',
  },

  dataMetrics: {
    wordCount: 14,
    uniqueStems: 12,
    complexity: 0.25,
    complexityLabel: 'LOW',
    rhymeDensity: 2,
    dialectMap: [
      { label: 'COLLOQUIAL', value: 85 },
      { label: 'PLAYFUL', value: 95 },
      { label: 'POP_LYRICISM', value: 90 },
      { label: 'ASSERTIVE', value: 70 },
    ],
  },

  idioms: [
    {
      term: '"There ain\'t no I in Team"',
      definition:
        'Expressão idiomática comum em inglês usada para enfatizar a importância do trabalho em equipe sobre o ego individual. Serve como a premissa lógica (estágio de tese) que a artista pretende derrubar imediatamente no verso seguinte.',
    },
    {
      term: '"There is a ME!"',
      definition:
        'Subversão gramatical e semântica da frase anterior. Reivindicação de espaço e identidade, sugerindo que a individualidade é a peça central da música e da autoaceitação da artista.',
    },
  ],

  footer: {
    userId: 'User_882',
    sessionId: 'XJ-993-BETA',
    timestamp: '2024-01-15 09:31 UTC',
  },
};

// ---------------------------------------------------------------------------
// Version 2 — Taylor Swift "cowboy like me" (AI-generated analysis)
// ---------------------------------------------------------------------------
const cowboyReport: ReportData = {
  reportId: '#00994-GAMMA',
  trackTitle: 'cowboy like me',
  artist: 'Taylor Swift',

  metadata: {
    album: 'evermore',
    year: 2020,
    genre: 'INDIE FOLK / CHAMBER POP',
    bpm: 88,
    musicalKey: 'G MAJOR',
  },

  thesis: {
    summary:
      'O trecho apresenta uma **dinâmica de espelhamento** entre dois personagens marginalizados socialmente (estelionatários emocionais), onde o cinismo da manipulação financeira é confrontado por uma *identificação mútua inesperada*. O sentimento oscila entre a frieza transacional e a vulnerabilidade do reconhecimento.',
    extendedAnalysis:
      "A composição insere-se na fase de *storytelling* ficcional de Taylor Swift no álbum **evermore**, afastando-se do confessionalismo para explorar arquétipos. O uso da metáfora do 'bandit' (bandido/fora da lei) subverte a imagem do cowboy romântico do oeste americano, transformando-a em uma analogia para a **ascensão socioeconômica via engano**. \n\nObserva-se uma progressão semântica crucial: a transição da frase *'I could be the way forward / Only if they pay for it'* (o eu lírico como produto) para *'We could be the way forward / And I know I'll pay for it'*. Esta mudança desloca o custo do financeiro para o emocional, sugerindo que a única coisa que o estelionatário não consegue comprar — ou evitar pagar — é o preço da conexão humana genuína.",
    instructorNote:
      "A estrutura lírica aqui opera sob a técnica de *parallelism*, onde a repetição de frases com leves alterações de pronomes ('I' para 'We') sinaliza a mudança de paradigma do isolamento para a parceria.",
  },

  dataMetrics: {
    wordCount: 67,
    uniqueStems: 42,
    complexity: 0.62,
    complexityLabel: 'MODERATE',
    rhymeDensity: 2,
    dialectMap: [
      { label: 'STORYTELLING', value: 95 },
      { label: 'CONVERSATIONAL', value: 80 },
      { label: 'CYNICAL', value: 75 },
      { label: 'FOLK', value: 60 },
    ],
  },

  idioms: [
    {
      term: '"Bandit like me"',
      definition:
        "Metáfora para alguém que opera à margem da moralidade social, especificamente um manipulador ou 'con artist'.",
    },
    {
      term: '"Eyes full of stars"',
      definition:
        "Representa a ambição desmedida ou a ilusão de grandeza, contrastando com a realidade mundana do 'hustling'.",
    },
    {
      term: '"Hustling for the good life"',
      definition:
        "Uso do termo 'hustle' para descrever a busca frenética e muitas vezes antiética por status e riqueza.",
    },
    {
      term: '"The way forward"',
      definition:
        'Construção poética que inicialmente representa a falsa promessa de salvação vendida a terceiros e, posteriormente, a possibilidade de redenção mútua.',
    },
  ],

  footer: {
    userId: 'User_882',
    sessionId: 'XJ-994-GAMMA',
    timestamp: '2024-02-03 17:45 UTC',
  },
};

// ---------------------------------------------------------------------------
// Versioned report registry
// ---------------------------------------------------------------------------
export const REPORT_VERSIONS: ReportData[] = [kendrickReport, taylorReport, cowboyReport];
