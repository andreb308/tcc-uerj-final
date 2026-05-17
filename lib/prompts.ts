// ---------------------------------------------------------------------------
// Shared system prompt for the Cultural Data Analyst / Computational Musicologist
// ---------------------------------------------------------------------------
// Used by:
//   - POST /api/report/[id] (structured report generation)
//   - POST /api/chat        (conversational mode, optionally seeded with report context)
// ---------------------------------------------------------------------------

export const REPORT_SYSTEM_PROMPT = `Você é um Analista de Dados Culturais e Musicólogo Computacional operando um terminal de análise semântica de alta precisão. Sua função é receber o nome de um artista, o título de uma música e um trecho específico de sua letra, e retornar um dossiê analítico estritamente estruturado.

Sua análise deve ser profunda, técnica, objetiva e acadêmica, desconstruindo a música em métricas quantitativas e metadados qualitativos.

REGRAS DE FORMATAÇÃO E TIPAGEM (ESTRITO):
1. Utilize a sintaxe Markdown APENAS dentro dos campos 'summary', 'extendedAnalysis' e 'instructorNote' para adicionar negrito (**), itálico (*) ou listas estruturadas. Não utilize Markdown em nenhum outro campo.
2. O idioma da sua resposta (textos e dados) DEVE SEMPRE ser compatível com a variável 'targetLanguage'. Caso o termo da música seja diferente do idioma do report, a tradução deve aparecer em parênteses logo em seguida.

DIRETRIZES DE PREENCHIMENTO DOS CAMPOS:

[METADATA / HEADER]
- album, year, genre: Busque a informação factual mais precisa possível sobre a faixa. Se não tiver um álbum pertencente à música (ex: Singles considerados 'droplets'), deve aparecer 'Nome da Música - Single' como álbum.
- bpm, musicalKey: Forneça os dados reais da música. Se não houver registro exato no seu banco de dados, faça a estimativa técnica mais precisa baseada no gênero e andamento da faixa original. Quanto à musicalKey, garanta que seu resultado bata com o idioma (ex: Dó, Ré, Mi, etc. em Português; A, B, C, etc. em inglês.)

[SECTION 01 - THESIS]
- summary: Um parágrafo incisivo (com Markdown) resumindo o tema central e o sentimento do trecho fornecido.
- extendedAnalysis: Uma análise profunda e detalhada (2 a 3 parágrafos, utilizando Markdown para ênfase). Aqui o significado da música deve ser conectado ao contexto da vida do artista, do álbum a que a música pertence, ou do momento histórico.
- instructorNote: Uma nota curta, quase como um comentário de rodapé de um professor universitário ou um "fun fact" técnico brutalista sobre a composição.

[SECTION 02 - DATA METRICS]
Atue como um analisador léxico para o trecho fornecido:
- wordCount: Número inteiro estimado de palavras no trecho analisado.
- uniqueStems: Estimativa de raízes de palavras únicas (vocabulário).
- complexity: Um valor float entre 0.0 e 1.0 representando a complexidade sintática e semântica do trecho.
- complexityLabel: Uma string em caixa alta definindo o nível (ex: "LOW", "MODERATE", "HIGH", "EXPERT").
- rhymeDensity: Um valor inteiro de 1 a 5 representando a complexidade do esquema de rimas (1 = básico/AABB, 5 = multissilábico/interno complexo).
- dialectMap: Crie um array de 4 objetos mapeando as influências linguísticas do trecho. Use labels em CAIXA ALTA (ex: "AAVE", "POETIC", "SLANG", "FORMAL", "MELANCHOLIC", "AGGRESSIVE", etc.) e distribua valores de 0 a 100 baseados na intensidade de cada traço.

[SECTION 03 - IDIOMS]
- idioms: Extraia de 1 a 8 expressões, gírias, metáforas ou construções poéticas notáveis do trecho fornecido e forneça suas definições diretas e o que representam naquele contexto específico. Essa é a chave da explicação, todo contexto linguístico e/ou cultural deve ser explicado aqui, principalmente o que não foi abordado na SECTION 01.`;

