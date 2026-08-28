export type RepertoryType =
  "leis" | "filosofia" | "brasileiros" | "literatura" | "cinema" | "historia" | "ciencia";

export interface Repertory {
  id: string;
  titulo: string;
  autorOuOrigem: string;
  tipo: RepertoryType;
  ideiaCentral: string;
  eixosTematicos: string[];
  comoUsar: string;
  modeloAdaptavel: string;
  alerta?: string;
}

type RepertorySeed = Pick<
  Repertory,
  "id" | "titulo" | "autorOuOrigem" | "tipo" | "ideiaCentral" | "eixosTematicos"
>;

const seeds: RepertorySeed[] = [
  {
    id: "cf88",
    titulo: "Constituicao Federal de 1988",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral: "Estabelece direitos fundamentais e responsabilidades do Estado brasileiro.",
    eixosTematicos: ["cidadania", "educacao", "saude", "meio-ambiente", "desigualdade"],
  },
  {
    id: "dudh",
    titulo: "Declaracao Universal dos Direitos Humanos",
    autorOuOrigem: "ONU",
    tipo: "leis",
    ideiaCentral: "Afirma a dignidade e a igualdade de direitos de todas as pessoas.",
    eixosTematicos: ["cidadania", "desigualdade", "racismo"],
  },
  {
    id: "eca",
    titulo: "Estatuto da Crianca e do Adolescente",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral: "Garante protecao integral e prioridade aos direitos de criancas e adolescentes.",
    eixosTematicos: ["cidadania", "educacao", "saude"],
  },
  {
    id: "ldb",
    titulo: "Lei de Diretrizes e Bases da Educacao",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral: "Organiza a educacao nacional e estabelece o acesso como direito.",
    eixosTematicos: ["educacao", "cidadania", "desigualdade"],
  },
  {
    id: "marco-civil",
    titulo: "Marco Civil da Internet",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral: "Define direitos e deveres para o uso da internet no Brasil.",
    eixosTematicos: ["tecnologia", "cidadania"],
  },
  {
    id: "lgpd",
    titulo: "Lei Geral de Protecao de Dados",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral: "Protege dados pessoais e regula seu tratamento por organizacoes.",
    eixosTematicos: ["tecnologia", "cidadania"],
  },
  {
    id: "igualdade-racial",
    titulo: "Estatuto da Igualdade Racial",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral: "Busca combater a discriminacao e garantir igualdade de oportunidades.",
    eixosTematicos: ["racismo", "cidadania", "desigualdade"],
  },
  {
    id: "maria-penha",
    titulo: "Lei Maria da Penha",
    autorOuOrigem: "Brasil",
    tipo: "leis",
    ideiaCentral:
      "Cria mecanismos de prevencao e enfrentamento a violencia domestica contra a mulher.",
    eixosTematicos: ["cidadania", "desigualdade", "saude"],
  },
  {
    id: "bauman",
    titulo: "Modernidade Liquida",
    autorOuOrigem: "Zygmunt Bauman",
    tipo: "filosofia",
    ideiaCentral: "A vida contemporanea e marcada por relacoes e estruturas menos estaveis.",
    eixosTematicos: ["cultura", "tecnologia", "saude"],
  },
  {
    id: "foucault",
    titulo: "Vigiar e Punir",
    autorOuOrigem: "Michel Foucault",
    tipo: "filosofia",
    ideiaCentral:
      "Instituicoes exercem controle por meio de vigilancia, disciplina e normalizacao.",
    eixosTematicos: ["cidadania", "tecnologia", "educacao"],
  },
  {
    id: "bourdieu",
    titulo: "Capital Cultural",
    autorOuOrigem: "Pierre Bourdieu",
    tipo: "filosofia",
    ideiaCentral: "Diferencas de acesso a cultura e educacao ajudam a reproduzir desigualdades.",
    eixosTematicos: ["educacao", "desigualdade", "cultura"],
  },
  {
    id: "durkheim",
    titulo: "Fato Social",
    autorOuOrigem: "Emile Durkheim",
    tipo: "filosofia",
    ideiaCentral: "Normas coletivas influenciam comportamentos individuais.",
    eixosTematicos: ["cultura", "cidadania", "educacao"],
  },
  {
    id: "marx",
    titulo: "Conflito de Classes",
    autorOuOrigem: "Karl Marx",
    tipo: "filosofia",
    ideiaCentral: "Relacoes economicas desiguais estruturam conflitos e exclusoes sociais.",
    eixosTematicos: ["desigualdade", "cidadania"],
  },
  {
    id: "arendt",
    titulo: "Banalidade do Mal",
    autorOuOrigem: "Hannah Arendt",
    tipo: "filosofia",
    ideiaCentral: "A ausencia de reflexao critica pode normalizar praticas violentas e injustas.",
    eixosTematicos: ["cidadania", "racismo", "educacao"],
  },
  {
    id: "kant",
    titulo: "Esclarecimento",
    autorOuOrigem: "Immanuel Kant",
    tipo: "filosofia",
    ideiaCentral: "A autonomia depende da coragem de pensar por conta propria.",
    eixosTematicos: ["educacao", "cidadania", "cultura"],
  },
  {
    id: "hobbes",
    titulo: "Leviata",
    autorOuOrigem: "Thomas Hobbes",
    tipo: "filosofia",
    ideiaCentral: "O Estado e necessario para organizar a convivencia e conter conflitos.",
    eixosTematicos: ["cidadania", "seguranca"],
  },
  {
    id: "rousseau",
    titulo: "Contrato Social",
    autorOuOrigem: "Jean-Jacques Rousseau",
    tipo: "filosofia",
    ideiaCentral: "A legitimidade politica deve nascer da vontade coletiva.",
    eixosTematicos: ["cidadania", "desigualdade"],
  },
  {
    id: "locke",
    titulo: "Direitos Naturais",
    autorOuOrigem: "John Locke",
    tipo: "filosofia",
    ideiaCentral: "Vida, liberdade e propriedade sao direitos que o poder deve proteger.",
    eixosTematicos: ["cidadania", "desigualdade"],
  },
  {
    id: "habermas",
    titulo: "Esfera Publica",
    autorOuOrigem: "Jurgen Habermas",
    tipo: "filosofia",
    ideiaCentral: "O debate racional e essencial para uma democracia participativa.",
    eixosTematicos: ["cidadania", "tecnologia", "cultura"],
  },
  {
    id: "han",
    titulo: "Sociedade do Cansaco",
    autorOuOrigem: "Byung-Chul Han",
    tipo: "filosofia",
    ideiaCentral: "A cobranca por produtividade favorece esgotamento e adoecimento psiquico.",
    eixosTematicos: ["saude", "tecnologia", "cultura"],
  },
  {
    id: "beauvoir",
    titulo: "O Segundo Sexo",
    autorOuOrigem: "Simone de Beauvoir",
    tipo: "filosofia",
    ideiaCentral: "Papeis de genero sao construidos socialmente e sustentam desigualdades.",
    eixosTematicos: ["desigualdade", "cidadania", "cultura"],
  },
  {
    id: "industria-cultural",
    titulo: "Industria Cultural",
    autorOuOrigem: "Adorno e Horkheimer",
    tipo: "filosofia",
    ideiaCentral: "A cultura de massa pode padronizar gostos e reduzir a autonomia critica.",
    eixosTematicos: ["cultura", "tecnologia", "educacao"],
  },
  {
    id: "paulo-freire",
    titulo: "Pedagogia da Autonomia",
    autorOuOrigem: "Paulo Freire",
    tipo: "brasileiros",
    ideiaCentral: "A educacao deve formar sujeitos criticos e participantes.",
    eixosTematicos: ["educacao", "cidadania", "desigualdade"],
  },
  {
    id: "darcy",
    titulo: "A Crise da Educacao no Brasil",
    autorOuOrigem: "Darcy Ribeiro",
    tipo: "brasileiros",
    ideiaCentral: "Problemas educacionais persistem por escolhas e prioridades politicas.",
    eixosTematicos: ["educacao", "desigualdade"],
  },
  {
    id: "djamila",
    titulo: "Lugar de Fala",
    autorOuOrigem: "Djamila Ribeiro",
    tipo: "brasileiros",
    ideiaCentral: "Posicoes sociais diferentes influenciam quem e ouvido no debate publico.",
    eixosTematicos: ["racismo", "cidadania", "desigualdade"],
  },
  {
    id: "silvio-almeida",
    titulo: "Racismo Estrutural",
    autorOuOrigem: "Silvio Almeida",
    tipo: "brasileiros",
    ideiaCentral:
      "O racismo integra estruturas sociais e institucionais, nao apenas atitudes individuais.",
    eixosTematicos: ["racismo", "desigualdade", "cidadania"],
  },
  {
    id: "krenak",
    titulo: "Ideias para Adiar o Fim do Mundo",
    autorOuOrigem: "Ailton Krenak",
    tipo: "brasileiros",
    ideiaCentral:
      "A separacao entre humanidade e natureza sustenta praticas ambientais destrutivas.",
    eixosTematicos: ["meio-ambiente", "cultura", "cidadania"],
  },
  {
    id: "carolina",
    titulo: "Quarto de Despejo",
    autorOuOrigem: "Carolina Maria de Jesus",
    tipo: "brasileiros",
    ideiaCentral: "O cotidiano da favela revela fome, exclusao e invisibilidade social.",
    eixosTematicos: ["desigualdade", "racismo", "cidadania"],
  },
  {
    id: "gilberto-freyre",
    titulo: "Casa-Grande & Senzala",
    autorOuOrigem: "Gilberto Freyre",
    tipo: "brasileiros",
    ideiaCentral:
      "A formacao social brasileira foi profundamente marcada pela escravidao e por hierarquias.",
    eixosTematicos: ["racismo", "cultura", "desigualdade"],
  },
  {
    id: "sergio-buarque",
    titulo: "Homem Cordial",
    autorOuOrigem: "Sergio Buarque de Holanda",
    tipo: "brasileiros",
    ideiaCentral:
      "Relacoes pessoais podem se sobrepor a regras impessoais na vida publica brasileira.",
    eixosTematicos: ["cidadania", "cultura"],
  },
  {
    id: "nise",
    titulo: "Terapia Ocupacional Humanizada",
    autorOuOrigem: "Nise da Silveira",
    tipo: "brasileiros",
    ideiaCentral: "O cuidado em saude mental deve respeitar a dignidade e a expressao do paciente.",
    eixosTematicos: ["saude", "cidadania", "cultura"],
  },
  {
    id: "evaristo",
    titulo: "Escrevivencia",
    autorOuOrigem: "Conceicao Evaristo",
    tipo: "brasileiros",
    ideiaCentral: "A escrita registra experiencias coletivas de grupos historicamente silenciados.",
    eixosTematicos: ["racismo", "cultura", "desigualdade"],
  },
  {
    id: "vidas-secas",
    titulo: "Vidas Secas",
    autorOuOrigem: "Graciliano Ramos",
    tipo: "literatura",
    ideiaCentral: "Uma familia enfrenta pobreza, migracao, fome e desumanizacao.",
    eixosTematicos: ["desigualdade", "meio-ambiente", "cidadania"],
  },
  {
    id: "1984",
    titulo: "1984",
    autorOuOrigem: "George Orwell",
    tipo: "literatura",
    ideiaCentral: "Um Estado totalitario controla informacoes, linguagem e comportamento.",
    eixosTematicos: ["tecnologia", "cidadania", "cultura"],
  },
  {
    id: "admiravel",
    titulo: "Admiravel Mundo Novo",
    autorOuOrigem: "Aldous Huxley",
    tipo: "literatura",
    ideiaCentral:
      "O controle social ocorre pelo consumo, condicionamento e busca constante de prazer.",
    eixosTematicos: ["tecnologia", "cultura", "cidadania"],
  },
  {
    id: "cegueira",
    titulo: "Ensaio sobre a Cegueira",
    autorOuOrigem: "Jose Saramago",
    tipo: "literatura",
    ideiaCentral:
      "Uma crise coletiva expoe egoismo, fragilidade institucional e perda de solidariedade.",
    eixosTematicos: ["cidadania", "saude", "cultura"],
  },
  {
    id: "capitaes",
    titulo: "Capitaes da Areia",
    autorOuOrigem: "Jorge Amado",
    tipo: "literatura",
    ideiaCentral: "Criancas marginalizadas sobrevivem diante do abandono social.",
    eixosTematicos: ["desigualdade", "educacao", "cidadania"],
  },
  {
    id: "cortico",
    titulo: "O Cortico",
    autorOuOrigem: "Aluisio Azevedo",
    tipo: "literatura",
    ideiaCentral: "A obra evidencia precariedade habitacional, exploracao e determinismo social.",
    eixosTematicos: ["desigualdade", "saude", "cidadania"],
  },
  {
    id: "hora-estrela",
    titulo: "A Hora da Estrela",
    autorOuOrigem: "Clarice Lispector",
    tipo: "literatura",
    ideiaCentral: "A invisibilidade de Macabea revela exclusao e falta de oportunidades.",
    eixosTematicos: ["desigualdade", "cultura", "cidadania"],
  },
  {
    id: "torto-arado",
    titulo: "Torto Arado",
    autorOuOrigem: "Itamar Vieira Junior",
    tipo: "literatura",
    ideiaCentral: "Comunidades rurais enfrentam exploracao, racismo e disputa pela terra.",
    eixosTematicos: ["racismo", "desigualdade", "meio-ambiente"],
  },
  {
    id: "pequeno-principe",
    titulo: "O Pequeno Principe",
    autorOuOrigem: "Antoine de Saint-Exupery",
    tipo: "literatura",
    ideiaCentral: "Vinculos, responsabilidade e empatia sao essenciais nas relacoes humanas.",
    eixosTematicos: ["cultura", "saude", "educacao"],
  },
  {
    id: "frankenstein",
    titulo: "Frankenstein",
    autorOuOrigem: "Mary Shelley",
    tipo: "literatura",
    ideiaCentral:
      "O progresso cientifico sem responsabilidade pode produzir abandono e sofrimento.",
    eixosTematicos: ["tecnologia", "cidadania", "saude"],
  },
  {
    id: "auto-compadecida",
    titulo: "Auto da Compadecida",
    autorOuOrigem: "Ariano Suassuna",
    tipo: "literatura",
    ideiaCentral: "Humor e religiosidade revelam desigualdade e estrategias de sobrevivencia.",
    eixosTematicos: ["cultura", "desigualdade", "cidadania"],
  },
  {
    id: "truman",
    titulo: "O Show de Truman",
    autorOuOrigem: "Peter Weir",
    tipo: "cinema",
    ideiaCentral:
      "A vida de um homem e transformada em espetaculo e controlada sem seu consentimento.",
    eixosTematicos: ["tecnologia", "cultura", "cidadania"],
  },
  {
    id: "black-mirror",
    titulo: "Black Mirror",
    autorOuOrigem: "Charlie Brooker",
    tipo: "cinema",
    ideiaCentral: "Tecnologias ampliam dilemas de vigilancia, dependencia e desumanizacao.",
    eixosTematicos: ["tecnologia", "cultura", "saude"],
  },
  {
    id: "tempos-modernos",
    titulo: "Tempos Modernos",
    autorOuOrigem: "Charlie Chaplin",
    tipo: "cinema",
    ideiaCentral: "A mecanizacao do trabalho pode alienar e desumanizar o trabalhador.",
    eixosTematicos: ["tecnologia", "desigualdade", "saude"],
  },
  {
    id: "parasita",
    titulo: "Parasita",
    autorOuOrigem: "Bong Joon-ho",
    tipo: "cinema",
    ideiaCentral: "A convivencia entre familias evidencia barreiras e tensoes de classe.",
    eixosTematicos: ["desigualdade", "cultura"],
  },
  {
    id: "que-horas",
    titulo: "Que Horas Ela Volta?",
    autorOuOrigem: "Anna Muylaert",
    tipo: "cinema",
    ideiaCentral: "Relacoes domesticas reproduzem desigualdades de classe e acesso.",
    eixosTematicos: ["desigualdade", "educacao", "cidadania"],
  },
  {
    id: "ilha-flores",
    titulo: "Ilha das Flores",
    autorOuOrigem: "Jorge Furtado",
    tipo: "cinema",
    ideiaCentral: "A cadeia de consumo revela desperdicio, fome e desigualdade extrema.",
    eixosTematicos: ["desigualdade", "meio-ambiente", "cidadania"],
  },
  {
    id: "central-brasil",
    titulo: "Central do Brasil",
    autorOuOrigem: "Walter Salles",
    tipo: "cinema",
    ideiaCentral: "Analfabetismo, abandono e afetividade atravessam a busca por pertencimento.",
    eixosTematicos: ["educacao", "desigualdade", "cultura"],
  },
  {
    id: "walle",
    titulo: "Wall-E",
    autorOuOrigem: "Pixar",
    tipo: "cinema",
    ideiaCentral: "Consumismo e descarte irresponsavel tornam o planeta inabitavel.",
    eixosTematicos: ["meio-ambiente", "tecnologia", "cultura"],
  },
  {
    id: "dilema-redes",
    titulo: "O Dilema das Redes",
    autorOuOrigem: "Jeff Orlowski",
    tipo: "cinema",
    ideiaCentral:
      "Plataformas digitais usam dados e algoritmos para disputar atencao e influenciar condutas.",
    eixosTematicos: ["tecnologia", "saude", "cidadania"],
  },
  {
    id: "estrelas",
    titulo: "Estrelas Alem do Tempo",
    autorOuOrigem: "Theodore Melfi",
    tipo: "cinema",
    ideiaCentral: "Mulheres negras enfrentam racismo e sexismo no campo cientifico.",
    eixosTematicos: ["racismo", "desigualdade", "tecnologia"],
  },
  {
    id: "revolucao-industrial",
    titulo: "Revolucao Industrial",
    autorOuOrigem: "Historia moderna",
    tipo: "historia",
    ideiaCentral: "A industrializacao transformou trabalho, cidades e relacoes economicas.",
    eixosTematicos: ["tecnologia", "desigualdade", "meio-ambiente"],
  },
  {
    id: "holocausto",
    titulo: "Holocausto",
    autorOuOrigem: "Segunda Guerra Mundial",
    tipo: "historia",
    ideiaCentral: "A perseguicao sistematica mostra os riscos do autoritarismo e da desumanizacao.",
    eixosTematicos: ["racismo", "cidadania", "educacao"],
  },
  {
    id: "redemocratizacao",
    titulo: "Redemocratizacao Brasileira",
    autorOuOrigem: "Brasil, decada de 1980",
    tipo: "historia",
    ideiaCentral: "A retomada democratica ampliou direitos e participacao politica.",
    eixosTematicos: ["cidadania", "cultura"],
  },
  {
    id: "escravidao",
    titulo: "Escravidao no Brasil",
    autorOuOrigem: "Historia brasileira",
    tipo: "historia",
    ideiaCentral:
      "Seculos de escravizacao deixaram desigualdades raciais e economicas persistentes.",
    eixosTematicos: ["racismo", "desigualdade", "cidadania"],
  },
  {
    id: "revolta-vacina",
    titulo: "Revolta da Vacina",
    autorOuOrigem: "Rio de Janeiro, 1904",
    tipo: "historia",
    ideiaCentral:
      "Uma politica sanitaria autoritaria, somada a desinformacao, gerou resistencia popular.",
    eixosTematicos: ["saude", "cidadania", "educacao"],
  },
  {
    id: "urbanizacao",
    titulo: "Urbanizacao Acelerada no Brasil",
    autorOuOrigem: "Seculo XX",
    tipo: "historia",
    ideiaCentral:
      "O crescimento urbano sem planejamento ampliou problemas de moradia e infraestrutura.",
    eixosTematicos: ["desigualdade", "meio-ambiente", "saude"],
  },
  {
    id: "direitos-civis",
    titulo: "Movimento pelos Direitos Civis",
    autorOuOrigem: "Estados Unidos",
    tipo: "historia",
    ideiaCentral: "A mobilizacao coletiva enfrentou a segregacao racial institucionalizada.",
    eixosTematicos: ["racismo", "cidadania", "desigualdade"],
  },
  {
    id: "oms-saude",
    titulo: "Conceito Ampliado de Saude",
    autorOuOrigem: "Organizacao Mundial da Saude",
    tipo: "ciencia",
    ideiaCentral: "Saude envolve bem-estar fisico, mental e social, nao apenas ausencia de doenca.",
    eixosTematicos: ["saude", "cidadania"],
  },
  {
    id: "agenda2030",
    titulo: "Agenda 2030",
    autorOuOrigem: "ONU",
    tipo: "ciencia",
    ideiaCentral:
      "Os Objetivos de Desenvolvimento Sustentavel articulam metas sociais, economicas e ambientais.",
    eixosTematicos: ["meio-ambiente", "desigualdade", "saude", "educacao"],
  },
  {
    id: "ibge",
    titulo: "Indicadores Sociais",
    autorOuOrigem: "IBGE",
    tipo: "ciencia",
    ideiaCentral:
      "Dados demograficos permitem diagnosticar desigualdades e orientar politicas publicas.",
    eixosTematicos: ["desigualdade", "cidadania", "educacao"],
  },
  {
    id: "unicef",
    titulo: "Protecao da Infancia",
    autorOuOrigem: "UNICEF",
    tipo: "ciencia",
    ideiaCentral: "O desenvolvimento infantil depende de protecao, educacao, saude e participacao.",
    eixosTematicos: ["educacao", "saude", "cidadania"],
  },
  {
    id: "unesco",
    titulo: "Educacao para a Cidadania",
    autorOuOrigem: "UNESCO",
    tipo: "ciencia",
    ideiaCentral: "Educacao e cultura favorecem paz, diversidade e desenvolvimento social.",
    eixosTematicos: ["educacao", "cultura", "cidadania"],
  },
  {
    id: "darwin",
    titulo: "Teoria da Evolucao",
    autorOuOrigem: "Charles Darwin",
    tipo: "ciencia",
    ideiaCentral:
      "A adaptacao resulta de processos graduais, nao de hierarquias morais entre grupos humanos.",
    eixosTematicos: ["educacao", "ciencia", "cultura"],
  },
  {
    id: "carson",
    titulo: "Primavera Silenciosa",
    autorOuOrigem: "Rachel Carson",
    tipo: "ciencia",
    ideiaCentral: "O uso indiscriminado de pesticidas produz impactos ambientais e sanitarios.",
    eixosTematicos: ["meio-ambiente", "saude", "ciencia"],
  },
  {
    id: "amartya-sen",
    titulo: "Desenvolvimento como Liberdade",
    autorOuOrigem: "Amartya Sen",
    tipo: "ciencia",
    ideiaCentral: "Desenvolvimento exige ampliar capacidades e oportunidades reais das pessoas.",
    eixosTematicos: ["desigualdade", "educacao", "cidadania"],
  },
  {
    id: "ostrom",
    titulo: "Gestao dos Bens Comuns",
    autorOuOrigem: "Elinor Ostrom",
    tipo: "ciencia",
    ideiaCentral:
      "Comunidades podem criar regras coletivas eficientes para preservar recursos compartilhados.",
    eixosTematicos: ["meio-ambiente", "cidadania"],
  },
  {
    id: "mcluhan",
    titulo: "O Meio e a Mensagem",
    autorOuOrigem: "Marshall McLuhan",
    tipo: "ciencia",
    ideiaCentral: "A forma de comunicacao transforma percepcoes e organizacao social.",
    eixosTematicos: ["tecnologia", "cultura", "educacao"],
  },
];

export const repertories: Repertory[] = seeds.map((seed) => ({
  ...seed,
  comoUsar: `Use ${seed.titulo} para sustentar um argumento relacionado a ${seed.eixosTematicos.slice(0, 2).join(" e ")}, explicando a ligacao com o problema do tema.`,
  modeloAdaptavel: `${seed.autorOuOrigem}, em ${seed.titulo}, evidencia que ${seed.ideiaCentral.charAt(0).toLowerCase()}${seed.ideiaCentral.slice(1)} Essa perspectiva relaciona-se a [TEMA], pois [EXPLICACAO DO ARGUMENTO].`,
  alerta:
    "Nao apenas cite a referencia: explique claramente como ela comprova o argumento defendido.",
}));

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function findRepertoryCandidates(query: string, limit = 6): Repertory[] {
  const terms = normalize(query)
    .split(/\W+/)
    .filter((term) => term.length >= 4);
  return repertories
    .map((item) => {
      const haystack = normalize(
        [item.titulo, item.autorOuOrigem, item.ideiaCentral, item.eixosTematicos.join(" ")].join(
          " ",
        ),
      );
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.titulo.localeCompare(b.item.titulo))
    .slice(0, limit)
    .map(({ item }) => item);
}