const ERROR_TEST = {
  name: 'AI_RetryError',
  reason: 'maxRetriesExceeded',
  errors: [
    {
      name: 'AI_APICallError',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent',
      requestBodyValues: {
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            required: ['id', 'metadata', 'thesis', 'dataMetrics', 'idioms'],
            type: 'object',
            properties: {
              id: { type: 'string' },
              metadata: {
                required: ['album', 'year', 'genre', 'bpm', 'musicalKey'],
                type: 'object',
                properties: {
                  album: { type: 'string' },
                  year: { type: 'number' },
                  genre: { type: 'string' },
                  bpm: { type: 'number' },
                  musicalKey: { type: 'string' },
                },
              },
              thesis: {
                required: ['summary', 'extendedAnalysis', 'instructorNote'],
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  extendedAnalysis: { type: 'string' },
                  instructorNote: { type: 'string' },
                },
              },
              dataMetrics: {
                required: [
                  'wordCount',
                  'uniqueStems',
                  'complexity',
                  'complexityLabel',
                  'rhymeDensity',
                  'dialectMap',
                ],
                type: 'object',
                properties: {
                  wordCount: { type: 'number' },
                  uniqueStems: { type: 'number' },
                  complexity: { type: 'number' },
                  complexityLabel: { type: 'string' },
                  rhymeDensity: { type: 'number' },
                  dialectMap: {
                    type: 'array',
                    items: {
                      required: ['label', 'value'],
                      type: 'object',
                      properties: { label: { type: 'string' }, value: { type: 'number' } },
                    },
                  },
                },
              },
              idioms: {
                type: 'array',
                items: {
                  required: ['term', 'definition'],
                  type: 'object',
                  properties: { term: { type: 'string' }, definition: { type: 'string' } },
                },
              },
            },
          },
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Você é um Analista de Dados Culturais e Musicólogo Computacional operando um terminal de análise semântica de alta precisão. Sua função é receber o nome de um artista, o título de uma música e um trecho específico de sua letra, e retornar um dossiê analítico estritamente estruturado.\n\nSua análise deve ser profunda, técnica, objetiva e acadêmica, desconstruindo a música em métricas quantitativas e metadados qualitativos.\n\nREGRAS DE FORMATAÇÃO E TIPAGEM (ESTRITO):\n1. Utilize a sintaxe Markdown APENAS dentro dos campos \'summary\', \'extendedAnalysis\' e \'instructorNote\' para adicionar negrito (**), itálico (*) ou listas estruturadas. Não utilize Markdown em nenhum outro campo.\n2. O idioma da análise (textos) deve ser em Português do Brasil (PT-BR), a menos que o termo original exija o inglês para não perder o sentido.\n\nDIRETRIZES DE PREENCHIMENTO DOS CAMPOS:\n\n[METADATA / HEADER]\n- album, year, genre: Busque a informação factual mais precisa possível sobre a faixa.\n- bpm, musicalKey: Forneça os dados reais da música. Se não houver registro exato no seu banco de dados, faça a estimativa técnica mais precisa baseada no gênero e andamento da faixa original.\n\n[SECTION 01 - THESIS]\n- summary: Um parágrafo incisivo (com Markdown) resumindo o tema central e o sentimento do trecho fornecido.\n- extendedAnalysis: Uma análise profunda e detalhada (2 a 3 parágrafos, utilizando Markdown para ênfase). Conecte o trecho fornecido com o contexto geral do álbum, da vida do artista ou do momento histórico.\n- instructorNote: Uma nota curta, quase como um comentário de rodapé de um professor universitário ou um "fun fact" técnico brutalista sobre a composição.\n\n[SECTION 02 - DATA METRICS]\nAtue como um analisador léxico para o trecho fornecido:\n- wordCount: Número inteiro estimado de palavras no trecho analisado.\n- uniqueStems: Estimativa de raízes de palavras únicas (vocabulário).\n- complexity: Um valor float entre 0.0 e 1.0 representando a complexidade sintática e semântica do trecho.\n- complexityLabel: Uma string em caixa alta definindo o nível (ex: "LOW", "MODERATE", "HIGH", "EXPERT").\n- rhymeDensity: Um valor inteiro de 1 a 5 representando a complexidade do esquema de rimas (1 = básico/AABB, 5 = multissilábico/interno complexo).\n- dialectMap: Crie um array de 3 a 5 objetos mapeando as influências linguísticas do trecho. Use labels em CAIXA ALTA (ex: "AAVE", "POETIC", "SLANG", "FORMAL", "MELANCHOLIC", "AGGRESSIVE") e distribua valores de 0 a 100 baseados na intensidade de cada traço.\n\n[SECTION 03 - IDIOMS]\n- idioms: Extraia de 1 a 5 expressões, gírias, metáforas ou construções poéticas notáveis do trecho fornecido e forneça suas definições diretas e o que representam naquele contexto específico.\n\n',
              },
              {
                text: "\n        artist: 'Taylor Swift',\n        trackTitle: 'Need',\n        targetLanguage: 'simple-english',\n        artifactData: \"Desire is the sound of the whiskey telling me you miss me, can you come around?\",",
              },
            ],
          },
        ],
        tools: [{ googleSearch: {} }],
      },
      statusCode: 500,
      responseHeaders: {
        'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
        'content-encoding': 'gzip',
        'content-type': 'application/json; charset=UTF-8',
        date: 'Sun, 10 May 2026 10:21:50 GMT',
        server: 'scaffolding on HTTPServer2',
        'server-timing': 'gfet4t7; dur=465',
        'transfer-encoding': 'chunked',
        vary: 'Origin, X-Origin, Referer',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'x-gemini-service-tier': 'standard',
        'x-xss-protection': '0',
      },
      responseBody:
        '{\n  "error": {\n    "code": 500,\n    "message": "Internal error encountered.",\n    "status": "INTERNAL"\n  }\n}\n',
      isRetryable: true,
      data: { error: { code: 500, message: 'Internal error encountered.', status: 'INTERNAL' } },
    },
    {
      name: 'AI_APICallError',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent',
      requestBodyValues: {
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            required: ['id', 'metadata', 'thesis', 'dataMetrics', 'idioms'],
            type: 'object',
            properties: {
              id: { type: 'string' },
              metadata: {
                required: ['album', 'year', 'genre', 'bpm', 'musicalKey'],
                type: 'object',
                properties: {
                  album: { type: 'string' },
                  year: { type: 'number' },
                  genre: { type: 'string' },
                  bpm: { type: 'number' },
                  musicalKey: { type: 'string' },
                },
              },
              thesis: {
                required: ['summary', 'extendedAnalysis', 'instructorNote'],
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  extendedAnalysis: { type: 'string' },
                  instructorNote: { type: 'string' },
                },
              },
              dataMetrics: {
                required: [
                  'wordCount',
                  'uniqueStems',
                  'complexity',
                  'complexityLabel',
                  'rhymeDensity',
                  'dialectMap',
                ],
                type: 'object',
                properties: {
                  wordCount: { type: 'number' },
                  uniqueStems: { type: 'number' },
                  complexity: { type: 'number' },
                  complexityLabel: { type: 'string' },
                  rhymeDensity: { type: 'number' },
                  dialectMap: {
                    type: 'array',
                    items: {
                      required: ['label', 'value'],
                      type: 'object',
                      properties: { label: { type: 'string' }, value: { type: 'number' } },
                    },
                  },
                },
              },
              idioms: {
                type: 'array',
                items: {
                  required: ['term', 'definition'],
                  type: 'object',
                  properties: { term: { type: 'string' }, definition: { type: 'string' } },
                },
              },
            },
          },
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Você é um Analista de Dados Culturais e Musicólogo Computacional operando um terminal de análise semântica de alta precisão. Sua função é receber o nome de um artista, o título de uma música e um trecho específico de sua letra, e retornar um dossiê analítico estritamente estruturado.\n\nSua análise deve ser profunda, técnica, objetiva e acadêmica, desconstruindo a música em métricas quantitativas e metadados qualitativos.\n\nREGRAS DE FORMATAÇÃO E TIPAGEM (ESTRITO):\n1. Utilize a sintaxe Markdown APENAS dentro dos campos \'summary\', \'extendedAnalysis\' e \'instructorNote\' para adicionar negrito (**), itálico (*) ou listas estruturadas. Não utilize Markdown em nenhum outro campo.\n2. O idioma da análise (textos) deve ser em Português do Brasil (PT-BR), a menos que o termo original exija o inglês para não perder o sentido.\n\nDIRETRIZES DE PREENCHIMENTO DOS CAMPOS:\n\n[METADATA / HEADER]\n- album, year, genre: Busque a informação factual mais precisa possível sobre a faixa.\n- bpm, musicalKey: Forneça os dados reais da música. Se não houver registro exato no seu banco de dados, faça a estimativa técnica mais precisa baseada no gênero e andamento da faixa original.\n\n[SECTION 01 - THESIS]\n- summary: Um parágrafo incisivo (com Markdown) resumindo o tema central e o sentimento do trecho fornecido.\n- extendedAnalysis: Uma análise profunda e detalhada (2 a 3 parágrafos, utilizando Markdown para ênfase). Conecte o trecho fornecido com o contexto geral do álbum, da vida do artista ou do momento histórico.\n- instructorNote: Uma nota curta, quase como um comentário de rodapé de um professor universitário ou um "fun fact" técnico brutalista sobre a composição.\n\n[SECTION 02 - DATA METRICS]\nAtue como um analisador léxico para o trecho fornecido:\n- wordCount: Número inteiro estimado de palavras no trecho analisado.\n- uniqueStems: Estimativa de raízes de palavras únicas (vocabulário).\n- complexity: Um valor float entre 0.0 e 1.0 representando a complexidade sintática e semântica do trecho.\n- complexityLabel: Uma string em caixa alta definindo o nível (ex: "LOW", "MODERATE", "HIGH", "EXPERT").\n- rhymeDensity: Um valor inteiro de 1 a 5 representando a complexidade do esquema de rimas (1 = básico/AABB, 5 = multissilábico/interno complexo).\n- dialectMap: Crie um array de 3 a 5 objetos mapeando as influências linguísticas do trecho. Use labels em CAIXA ALTA (ex: "AAVE", "POETIC", "SLANG", "FORMAL", "MELANCHOLIC", "AGGRESSIVE") e distribua valores de 0 a 100 baseados na intensidade de cada traço.\n\n[SECTION 03 - IDIOMS]\n- idioms: Extraia de 1 a 5 expressões, gírias, metáforas ou construções poéticas notáveis do trecho fornecido e forneça suas definições diretas e o que representam naquele contexto específico.\n\n',
              },
              {
                text: "\n        artist: 'Taylor Swift',\n        trackTitle: 'Need',\n        targetLanguage: 'simple-english',\n        artifactData: \"Desire is the sound of the whiskey telling me you miss me, can you come around?\",",
              },
            ],
          },
        ],
        tools: [{ googleSearch: {} }],
      },
      statusCode: 500,
      responseHeaders: {
        'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
        'content-encoding': 'gzip',
        'content-type': 'application/json; charset=UTF-8',
        date: 'Sun, 10 May 2026 10:21:53 GMT',
        server: 'scaffolding on HTTPServer2',
        'server-timing': 'gfet4t7; dur=668',
        'transfer-encoding': 'chunked',
        vary: 'Origin, X-Origin, Referer',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'x-gemini-service-tier': 'standard',
        'x-xss-protection': '0',
      },
      responseBody:
        '{\n  "error": {\n    "code": 500,\n    "message": "Internal error encountered.",\n    "status": "INTERNAL"\n  }\n}\n',
      isRetryable: true,
      data: { error: { code: 500, message: 'Internal error encountered.', status: 'INTERNAL' } },
    },
    {
      name: 'AI_APICallError',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent',
      requestBodyValues: {
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            required: ['id', 'metadata', 'thesis', 'dataMetrics', 'idioms'],
            type: 'object',
            properties: {
              id: { type: 'string' },
              metadata: {
                required: ['album', 'year', 'genre', 'bpm', 'musicalKey'],
                type: 'object',
                properties: {
                  album: { type: 'string' },
                  year: { type: 'number' },
                  genre: { type: 'string' },
                  bpm: { type: 'number' },
                  musicalKey: { type: 'string' },
                },
              },
              thesis: {
                required: ['summary', 'extendedAnalysis', 'instructorNote'],
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  extendedAnalysis: { type: 'string' },
                  instructorNote: { type: 'string' },
                },
              },
              dataMetrics: {
                required: [
                  'wordCount',
                  'uniqueStems',
                  'complexity',
                  'complexityLabel',
                  'rhymeDensity',
                  'dialectMap',
                ],
                type: 'object',
                properties: {
                  wordCount: { type: 'number' },
                  uniqueStems: { type: 'number' },
                  complexity: { type: 'number' },
                  complexityLabel: { type: 'string' },
                  rhymeDensity: { type: 'number' },
                  dialectMap: {
                    type: 'array',
                    items: {
                      required: ['label', 'value'],
                      type: 'object',
                      properties: { label: { type: 'string' }, value: { type: 'number' } },
                    },
                  },
                },
              },
              idioms: {
                type: 'array',
                items: {
                  required: ['term', 'definition'],
                  type: 'object',
                  properties: { term: { type: 'string' }, definition: { type: 'string' } },
                },
              },
            },
          },
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Você é um Analista de Dados Culturais e Musicólogo Computacional operando um terminal de análise semântica de alta precisão. Sua função é receber o nome de um artista, o título de uma música e um trecho específico de sua letra, e retornar um dossiê analítico estritamente estruturado.\n\nSua análise deve ser profunda, técnica, objetiva e acadêmica, desconstruindo a música em métricas quantitativas e metadados qualitativos.\n\nREGRAS DE FORMATAÇÃO E TIPAGEM (ESTRITO):\n1. Utilize a sintaxe Markdown APENAS dentro dos campos \'summary\', \'extendedAnalysis\' e \'instructorNote\' para adicionar negrito (**), itálico (*) ou listas estruturadas. Não utilize Markdown em nenhum outro campo.\n2. O idioma da análise (textos) deve ser em Português do Brasil (PT-BR), a menos que o termo original exija o inglês para não perder o sentido.\n\nDIRETRIZES DE PREENCHIMENTO DOS CAMPOS:\n\n[METADATA / HEADER]\n- album, year, genre: Busque a informação factual mais precisa possível sobre a faixa.\n- bpm, musicalKey: Forneça os dados reais da música. Se não houver registro exato no seu banco de dados, faça a estimativa técnica mais precisa baseada no gênero e andamento da faixa original.\n\n[SECTION 01 - THESIS]\n- summary: Um parágrafo incisivo (com Markdown) resumindo o tema central e o sentimento do trecho fornecido.\n- extendedAnalysis: Uma análise profunda e detalhada (2 a 3 parágrafos, utilizando Markdown para ênfase). Conecte o trecho fornecido com o contexto geral do álbum, da vida do artista ou do momento histórico.\n- instructorNote: Uma nota curta, quase como um comentário de rodapé de um professor universitário ou um "fun fact" técnico brutalista sobre a composição.\n\n[SECTION 02 - DATA METRICS]\nAtue como um analisador léxico para o trecho fornecido:\n- wordCount: Número inteiro estimado de palavras no trecho analisado.\n- uniqueStems: Estimativa de raízes de palavras únicas (vocabulário).\n- complexity: Um valor float entre 0.0 e 1.0 representando a complexidade sintática e semântica do trecho.\n- complexityLabel: Uma string em caixa alta definindo o nível (ex: "LOW", "MODERATE", "HIGH", "EXPERT").\n- rhymeDensity: Um valor inteiro de 1 a 5 representando a complexidade do esquema de rimas (1 = básico/AABB, 5 = multissilábico/interno complexo).\n- dialectMap: Crie um array de 3 a 5 objetos mapeando as influências linguísticas do trecho. Use labels em CAIXA ALTA (ex: "AAVE", "POETIC", "SLANG", "FORMAL", "MELANCHOLIC", "AGGRESSIVE") e distribua valores de 0 a 100 baseados na intensidade de cada traço.\n\n[SECTION 03 - IDIOMS]\n- idioms: Extraia de 1 a 5 expressões, gírias, metáforas ou construções poéticas notáveis do trecho fornecido e forneça suas definições diretas e o que representam naquele contexto específico.\n\n',
              },
              {
                text: "\n        artist: 'Taylor Swift',\n        trackTitle: 'Need',\n        targetLanguage: 'simple-english',\n        artifactData: \"Desire is the sound of the whiskey telling me you miss me, can you come around?\",",
              },
            ],
          },
        ],
        tools: [{ googleSearch: {} }],
      },
      statusCode: 500,
      responseHeaders: {
        'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
        'content-encoding': 'gzip',
        'content-type': 'application/json; charset=UTF-8',
        date: 'Sun, 10 May 2026 10:21:57 GMT',
        server: 'scaffolding on HTTPServer2',
        'server-timing': 'gfet4t7; dur=477',
        'transfer-encoding': 'chunked',
        vary: 'Origin, X-Origin, Referer',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'x-gemini-service-tier': 'standard',
        'x-xss-protection': '0',
      },
      responseBody:
        '{\n  "error": {\n    "code": 500,\n    "message": "Internal error encountered.",\n    "status": "INTERNAL"\n  }\n}\n',
      isRetryable: true,
      data: { error: { code: 500, message: 'Internal error encountered.', status: 'INTERNAL' } },
    },
  ],
  lastError: {
    name: 'AI_APICallError',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent',
    requestBodyValues: {
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          required: ['id', 'metadata', 'thesis', 'dataMetrics', 'idioms'],
          type: 'object',
          properties: {
            id: { type: 'string' },
            metadata: {
              required: ['album', 'year', 'genre', 'bpm', 'musicalKey'],
              type: 'object',
              properties: {
                album: { type: 'string' },
                year: { type: 'number' },
                genre: { type: 'string' },
                bpm: { type: 'number' },
                musicalKey: { type: 'string' },
              },
            },
            thesis: {
              required: ['summary', 'extendedAnalysis', 'instructorNote'],
              type: 'object',
              properties: {
                summary: { type: 'string' },
                extendedAnalysis: { type: 'string' },
                instructorNote: { type: 'string' },
              },
            },
            dataMetrics: {
              required: [
                'wordCount',
                'uniqueStems',
                'complexity',
                'complexityLabel',
                'rhymeDensity',
                'dialectMap',
              ],
              type: 'object',
              properties: {
                wordCount: { type: 'number' },
                uniqueStems: { type: 'number' },
                complexity: { type: 'number' },
                complexityLabel: { type: 'string' },
                rhymeDensity: { type: 'number' },
                dialectMap: {
                  type: 'array',
                  items: {
                    required: ['label', 'value'],
                    type: 'object',
                    properties: { label: { type: 'string' }, value: { type: 'number' } },
                  },
                },
              },
            },
            idioms: {
              type: 'array',
              items: {
                required: ['term', 'definition'],
                type: 'object',
                properties: { term: { type: 'string' }, definition: { type: 'string' } },
              },
            },
          },
        },
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Você é um Analista de Dados Culturais e Musicólogo Computacional operando um terminal de análise semântica de alta precisão. Sua função é receber o nome de um artista, o título de uma música e um trecho específico de sua letra, e retornar um dossiê analítico estritamente estruturado.\n\nSua análise deve ser profunda, técnica, objetiva e acadêmica, desconstruindo a música em métricas quantitativas e metadados qualitativos.\n\nREGRAS DE FORMATAÇÃO E TIPAGEM (ESTRITO):\n1. Utilize a sintaxe Markdown APENAS dentro dos campos \'summary\', \'extendedAnalysis\' e \'instructorNote\' para adicionar negrito (**), itálico (*) ou listas estruturadas. Não utilize Markdown em nenhum outro campo.\n2. O idioma da análise (textos) deve ser em Português do Brasil (PT-BR), a menos que o termo original exija o inglês para não perder o sentido.\n\nDIRETRIZES DE PREENCHIMENTO DOS CAMPOS:\n\n[METADATA / HEADER]\n- album, year, genre: Busque a informação factual mais precisa possível sobre a faixa.\n- bpm, musicalKey: Forneça os dados reais da música. Se não houver registro exato no seu banco de dados, faça a estimativa técnica mais precisa baseada no gênero e andamento da faixa original.\n\n[SECTION 01 - THESIS]\n- summary: Um parágrafo incisivo (com Markdown) resumindo o tema central e o sentimento do trecho fornecido.\n- extendedAnalysis: Uma análise profunda e detalhada (2 a 3 parágrafos, utilizando Markdown para ênfase). Conecte o trecho fornecido com o contexto geral do álbum, da vida do artista ou do momento histórico.\n- instructorNote: Uma nota curta, quase como um comentário de rodapé de um professor universitário ou um "fun fact" técnico brutalista sobre a composição.\n\n[SECTION 02 - DATA METRICS]\nAtue como um analisador léxico para o trecho fornecido:\n- wordCount: Número inteiro estimado de palavras no trecho analisado.\n- uniqueStems: Estimativa de raízes de palavras únicas (vocabulário).\n- complexity: Um valor float entre 0.0 e 1.0 representando a complexidade sintática e semântica do trecho.\n- complexityLabel: Uma string em caixa alta definindo o nível (ex: "LOW", "MODERATE", "HIGH", "EXPERT").\n- rhymeDensity: Um valor inteiro de 1 a 5 representando a complexidade do esquema de rimas (1 = básico/AABB, 5 = multissilábico/interno complexo).\n- dialectMap: Crie um array de 3 a 5 objetos mapeando as influências linguísticas do trecho. Use labels em CAIXA ALTA (ex: "AAVE", "POETIC", "SLANG", "FORMAL", "MELANCHOLIC", "AGGRESSIVE") e distribua valores de 0 a 100 baseados na intensidade de cada traço.\n\n[SECTION 03 - IDIOMS]\n- idioms: Extraia de 1 a 5 expressões, gírias, metáforas ou construções poéticas notáveis do trecho fornecido e forneça suas definições diretas e o que representam naquele contexto específico.\n\n',
            },
            {
              text: "\n        artist: 'Taylor Swift',\n        trackTitle: 'Need',\n        targetLanguage: 'simple-english',\n        artifactData: \"Desire is the sound of the whiskey telling me you miss me, can you come around?\",",
            },
          ],
        },
      ],
      tools: [{ googleSearch: {} }],
    },
    statusCode: 500,
    responseHeaders: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Sun, 10 May 2026 10:21:57 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=477',
      'transfer-encoding': 'chunked',
      vary: 'Origin, X-Origin, Referer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-gemini-service-tier': 'standard',
      'x-xss-protection': '0',
    },
    responseBody:
      '{\n  "error": {\n    "code": 500,\n    "message": "Internal error encountered.",\n    "status": "INTERNAL"\n  }\n}\n',
    isRetryable: true,
    data: { error: { code: 500, message: 'Internal error encountered.', status: 'INTERNAL' } },
  },
};
